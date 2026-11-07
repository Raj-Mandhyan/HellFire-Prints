'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { OrderStatus, ShipmentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { validateImageUrl } from '@/lib/image-validation';
import { sendOrderAdminNotification } from '@/lib/email';
import {
  RETAIL_MRP_SIZE_PRICES,
  DIWALI_SIZE_PRICES,
  ThreeTierPriceValues,
  validateThreeTierPriceHierarchy,
} from '@/lib/pricing';

// Helper to validate and normalize slug
async function generateUniqueSlug(title: string, currentProductId?: string): Promise<string> {
  let baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  if (!baseSlug) baseSlug = 'product';

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: {
        slug: uniqueSlug,
        NOT: currentProductId ? { id: currentProductId } : undefined,
      },
    });

    if (!existing) {
      break;
    }

    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}

/**
 * Parse and validate Three-Tier pricing from FormData for all 4 poster sizes (A3, A4, A5, A6).
 * Enforces: Retail MRP >= Base Selling Price >= Diwali Selling Price > 0.
 */
function parseAndValidateSizeTierPrices(
  formData: FormData
): { valid: true; sizeTierMap: Record<string, ThreeTierPriceValues> } | { valid: false; error: string } {
  const SIZES = ['A3', 'A4', 'A5', 'A6'] as const;
  const sizeTierMap: Record<string, ThreeTierPriceValues> = {};

  for (const code of SIZES) {
    const baseRaw = formData.get(`price_${code}`) as string | null;
    if (!baseRaw) {
      return { valid: false, error: `Base Selling Price for size ${code} is required.` };
    }
    const baseVal = parseFloat(baseRaw);
    if (Number.isNaN(baseVal) || baseVal <= 0) {
      return { valid: false, error: `Size ${code}: Base Selling Price must be a valid positive number.` };
    }

    const mrpRaw = formData.get(`mrp_${code}`) as string | null;
    const diwaliRaw = formData.get(`diwali_${code}`) as string | null;

    const mrpVal =
      mrpRaw !== null && mrpRaw.trim() !== ''
        ? parseFloat(mrpRaw)
        : Math.max(baseVal, RETAIL_MRP_SIZE_PRICES[code] ?? baseVal);

    const diwaliVal =
      diwaliRaw !== null && diwaliRaw.trim() !== ''
        ? parseFloat(diwaliRaw)
        : Math.min(baseVal, DIWALI_SIZE_PRICES[code] ?? baseVal);

    const check = validateThreeTierPriceHierarchy(mrpVal, baseVal, diwaliVal, `Size ${code}`);
    if (!check.valid) {
      return { valid: false, error: check.error || `Invalid pricing hierarchy for size ${code}.` };
    }

    sizeTierMap[code] = check.normalized;
  }

  return { valid: true, sizeTierMap };
}

/**
 * Server Action: Create Product
 */
