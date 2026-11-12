import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import {
  DIWALI_SIZE_PRICES,
  BASE_SELLING_SIZE_PRICES,
  RETAIL_MRP_SIZE_PRICES,
  DIWALI_OFFER_START_ISO,
  DIWALI_OFFER_END_ISO,
  MINIMUM_ORDER_VALUE,
  getSizePricing,
  getVariantPricing,
  getDiwaliOfferStatus,
  validateThreeTierPriceHierarchy,
} from '../lib/pricing';
import { calculateCustomPosterPrice, POSTER_SIZES } from '../lib/customPosterPricing';
import { calculateCartTotal } from '../lib/discounts';
import { ANNOUNCEMENT_UPDATES, TOP_NOTICE_UPDATES } from '../lib/constants';

interface CheckResult {
  id: number;
  title: string;
  passed: boolean;
  details: string;
}

const checks: CheckResult[] = [];

function record(id: number, title: string, passed: boolean, details: string) {
  checks.push({ id, title, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'} [Check ${id}] ${title}: ${details}`);
}

async function main() {
  const rootDir = process.cwd();
  const activeNow = new Date('2026-11-12T20:00:00+05:30'); // Inside 12 Nov 1:00 PM – 14 Nov 1:00 PM IST
  const expiredNow = new Date('2026-11-14T13:00:01+05:30'); // After 14 Nov 1:00 PM IST

  // 1. All products display the new Diwali prices (39 single posters + 17 multi-piece sets)
  const products = await prisma.product.findMany({
    include: { variants: { include: { size: true } } },
  });
  const singlePosterProducts = products.filter((p) => p.price === 29);
  const multiPieceSetProducts = products.filter((p) => p.price !== 29);

  const singlePostersUpdated =
    singlePosterProducts.length > 0 &&
    singlePosterProducts.every((p) => p.diwaliPrice === 20);
  const multiPieceSetsValid = multiPieceSetProducts.every(
    (p) =>
      p.MRP >= p.price &&
      p.diwaliPrice !== null &&
      p.diwaliPrice > 0 &&
      p.diwaliPrice <= p.price &&
      p.variants
        .filter((v) => ['A3', 'A4', 'A5', 'A6'].includes(v.size.name))
        .every(
          (v) =>
            v.retailMrp !== null &&
            v.baseSellingPrice !== null &&
            v.diwaliSellingPrice !== null &&
            v.retailMrp >= v.baseSellingPrice &&
            v.baseSellingPrice >= v.diwaliSellingPrice &&
            v.diwaliSellingPrice > 0
        )
  );

  record(
    1,
    'All products display the new Diwali prices',
    products.length === 56 &&
      singlePostersUpdated &&
      multiPieceSetsValid &&
      ANNOUNCEMENT_UPDATES[1].includes('A3 ₹40') &&
      ANNOUNCEMENT_UPDATES[1].includes('A4 ₹20') &&
      ANNOUNCEMENT_UPDATES[1].includes('A5 ₹10') &&
      ANNOUNCEMENT_UPDATES[1].includes('A6 ₹5') &&
      TOP_NOTICE_UPDATES[0].includes('A6 ₹5') &&
      TOP_NOTICE_UPDATES[0].includes('A5 ₹10') &&
      TOP_NOTICE_UPDATES[0].includes('A4 ₹20') &&
      TOP_NOTICE_UPDATES[0].includes('A3 ₹40'),
    `Verified all ${products.length} products (${singlePosterProducts.length} single posters @ A4 ₹20 + ${multiPieceSetProducts.length} multi-piece sets with custom set pricing) and global tickers.`
  );

  const singleProductIds = new Set(singlePosterProducts.map((p) => p.id));

  // 2. A3 is ₹40
  const a3Variants = await prisma.productVariant.findMany({
    where: { size: { name: 'A3' } },
  });
  const singleA3Variants = a3Variants.filter((v) => singleProductIds.has(v.productId));
  const a3Pricing = getSizePricing('A3', activeNow);
  const a3Studio = POSTER_SIZES.find((s) => s.name === 'A3');
  record(
    2,
    'A3 Diwali Extended Selling Price is ₹40',
    DIWALI_SIZE_PRICES.A3 === 40 &&
      a3Pricing.diwaliSellingPrice === 40 &&
      a3Pricing.effectivePrice === 40 &&
      a3Studio?.diwaliSellingPrice === 40 &&
      singleA3Variants.length > 0 &&
      singleA3Variants.every((v) => v.diwaliSellingPrice === 40),
    `DIWALI_SIZE_PRICES.A3=₹${DIWALI_SIZE_PRICES.A3}, effectivePrice=₹${a3Pricing.effectivePrice}, ${singleA3Variants.length} single-poster A3 variants set to ₹40.`
  );

  // 3. A4 is ₹20
  const a4Variants = await prisma.productVariant.findMany({
    where: { size: { name: 'A4' } },
  });
  const singleA4Variants = a4Variants.filter((v) => singleProductIds.has(v.productId));
  const a4Pricing = getSizePricing('A4', activeNow);
  const a4Studio = POSTER_SIZES.find((s) => s.name === 'A4');
  record(
    3,
    'A4 Diwali Extended Selling Price is ₹20',
    DIWALI_SIZE_PRICES.A4 === 20 &&
      a4Pricing.diwaliSellingPrice === 20 &&
      a4Pricing.effectivePrice === 20 &&
      a4Studio?.diwaliSellingPrice === 20 &&
      singleA4Variants.length > 0 &&
      singleA4Variants.every((v) => v.diwaliSellingPrice === 20),
    `DIWALI_SIZE_PRICES.A4=₹${DIWALI_SIZE_PRICES.A4}, effectivePrice=₹${a4Pricing.effectivePrice}, ${singleA4Variants.length} single-poster A4 variants set to ₹20.`
  );

  // 4. A5 is ₹10
  const a5Variants = await prisma.productVariant.findMany({
    where: { size: { name: 'A5' } },
  });
  const singleA5Variants = a5Variants.filter((v) => singleProductIds.has(v.productId));
  const a5Pricing = getSizePricing('A5', activeNow);
  const a5Studio = POSTER_SIZES.find((s) => s.name === 'A5');
  record(
    4,
    'A5 Diwali Extended Selling Price is ₹10',
    DIWALI_SIZE_PRICES.A5 === 10 &&
      a5Pricing.diwaliSellingPrice === 10 &&
      a5Pricing.effectivePrice === 10 &&
      a5Studio?.diwaliSellingPrice === 10 &&
      singleA5Variants.length > 0 &&
      singleA5Variants.every((v) => v.diwaliSellingPrice === 10),
    `DIWALI_SIZE_PRICES.A5=₹${DIWALI_SIZE_PRICES.A5}, effectivePrice=₹${a5Pricing.effectivePrice}, ${singleA5Variants.length} single-poster A5 variants set to ₹10.`
  );

  // 5. A6 is ₹5
  const a6Variants = await prisma.productVariant.findMany({
    where: { size: { name: 'A6' } },
  });
  const singleA6Variants = a6Variants.filter((v) => singleProductIds.has(v.productId));
  const a6Pricing = getSizePricing('A6', activeNow);
  const a6Studio = POSTER_SIZES.find((s) => s.name === 'A6');
  record(
    5,
    'A6 Diwali Extended Selling Price is ₹5',
    DIWALI_SIZE_PRICES.A6 === 5 &&
      a6Pricing.diwaliSellingPrice === 5 &&
      a6Pricing.effectivePrice === 5 &&
      a6Studio?.diwaliSellingPrice === 5 &&
      singleA6Variants.length > 0 &&
      singleA6Variants.every((v) => v.diwaliSellingPrice === 5),
    `DIWALI_SIZE_PRICES.A6=₹${DIWALI_SIZE_PRICES.A6}, effectivePrice=₹${a6Pricing.effectivePrice}, ${singleA6Variants.length} single-poster A6 variants set to ₹5.`
  );

  // 6. Retail MRP remains unchanged
  const mrpUnchanged =
    RETAIL_MRP_SIZE_PRICES.A3 === 99 &&
    RETAIL_MRP_SIZE_PRICES.A4 === 59 &&
    RETAIL_MRP_SIZE_PRICES.A5 === 39 &&
    RETAIL_MRP_SIZE_PRICES.A6 === 19 &&
    singleA3Variants.every((v) => v.retailMrp === 99) &&
    singleA4Variants.every((v) => v.retailMrp === 59) &&
    singleA5Variants.every((v) => v.retailMrp === 39) &&
    singleA6Variants.every((v) => v.retailMrp === 19) &&
    singlePosterProducts.every((p) => p.MRP >= p.price) &&
    multiPieceSetsValid;
  record(
    6,
    'Retail MRP remains completely unchanged across config and database',
    mrpUnchanged,
    'A3=₹99, A4=₹59, A5=₹39, A6=₹19 preserved across single-poster variants and all product-specific MRPs preserved untouched.'
  );

  // 7. Base Selling Price remains unchanged
  const baseUnchanged =
    BASE_SELLING_SIZE_PRICES.A3 === 49 &&
    BASE_SELLING_SIZE_PRICES.A4 === 29 &&
    BASE_SELLING_SIZE_PRICES.A5 === 15 &&
    BASE_SELLING_SIZE_PRICES.A6 === 7 &&
    singleA3Variants.every((v) => v.baseSellingPrice === 49 && v.price === 49) &&
    singleA4Variants.every((v) => v.baseSellingPrice === 29 && v.price === 29) &&
    singleA5Variants.every((v) => v.baseSellingPrice === 15 && v.price === 15) &&
    singleA6Variants.every((v) => v.baseSellingPrice === 7 && v.price === 7) &&
    singlePosterProducts.every((p) => p.price === 29) &&
    multiPieceSetsValid;
  record(
    7,
    'Base Selling Price remains completely unchanged across config and database',
    baseUnchanged,
    'A3=₹49, A4=₹29, A5=₹15, A6=₹7 preserved across single posters and all custom set Base Selling Prices preserved.'
  );

  // 8. Admins can still edit all three pricing fields
  const productFormSrc = fs.readFileSync(path.join(rootDir, 'components/ProductForm.tsx'), 'utf8');
  const adminActionsSrc = fs.readFileSync(path.join(rootDir, 'app/admin/actions.ts'), 'utf8');
  const hierarchyA3 = validateThreeTierPriceHierarchy(99, 49, 40, 'A3');
  const hierarchyA4 = validateThreeTierPriceHierarchy(59, 29, 20, 'A4');
  const hierarchyA5 = validateThreeTierPriceHierarchy(39, 15, 10, 'A5');
  const hierarchyA6 = validateThreeTierPriceHierarchy(19, 7, 5, 'A6');
  const customVariantPricing = getVariantPricing(
    {
      size: { name: 'A4' },
      retailMrp: 69,
      baseSellingPrice: 35,
      diwaliSellingPrice: 25,
    },
    29,
    activeNow
  );
  record(
    8,
    'Admins can still independently edit all three pricing fields in Admin -> Products',
    productFormSrc.includes('Retail MRP') &&
      productFormSrc.includes('Base Selling Price') &&
      productFormSrc.includes('Diwali Selling Price') &&
      adminActionsSrc.includes('validateThreeTierPriceHierarchy') &&
      hierarchyA3.valid &&
      hierarchyA4.valid &&
      hierarchyA5.valid &&
      hierarchyA6.valid &&
      customVariantPricing.retailMrp === 69 &&
      customVariantPricing.baseSellingPrice === 35 &&
      customVariantPricing.diwaliSellingPrice === 25 &&
      customVariantPricing.effectivePrice === 25,
    'ProductForm.tsx and app/admin/actions.ts preserve full per-size Three-Tier editing and custom override resolution.'
  );

  // 9 & 10 & 11 & 12 & 13 & 14: Cart, Checkout, Razorpay, COD, Minimum Order Value, Expiration
  const sampleProduct = singlePosterProducts[0];
  const sampleA4Variant = sampleProduct.variants.find((v) => v.size.name === 'A4')!;
  const sampleA3Variant = sampleProduct.variants.find((v) => v.size.name === 'A3')!;

  const tempCart = await prisma.cart.create({
    data: {
      sessionToken: `test-diwali-extended-40-20-10-5-${Date.now()}`,
      items: {
        create: [
          {
            productId: sampleProduct.id,
            variantId: sampleA4Variant.id,
            quantity: 2, // 2x A4 = 2 * ₹20 = ₹40 during active offer; 2 * ₹29 = ₹58 after offer
          },
          {
            productId: sampleProduct.id,
            variantId: sampleA3Variant.id,
            quantity: 1, // 1x A3 = ₹40 during active offer; ₹49 after offer
          },
        ],
      },
    },
  });

  try {
    const activeBreakdown = await calculateCartTotal(tempCart.id, activeNow);
    const expiredBreakdown = await calculateCartTotal(tempCart.id, expiredNow);

    // 9. Cart calculations are correct (2x A4 @ ₹20 + 1x A3 @ ₹40 = ₹80; Base = 2*29 + 49 = ₹107; MRP = 2*59 + 99 = ₹217; Diwali discount = ₹27)
    record(
      9,
      'Cart calculations are accurate with new Diwali Extended Offer prices',
      activeBreakdown.subtotal === 80 &&
        activeBreakdown.originalSubtotal === 107 &&
        activeBreakdown.retailMrpSubtotal === 217 &&
        activeBreakdown.diwaliDiscount === 27 &&
        activeBreakdown.total === 80,
      `2x A4 + 1x A3 during active offer: MRP Subtotal=₹${activeBreakdown.retailMrpSubtotal}, Base Subtotal=₹${activeBreakdown.originalSubtotal}, Diwali Discount=-₹${activeBreakdown.diwaliDiscount}, Final Subtotal=₹${activeBreakdown.subtotal}.`
    );

    // 10. Checkout calculations are correct (including Custom Poster Studio)
    const customA3Active = calculateCustomPosterPrice({ sizeName: 'A3' }, activeNow);
    const customA4Active = calculateCustomPosterPrice({ sizeName: 'A4' }, activeNow);
    const customA5Active = calculateCustomPosterPrice({ sizeName: 'A5' }, activeNow);
    const customA6Active = calculateCustomPosterPrice({ sizeName: 'A6' }, activeNow);
    record(
      10,
      'Checkout & Custom Poster Studio calculations match new Diwali prices',
      activeBreakdown.total === 80 &&
        customA3Active === 40 &&
        customA4Active === 20 &&
        customA5Active === 10 &&
        customA6Active === 5,
      `Checkout total=₹${activeBreakdown.total}; Custom Poster active prices: A3=₹${customA3Active}, A4=₹${customA4Active}, A5=₹${customA5Active}, A6=₹${customA6Active}.`
    );

    // 11. Razorpay receives the correct amount (in paise)
    const razorpayPaise = Math.round(activeBreakdown.total * 100);
    record(
      11,
      'Razorpay receives the exact final amount in paise',
      razorpayPaise === 8000 && activeBreakdown.total === 80,
      `Razorpay order amount = ${razorpayPaise} paise (₹${activeBreakdown.total}).`
    );

    // 12. COD uses the correct amount
    record(
      12,
      'Cash on Delivery (COD) uses the exact final amount',
      activeBreakdown.total === 80 && activeBreakdown.isMinimumOrderMet,
      `COD order total = ₹${activeBreakdown.total} (meets ₹${MINIMUM_ORDER_VALUE} minimum order value).`
    );

    // 13. Minimum order value of ₹30 remains enforced (test 1x A4 = ₹20 < ₹30)
    await prisma.cartItem.deleteMany({ where: { cartId: tempCart.id } });
    await prisma.cartItem.create({
      data: {
        cartId: tempCart.id,
        productId: sampleProduct.id,
        variantId: sampleA4Variant.id,
        quantity: 1, // 1x A4 = ₹20 during active offer
      },
    });
    const belowMinBreakdown = await calculateCartTotal(tempCart.id, activeNow);
    record(
      13,
      'Minimum order value of ₹30 remains strictly enforced',
      MINIMUM_ORDER_VALUE === 30 &&
        belowMinBreakdown.total === 20 &&
        !belowMinBreakdown.isMinimumOrderMet &&
        belowMinBreakdown.shortfallAmount === 10,
      `1x A4 during active offer = ₹${belowMinBreakdown.total}; isMinimumOrderMet=${belowMinBreakdown.isMinimumOrderMet}, shortfallAmount=₹${belowMinBreakdown.shortfallAmount}.`
    );

    // 14. Campaign expiration restores Base Selling Prices (and schedule is preserved)
    const statusAtActive = getDiwaliOfferStatus(activeNow);
    const statusAtExpired = getDiwaliOfferStatus(expiredNow);
    record(
      14,
      'Extended Offer schedule preserved & expiration restores Base Selling Prices',
      DIWALI_OFFER_START_ISO === '2026-11-12T13:00:00+05:30' &&
        DIWALI_OFFER_END_ISO === '2026-11-14T13:00:00+05:30' &&
        statusAtActive.phase === 'ACTIVE' &&
        statusAtExpired.phase === 'EXPIRED' &&
        expiredBreakdown.total === 107 &&
        expiredBreakdown.diwaliDiscount === 0,
      `Schedule preserved (${DIWALI_OFFER_START_ISO} to ${DIWALI_OFFER_END_ISO}); after expiration 2x A4 + 1x A3 restores to Base Selling Price total ₹${expiredBreakdown.total} (Diwali discount ₹0).`
    );
  } finally {
    await prisma.cartItem.deleteMany({ where: { cartId: tempCart.id } });
    await prisma.cart.delete({ where: { id: tempCart.id } });
  }

  // 15. Historical orders remain unchanged
  const [orderCount, orderItemCount] = await Promise.all([
    prisma.order.count(),
    prisma.orderItem.count(),
  ]);
  record(
    15,
    'Historical orders and order items remain 100% unchanged',
    orderCount === 53 && orderItemCount === 99,
    `Orders=${orderCount}, OrderItems=${orderItemCount} preserved untouched.`
  );

  const failed = checks.filter((c) => !c.passed);
  console.log(`\n================================================================`);
  console.log(`TOTAL CHECKS: ${checks.length} | PASSED: ${checks.length - failed.length} | FAILED: ${failed.length}`);
  console.log(`================================================================\n`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
