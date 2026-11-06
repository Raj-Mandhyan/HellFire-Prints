import prisma from './prisma';
import {
  getVariantPricing,
  getSizePricing,
  getDiwaliOfferStatus,
  MINIMUM_ORDER_VALUE,
  DiwaliOfferStatus,
} from './pricing';

export interface DiscountBreakdown {
  originalSubtotal: number;
  diwaliDiscount: number;
  subtotal: number;
  quantityDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
  totalSavings: number;
  shippingFee: number;
  total: number;
  minimumOrderValue: number;
  isMinimumOrderMet: boolean;
  shortfallAmount: number;
  offerStatus: DiwaliOfferStatus;
  appliedCoupon: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  couponError?: string;
}

/**
 * Authoritative Server-Side Cart & Promotional Pricing Calculation Engine.
 * Dynamically validates the Diwali Offer timestamp in IST (Asia/Kolkata) and
 * ensures promotional discounts are never double-applied or accepted after expiration.
 */
export async function calculateCartTotal(
  cartId: string,
  nowOrCoupon?: Date | string,
  maybeNow?: Date
): Promise<DiscountBreakdown> {
  const now =
    nowOrCoupon instanceof Date
      ? nowOrCoupon
      : maybeNow instanceof Date
      ? maybeNow
      : new Date();
  const explicitCouponCode = typeof nowOrCoupon === 'string' ? nowOrCoupon : undefined;
  const offerStatus = getDiwaliOfferStatus(now);

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: true,
          variant: {
            include: {
              size: true,
              frame: true,
            },
          },
          customPoster: true,
        },
      },
    },
  });

  if (!cart || !cart.items.length) {
    return {
      originalSubtotal: 0,
      diwaliDiscount: 0,
      subtotal: 0,
      quantityDiscount: 0,
      couponDiscount: 0,
      totalDiscount: 0,
      totalSavings: 0,
      shippingFee: 0,
      total: 0,
      minimumOrderValue: MINIMUM_ORDER_VALUE,
      isMinimumOrderMet: false,
      shortfallAmount: MINIMUM_ORDER_VALUE,
      offerStatus,
      appliedCoupon: null,
    };
  }

  let originalSubtotal = 0;
  let subtotal = 0;
  let diwaliDiscount = 0;

  for (const item of cart.items) {
    let itemOriginalPrice = 0;
    let itemEffectivePrice = 0;

    if (item.customPosterId && item.customPoster) {
      // Dynamically revalidate custom poster price against current IST offer window
      const sizePricing = getSizePricing(item.customPoster.sizeName || 'A4', now);
      itemOriginalPrice = sizePricing.originalPrice;
      itemEffectivePrice = sizePricing.effectivePrice;
    } else {
      const variantPricing = getVariantPricing(item.variant, item.product.price, now);
      itemOriginalPrice = variantPricing.originalPrice;
      itemEffectivePrice = variantPricing.effectivePrice;
    }

    originalSubtotal += itemOriginalPrice * item.quantity;
    subtotal += itemEffectivePrice * item.quantity;
    diwaliDiscount += Math.max(0, itemOriginalPrice - itemEffectivePrice) * item.quantity;
  }

  // Do not apply automatic multi-buy percentage discount on top of Diwali promotional prices
  const quantityDiscount = 0;
  const subtotalAfterQty = subtotal;

  // Validate and apply optional Coupon Discount
  let couponDiscount = 0;
  let appliedCoupon = null;
  let couponError: string | undefined = undefined;

  const effectiveCouponCode = explicitCouponCode ?? cart.couponCode;
  if (effectiveCouponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: effectiveCouponCode.toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      couponError = 'This coupon code is invalid or inactive.';
    } else if (now < coupon.startDate || now > coupon.endDate) {
      couponError = 'This coupon code has expired.';
    } else if (
      coupon.usageLimit !== null &&
      coupon.usageLimit !== undefined &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      couponError = 'This coupon has reached its maximum usage limit.';
    } else if (subtotal < coupon.minPurchase) {
      couponError = `Minimum order of ₹${coupon.minPurchase} required for this coupon.`;
    } else {
      if (coupon.discountType === 'PERCENTAGE') {
        couponDiscount = (subtotalAfterQty * coupon.discountValue) / 100;
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
          couponDiscount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'FIXED') {
        couponDiscount = coupon.discountValue;
      }

      couponDiscount = Math.min(couponDiscount, subtotalAfterQty);
      couponDiscount = Math.round(couponDiscount * 100) / 100;

      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      };
    }
  }

  // Additional order-level discount applied on top of effective subtotal
  const totalDiscount = Math.round((quantityDiscount + couponDiscount) * 100) / 100;
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);

  // Total customer savings = Diwali promotional savings + any coupon discount
  const totalSavings = Math.round((diwaliDiscount + totalDiscount) * 100) / 100;

  // Free shipping across all orders
  const shippingFee = 0;
  const total = Math.round((discountedSubtotal + shippingFee) * 100) / 100;

  const isMinimumOrderMet = discountedSubtotal >= MINIMUM_ORDER_VALUE && total >= MINIMUM_ORDER_VALUE;
  const shortfallAmount = Math.max(0, Math.round((MINIMUM_ORDER_VALUE - discountedSubtotal) * 100) / 100);

  return {
    originalSubtotal: Math.round(originalSubtotal * 100) / 100,
    diwaliDiscount: Math.round(diwaliDiscount * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    quantityDiscount,
    couponDiscount,
    totalDiscount,
    totalSavings,
    shippingFee,
    total,
    minimumOrderValue: MINIMUM_ORDER_VALUE,
    isMinimumOrderMet,
    shortfallAmount,
    offerStatus,
    appliedCoupon,
    couponError,
  };
}