export async function createProductAction(prevState: unknown, formData: FormData) {
  try {
    await requireAdmin();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceRaw = formData.get('price') as string;
    const MRPRaw = formData.get('MRP') as string;
    const diwaliPriceRaw = formData.get('diwaliPrice') as string;
    const discountRaw = formData.get('discount') as string;
    const SKU = formData.get('SKU') as string;
    const categoryId = formData.get('categoryId') as string;
    const stockRaw = formData.get('stock') as string;
    const imagesRaw = formData.get('images') as string; // comma/newline separated URLs
    const featured = formData.get('featured') === 'true';
    const trending = formData.get('trending') === 'true';

    // Validation
    if (!title || !description || !SKU || !categoryId || !stockRaw) {
      return { error: 'All primary fields (title, description, SKU, category, stock) are required.' };
    }

    const tierResult = parseAndValidateSizeTierPrices(formData);
    if (!tierResult.valid) {
      return { error: tierResult.error };
    }
    const { sizeTierMap } = tierResult;
    const tierA4 = sizeTierMap.A4;

    // Product-level A4 summary fields default to A4 Three-Tier prices
    const price = priceRaw ? parseFloat(priceRaw) : tierA4.baseSellingPrice;
    const MRP = MRPRaw ? parseFloat(MRPRaw) : tierA4.retailMrp;
    const diwaliPrice = diwaliPriceRaw ? parseFloat(diwaliPriceRaw) : tierA4.diwaliSellingPrice;
    const discount = discountRaw ? parseFloat(discountRaw) : 0;
    const stock = parseInt(stockRaw, 10);

    if (isNaN(price) || price <= 0) return { error: 'Base Selling Price must be a valid positive number.' };
    if (isNaN(MRP) || MRP <= 0) return { error: 'Retail MRP must be a valid positive number.' };
    if (isNaN(diwaliPrice) || diwaliPrice <= 0) return { error: 'Diwali Selling Price must be a valid positive number.' };
    if (isNaN(discount) || discount < 0 || discount > 100) return { error: 'Discount must be between 0 and 100.' };
    if (isNaN(stock) || stock < 0) return { error: 'Stock must be a valid non-negative integer.' };

    const slug = await generateUniqueSlug(title);

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      return { error: 'Selected category does not exist.' };
    }

    // Verify SKU unique
    const existingSKU = await prisma.product.findUnique({
      where: { SKU },
    });
    if (existingSKU) {
      return { error: 'A product with this SKU already exists.' };
    }

    // Parse image URLs
    const imageUrls = imagesRaw
      ? imagesRaw
        .split(/[\n,]/)
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
      : [];

    // Validate image URLs concurrently outside any transaction
    const validationResults = await Promise.all(
      imageUrls.map(async (url) => {
        const valResult = await validateImageUrl(url);
        return { url, ...valResult };
      })
    );

    for (const res of validationResults) {
      if (!res.isValid) {
        return { error: `Invalid product image URL. Use a direct public HTTPS image URL or upload an image. Details: ${res.error}` };
      }
    }

    // Prepare image records in memory outside the transaction
    const imageRecords = imageUrls.length > 0
      ? imageUrls.map((url, i) => ({
        url,
        alt: `${title} Image ${i + 1}`,
      }))
      : [
        {
          url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
          alt: `${title} Default Placeholder`,
        },
      ];

    // Pre-fetch ONLY the 4 valid sizes (A3, A4, A5, A6)
    const VALID_SIZES = ['A3', 'A4', 'A5', 'A6'];
    const dbSizes = await prisma.productSize.findMany({
      where: { name: { in: VALID_SIZES } },
    });
    // Order strictly: A3, A4, A5, A6
    const sizes = dbSizes.sort(
      (a, b) => VALID_SIZES.indexOf(a.name) - VALID_SIZES.indexOf(b.name)
    );

    // Pre-calculate variant records solely per size in memory outside the transaction
    const variantRecords: Array<{
      sizeId: string;
      price: number;
      retailMrp: number;
      baseSellingPrice: number;
      diwaliSellingPrice: number;
      additionalPrice: number;
      stock: number;
      SKU: string;
      frameId: string | null;
      paperType: string | null;
    }> = sizes.map((size) => {
      const cleanedSize = size.name.replace(/\s+/g, '');
      const variantSKU = `${SKU}-${cleanedSize}`.replace(/[^a-zA-Z0-9-]/g, '');
      const tier = sizeTierMap[size.name] ?? tierA4;

      return {
        sizeId: size.id,
        price: tier.baseSellingPrice,
        retailMrp: tier.retailMrp,
        baseSellingPrice: tier.baseSellingPrice,
        diwaliSellingPrice: tier.diwaliSellingPrice,
        additionalPrice: 0,
        stock, // sync initial stock
        SKU: variantSKU,
        frameId: null,
        paperType: null,
      };
    });

    // Run creation inside minimal atomic database transaction (only 4 batched queries)
    await prisma.$transaction(async (tx) => {
      // 1. Create Product
      const product = await tx.product.create({
        data: {
          title,
          slug,
          description,
          price: tierA4.baseSellingPrice,
          MRP: tierA4.retailMrp,
          diwaliPrice: tierA4.diwaliSellingPrice,
          discount,
          SKU,
          featured,
          trending,
          active: true,
          categoryId,
        },
      });

      // 2. Create Inventory Record
      await tx.inventory.create({
        data: {
          productId: product.id,
          quantity: stock,
          alertThreshold: 5,
        },
      });

      // 3. Batch Create Product Images (single SQL insert)
      if (imageRecords.length > 0) {
        await tx.productImage.createMany({
          data: imageRecords.map((img) => ({
            ...img,
            productId: product.id,
          })),
        });
      }

      // 4. Batch Create Product Variants (single SQL insert for all variants)
      if (variantRecords.length > 0) {
        await tx.productVariant.createMany({
          data: variantRecords.map((variant) => ({
            ...variant,
            productId: product.id,
          })),
        });
      }
    });

  } catch (error: unknown) {
    console.error('Create product action error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message || 'Failed to create product.' };
  }

  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath('/admin/products');
  redirect('/admin/products');
}

