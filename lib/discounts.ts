import prisma from './prisma';
import {
  getVariantPricing,
  getSizePricing,
  getDiwaliOfferStatus,
  MINIMUM_ORDER_VALUE,
  DiwaliOfferStatus,
} from './pricing';

export interface DiscountBreakdown {
  /** Sum of Retail MRP across all cart items (reference only, never charged) */
  retailMrpSubtotal: number;
  /** Sum of Base Selling Prices across all cart items (normal non-promotional subtotal) */
  originalSubtotal: number;
  /** Additional Diwali savings off Base Selling Price (originalSubtotal - subtotal) */
  diwaliDiscount: number;
  /** Total savings off Retail MRP (retailMrpSubtotal - total) */
  mrpSavings: number;
  /** Effective selling subtotal (Diwali Selling Price during active campaign, else Base Selling Price) */
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
 * Authoritative Server-Side Cart & Three-Tier Promotional Pricing Calculation Engine.
 * Dynamically validates the Diwali Offer timestamp in IST (Asia/Kolkata) and
 * ensures promotional discounts are never double-applied or accepted after expiration.
 * Retail MRP is strictly a reference value and is NEVER charged at checkout.
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
      retailMrpSubtotal: 0,
      originalSubtotal: 0,
      diwaliDiscount: 0,
      mrpSavings: 0,
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

  let retailMrpSubtotal = 0;
  let originalSubtotal = 0;
  let subtotal = 0;
  let diwaliDiscount = 0;

  for (const item of cart.items) {
    let itemRetailMrp = 0;
    let itemBaseSellingPrice = 0;
    let itemEffectivePrice = 0;

    if (item.customPosterId && item.customPoster) {
      // Dynamically revalidate custom poster price against current IST offer window
      const sizePricing = getSizePricing(item.customPoster.sizeName || 'A4', now);
      itemRetailMrp = sizePricing.retailMrp;
      itemBaseSellingPrice = sizePricing.baseSellingPrice;
      itemEffectivePrice = sizePricing.effectivePrice;
    } else {
      const variantPricing = getVariantPricing(
        item.variant,
        item.product.price,
        now,
        undefined,
        item.product.MRP,
        item.product.diwaliPrice
      );
      itemRetailMrp = variantPricing.retailMrp;
      itemBaseSellingPrice = variantPricing.baseSellingPrice;
      itemEffectivePrice = variantPricing.effectivePrice;
    }

    retailMrpSubtotal += itemRetailMrp * item.quantity;
    originalSubtotal += itemBaseSellingPrice * item.quantity;
    subtotal += itemEffectivePrice * item.quantity;
    diwaliDiscount += Math.max(0, itemBaseSellingPrice - itemEffectivePrice) * item.quantity;
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

  // Total customer savings vs Base Selling Price = Diwali promotional savings + any coupon discount
  const totalSavings = Math.round((diwaliDiscount + totalDiscount) * 100) / 100;

  // Total customer savings vs Retail MRP
  const mrpSavings = Math.max(0, Math.round((retailMrpSubtotal - discountedSubtotal) * 100) / 100);

  // Free shipping across all orders
  const shippingFee = 0;
  const total = Math.round((discountedSubtotal + shippingFee) * 100) / 100;

  const isMinimumOrderMet = discountedSubtotal >= MINIMUM_ORDER_VALUE && total >= MINIMUM_ORDER_VALUE;
  const shortfallAmount = Math.max(
    0,
    Math.round((MINIMUM_ORDER_VALUE - discountedSubtotal) * 100) / 100
  );

  return {
    retailMrpSubtotal: Math.round(retailMrpSubtotal * 100) / 100,
    originalSubtotal: Math.round(originalSubtotal * 100) / 100,
    diwaliDiscount: Math.round(diwaliDiscount * 100) / 100,
    mrpSavings,
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
