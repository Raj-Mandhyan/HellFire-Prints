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

    // Validation
    if (!title || !description || !priceRaw || !SKU || !categoryId || !stockRaw) {
      return { error: 'All primary fields (title, description, price, SKU, category, stock) are required.' };
    }

    const price = parseFloat(priceRaw);
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

    for (const url of imageUrls) {
      const valResult = await validateImageUrl(url);
      if (!valResult.isValid) {
        return { error: `Invalid product image URL. Use a direct public HTTPS image URL or upload an image. Details: ${valResult.error}` };
      }
    }

    // Run creation inside database transaction for safety
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

      // 3. Create Product Images
      if (imageUrls.length > 0) {
        for (let i = 0; i < imageUrls.length; i++) {
          await tx.productImage.create({
            data: {
              url: imageUrls[i],
              alt: `${title} Image ${i + 1}`,
              productId: product.id,
            },
          });
        }
      } else {
        // Create one default placeholder image
        await tx.productImage.create({
          data: {
            url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
            alt: `${title} Default Placeholder`,
            productId: product.id,
          },
        });
      }

      // 4. Auto-generate Product Variants (Sizes x Frames x Paper Types)
      const sizes = await tx.productSize.findMany();
      const frames = await tx.productFrame.findMany();
      const paperTypes = ['Matte Premium (300 GSM)', 'Glossy Metallic (320 GSM)'];

      for (const size of sizes) {
        for (const frame of frames) {
          for (const paper of paperTypes) {
            const additionalPrice =
              size.additionalPrice + frame.additionalPrice + (paper.includes('Glossy') ? 49.0 : 0.0);

            // Clean SKU name
            const cleanedSize = size.name.replace(/\s+/g, '');
            const cleanedFrame = frame.name.substring(0, 3).toUpperCase().replace(/\s+/g, '');
            const cleanedPaper = paper.includes('Glossy') ? 'GLO' : 'MAT';
            const variantSKU = `${SKU}-${cleanedSize}-${cleanedFrame}-${cleanedPaper}`.replace(/[^a-zA-Z0-9-]/g, '');

            await tx.productVariant.create({
              data: {
                productId: product.id,
                sizeId: size.id,
                frameId: frame.id,
                paperType: paper,
                additionalPrice,
                stock, // sync initial stock
                SKU: variantSKU,
              },
            });
          }
        }
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

    if (!id || !title || !description || !priceRaw || !SKU || !categoryId || !stockRaw) {
      return { error: 'All fields are required.' };
    }

    const price = parseFloat(priceRaw);
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

    for (const url of parsedImageUrls) {
      const valResult = await validateImageUrl(url);
      if (!valResult.isValid) {
        return { error: `Invalid product image URL. Use a direct public HTTPS image URL or upload an image. Details: ${valResult.error}` };
      }
    }

    const slug = await generateUniqueSlug(title, id);

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

      // 3. Sync stock to all its variants
      await tx.productVariant.updateMany({
        where: { productId: id },
        data: { stock },
      });

      // 4. Update Images (replace them if new text provided)
      if (imagesRaw !== null && parsedImageUrls.length > 0) {
        // Delete old images
        await tx.productImage.deleteMany({ where: { productId: id } });
        // Insert new images
        for (let i = 0; i < parsedImageUrls.length; i++) {
          await tx.productImage.create({
            data: {
              url: parsedImageUrls[i],
              alt: `${title} Image ${i + 1}`,
              productId: id,
            },
          });
        }
      }
    });

  } catch (error: unknown) {
    console.error('Update product action error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message || 'Failed to update product.' };
  }

  revalidatePath('/');
  revalidatePath(`/product/${id}`);
  revalidatePath('/admin/products');
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