/**
 * Server Action: Update Product
 */
export async function updateProductAction(prevState: unknown, formData: FormData) {
  const id = formData.get('id') as string;
  let slug = '';
  try {
    await requireAdmin();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceRaw = formData.get('price') as string;
    const MRPRaw = formData.get('MRP') as string;
    const diwaliPriceRaw = formData.get('diwaliPrice') as string;
    const discountRaw = formData.get('discount') as string;
    const SKU = formData.get('SKU') as string;
    const categoryId = formData.get('categoryId') as string;
    const stockRaw = formData.get('stock') as string;
    const imagesRaw = formData.get('images') as string;
    const active = formData.get('active') === 'true';
    const featured = formData.get('featured') === 'true';
    const trending = formData.get('trending') === 'true';

    if (!id || !title || !description || !SKU || !categoryId || !stockRaw) {
      return { error: 'All fields are required.' };
    }

    const tierResult = parseAndValidateSizeTierPrices(formData);
    if (!tierResult.valid) {
      return { error: tierResult.error };
    }
    const { sizeTierMap } = tierResult;
    const tierA4 = sizeTierMap.A4;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { price: true, MRP: true, diwaliPrice: true },
    });

    const parsedPriceInput = priceRaw ? parseFloat(priceRaw) : tierA4.baseSellingPrice;
    const price =
      existingProduct && parsedPriceInput === existingProduct.price && tierA4.baseSellingPrice !== existingProduct.price
        ? tierA4.baseSellingPrice
        : formData.has('mrp_A4')
        ? tierA4.baseSellingPrice
        : parsedPriceInput;

    const MRP = formData.has('mrp_A4')
      ? tierA4.retailMrp
      : MRPRaw
      ? Math.max(price, parseFloat(MRPRaw))
      : tierA4.retailMrp;

    const diwaliPrice = formData.has('diwali_A4')
      ? tierA4.diwaliSellingPrice
      : diwaliPriceRaw
      ? Math.min(price, parseFloat(diwaliPriceRaw))
      : tierA4.diwaliSellingPrice;

    const discount = discountRaw ? parseFloat(discountRaw) : 0;
    const stock = parseInt(stockRaw, 10);

    if (isNaN(price) || price <= 0) return { error: 'Base Selling Price must be a valid positive number.' };
    if (isNaN(MRP) || MRP <= 0) return { error: 'Retail MRP must be a valid positive number.' };
    if (isNaN(diwaliPrice) || diwaliPrice <= 0) return { error: 'Diwali Selling Price must be a valid positive number.' };
    if (isNaN(discount) || discount < 0 || discount > 100) return { error: 'Discount must be between 0 and 100.' };
    if (isNaN(stock) || stock < 0) return { error: 'Stock must be a valid non-negative integer.' };

    const parsedImageUrls = imagesRaw
      ? imagesRaw
        .split(/[\n,]/)
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
      : [];

    const validationResults = await Promise.all(
      parsedImageUrls.map(async (url) => {
        const valResult = await validateImageUrl(url);
        return { url, ...valResult };
      })
    );

    for (const res of validationResults) {
      if (!res.isValid) {
        return { error: `Invalid product image URL. Use a direct public HTTPS image URL or upload an image. Details: ${res.error}` };
      }
    }

    slug = await generateUniqueSlug(title, id);

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) return { error: 'Selected category does not exist.' };

    // Verify SKU unique
    const existingSKU = await prisma.product.findFirst({
      where: { SKU, NOT: { id } },
    });
    if (existingSKU) return { error: 'A product with this SKU already exists.' };

    await prisma.$transaction(async (tx) => {
      // 1. Update Core Product details
      await tx.product.update({
        where: { id },
        data: {
          title,
          slug,
          description,
          price,
          MRP,
          diwaliPrice,
          discount,
          SKU,
          active,
          featured,
          trending,
          categoryId,
        },
      });

      // 2. Update overall Inventory quantity
      await tx.inventory.update({
        where: { productId: id },
        data: { quantity: stock },
      });

      // 3. Sync stock and size-specific Three-Tier prices to variants for THIS product only
      const VALID_SIZES = ['A3', 'A4', 'A5', 'A6'];
      const dbSizes = await tx.productSize.findMany({
        where: { name: { in: VALID_SIZES } },
      });

      for (const size of dbSizes) {
        const tier = sizeTierMap[size.name];
        if (!tier) continue;

        const existingVariants = await tx.productVariant.findMany({
          where: { productId: id, sizeId: size.id },
        });

        if (existingVariants.length > 0) {
          await tx.productVariant.updateMany({
            where: { productId: id, sizeId: size.id },
            data: {
              price: tier.baseSellingPrice,
              retailMrp: tier.retailMrp,
              baseSellingPrice: tier.baseSellingPrice,
              diwaliSellingPrice: tier.diwaliSellingPrice,
              stock,
            },
          });
        } else {
          const cleanedSize = size.name.replace(/\s+/g, '');
          const variantSKU = `${SKU}-${cleanedSize}`.replace(/[^a-zA-Z0-9-]/g, '');
          await tx.productVariant.create({
            data: {
              productId: id,
              sizeId: size.id,
              price: tier.baseSellingPrice,
              retailMrp: tier.retailMrp,
              baseSellingPrice: tier.baseSellingPrice,
              diwaliSellingPrice: tier.diwaliSellingPrice,
              additionalPrice: 0,
              stock,
              SKU: variantSKU,
            },
          });
        }
      }

      // 4. Update Images (replace them if new text provided)
      if (imagesRaw !== null && parsedImageUrls.length > 0) {
        // Delete old images
        await tx.productImage.deleteMany({ where: { productId: id } });
        // Batch insert new images in a single SQL operation
        await tx.productImage.createMany({
          data: parsedImageUrls.map((url, i) => ({
            url,
            alt: `${title} Image ${i + 1}`,
            productId: id,
          })),
        });
      }
    });

  } catch (error: unknown) {
    console.error('Update product action error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message || 'Failed to update product.' };
  }

  revalidatePath('/');
  revalidatePath('/search');
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath(`/product/${slug}`);
  revalidatePath(`/product/${id}`);
  revalidatePath('/admin/products');
  revalidatePath(`/admin/products/${id}/edit`);
  redirect('/admin/products');
}

