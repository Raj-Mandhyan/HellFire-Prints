'use server';

import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createCouponAction(prevState: unknown, formData: FormData) {
  try {
    await requireAdmin();

    const code = (formData.get('code') as string)?.trim().toUpperCase();
    const discountType = formData.get('discountType') as string;
    const discountValueRaw = formData.get('discountValue') as string;
    const minPurchaseRaw = formData.get('minPurchase') as string;
    const maxDiscountRaw = formData.get('maxDiscount') as string;
    const startDateRaw = formData.get('startDate') as string;
    const endDateRaw = formData.get('endDate') as string;
    const usageLimitRaw = formData.get('usageLimit') as string;

    if (!code || !discountType || !discountValueRaw || !startDateRaw || !endDateRaw) {
      return { error: 'Required fields are missing.' };
    }

    const discountValue = parseFloat(discountValueRaw);
    const minPurchase = minPurchaseRaw ? parseFloat(minPurchaseRaw) : 0;
    const maxDiscount = maxDiscountRaw ? parseFloat(maxDiscountRaw) : null;
    const usageLimit = usageLimitRaw ? parseInt(usageLimitRaw, 10) : null;
    const startDate = new Date(startDateRaw);
    const endDate = new Date(endDateRaw);

    if (isNaN(discountValue) || discountValue <= 0) {
      return { error: 'Discount value must be a positive number.' };
    }

    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      return { error: 'Percentage discount cannot exceed 100%.' };
    }

    if (startDate > endDate) {
      return { error: 'Start date cannot be after end date.' };
    }

    // Verify code unique
    const existing = await prisma.coupon.findUnique({
      where: { code },
    });
    if (existing) {
      return { error: 'A coupon with this code already exists.' };
    }

    await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        minPurchase,
        maxDiscount,
        startDate,
        endDate,
        usageLimit,
        active: true,
      },
    });

  } catch (error: unknown) {
    console.error('Create coupon action error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create coupon.' };
  }

  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function toggleCouponAction(id: string, active: boolean) {
  try {
    await requireAdmin();

    if (!id) return { error: 'Coupon ID is required.' };

    await prisma.coupon.update({
      where: { id },
      data: { active },
    });

  } catch (error: unknown) {
    console.error('Toggle coupon action error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to toggle coupon status.' };
  }

  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function deleteCouponAction(id: string) {
  try {
    await requireAdmin();

    if (!id) return { error: 'Coupon ID is required.' };

    await prisma.coupon.delete({
      where: { id },
    });

  } catch (error: unknown) {
    console.error('Delete coupon action error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete coupon.' };
  }

  revalidatePath('/admin/coupons');
  return { success: true };
}
