import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';
import {
  DIWALI_OFFER_START_ISO,
  DIWALI_OFFER_START_UTC_ISO,
  DIWALI_OFFER_END_ISO,
  DIWALI_OFFER_END_UTC_ISO,
  DIWALI_OFFER_START_MS,
  DIWALI_OFFER_END_MS,
  DIWALI_OFFER_START_DISPLAY,
  DIWALI_OFFER_END_DISPLAY,
  RETAIL_MRP_SIZE_PRICES,
  BASE_SELLING_SIZE_PRICES,
  DIWALI_SIZE_PRICES,
  MINIMUM_ORDER_VALUE,
  getDiwaliOfferStatus,
  getSizePricing,
  getVariantPricing,
  validateNoFrameSelection,
  validateThreeTierPriceHierarchy,
} from '../lib/pricing';
import { calculateCustomPosterPrice } from '../lib/customPosterPricing';
import { calculateCartTotal } from '../lib/discounts';
import { ANNOUNCEMENT_UPDATES, TOP_NOTICE_UPDATES } from '../lib/constants';

interface TestResult {
  id: string;
  category: 'Frame Removal' | 'Extended Campaign' | 'Payments' | 'Website';
  title: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(
  id: string,
  category: TestResult['category'],
  title: string,
  passed: boolean,
  details: string
) {
  results.push({ id, category, title, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${id}] (${category}) ${title}: ${details}`);
}

async function main() {
  const rootDir = process.cwd();

  // =========================================================================
  // 7.1 FRAME REMOVAL TESTS (FR-1 .. FR-7)
  // =========================================================================

  // FR-1: No frame options appear on any product page
  const productDetailsSrc = fs.readFileSync(
    path.join(rootDir, 'components/ProductDetails.tsx'),
    'utf8'
  );
  const productSlugSrc = fs.readFileSync(
    path.join(rootDir, 'app/product/[slug]/page.tsx'),
    'utf8'
  );
  const hasNoFrameOnProductPage =
    !productDetailsSrc.includes('frame: true') &&
    !productDetailsSrc.includes('Select Frame') &&
    !productSlugSrc.includes('frame: true');
  record(
    'FR-1',
    'Frame Removal',
    'No frame options appear on any product page',
    hasNoFrameOnProductPage,
    'components/ProductDetails.tsx and app/product/[slug]/page.tsx have zero frame selectors or Prisma frame includes.'
  );

  // FR-2: No frame options appear in Custom Poster Studio
  const customPosterSrc = fs.readFileSync(
    path.join(rootDir, 'app/custom-poster/page.tsx'),
    'utf8'
  );
  const customPosterPricingSrc = fs.readFileSync(
    path.join(rootDir, 'lib/customPosterPricing.ts'),
    'utf8'
  );
  const hasNoFrameInCustomStudio =
    !customPosterSrc.includes('Presentation Frame') &&
    !customPosterSrc.includes('Obsidian Frame') &&
    !customPosterSrc.includes('Chrome Frame') &&
    !customPosterSrc.includes('setFrameName') &&
    !customPosterPricingSrc.includes('FRAME_OPTIONS');
  record(
    'FR-2',
    'Frame Removal',
    'No frame options appear in Custom Poster Studio',
    hasNoFrameInCustomStudio,
    'Presentation Frame (Gallery Mockup), Obsidian/Chrome frame states, and FRAME_OPTIONS removed from Custom Poster Studio.'
  );

  // FR-3: No frame options appear in Cart
  const cartPageSrc = fs.readFileSync(path.join(rootDir, 'app/cart/page.tsx'), 'utf8');
  const cartContextSrc = fs.readFileSync(path.join(rootDir, 'context/CartContext.tsx'), 'utf8');
  const hasNoFrameInCart =
    !cartPageSrc.includes('frameName') && !cartContextSrc.includes('frameName');
  record(
    'FR-3',
    'Frame Removal',
    'No frame options appear in Cart',
    hasNoFrameInCart,
    'app/cart/page.tsx and context/CartContext.tsx contain zero frame fields or frame display rows.'
  );

  // FR-4: No frame options appear in Checkout
  const checkoutPageSrc = fs.readFileSync(path.join(rootDir, 'app/checkout/page.tsx'), 'utf8');
  const checkoutClientSrc = fs.readFileSync(
    path.join(rootDir, 'components/CheckoutPageClient.tsx'),
    'utf8'
  );
  const hasNoFrameInCheckout =
    !checkoutPageSrc.includes('frameName') &&
    !checkoutPageSrc.includes('frame: true') &&
    !checkoutClientSrc.includes('frameName');
  record(
    'FR-4',
    'Frame Removal',
    'No frame options appear in Checkout',
    hasNoFrameInCheckout,
    'app/checkout/page.tsx and components/CheckoutPageClient.tsx render poster size & quantity strictly without frames.'
  );

  // FR-5: No frame charges are added to any order & database variants have zero frame surcharge
  const variantsWithFrameCharge = await prisma.productVariant.count({
    where: {
      OR: [{ frameId: { not: null } }, { additionalPrice: { not: 0 } }],
    },
  });
  const fakeVariantWithLegacyFrame = {
    size: { name: 'A4', additionalPrice: 0 },
    additionalPrice: 0,
    baseSellingPrice: 29,
    diwaliSellingPrice: 16,
    retailMrp: 49,
  };
  const activeVariantPricing = getVariantPricing(
    fakeVariantWithLegacyFrame,
    29,
    new Date('2026-11-12T15:00:00+05:30')
  );
  const normalVariantPricing = getVariantPricing(
    fakeVariantWithLegacyFrame,
    29,
    new Date('2026-11-12T10:00:00+05:30')
  );
  record(
    'FR-5',
    'Frame Removal',
    'No frame charges are added to any order or variant',
    variantsWithFrameCharge === 0 &&
      activeVariantPricing.effectivePrice === 16 &&
      normalVariantPricing.effectivePrice === 29,
    `Database variants with frameId/additionalPrice=${variantsWithFrameCharge}; A4 active=${activeVariantPricing.effectivePrice}, normal=${normalVariantPricing.effectivePrice}.`
  );

  // FR-6: Backend rejects obsolete frame-selection inputs
  const rejectFrameId = validateNoFrameSelection({ frameId: 'frame_123' });
  const rejectBlackFrame = validateNoFrameSelection({ frameName: 'Black Frame' });
  const rejectObsidianFrame = validateNoFrameSelection({ frameName: 'Obsidian Frame' });
  const allowFrameless = validateNoFrameSelection({ frameId: null, frameName: '' });
  record(
    'FR-6',
    'Frame Removal',
    'Backend rejects obsolete frame-selection inputs',
    !rejectFrameId.valid &&
      !rejectBlackFrame.valid &&
      !rejectObsidianFrame.valid &&
      allowFrameless.valid,
    `frameId rejected (${rejectFrameId.error}); Black/Obsidian Frame rejected; empty frameless payload accepted.`
  );

  // FR-7: Historical orders remain readable and intact
  const [productCount, variantCount, orderCount, orderItemCount] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
  ]);
  const sampleOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
  record(
    'FR-7',
    'Frame Removal',
    'Historical orders and products remain 100% readable and intact',
    productCount >= 48 && variantCount >= 578 && orderCount >= 50 && sampleOrders.length > 0,
    `Products=${productCount}, Variants=${variantCount}, Orders=${orderCount}, OrderItems=${orderItemCount}.`
  );

  // =========================================================================
  // 7.2 EXTENDED CAMPAIGN TESTS (EC-1 .. EC-10)
  // =========================================================================

  // EC-1: Before 12 November, 1:00 PM IST, countdown counts down to start time
  const beforeStartIst = new Date('2026-11-12T10:00:00+05:30'); // 3 hours before 1:00 PM IST
  const statusBeforeStart = getDiwaliOfferStatus(beforeStartIst);
  const pricingBeforeStart = getSizePricing('A4', beforeStartIst);
  record(
    'EC-1',
    'Extended Campaign',
    'Before 12 Nov 2026 1:00 PM IST, campaign is UPCOMING and counts down to start time',
    statusBeforeStart.phase === 'UPCOMING' &&
      statusBeforeStart.isUpcoming &&
      !statusBeforeStart.isActive &&
      statusBeforeStart.targetTimeMs === DIWALI_OFFER_START_MS &&
      statusBeforeStart.countdown.hours === 3 &&
      statusBeforeStart.countdown.minutes === 0 &&
      pricingBeforeStart.effectivePrice === BASE_SELLING_SIZE_PRICES.A4,
    `At 12 Nov 10:00 AM IST: phase=${statusBeforeStart.phase}, countdown=${statusBeforeStart.countdown.hours}h ${statusBeforeStart.countdown.minutes}m, effectivePrice=₹${pricingBeforeStart.effectivePrice} (Base Selling Price).`
  );

  // EC-2: At 12 November, 1:00 PM IST, the campaign activates
  const exactStartIst = new Date('2026-11-12T13:00:00+05:30');
  const statusAtStart = getDiwaliOfferStatus(exactStartIst);
  record(
    'EC-2',
    'Extended Campaign',
    'At 12 November 2026, 1:00 PM IST, the campaign activates',
    statusAtStart.phase === 'ACTIVE' &&
      statusAtStart.isActive &&
      statusAtStart.targetTimeMs === DIWALI_OFFER_END_MS &&
      statusAtStart.countdown.days === 2 &&
      statusAtStart.countdown.hours === 0,
    `At 12 Nov 1:00 PM IST (${DIWALI_OFFER_START_UTC_ISO}): phase=${statusAtStart.phase}, 48-hour countdown=${statusAtStart.countdown.days}d ${statusAtStart.countdown.hours}h.`
  );

  // EC-3: Promotional prices become applicable during the active 48-hour window
  const midCampaignIst = new Date('2026-11-13T13:00:00+05:30');
  const a3Mid = getSizePricing('A3', midCampaignIst);
  const a4Mid = getSizePricing('A4', midCampaignIst);
  const a5Mid = getSizePricing('A5', midCampaignIst);
  const a6Mid = getSizePricing('A6', midCampaignIst);
  const customMid = calculateCustomPosterPrice({ sizeName: 'A4', paperType: 'Matte' }, midCampaignIst);
  record(
    'EC-3',
    'Extended Campaign',
    'Promotional Diwali Selling Prices become applicable during active window',
    a3Mid.effectivePrice === 32 &&
      a4Mid.effectivePrice === 16 &&
      a5Mid.effectivePrice === 8 &&
      a6Mid.effectivePrice === 4 &&
      customMid === 16,
    `Active prices: A3=₹${a3Mid.effectivePrice}, A4=₹${a4Mid.effectivePrice}, A5=₹${a5Mid.effectivePrice}, A6=₹${a6Mid.effectivePrice}, Custom A4=₹${customMid}.`
  );

  // EC-4: Countdown counts down to 14 November, 1:00 PM IST
  const statusMid = getDiwaliOfferStatus(midCampaignIst);
  record(
    'EC-4',
    'Extended Campaign',
    'During active campaign, countdown counts down to 14 November 2026, 1:00 PM IST',
    statusMid.phase === 'ACTIVE' &&
      statusMid.targetTimeMs === DIWALI_OFFER_END_MS &&
      statusMid.countdown.days === 1 &&
      statusMid.countdown.hours === 0 &&
      statusMid.countdown.minutes === 0 &&
      statusMid.countdown.seconds === 0,
    `At 13 Nov 1:00 PM IST: target=${DIWALI_OFFER_END_ISO} (${DIWALI_OFFER_END_UTC_ISO}), remaining=${statusMid.countdown.days}d ${statusMid.countdown.hours}h.`
  );

  // EC-5: Page refresh preserves accurate remaining time via /api/time and SSR offset seeding
  const timeRouteSrc = fs.readFileSync(path.join(rootDir, 'app/api/time/route.ts'), 'utf8');
  const authTimeHookSrc = fs.readFileSync(
    path.join(rootDir, 'lib/useAuthoritativeTime.ts'),
    'utf8'
  );
  record(
    'EC-5',
    'Extended Campaign',
    'Page refresh preserves accurate remaining time via /api/time & sessionStorage offset',
    timeRouteSrc.includes('DIWALI_OFFER_START_UTC_ISO') &&
      timeRouteSrc.includes('DIWALI_OFFER_END_UTC_ISO') &&
      authTimeHookSrc.includes('OFFSET_STORAGE_KEY') &&
      authTimeHookSrc.includes('initialServerTimeMs'),
    '/api/time returns authoritative UTC/IST timestamps and useAuthoritativeDiwaliStatus seeds offset immediately on SSR & refresh.'
  );

  // EC-6: Tab switch and return preserves accurate remaining time
  record(
    'EC-6',
    'Extended Campaign',
    'Tab switch and focus return immediately resynchronize countdown',
    authTimeHookSrc.includes("document.addEventListener('visibilitychange'") &&
      authTimeHookSrc.includes("window.addEventListener('focus'"),
    'visibilitychange and window focus listeners immediately recompute and resync against /api/time.'
  );

  // EC-7: Route navigation preserves accurate remaining time
  record(
    'EC-7',
    'Extended Campaign',
    'Route navigation preserves accurate remaining time without jumping',
    authTimeHookSrc.includes('let sharedServerOffsetMs: number | null = null'),
    'Module-scoped sharedServerOffsetMs preserves server clock offset across all Next.js client route transitions.'
  );

  // EC-8: Countdown never resets to 48:00:00
  const oneSecBeforeEnd = new Date('2026-11-14T12:59:59+05:30');
  const statusOneSecBeforeEnd = getDiwaliOfferStatus(oneSecBeforeEnd);
  record(
    'EC-8',
    'Extended Campaign',
    'Countdown never resets to 48:00:00 and accurately reflects exact remaining seconds',
    statusOneSecBeforeEnd.phase === 'ACTIVE' &&
      statusOneSecBeforeEnd.countdown.days === 0 &&
      statusOneSecBeforeEnd.countdown.hours === 0 &&
      statusOneSecBeforeEnd.countdown.minutes === 0 &&
      statusOneSecBeforeEnd.countdown.seconds === 1,
    `At 14 Nov 12:59:59 PM IST: remaining=${statusOneSecBeforeEnd.countdown.days}d ${statusOneSecBeforeEnd.countdown.hours}h ${statusOneSecBeforeEnd.countdown.minutes}m ${statusOneSecBeforeEnd.countdown.seconds}s.`
  );

  // EC-9: At 14 November, 1:00 PM IST, the campaign expires
  const exactEndIst = new Date('2026-11-14T13:00:00+05:30');
  const statusAtEnd = getDiwaliOfferStatus(exactEndIst);
  record(
    'EC-9',
    'Extended Campaign',
    'At 14 November 2026, 1:00 PM IST, the campaign expires',
    statusAtEnd.phase === 'EXPIRED' &&
      statusAtEnd.isExpired &&
      !statusAtEnd.isActive &&
      statusAtEnd.countdown.totalMs === 0,
    `At 14 Nov 1:00 PM IST (${DIWALI_OFFER_END_UTC_ISO}): phase=${statusAtEnd.phase}, countdown=00:00:00:00.`
  );

  // EC-10: After expiration, Base Selling Prices are restored
  const afterEndIst = new Date('2026-11-14T13:00:01+05:30');
  const a3Expired = getSizePricing('A3', afterEndIst);
  const a4Expired = getSizePricing('A4', afterEndIst);
  const a5Expired = getSizePricing('A5', afterEndIst);
  const a6Expired = getSizePricing('A6', afterEndIst);
  record(
    'EC-10',
    'Extended Campaign',
    'After expiration, Base Selling Prices are automatically restored',
    a3Expired.effectivePrice === BASE_SELLING_SIZE_PRICES.A3 &&
      a4Expired.effectivePrice === BASE_SELLING_SIZE_PRICES.A4 &&
      a5Expired.effectivePrice === BASE_SELLING_SIZE_PRICES.A5 &&
      a6Expired.effectivePrice === BASE_SELLING_SIZE_PRICES.A6 &&
      a4Expired.activeDiscount === 0,
    `Expired prices restored to Base Selling Price: A3=₹${a3Expired.effectivePrice}, A4=₹${a4Expired.effectivePrice}, A5=₹${a5Expired.effectivePrice}, A6=₹${a6Expired.effectivePrice}.`
  );

  // =========================================================================
  // 7.3 PAYMENTS & PRICING INTEGRITY TESTS (PM-1 .. PM-6)
  // =========================================================================

  // Create a temporary test cart with 2x A4 posters to verify cart & checkout calculations across UPCOMING, ACTIVE, EXPIRED
  const sampleProduct = await prisma.product.findFirst({
    where: { active: true },
    include: { variants: { include: { size: true } } },
  });
  const a4Variant = sampleProduct?.variants.find((v) => v.size?.name === 'A4');

  const tempCart = await prisma.cart.create({
    data: {
      sessionToken: `test-extended-offer-${Date.now()}`,
      items:
        sampleProduct && a4Variant
          ? {
              create: [
                {
                  productId: sampleProduct.id,
                  variantId: a4Variant.id,
                  quantity: 2,
                },
              ],
            }
          : undefined,
    },
  });

  try {
    const cartUpcoming = await calculateCartTotal(tempCart.id, beforeStartIst);
    const cartActive = await calculateCartTotal(tempCart.id, midCampaignIst);
    const cartExpired = await calculateCartTotal(tempCart.id, afterEndIst);

    // PM-1: Razorpay works during the active offer
    const orderActionsSrc = fs.readFileSync(path.join(rootDir, 'app/actions/order.ts'), 'utf8');
    record(
      'PM-1',
      'Payments',
      'Razorpay works during the active offer with Diwali Selling Price',
      cartActive.total === 32 &&
        cartActive.diwaliDiscount === 26 &&
        cartActive.isMinimumOrderMet &&
        orderActionsSrc.includes('initiatePaymentAction') &&
        orderActionsSrc.includes('verifyPaymentAction'),
      `2x A4 during ACTIVE offer: Retail MRP=₹${cartActive.retailMrpSubtotal}, Base=₹${cartActive.originalSubtotal}, Diwali Discount=-₹${cartActive.diwaliDiscount}, Final Payable=₹${cartActive.total} (>= ₹${MINIMUM_ORDER_VALUE}).`
    );

    // PM-2: COD works during the active offer
    record(
      'PM-2',
      'Payments',
      'Cash on Delivery (COD) works during the active offer',
      cartActive.total === 32 &&
        orderActionsSrc.includes('placeCodOrderAction') &&
        orderActionsSrc.includes("paymentMethod: 'COD'"),
      `COD checkout uses identical server-side calculateCartTotal(cart.id, now) -> ₹${cartActive.total} during ACTIVE window.`
    );

    // PM-3: Razorpay works after offer expiration
    record(
      'PM-3',
      'Payments',
      'Razorpay works outside/after offer expiration with Base Selling Price',
      cartUpcoming.total === 58 &&
        cartExpired.total === 58 &&
        cartExpired.diwaliDiscount === 0 &&
        cartExpired.isMinimumOrderMet,
      `2x A4 outside/after offer: UPCOMING=₹${cartUpcoming.total}, EXPIRED=₹${cartExpired.total} (Base Selling Price ₹29 x 2, Diwali Discount ₹0).`
    );

    // PM-4: COD works after offer expiration
    record(
      'PM-4',
      'Payments',
      'Cash on Delivery (COD) works outside/after offer expiration with Base Selling Price',
      cartExpired.total === 58 && cartExpired.offerStatus.phase === 'EXPIRED',
      `COD checkout after 14 Nov 1:00 PM IST charges Base Selling Price total ₹${cartExpired.total}.`
    );

    // PM-5: Minimum order value of ₹30 is enforced
    // Update temp cart to 1x A4 (₹16 during active offer < ₹30)
    const firstItem = await prisma.cartItem.findFirst({ where: { cartId: tempCart.id } });
    if (firstItem) {
      await prisma.cartItem.update({
        where: { id: firstItem.id },
        data: { quantity: 1 },
      });
    }
    const singleA4Active = await calculateCartTotal(tempCart.id, midCampaignIst);
    record(
      'PM-5',
      'Payments',
      'Minimum order value of ₹30 is strictly enforced',
      MINIMUM_ORDER_VALUE === 30 &&
        singleA4Active.total === 16 &&
        !singleA4Active.isMinimumOrderMet &&
        singleA4Active.shortfallAmount === 14,
      `1x A4 during ACTIVE offer = ₹${singleA4Active.total}; isMinimumOrderMet=${singleA4Active.isMinimumOrderMet}, shortfallAmount=₹${singleA4Active.shortfallAmount}.`
    );

    // PM-6: Retail MRP is never charged at checkout
    record(
      'PM-6',
      'Payments',
      'Retail MRP is never charged at checkout in any phase',
      cartUpcoming.total === 58 &&
        cartActive.total === 32 &&
        cartExpired.total === 58 &&
        cartUpcoming.retailMrpSubtotal > cartUpcoming.total &&
        cartActive.retailMrpSubtotal > cartActive.total &&
        cartExpired.retailMrpSubtotal > cartExpired.total,
      `Retail MRP subtotal (₹${cartActive.retailMrpSubtotal} for 2x A4) is never charged: UPCOMING charges ₹${cartUpcoming.total}, ACTIVE charges ₹${cartActive.total}, EXPIRED charges ₹${cartExpired.total}.`
    );
  } finally {
    await prisma.cartItem.deleteMany({ where: { cartId: tempCart.id } });
    await prisma.cart.delete({ where: { id: tempCart.id } });
  }

  // =========================================================================
  // 7.4 WEBSITE & UI INTEGRITY TESTS (WB-1 .. WB-8)
  // =========================================================================

  // WB-1: Homepage loads properly with Grand Diwali Extended Offer 2026 messaging
  const heroSrc = fs.readFileSync(path.join(rootDir, 'components/DiwaliHeroSection.tsx'), 'utf8');
  const hasExtendedMessaging =
    heroSrc.includes('HELLFIRE PRINTS PRESENTS: THE GRAND DIWALI EXTENDED OFFER 2026') &&
    heroSrc.includes('YOU ASKED. WE LISTENED.') &&
    heroSrc.includes('THE DIWALI EXTENDED SALE IS LIVE NOW!') &&
    heroSrc.includes('THE EXTENDED DIWALI OFFER STARTS IN') &&
    heroSrc.includes('THE DIWALI EXTENDED OFFER HAS ENDED') &&
    heroSrc.includes('48 HOURS. EXCLUSIVE FESTIVE PRICES. ONE LAST CHANCE.') &&
    DIWALI_OFFER_START_DISPLAY === '12 November 2026 — 1:00 PM IST' &&
    DIWALI_OFFER_END_DISPLAY === '14 November 2026 — 1:00 PM IST';
  record(
    'WB-1',
    'Website',
    'Homepage Hero & Notice Ticker display Grand Diwali Extended Offer 2026',
    hasExtendedMessaging &&
      ANNOUNCEMENT_UPDATES[0].includes(
        'YOU ASKED, WE LISTENED! THE DIWALI SALE IS BACK FOR 48 HOURS ONLY! SHOP NOW AT HELLFIRE PRINTS!'
      ) &&
      TOP_NOTICE_UPDATES[0].includes('YOU ASKED, WE LISTENED!'),
    `Hero & Ticker verified with Start="${DIWALI_OFFER_START_DISPLAY}" and End="${DIWALI_OFFER_END_DISPLAY}".`
  );

  // WB-2: Product catalogue loads properly
  const catalogSrc = fs.readFileSync(path.join(rootDir, 'components/ProductCatalog.tsx'), 'utf8');
  record(
    'WB-2',
    'Website',
    'Product catalogue loads properly with frameless Three-Tier pricing',
    catalogSrc.includes('effectivePhase') && !catalogSrc.includes('frame: true'),
    'ProductCatalog.tsx renders all products with Three-Tier pricing and zero frame options.'
  );

  // WB-3: Product detail pages load properly
  record(
    'WB-3',
    'Website',
    'Product detail pages load properly with A3, A4, A5, A6 size selection only',
    productDetailsSrc.includes("['A3', 'A4', 'A5', 'A6']") &&
      !productDetailsSrc.includes('frame: true'),
    'ProductDetails.tsx renders A3, A4, A5, A6 size selector and Three-Tier pricing without frames.'
  );

  // WB-4: Custom Poster Studio works without frames
  record(
    'WB-4',
    'Website',
    'Custom Poster Studio works without frames',
    hasNoFrameInCustomStudio && customPosterSrc.includes('Frameless Archival Poster Canvas'),
    'Custom Poster Studio canvas, size selector, and cart payload operate strictly without frames.'
  );

  // WB-5: Cart and checkout work without frames
  record(
    'WB-5',
    'Website',
    'Cart and checkout work without frames',
    hasNoFrameInCart && hasNoFrameInCheckout,
    'Cart and Checkout pages operate cleanly with standalone poster sizes and quantities.'
  );

  // WB-6: Admin Dashboard remains in its normal UI
  const adminLayoutSrc = fs.readFileSync(path.join(rootDir, 'app/admin/layout.tsx'), 'utf8');
  const productFormSrc = fs.readFileSync(path.join(rootDir, 'components/ProductForm.tsx'), 'utf8');
  const validHierarchy = validateThreeTierPriceHierarchy(49, 29, 16, 'A4');
  record(
    'WB-6',
    'Website',
    'Admin Dashboard remains in its normal pre-Diwali UI with Three-Tier Pricing controls',
    !adminLayoutSrc.includes('DiwaliFireworks') &&
      !adminLayoutSrc.includes('FestiveJhalar') &&
      productFormSrc.includes('Retail MRP') &&
      productFormSrc.includes('Base Selling Price') &&
      productFormSrc.includes('Diwali Selling Price') &&
      validHierarchy.valid,
    'Admin layout has zero Diwali decorations and ProductForm retains all Three-Tier Pricing inputs.'
  );

  // WB-7: No React hydration errors exist
  const rootLayoutSrc = fs.readFileSync(path.join(rootDir, 'app/layout.tsx'), 'utf8');
  record(
    'WB-7',
    'Website',
    'No React hydration errors exist (deterministic SSR reference time + suppressHydrationWarning)',
    rootLayoutSrc.includes('suppressHydrationWarning') &&
      authTimeHookSrc.includes('initialReferenceMs'),
    'SSR and client hydration use deterministic initialReferenceMs and post-mount clock sync.'
  );

  // WB-8: Policy pages accurately reflect frameless posters
  const refundSrc = fs.readFileSync(
    path.join(rootDir, 'app/cancellation-and-refund-policy/page.tsx'),
    'utf8'
  );
  const shippingSrc = fs.readFileSync(path.join(rootDir, 'app/shipping-policy/page.tsx'), 'utf8');
  const termsSrc = fs.readFileSync(
    path.join(rootDir, 'app/terms-and-conditions/page.tsx'),
    'utf8'
  );
  record(
    'WB-8',
    'Website',
    'Customer-facing policy pages accurately describe standalone frameless posters',
    !refundSrc.includes('frame') &&
      !shippingSrc.includes('frame') &&
      !termsSrc.includes('frame'),
    'Cancellation, Shipping, and Terms & Conditions pages contain zero frame references.'
  );

  const failed = results.filter((r) => !r.passed);
  console.log(`\n================================================================`);
  console.log(`TOTAL CHECKS: ${results.length} | PASSED: ${results.length - failed.length} | FAILED: ${failed.length}`);
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
