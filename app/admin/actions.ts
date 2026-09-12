'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { OrderStatus, ShipmentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { validateImageUrl } from '@/lib/image-validation';

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
 * Server Action: Create Product
 */
export async function createProductAction(prevState: unknown, formData: FormData) {
  try {
    await requireAdmin();

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceRaw = formData.get('price') as string;
    const MRPRaw = formData.get('MRP') as string;
    const discountRaw = formData.get('discount') as string;
    const SKU = formData.get('SKU') as string;
    const categoryId = formData.get('categoryId') as string;
    const stockRaw = formData.get('stock') as string;
    const imagesRaw = formData.get('images') as string; // comma/newline separated URLs
    const featured = formData.get('featured') === 'true';
    const trending = formData.get('trending') === 'true';

    // Size prices
    const priceA6Raw = formData.get('price_A6') as string;
    const priceA5Raw = formData.get('price_A5') as string;
    const priceA4Raw = formData.get('price_A4') as string;
    const priceA3Raw = formData.get('price_A3') as string;

    // Validation
    if (!title || !description || !SKU || !categoryId || !stockRaw) {
      return { error: 'All primary fields (title, description, SKU, category, stock) are required.' };
    }

    if (!priceA6Raw || !priceA5Raw || !priceA4Raw || !priceA3Raw) {
      return { error: 'Prices for all four sizes (A6, A5, A4, A3) are required.' };
    }

    const priceA6 = parseFloat(priceA6Raw);
    const priceA5 = parseFloat(priceA5Raw);
    const priceA4 = parseFloat(priceA4Raw);
    const priceA3 = parseFloat(priceA3Raw);

    if (
      isNaN(priceA6) || priceA6 < 0 ||
      isNaN(priceA5) || priceA5 < 0 ||
      isNaN(priceA4) || priceA4 < 0 ||
      isNaN(priceA3) || priceA3 < 0
    ) {
      return { error: 'All size prices must be valid non-negative numbers.' };
    }

    const sizePriceMap: Record<string, number> = {
      A6: priceA6,
      A5: priceA5,
      A4: priceA4,
      A3: priceA3,
    };

    // Base price defaults to A4 price if not explicitly provided
    const price = priceRaw ? parseFloat(priceRaw) : priceA4;
    const MRP = MRPRaw ? parseFloat(MRPRaw) : price;
    const discount = discountRaw ? parseFloat(discountRaw) : 0;
    const stock = parseInt(stockRaw, 10);

    if (isNaN(price) || price < 0) return { error: 'Price must be a valid non-negative number.' };
    if (isNaN(MRP) || MRP < 0) return { error: 'MRP must be a valid non-negative number.' };
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
      additionalPrice: number;
      stock: number;
      SKU: string;
      frameId: string | null;
      paperType: string | null;
    }> = sizes.map((size) => {
      const cleanedSize = size.name.replace(/\s+/g, '');
      const variantSKU = `${SKU}-${cleanedSize}`.replace(/[^a-zA-Z0-9-]/g, '');
      const variantPrice = sizePriceMap[size.name] ?? price;

      return {
        sizeId: size.id,
        price: variantPrice,
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
          price,
          MRP,
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
    const discountRaw = formData.get('discount') as string;
    const SKU = formData.get('SKU') as string;
    const categoryId = formData.get('categoryId') as string;
    const stockRaw = formData.get('stock') as string;
    const imagesRaw = formData.get('images') as string;
    const active = formData.get('active') === 'true';
    const featured = formData.get('featured') === 'true';
    const trending = formData.get('trending') === 'true';

    // Size prices
    const priceA6Raw = formData.get('price_A6') as string;
    const priceA5Raw = formData.get('price_A5') as string;
    const priceA4Raw = formData.get('price_A4') as string;
    const priceA3Raw = formData.get('price_A3') as string;

    if (!id || !title || !description || !SKU || !categoryId || !stockRaw) {
      return { error: 'All fields are required.' };
    }

    if (!priceA6Raw || !priceA5Raw || !priceA4Raw || !priceA3Raw) {
      return { error: 'Prices for all four sizes (A6, A5, A4, A3) are required.' };
    }

    const priceA6 = parseFloat(priceA6Raw);
    const priceA5 = parseFloat(priceA5Raw);
    const priceA4 = parseFloat(priceA4Raw);
    const priceA3 = parseFloat(priceA3Raw);

    if (
      isNaN(priceA6) || priceA6 < 0 ||
      isNaN(priceA5) || priceA5 < 0 ||
      isNaN(priceA4) || priceA4 < 0 ||
      isNaN(priceA3) || priceA3 < 0
    ) {
      return { error: 'All size prices must be valid non-negative numbers.' };
    }

    const sizePriceMap: Record<string, number> = {
      A6: priceA6,
      A5: priceA5,
      A4: priceA4,
      A3: priceA3,
    };

    const price = priceRaw ? parseFloat(priceRaw) : priceA4;
    const MRP = MRPRaw ? parseFloat(MRPRaw) : price;
    const discount = discountRaw ? parseFloat(discountRaw) : 0;
    const stock = parseInt(stockRaw, 10);

    if (isNaN(price) || price < 0) return { error: 'Price must be a valid non-negative number.' };
    if (isNaN(MRP) || MRP < 0) return { error: 'MRP must be a valid non-negative number.' };
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

      // 3. Sync stock and size-specific prices to variants for THIS product only
      const VALID_SIZES = ['A3', 'A4', 'A5', 'A6'];
      const dbSizes = await tx.productSize.findMany({
        where: { name: { in: VALID_SIZES } },
      });

      for (const size of dbSizes) {
        const newSizePrice = sizePriceMap[size.name];
        if (newSizePrice === undefined) continue;

        const existingVariants = await tx.productVariant.findMany({
          where: { productId: id, sizeId: size.id },
        });

        if (existingVariants.length > 0) {
          await tx.productVariant.updateMany({
            where: { productId: id, sizeId: size.id },
            data: {
              price: newSizePrice,
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
              price: newSizePrice,
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

    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    return { success: true, message: 'Order status updated successfully.' };
  } catch (error: unknown) {
    console.error('Update order status error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message || 'Failed to update order status.' };
  }
}
