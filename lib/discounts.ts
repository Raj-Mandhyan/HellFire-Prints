import prisma from './prisma';

export interface DiscountBreakdown {
  subtotal: number;
  quantityDiscount: number;
  couponDiscount: number;
  totalDiscount: number;
  shippingFee: number;
  total: number;
  appliedCoupon: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  couponError?: string;
}

export async function calculateCartTotal(cartId: string, couponCodeOverride?: string | null): Promise<DiscountBreakdown> {
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
      subtotal: 0,
      quantityDiscount: 0,
      couponDiscount: 0,
      totalDiscount: 0,
      shippingFee: 0,
      total: 0,
      appliedCoupon: null,
    };
  }

  // 1. Calculate Subtotal
  let subtotal = 0;
  let totalQuantity = 0;

  for (const item of cart.items) {
    let unitPrice = 0;
    if (item.customPosterId && item.customPoster) {
      unitPrice = item.customPoster.price;
    } else if (item.product) {
      unitPrice = item.product.price + (item.variant?.additionalPrice || 0);
    }
    subtotal += unitPrice * item.quantity;
    totalQuantity += item.quantity;
  }

  // 2. Quantity-based Incentive Discount
  let quantityDiscountRate = 0;
  if (totalQuantity === 2) {
    quantityDiscountRate = 0.10; // 10% OFF
  } else if (totalQuantity >= 3) {
    quantityDiscountRate = 0.15; // 15% OFF
  }
  const quantityDiscount = Math.round(subtotal * quantityDiscountRate * 100) / 100;

  // 3. Coupon Code lookup & validation
  const effectiveCouponCode = couponCodeOverride !== undefined ? couponCodeOverride : cart.couponCode;
  let couponDiscount = 0;
  let appliedCoupon = null;
  let couponError: string | undefined;

  if (effectiveCouponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: effectiveCouponCode.toUpperCase() },
    });

    const now = new Date();

    if (!coupon) {
      couponError = "Invalid coupon code.";
    } else if (!coupon.active) {
      couponError = "This coupon is inactive.";
    } else if (coupon.startDate > now || coupon.endDate < now) {
      couponError = "This coupon has expired.";
    } else if (subtotal < coupon.minPurchase) {
      couponError = `Minimum purchase of ₹${coupon.minPurchase} required for this coupon.`;
    } else if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      couponError = "This coupon has reached its usage limit.";
    } else {
      // Valid coupon!
      if (coupon.discountType === 'PERCENTAGE') {
        let calculated = subtotal * (coupon.discountValue / 100);
        if (coupon.maxDiscount && calculated > coupon.maxDiscount) {
          calculated = coupon.maxDiscount;
        }
        couponDiscount = Math.round(calculated * 100) / 100;
      } else if (coupon.discountType === 'FIXED') {
        couponDiscount = coupon.discountValue;
      }

      // Discount cannot exceed remaining subtotal
      const maxAllowed = subtotal - quantityDiscount;
      if (couponDiscount > maxAllowed) {
        couponDiscount = maxAllowed;
      }

      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      };
    }
  }

  const totalDiscount = quantityDiscount + couponDiscount;

  // 4. Shipping Fee Calculation
  // FREE SHIPPING on orders above ₹1,999 (calculated on original subtotal)
  const shippingFee = subtotal >= 1999 ? 0 : 150;

  // 5. Total calculation
  const total = Math.max(0, subtotal - totalDiscount + shippingFee);

  return {
    subtotal,
    quantityDiscount,
    couponDiscount,
    totalDiscount,
    shippingFee,
    total,
    appliedCoupon,
    couponError,
  };
}
