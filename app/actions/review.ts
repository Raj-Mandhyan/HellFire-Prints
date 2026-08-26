'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

interface GetReviewsInput {
  productId: string;
  page?: number;
  sortBy?: 'recent' | 'highest' | 'lowest';
  verifiedOnly?: boolean;
}

/**
 * Fetch paginated and sorted reviews for a specific product
 */
export async function getProductReviewsAction({
  productId,
  page = 1,
  sortBy = 'recent',
  verifiedOnly = false,
}: GetReviewsInput) {
  try {
    const take = 10;
    const skip = (page - 1) * take;

    const where: Prisma.ReviewWhereInput = { productId, active: true };
    if (verifiedOnly) {
      where.verifiedPurchase = true;
    }

    const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    if (sortBy === 'highest') {
      orderBy.rating = 'desc';
    } else if (sortBy === 'lowest') {
      orderBy.rating = 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy,
        take,
        skip,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      success: true,
      reviews,
      totalCount,
      hasMore: skip + reviews.length < totalCount,
    };
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return { success: false, error: 'Failed to retrieve reviews.' };
  }
}

/**
 * Calculate dynamic average ratings and count distribution for a product
 */
export async function getProductRatingSummaryAction(productId: string) {
  try {
    const aggregate = await prisma.review.aggregate({
      where: { productId, active: true },
      _count: { id: true },
      _avg: { rating: true },
    });

    const totalReviews = aggregate._count.id;
    const averageRating = aggregate._avg.rating || 0;

    const groupBy = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId, active: true },
      _count: { id: true },
    });

    // Default distribution array
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    groupBy.forEach((group) => {
      distribution[group.rating] = group._count.id;
    });

    return {
      success: true,
      summary: {
        totalReviews,
        averageRating,
        distribution,
      },
    };
  } catch (error) {
    console.error('Failed to get rating summary:', error);
    return { success: false, error: 'Failed to retrieve rating summary.' };
  }
}

/**
 * Submit or update a product review/rating. Enforces verified purchase and author validation.
 */
export async function submitProductReviewAction(
  productId: string,
  rating: number,
  comment: string,
  title?: string
) {
  try {
    // 1. Verify Authentication
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'You must be logged in to review products.' };
    }

    // 2. Validate input constraints
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return { error: 'Invalid rating. Please select between 1 and 5 stars.' };
    }

    const trimmedComment = comment ? comment.trim() : '';
    const trimmedTitle = title ? title.trim() : '';

    if (trimmedComment.length > 2000) {
      return { error: 'Review text must not exceed 2000 characters.' };
    }

    if (trimmedTitle.length > 150) {
      return { error: 'Review title must not exceed 150 characters.' };
    }

    // 3. Enforce Verified Purchase (Order must exist and be SHIPPED/DELIVERED)
    const verifiedOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        orderStatus: {
          in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'],
        },
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!verifiedOrder) {
      return { error: 'You can only review products that have been purchased and shipped or delivered to you.' };
    }

    // 4. Upsert review to maintain exactly one review per user per product
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    });

    let review;
    if (existingReview) {
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: trimmedComment || null,
          title: trimmedTitle || null,
          verifiedPurchase: true,
        },
      });
      console.log(`Updated existing review ${review.id} for user ${user.id}`);
    } else {
      review = await prisma.review.create({
        data: {
          userId: user.id,
          productId,
          rating,
          comment: trimmedComment || null,
          title: trimmedTitle || null,
          verifiedPurchase: true,
        },
      });
      console.log(`Created new review ${review.id} for user ${user.id}`);
    }

    return { success: true, review };
  } catch (error) {
    console.error('Failed to submit review:', error);
    return { error: 'Internal server error while saving review.' };
  }
}

/**
 * Delete review. Verified to make sure owner or ADMIN role is processing.
 */
export async function deleteProductReviewAction(reviewId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'You must be logged in to perform this action.' };
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return { error: 'Review not found.' };
    }

    // Check authorization: Owner or Admin
    if (review.userId !== user.id && user.role !== 'ADMIN') {
      return { error: 'You are not authorized to delete this review.' };
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    console.log(`Deleted review ${reviewId} by user ${user.id}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete review:', error);
    return { error: 'Failed to delete review.' };
  }
}

/**
 * Check if the current user is eligible to write a review for a specific product
 */
export async function checkReviewEligibilityAction(productId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { eligible: false, reason: 'unauthenticated' };
    }

    const verifiedOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        orderStatus: {
          in: ['CONFIRMED', 'SHIPPED', 'DELIVERED'],
        },
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!verifiedOrder) {
      return { eligible: false, reason: 'not_purchased' };
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    });

    return {
      eligible: true,
      existingReview,
    };
  } catch (error) {
    console.error('Eligibility check failed:', error);
    return { eligible: false, reason: 'error' };
  }
}
