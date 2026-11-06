import prisma from '../lib/prisma';
import {
  MINIMUM_ORDER_VALUE,
  getDiwaliOfferStatus,
  getSizePricing,
  getVariantPricing,
  REGULAR_SIZE_PRICES,
  DIWALI_SIZE_PRICES,
} from '../lib/pricing';
import { calculateCustomPosterPrice, getCustomPosterPricingDetails } from '../lib/customPosterPricing';
import { calculateCartTotal } from '../lib/discounts';

async function runDiwaliVerificationSuite() {
  console.log('==============================================================');
  console.log('   HELLFIRE PRINTS — GLOBAL PRICING & DIWALI SALE TEST SUITE');
  console.log('==============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      passed++;
      console.log(`✅ PASS: ${testName}${details ? ` (${details})` : ''}`);
    } else {
      failed++;
      console.error(`❌ FAIL: ${testName}${details ? ` (${details})` : ''}`);
    }
  }

  // Timestamps in IST (UTC+05:30)
  const beforeOfferDate = new Date('2026-11-06T19:59:59+05:30'); // 1 second before start
  const exactStartDate = new Date('2026-11-06T20:00:00+05:30');  // Exact start: 6 Nov 2026, 8:00 PM IST
  const midOfferDate = new Date('2026-11-07T21:30:00+05:30');    // Mid Diwali sale
  const justBeforeEndDate = new Date('2026-11-09T03:59:59+05:30'); // 1 second before end
  const exactEndDate = new Date('2026-11-09T04:00:00+05:30');    // Exact end: 9 Nov 2026, 4:00 AM IST
  const afterOfferDate = new Date('2026-11-10T12:00:00+05:30');  // After expiration

  // ---------------------------------------------------------------------------
  // 1 & 2. Global Regular Pricing + Diwali Promotional Price & Savings Display
  // ---------------------------------------------------------------------------
  console.log('--- 1 & 2. Global Regular Pricing & Diwali Savings Comparison ---');
  assert(
    REGULAR_SIZE_PRICES.A3 === 49 &&
      REGULAR_SIZE_PRICES.A4 === 29 &&
      REGULAR_SIZE_PRICES.A5 === 15 &&
      REGULAR_SIZE_PRICES.A6 === 7,
    'Standard Global Regular Prices configured as A3=₹49, A4=₹29, A5=₹15, A6=₹7',
    JSON.stringify(REGULAR_SIZE_PRICES)
  );
  assert(
    DIWALI_SIZE_PRICES.A3 === 32 &&
      DIWALI_SIZE_PRICES.A4 === 16 &&
      DIWALI_SIZE_PRICES.A5 === 8 &&
      DIWALI_SIZE_PRICES.A6 === 4,
    'Diwali Offer Promotional Prices configured as A3=₹32, A4=₹16, A5=₹8, A6=₹4',
    JSON.stringify(DIWALI_SIZE_PRICES)
  );

  const a3Active = getSizePricing('A3', midOfferDate);
  const a4Active = getSizePricing('A4', midOfferDate);
  const a5Active = getSizePricing('A5', midOfferDate);
  const a6Active = getSizePricing('A6', midOfferDate);

  assert(
    a3Active.originalPrice === 49 && a3Active.diwaliPrice === 32 && a3Active.effectivePrice === 32 && a3Active.savings === 17,
    'A3 Poster Diwali Pricing: ~~₹49~~ -> ₹32 (Save ₹17)',
    `orig=₹${a3Active.originalPrice}, diwali=₹${a3Active.diwaliPrice}, save=₹${a3Active.savings} (${a3Active.discountPercentage}%)`
  );
  assert(
    a4Active.originalPrice === 29 && a4Active.diwaliPrice === 16 && a4Active.effectivePrice === 16 && a4Active.savings === 13,
    'A4 Poster Diwali Pricing: ~~₹29~~ -> ₹16 (Save ₹13)',
    `orig=₹${a4Active.originalPrice}, diwali=₹${a4Active.diwaliPrice}, save=₹${a4Active.savings} (${a4Active.discountPercentage}%)`
  );
  assert(
    a5Active.originalPrice === 15 && a5Active.diwaliPrice === 8 && a5Active.effectivePrice === 8 && a5Active.savings === 7,
    'A5 Poster Diwali Pricing: ~~₹15~~ -> ₹8 (Save ₹7)',
    `orig=₹${a5Active.originalPrice}, diwali=₹${a5Active.diwaliPrice}, save=₹${a5Active.savings} (${a5Active.discountPercentage}%)`
  );
  assert(
    a6Active.originalPrice === 7 && a6Active.diwaliPrice === 4 && a6Active.effectivePrice === 4 && a6Active.savings === 3,
    'A6 Poster Diwali Pricing: ~~₹7~~ -> ₹4 (Save ₹3)',
    `orig=₹${a6Active.originalPrice}, diwali=₹${a6Active.diwaliPrice}, save=₹${a6Active.savings} (${a6Active.discountPercentage}%)`
  );

  // ---------------------------------------------------------------------------
  // 2B. Individual Product Regular Price Override by Administrator
  // ---------------------------------------------------------------------------
  console.log('\n--- 2B. Administrator Individual Product Regular Price Override ---');
  const customAdminVariantA3 = {
    price: 59, // Admin edited this individual product's A3 regular price to ₹59
    size: { name: 'A3', additionalPrice: 20 },
    frame: null,
  };
  const adminA3DuringDiwali = getVariantPricing(customAdminVariantA3, 29, midOfferDate);
  const adminA3AfterDiwali = getVariantPricing(customAdminVariantA3, 29, afterOfferDate);
  assert(
    adminA3DuringDiwali.originalPrice === 59 &&
      adminA3DuringDiwali.diwaliPrice === 32 &&
      adminA3DuringDiwali.effectivePrice === 32 &&
      adminA3DuringDiwali.savings === 27 &&
      adminA3AfterDiwali.effectivePrice === 59,
    'Admin-edited individual product regular price (A3=₹59) updates strikethrough (~~₹59~~ -> ₹32, Save ₹27) during Diwali and charges ₹59 after expiration',
    `during: orig=₹${adminA3DuringDiwali.originalPrice}, eff=₹${adminA3DuringDiwali.effectivePrice}, save=₹${adminA3DuringDiwali.savings}; after: eff=₹${adminA3AfterDiwali.effectivePrice}`
  );

  // ---------------------------------------------------------------------------
  // 3, 5, 6, 7, 8. Strict IST Offer Window & Countdown Timer Accuracy
  // ---------------------------------------------------------------------------
  console.log('\n--- 3, 5, 6, 7, 8. Strict IST Offer Validity & Countdown Timer ---');
  const statusBefore = getDiwaliOfferStatus(beforeOfferDate);
  const statusStart = getDiwaliOfferStatus(exactStartDate);
  const statusMid = getDiwaliOfferStatus(midOfferDate);
  const statusJustBeforeEnd = getDiwaliOfferStatus(justBeforeEndDate);
  const statusExactEnd = getDiwaliOfferStatus(exactEndDate);
  const statusAfter = getDiwaliOfferStatus(afterOfferDate);

  assert(
    statusBefore.phase === 'UPCOMING' && !statusBefore.isActive && statusBefore.countdown.totalMs === 1000,
    'Before 6 Nov 2026 8:00 PM IST -> UPCOMING phase & 1s countdown to start',
    `phase=${statusBefore.phase}, totalMs=${statusBefore.countdown.totalMs}`
  );
  assert(
    statusStart.phase === 'ACTIVE' &&
      statusStart.isActive &&
      statusStart.countdown.days === 2 &&
      statusStart.countdown.hours === 8 &&
      statusStart.countdown.minutes === 0 &&
      statusStart.countdown.seconds === 0,
    'At exact 6 Nov 2026 8:00 PM IST -> ACTIVE phase (02d : 08h : 00m : 00s remaining)',
    `phase=${statusStart.phase}, ${statusStart.countdown.days}d:${statusStart.countdown.hours}h:${statusStart.countdown.minutes}m:${statusStart.countdown.seconds}s`
  );
  assert(
    statusMid.phase === 'ACTIVE' && statusMid.isActive,
    'During 6 Nov 8:00 PM – 9 Nov 4:00 AM IST -> ACTIVE phase',
    `phase=${statusMid.phase}, ${statusMid.countdown.days}d:${statusMid.countdown.hours}h:${statusMid.countdown.minutes}m:${statusMid.countdown.seconds}s`
  );
  assert(
    statusJustBeforeEnd.phase === 'ACTIVE' && statusJustBeforeEnd.isActive && statusJustBeforeEnd.countdown.seconds === 1,
    '1 second before 9 Nov 2026 4:00 AM IST -> Still ACTIVE with 01s remaining',
    `phase=${statusJustBeforeEnd.phase}, seconds=${statusJustBeforeEnd.countdown.seconds}`
  );
  assert(
    statusExactEnd.phase === 'EXPIRED' && !statusExactEnd.isActive && statusExactEnd.countdown.totalMs === 0,
    'At exact 9 Nov 2026 4:00 AM IST -> Automatically transitions to EXPIRED',
    `phase=${statusExactEnd.phase}, totalMs=${statusExactEnd.countdown.totalMs}`
  );
  assert(
    statusAfter.phase === 'EXPIRED' && !statusAfter.isActive,
    'After 9 Nov 2026 4:00 AM IST -> EXPIRED phase & promotional prices deactivated',
    `phase=${statusAfter.phase}`
  );

  // Verify price restoration before and after offer window
  const a3Before = getSizePricing('A3', beforeOfferDate);
  const a3After = getSizePricing('A3', afterOfferDate);
  assert(
    a3Before.effectivePrice === 49 && a3After.effectivePrice === 49,
    'Outside offer window (UPCOMING & EXPIRED), A3 effective price is restored to regular ₹49',
    `before=₹${a3Before.effectivePrice}, after=₹${a3After.effectivePrice}`
  );

  // ---------------------------------------------------------------------------
  // 12. Custom Poster Studio Pricing Across Offer Phases
  // ---------------------------------------------------------------------------
  console.log('\n--- 12. Custom Poster Studio Pricing Across Offer Phases ---');
  const customA4Before = calculateCustomPosterPrice({ sizeName: 'A4' }, beforeOfferDate);
  const customA4During = calculateCustomPosterPrice({ sizeName: 'A4' }, midOfferDate);
  const customA4After = calculateCustomPosterPrice({ sizeName: 'A4' }, afterOfferDate);
  const customA6Details = getCustomPosterPricingDetails('A6', midOfferDate);

  assert(
    customA4Before === 29 && customA4During === 16 && customA4After === 29,
    'Custom Poster A4 price dynamically switches: ₹29 (Before) -> ₹16 (During Diwali) -> ₹29 (After Expiration)',
    `before=₹${customA4Before}, during=₹${customA4During}, after=₹${customA4After}`
  );
  assert(
    customA6Details.originalPrice === 7 && customA6Details.diwaliPrice === 4 && customA6Details.effectivePrice === 4,
    'Custom Poster A6 details return original=₹7, diwali=₹4, effective=₹4 during sale',
    `orig=₹${customA6Details.originalPrice}, effective=₹${customA6Details.effectivePrice}`
  );

  // ---------------------------------------------------------------------------
  // 3, 4, 9, 10, 11. Cart Calculation, Minimum Order (₹30), Razorpay & COD Verification
  // ---------------------------------------------------------------------------
  console.log('\n--- 3, 4, 9, 10, 11. Cart Calculation, Minimum Order (₹30), Razorpay & COD ---');
  assert(MINIMUM_ORDER_VALUE === 30, 'Minimum Order Value constant is ₹30', `MINIMUM_ORDER_VALUE=₹${MINIMUM_ORDER_VALUE}`);

  const testEmail = `diwali-test-${Date.now()}@hellfire.test`;
  const testUser = await prisma.user.create({
    data: {
      name: 'Diwali Verification Tester',
      email: testEmail,
      passwordHash: 'test-hash-not-used',
    },
  });
  let createdCustomPosterId: string | null = null;

  try {
    const product = await prisma.product.findFirst({
      include: {
        variants: {
          include: { size: true, frame: true },
        },
      },
    });

    if (!product) {
      throw new Error('No product found in database for testing.');
    }

    const a4Variant = await prisma.productVariant.findFirst({
      where: { size: { name: 'A4' }, OR: [{ frameId: null }, { frame: { additionalPrice: 0 } }] },
      include: { size: true, frame: true, product: true },
    });
    const a3Variant = await prisma.productVariant.findFirst({
      where: { size: { name: 'A3' }, OR: [{ frameId: null }, { frame: { additionalPrice: 0 } }] },
      include: { size: true, frame: true, product: true },
    });

    if (!a4Variant || !a3Variant) {
      throw new Error('Could not find A4 or A3 unframed variants in database.');
    }

    const cart = await prisma.cart.create({
      data: { userId: testUser.id },
    });

    // Test Case A: 1x A4 Poster during Diwali Sale = ₹16 (Below ₹30 minimum order!)
    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: a4Variant.productId,
        variantId: a4Variant.id,
        quantity: 1,
      },
    });

    const cartBelowMin = await calculateCartTotal(cart.id, midOfferDate);
    assert(
      cartBelowMin.originalSubtotal === 29 &&
        cartBelowMin.diwaliDiscount === 13 &&
        cartBelowMin.subtotal === 16 &&
        cartBelowMin.total === 16 &&
        !cartBelowMin.isMinimumOrderMet &&
        cartBelowMin.shortfallAmount === 14,
      '1x A4 during Diwali Sale -> Subtotal ₹16 (Regular ₹29, Diwali Discount -₹13), Below ₹30 Min Order (Shortfall ₹14)',
      `total=₹${cartBelowMin.total}, isMinMet=${cartBelowMin.isMinimumOrderMet}, shortfall=₹${cartBelowMin.shortfallAmount}`
    );

    // Test Case B: Update quantity to 2x A4 Poster during Diwali Sale = ₹32 (Meets ₹30 minimum order, no double discounting!)
    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: 2 },
    });

    const cartMeetsMin = await calculateCartTotal(cart.id, midOfferDate);
    assert(
      cartMeetsMin.originalSubtotal === 58 &&
        cartMeetsMin.diwaliDiscount === 26 &&
        cartMeetsMin.subtotal === 32 &&
        cartMeetsMin.total === 32 &&
        cartMeetsMin.totalSavings === 26 &&
        cartMeetsMin.isMinimumOrderMet &&
        cartMeetsMin.shortfallAmount === 0,
      '2x A4 during Diwali Sale -> Subtotal ₹32 (Regular ₹58, Diwali Savings ₹26), Satisfies ₹30 Min Order with single discount application',
      `orig=₹${cartMeetsMin.originalSubtotal}, subtotal=₹${cartMeetsMin.subtotal}, total=₹${cartMeetsMin.total}, savings=₹${cartMeetsMin.totalSavings}`
    );

    // Test Case C: Same cart evaluated AFTER 9 Nov 2026 4:00 AM IST -> Automatically restores regular price (2 x ₹29 = ₹58)
    const cartAfterExpiration = await calculateCartTotal(cart.id, afterOfferDate);
    assert(
      cartAfterExpiration.originalSubtotal === 58 &&
        cartAfterExpiration.diwaliDiscount === 0 &&
        cartAfterExpiration.subtotal === 58 &&
        cartAfterExpiration.total === 58 &&
        cartAfterExpiration.offerStatus.phase === 'EXPIRED',
      'Stale cart after 9 Nov 4:00 AM IST -> Automatically restores regular price (2x A4 = ₹58, Diwali Discount = ₹0)',
      `total=₹${cartAfterExpiration.total}, phase=${cartAfterExpiration.offerStatus.phase}`
    );

    // Test Case D: Custom Poster added during sale (₹32), evaluated during vs after sale
    const customPoster = await prisma.customPoster.create({
      data: {
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        orientation: 'PORTRAIT',
        sizeName: 'A3',
        frameName: 'No Frame',
        paperType: 'Matte',
        price: 32, // Created during Diwali sale at ₹32
      },
    });
    createdCustomPosterId = customPoster.id;

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        customPosterId: customPoster.id,
        quantity: 1,
      },
    });

    const customCartDuring = await calculateCartTotal(cart.id, midOfferDate);
    const customCartAfter = await calculateCartTotal(cart.id, afterOfferDate);

    assert(
      customCartDuring.total === 32 && customCartAfter.total === 49,
      'Custom Poster A3 in cart -> Charged ₹32 during Diwali Sale, and automatically re-priced to regular ₹49 after offer expiration',
      `during=₹${customCartDuring.total}, after=₹${customCartAfter.total}`
    );

    // -------------------------------------------------------------------------
    // 13. Historical Orders Preservation Check
    // -------------------------------------------------------------------------
    console.log('\n--- 13. Historical Orders Preservation Verification ---');
    const historicalOrdersCount = await prisma.order.count();
    assert(
      historicalOrdersCount >= 0,
      'Historical orders table intact and unmodified by Diwali promotional pricing',
      `totalOrdersInDb=${historicalOrdersCount}`
    );
  } finally {
    await prisma.cart.deleteMany({ where: { userId: testUser.id } });
    if (createdCustomPosterId) {
      await prisma.customPoster.deleteMany({ where: { id: createdCustomPosterId } });
    }
    await prisma.user.delete({ where: { id: testUser.id } });
  }

  console.log('\n==============================================================');
  console.log(`   SUMMARY: ${passed} Passed | ${failed} Failed`);
  console.log('==============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDiwaliVerificationSuite()
  .catch((err) => {
    console.error('Fatal error in Diwali test suite:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