/**
 * Server Action: Delete/Deactivate Product
 */
export async function deleteProductAction(id: string) {
  try {
    await requireAdmin();

    if (!id) return { error: 'Product ID is required.' };

    // Check if product is referenced in orders
    const ordersCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (ordersCount > 0) {
      // Safe Deactivation: set active false and stock 0
      await prisma.$transaction([
        prisma.product.update({
          where: { id },
          data: { active: false },
        }),
        prisma.inventory.update({
          where: { productId: id },
          data: { quantity: 0 },
        }),
        prisma.productVariant.updateMany({
          where: { productId: id },
          data: { stock: 0 },
        }),
      ]);
      revalidatePath('/');
      revalidatePath('/admin/products');
      return { success: true, deactivated: true, message: 'Product is linked to historical orders. It has been safely deactivated instead of deleted.' };
    } else {
      // Complete Deletion
      await prisma.product.delete({
        where: { id },
      });
      revalidatePath('/');
      revalidatePath('/admin/products');
      return { success: true, deactivated: false, message: 'Product deleted successfully.' };
    }
  } catch (error: unknown) {
    console.error('Delete product action error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message || 'Failed to delete product.' };
  }
}

/**
 * Server Action: Update Inventory Stock directly
 */
export async function updateInventoryAction(productId: string, quantity: number, alertThreshold = 5) {
  try {
    await requireAdmin();

    if (!productId) return { error: 'Product ID is required.' };
    if (isNaN(quantity) || quantity < 0) {
      return { error: 'Stock quantity cannot be negative.' };
    }

    await prisma.$transaction([
      prisma.inventory.update({
        where: { productId },
        data: { quantity, alertThreshold },
      }),
      // Sync stock level to all variants
      prisma.productVariant.updateMany({
        where: { productId },
        data: { stock: quantity },
      }),
    ]);

    revalidatePath('/');
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/products');
    return { success: true, message: 'Inventory updated successfully.' };
  } catch (error: unknown) {
    console.error('Update inventory action error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message || 'Failed to update stock.' };
  }
}

/**
 * Server Action: Update Order Status
 */
export async function updateOrderStatusAction(orderId: string, orderStatus: OrderStatus) {
  try {
    await requireAdmin();

    if (!orderId || !orderStatus) {
      return { error: 'Order ID and Status are required.' };
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(orderStatus)) {
      return { error: `Invalid order status value: ${orderStatus}` };
    }

    // Map orderStatus to an appropriate ShipmentStatus if shipping records exist
    let shipmentStatusStr = 'PENDING';
    if (orderStatus === 'CONFIRMED') shipmentStatusStr = 'LABEL_GENERATED';
    else if (orderStatus === 'SHIPPED') shipmentStatusStr = 'IN_TRANSIT';
    else if (orderStatus === 'DELIVERED') shipmentStatusStr = 'DELIVERED';
    else if (orderStatus === 'CANCELLED') shipmentStatusStr = 'RTO';

    await prisma.$transaction(async (tx) => {
      // Update Order Status
      await tx.order.update({
        where: { id: orderId },
        data: { orderStatus },
      });

      // Update Shipping Record if exists
      const shippingRecord = await tx.shipping.findUnique({
        where: { orderId },
      });

      if (shippingRecord) {
        await tx.shipping.update({
          where: { orderId },
          data: {
            shipmentStatus: shipmentStatusStr as ShipmentStatus,
          },
        });

        // Add a Tracking Entry
        await tx.shipmentTracking.create({
          data: {
            shippingId: shippingRecord.id,
            status: orderStatus,
            location: 'Main Warehouse',
            description: `Order status updated to ${orderStatus} by Administrator.`,
            timestamp: new Date(),
          },
        });
      }
    });

    try {
      revalidatePath('/admin');
      revalidatePath('/admin/orders');
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath(`/account/orders/${orderId}`);
    } catch {
      // Safe fallback when invoked outside Next.js request context
    }
    return { success: true, message: 'Order status updated successfully.' };
  } catch (error: unknown) {
    console.error('Update order status error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message || 'Failed to update order status.' };
  }
}

/**
 * Server Action: Mark Cash on Delivery (COD) Payment as Collected (Admin Only)
 */
export async function markCodPaymentCollectedAction(orderId: string) {
  try {
    await requireAdmin();

    if (!orderId) {
      return { error: 'Order ID is required.' };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return { error: 'Order not found.' };
    }

    if (order.paymentMethod !== 'COD') {
      return { error: 'Only Cash on Delivery (COD) orders can be manually marked as collected.' };
    }

    if (order.orderStatus === 'CANCELLED') {
      return { error: 'Cannot mark payment as collected for a cancelled order.' };
    }

    if (order.paymentStatus === 'CAPTURED') {
      return {
        success: true,
        alreadyCollected: true,
        message: 'COD payment has already been marked as collected.',
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'CAPTURED',
          ...(order.orderStatus === 'PENDING' ? { orderStatus: 'CONFIRMED' } : {}),
        },
      });

      await tx.payment.upsert({
        where: { orderId },
        update: {
          paymentMethod: 'COD',
          paymentStatus: 'CAPTURED',
          amount: order.total,
        },
        create: {
          orderId,
          paymentMethod: 'COD',
          paymentStatus: 'CAPTURED',
          amount: order.total,
          currency: 'INR',
          razorpayOrderId: null,
          razorpayPaymentId: null,
          razorpaySignature: null,
        },
      });
    });

    // Non-blocking admin email notification dispatch once payment is captured
    try {
      await sendOrderAdminNotification(orderId);
    } catch (emailErr) {
      console.error(`[Admin Email] Non-blocking notification error for COD order ${orderId}:`, emailErr);
    }

    try {
      revalidatePath('/admin');
      revalidatePath('/admin/orders');
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath(`/account/orders/${orderId}`);
    } catch {
      // Safe fallback when invoked outside Next.js request context
    }

    return {
      success: true,
      message: 'Cash on Delivery payment marked as collected successfully.',
    };
  } catch (error: unknown) {
    console.error('Mark COD payment collected error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message || 'Failed to update COD payment status.' };
  }
}
