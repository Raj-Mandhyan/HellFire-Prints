'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * Toggle a product like for the authenticated user
 */
export async function toggleProductLikeAction(productId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'unauthenticated' };
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: 'Product not found.' };
    }

    // Check if the user already likes this product
    const existing = await prisma.productLike.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    let isLiked = false;
    if (existing) {
      try {
        await prisma.productLike.delete({
          where: { id: existing.id },
        });
      } catch {
        // Handle race conditions where record might have been deleted concurrently
      }
    } else {
      try {
        await prisma.productLike.create({
          data: {
            userId: user.id,
            productId,
          },
        });
        isLiked = true;
      } catch {
        // Handle race conditions where record might have been created concurrently
        isLiked = true;
      }
    }

    // Get the updated count
    const totalLikes = await prisma.productLike.count({
      where: { productId },
    });

    // Revalidate the product details path
    revalidatePath(`/product/${product.slug}`);

    return { success: true, isLiked, totalLikes };
  } catch (error) {
    console.error('Failed to toggle product like:', error);
    return { success: false, error: 'Database error occurred.' };
  }
}

/**
 * Fetch the like status and count for a product
 */
export async function getProductLikeStatusAction(productId: string) {
  try {
    const user = await getCurrentUser();
    
    const [existing, totalLikes] = await Promise.all([
      user
        ? prisma.productLike.findUnique({
            where: {
              userId_productId: {
                userId: user.id,
                productId,
              },
            },
          })
        : null,
      prisma.productLike.count({
        where: { productId },
      }),
    ]);

    return {
      success: true,
      isLiked: !!existing,
      totalLikes,
    };
  } catch (error) {
    console.error('Failed to get product like status:', error);
    return { success: false, error: 'Failed to retrieve like status.' };
  }
}
