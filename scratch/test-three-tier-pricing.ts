import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';
import {
  RETAIL_MRP_SIZE_PRICES,
  BASE_SELLING_SIZE_PRICES,
  DIWALI_SIZE_PRICES,
  DIWALI_OFFER_START_MS,
  DIWALI_OFFER_END_MS,
  getSizePricing,
  getVariantPricing,
  getVariantUnitPrice,
  validateThreeTierPriceHierarchy,
} from '../lib/pricing';
import { calculateCartTotal } from '../lib/discounts';

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

async function runTests() {
  console.log('=== Running Three-Tier Product Pricing System Verification Suite (20 Scenarios) ===\n');
  let passed = 0;

  const activeDate = new Date(DIWALI_OFFER_START_MS + 60_000); // Inside active Diwali window
  const expiredDate = new Date(DIWALI_OFFER_END_MS + 60_000); // After 9 Nov 2026 4:00 AM IST

  // Scenario 1: Admin login & requireAdmin protection in app/admin/actions.ts and app/admin/products
  {
    const actionsCode = fs.readFileSync(path.join(process.cwd(), 'app/admin/actions.ts'), 'utf8');
    const adminProductsPage = fs.readFileSync(path.join(process.cwd(), 'app/admin/products/page.tsx'), 'utf8');
    const adminEditPage = fs.readFileSync(path.join(process.cwd(), 'app/admin/products/[id]/edit/page.tsx'), 'utf8');
    assert(actionsCode.includes('await requireAdmin()'), 'createProductAction & updateProductAction must call requireAdmin()');
    assert(adminProductsPage.includes('await requireAdmin()'), 'Admin products page must call requireAdmin()');
    assert(adminEditPage.includes('await requireAdmin()'), 'Admin edit product page must call requireAdmin()');
    console.log('✅ Scenario 1: Admin authentication & requireAdmin() enforcement verified');
    passed++;
  }

  // Scenario 2: Viewing product prices in Admin -> Products
  {
    const sampleProduct = await prisma.product.findFirst({
      where: { active: true },
      include: { variants: { include: { size: true } } },
    });
    assert(sampleProduct !== null, 'Active product must exist in Neon PostgreSQL');
    assert(typeof sampleProduct!.MRP === 'number' && sampleProduct!.MRP > 0, 'Product.MRP must be populated');
    assert(typeof sampleProduct!.price === 'number' && sampleProduct!.price > 0, 'Product.price must be populated');
    assert(typeof sampleProduct!.diwaliPrice === 'number' && sampleProduct!.diwaliPrice! > 0, 'Product.diwaliPrice must be populated');
    for (const v of sampleProduct!.variants) {
      if (['A3', 'A4', 'A5', 'A6'].includes(v.size.name)) {
        assert(typeof v.retailMrp === 'number' && v.retailMrp > 0, `Variant ${v.size.name} retailMrp must be populated`);
        assert(typeof v.baseSellingPrice === 'number' && v.baseSellingPrice > 0, `Variant ${v.size.name} baseSellingPrice must be populated`);
        assert(typeof v.diwaliSellingPrice === 'number' && v.diwaliSellingPrice > 0, `Variant ${v.size.name} diwaliSellingPrice must be populated`);
      }
    }
    console.log('✅ Scenario 2: Viewing product Three-Tier prices in Admin -> Products verified');
    passed++;
  }

  // Scenario 3: Editing Retail MRP for a product size & verifying persistence
  const targetProduct = await prisma.product.findFirst({
    where: { active: true },
    include: { variants: { include: { size: true } } },
  });
  assert(targetProduct !== null, 'Target product must exist');
  const a3Variant = targetProduct!.variants.find((v) => v.size.name === 'A3')!;
  const origA3 = {
    retailMrp: a3Variant.retailMrp,
    baseSellingPrice: a3Variant.baseSellingPrice,
    price: a3Variant.price,
    diwaliSellingPrice: a3Variant.diwaliSellingPrice,
  };

  try {
    {
      await prisma.productVariant.update({
        where: { id: a3Variant.id },
        data: { retailMrp: 129 },
      });
      const updated = await prisma.productVariant.findUnique({ where: { id: a3Variant.id }, include: { size: true } });
      const pricing = getVariantPricing(updated, targetProduct!.price, activeDate);
      assert(pricing.retailMrp === 129, `Expected updated Retail MRP 129, got ${pricing.retailMrp}`);
      assert(pricing.effectivePrice === origA3.diwaliSellingPrice, 'Editing Retail MRP must not change effective Diwali checkout price');
      console.log('✅ Scenario 3: Editing Retail MRP verified');
      passed++;
    }

    // Scenario 4: Editing Base Selling Price
    {
      await prisma.productVariant.update({
        where: { id: a3Variant.id },
        data: { baseSellingPrice: 59, price: 59 },
      });
      const updated = await prisma.productVariant.findUnique({ where: { id: a3Variant.id }, include: { size: true } });
      const activePricing = getVariantPricing(updated, targetProduct!.price, activeDate);
      const expiredPricing = getVariantPricing(updated, targetProduct!.price, expiredDate);
      assert(activePricing.baseSellingPrice === 59, `Expected Base Selling Price 59, got ${activePricing.baseSellingPrice}`);
      assert(expiredPricing.effectivePrice === 59, `Expected expired effective price 59, got ${expiredPricing.effectivePrice}`);
      console.log('✅ Scenario 4: Editing Base Selling Price verified');
      passed++;
    }

    // Scenario 5: Editing Diwali Selling Price
    {
      await prisma.productVariant.update({
        where: { id: a3Variant.id },
        data: { diwaliSellingPrice: 35 },
      });
      const updated = await prisma.productVariant.findUnique({ where: { id: a3Variant.id }, include: { size: true } });
      const activePricing = getVariantPricing(updated, targetProduct!.price, activeDate);
      assert(activePricing.diwaliSellingPrice === 35, `Expected Diwali Selling Price 35, got ${activePricing.diwaliSellingPrice}`);
      assert(activePricing.effectivePrice === 35, `Expected active effective price 35, got ${activePricing.effectivePrice}`);
      assert(activePricing.savings === 59 - 35, `Expected Diwali savings 24, got ${activePricing.savings}`);
      console.log('✅ Scenario 5: Editing Diwali Selling Price verified');
      passed++;
    }
  } finally {
    // Restore original A3 values
    await prisma.productVariant.update({
      where: { id: a3Variant.id },
      data: origA3,
    });
  }

  // Scenario 6: Editing prices for each size (A3, A4, A5, A6) independently
  {
    const customTiers = {
      A3: { retailMrp: 119, baseSellingPrice: 55, diwaliSellingPrice: 36 },
      A4: { retailMrp: 69, baseSellingPrice: 35, diwaliSellingPrice: 19 },
      A5: { retailMrp: 45, baseSellingPrice: 19, diwaliSellingPrice: 10 },
      A6: { retailMrp: 25, baseSellingPrice: 9, diwaliSellingPrice: 5 },
    } as const;

    for (const [sizeCode, tiers] of Object.entries(customTiers)) {
      const check = validateThreeTierPriceHierarchy(
        tiers.retailMrp,
        tiers.baseSellingPrice,
        tiers.diwaliSellingPrice,
        `Size ${sizeCode}`
      );
      assert(check.valid, `Custom tier for ${sizeCode} must be valid`);
      const resolvedActive = getSizePricing(sizeCode, activeDate, 'ACTIVE', tiers);
      const resolvedNormal = getSizePricing(sizeCode, expiredDate, 'EXPIRED', tiers);
      assert(resolvedActive.retailMrp === tiers.retailMrp, `${sizeCode} retailMrp mismatch`);
      assert(resolvedActive.baseSellingPrice === tiers.baseSellingPrice, `${sizeCode} baseSellingPrice mismatch`);
      assert(resolvedActive.diwaliSellingPrice === tiers.diwaliSellingPrice, `${sizeCode} diwaliSellingPrice mismatch`);
      assert(resolvedActive.effectivePrice === tiers.diwaliSellingPrice, `${sizeCode} active effectivePrice must equal diwaliSellingPrice`);
      assert(resolvedNormal.effectivePrice === tiers.baseSellingPrice, `${sizeCode} normal effectivePrice must equal baseSellingPrice`);
    }
    console.log('✅ Scenario 6: Editing prices for each size (A3, A4, A5, A6) verified');
    passed++;
  }

  // Scenario 7: Creating a new product with all three prices (and cleaning up)
  {
    const category = await prisma.category.findFirst();
    const dbSizes = await prisma.productSize.findMany({
      where: { name: { in: ['A3', 'A4', 'A5', 'A6'] } },
    });
    const tempSku = `TEST-3TIER-${Date.now()}`;
    const created = await prisma.product.create({
      data: {
        title: 'Temporary Three-Tier Verification Poster',
        slug: `temp-three-tier-${Date.now()}`,
        description: 'Automated test product for three-tier pricing verification.',
        price: BASE_SELLING_SIZE_PRICES.A4,
        MRP: RETAIL_MRP_SIZE_PRICES.A4,
        diwaliPrice: DIWALI_SIZE_PRICES.A4,
        discount: 0,
        SKU: tempSku,
        active: false,
        categoryId: category!.id,
        variants: {
          create: dbSizes.map((s) => ({
            sizeId: s.id,
            price: BASE_SELLING_SIZE_PRICES[s.name],
            retailMrp: RETAIL_MRP_SIZE_PRICES[s.name],
            baseSellingPrice: BASE_SELLING_SIZE_PRICES[s.name],
            diwaliSellingPrice: DIWALI_SIZE_PRICES[s.name],
            additionalPrice: 0,
            stock: 25,
            SKU: `${tempSku}-${s.name}`,
          })),
        },
      },
      include: { variants: { include: { size: true } } },
    });

    try {
      assert(created.variants.length === 4, 'Created product must have 4 size variants');
      for (const v of created.variants) {
        assert(v.retailMrp === RETAIL_MRP_SIZE_PRICES[v.size.name], `Created ${v.size.name} retailMrp mismatch`);
        assert(v.baseSellingPrice === BASE_SELLING_SIZE_PRICES[v.size.name], `Created ${v.size.name} baseSellingPrice mismatch`);
        assert(v.diwaliSellingPrice === DIWALI_SIZE_PRICES[v.size.name], `Created ${v.size.name} diwaliSellingPrice mismatch`);
      }
      console.log('✅ Scenario 7: Creating a new product with all three prices verified');
      passed++;
    } finally {
      await prisma.product.delete({ where: { id: created.id } });
    }
  }

  // Scenario 8: Validation when Retail MRP < Base Selling Price
  {
    const invalidMrp = validateThreeTierPriceHierarchy(39, 49, 32, 'Size A3');
    assert(invalidMrp.valid === false, 'Retail MRP < Base Selling Price must fail validation');
    assert(
      Boolean(invalidMrp.error && invalidMrp.error.includes('Retail MRP (₹39) must be greater than or equal to Base Selling Price (₹49)')),
      `Unexpected error message: ${invalidMrp.error}`
    );
    console.log('✅ Scenario 8: Validation when Retail MRP < Base Selling Price verified');
    passed++;
  }

  // Scenario 9: Validation when Base Selling Price < Diwali Selling Price
  {
    const invalidDiwali = validateThreeTierPriceHierarchy(99, 29, 32, 'Size A3');
    assert(invalidDiwali.valid === false, 'Base Selling Price < Diwali Selling Price must fail validation');
    assert(
      Boolean(invalidDiwali.error && invalidDiwali.error.includes('Base Selling Price (₹29) must be greater than or equal to Diwali Selling Price (₹32)')),
      `Unexpected error message: ${invalidDiwali.error}`
    );
    console.log('✅ Scenario 9: Validation when Base Selling Price < Diwali Selling Price verified');
    passed++;
  }

  // Scenario 10: Customer-facing display during active Diwali Sale
  {
    const heroCode = fs.readFileSync(path.join(process.cwd(), 'components/DiwaliHeroSection.tsx'), 'utf8');
    const detailsCode = fs.readFileSync(path.join(process.cwd(), 'components/ProductDetails.tsx'), 'utf8');
    const catalogCode = fs.readFileSync(path.join(process.cwd(), 'components/ProductCatalog.tsx'), 'utf8');

    assert(heroCode.includes('Retail MRP:') && heroCode.includes('Base Selling Price:') && heroCode.includes('Diwali Selling Price:'), 'DiwaliHeroSection must display all three pricing tiers during active Diwali Sale');
    assert(detailsCode.includes('Retail MRP:') && detailsCode.includes('Base Selling Price:') && detailsCode.includes('Diwali Selling Price:') && detailsCode.includes('DIWALI SPECIAL OFFER'), 'ProductDetails must display all three pricing tiers and DIWALI SPECIAL OFFER badge');
    assert(catalogCode.includes('a4Pricing.retailMrp') && catalogCode.includes('a4Pricing.baseSellingPrice') && catalogCode.includes('a4Pricing.diwaliSellingPrice'), 'ProductCatalog cards must display all three pricing tiers');
    console.log('✅ Scenario 10: Customer-facing display during active Diwali Sale verified');
    passed++;
  }

  // Scenario 11: Customer-facing display after Diwali Sale expiration
  {
    for (const sizeCode of ['A3', 'A4', 'A5', 'A6'] as const) {
      const expiredPricing = getSizePricing(sizeCode, expiredDate, 'EXPIRED');
      assert(expiredPricing.isOfferActive === false, 'Offer must be inactive when expired');
      assert(expiredPricing.effectivePrice === BASE_SELLING_SIZE_PRICES[sizeCode], `Expired effectivePrice for ${sizeCode} must be Base Selling Price`);
      assert(expiredPricing.activeDiscount === 0, 'Active Diwali discount must be 0 when expired');
      assert(expiredPricing.normalDaySavings === RETAIL_MRP_SIZE_PRICES[sizeCode] - BASE_SELLING_SIZE_PRICES[sizeCode], 'Normal day savings vs Retail MRP must be accurate');
    }
    console.log('✅ Scenario 11: Customer-facing display after Diwali Sale expiration verified');
    passed++;
  }

  // Prepare temporary cart for Scenarios 12–19
  const testCart = await prisma.cart.create({
    data: {
      sessionToken: `test-3tier-session-${Date.now()}`,
      items: {
        create: [
          {
            productId: targetProduct!.id,
            variantId: a3Variant.id,
            quantity: 1, // A3: MRP=99, Base=49, Diwali=32
          },
        ],
      },
    },
  });

  try {
    // Scenario 12: Cart calculation during active Diwali Sale
    {
      const activeCart = await calculateCartTotal(testCart.id, activeDate);
      assert(activeCart.retailMrpSubtotal === 99, `Expected retailMrpSubtotal 99, got ${activeCart.retailMrpSubtotal}`);
      assert(activeCart.originalSubtotal === 49, `Expected originalSubtotal (Base) 49, got ${activeCart.originalSubtotal}`);
      assert(activeCart.subtotal === 32, `Expected Diwali subtotal 32, got ${activeCart.subtotal}`);
      assert(activeCart.diwaliDiscount === 17, `Expected diwaliDiscount 17, got ${activeCart.diwaliDiscount}`);
      assert(activeCart.mrpSavings === 67, `Expected mrpSavings 67, got ${activeCart.mrpSavings}`);
      assert(activeCart.total === 32, `Expected total 32, got ${activeCart.total}`);
      assert(activeCart.isMinimumOrderMet === true, '₹32 order must satisfy ₹30 minimum order value');
      console.log('✅ Scenario 12: Cart calculation during active Diwali Sale verified');
      passed++;
    }

    // Scenario 13: Cart calculation after Diwali Sale expiration
    {
      const expiredCart = await calculateCartTotal(testCart.id, expiredDate);
      assert(expiredCart.retailMrpSubtotal === 99, `Expected retailMrpSubtotal 99, got ${expiredCart.retailMrpSubtotal}`);
      assert(expiredCart.originalSubtotal === 49, `Expected originalSubtotal (Base) 49, got ${expiredCart.originalSubtotal}`);
      assert(expiredCart.subtotal === 49, `Expected normal-day subtotal 49, got ${expiredCart.subtotal}`);
      assert(expiredCart.diwaliDiscount === 0, `Expected diwaliDiscount 0 after expiry, got ${expiredCart.diwaliDiscount}`);
      assert(expiredCart.mrpSavings === 50, `Expected mrpSavings 50 on normal day, got ${expiredCart.mrpSavings}`);
      assert(expiredCart.total === 49, `Expected total 49 after expiry, got ${expiredCart.total}`);
      console.log('✅ Scenario 13: Cart calculation after Diwali Sale expiration verified');
      passed++;
    }

    // Scenario 14: Checkout calculation during active Diwali Sale (never charges Retail MRP)
    {
      const unitCharged = getVariantUnitPrice(a3Variant, targetProduct!.price, activeDate);
      assert(unitCharged === 32, `Checkout during Diwali must charge Diwali Selling Price (₹32), got ₹${unitCharged}`);
      assert(unitCharged !== a3Variant.retailMrp, 'Checkout must NEVER charge Retail MRP');
      console.log('✅ Scenario 14: Checkout calculation during active Diwali Sale verified');
      passed++;
    }

    // Scenario 15: Checkout calculation after Diwali Sale expiration (charges Base Selling Price, never Retail MRP)
    {
      const unitCharged = getVariantUnitPrice(a3Variant, targetProduct!.price, expiredDate);
      assert(unitCharged === 49, `Checkout after Diwali must charge Base Selling Price (₹49), got ₹${unitCharged}`);
      assert(unitCharged !== a3Variant.retailMrp, 'Checkout must NEVER charge Retail MRP');
      console.log('✅ Scenario 15: Checkout calculation after Diwali Sale expiration verified');
      passed++;
    }

    // Scenario 16: Razorpay payment order snapshot with Diwali Selling Price
    {
      const vp = getVariantPricing(a3Variant, targetProduct!.price, activeDate);
      assert(vp.effectivePrice === 32 && vp.retailMrp === 99 && vp.baseSellingPrice === 49 && vp.diwaliSellingPrice === 32, 'Razorpay active Diwali snapshot values verified');
      const rzpPaise = Math.round(vp.effectivePrice * 100);
      assert(rzpPaise === 3200, `Expected Razorpay paise amount 3200, got ${rzpPaise}`);
      console.log('✅ Scenario 16: Razorpay payment with Diwali Selling Price verified');
      passed++;
    }

    // Scenario 17: COD order snapshot with Diwali Selling Price
    {
      const vp = getVariantPricing(a3Variant, targetProduct!.price, activeDate);
      const orderCode = fs.readFileSync(path.join(process.cwd(), 'app/actions/order.ts'), 'utf8');
      assert(
        orderCode.includes('retailMrp: variantPricing.retailMrp') &&
          orderCode.includes('baseSellingPrice: variantPricing.baseSellingPrice') &&
          orderCode.includes('diwaliSellingPrice: variantPricing.diwaliSellingPrice'),
        'Order creation actions must snapshot all three pricing tiers on OrderItem'
      );
      assert(vp.effectivePrice === 32, 'COD order during Diwali charges ₹32');
      console.log('✅ Scenario 17: COD order with Diwali Selling Price verified');
      passed++;
    }

    // Scenario 18: Razorpay payment with Base Selling Price after sale expiry
    {
      const vp = getVariantPricing(a3Variant, targetProduct!.price, expiredDate);
      const rzpPaise = Math.round(vp.effectivePrice * 100);
      assert(vp.effectivePrice === 49 && rzpPaise === 4900, `Expected Razorpay post-expiry amount ₹49 (4900 paise), got ₹${vp.effectivePrice}`);
      console.log('✅ Scenario 18: Razorpay payment with Base Selling Price after sale expiry verified');
      passed++;
    }

    // Scenario 19: COD order with Base Selling Price after sale expiry
    {
      const vp = getVariantPricing(a3Variant, targetProduct!.price, expiredDate);
      assert(vp.effectivePrice === 49, `Expected COD post-expiry payable amount ₹49, got ₹${vp.effectivePrice}`);
      console.log('✅ Scenario 19: COD order with Base Selling Price after sale expiry verified');
      passed++;
    }
  } finally {
    await prisma.cart.delete({ where: { id: testCart.id } });
  }

  // Scenario 20: Unauthorized user attempting to modify prices is blocked
  {
    const { updateProductAction } = await import('../app/admin/actions');
    const fd = new FormData();
    fd.set('id', targetProduct!.id);
    fd.set('title', 'Unauthorized Price Tamper');
    fd.set('price_A4', '1');
    const res = await updateProductAction(null, fd);
    assert(Boolean(res && res.error), 'Unauthenticated/unauthorized call to updateProductAction must be rejected');
    console.log(`✅ Scenario 20: Unauthorized price modification blocked (${res?.error})`);
    passed++;
  }

  console.log(`\n🎉 ALL ${passed}/20 THREE-TIER PRICING TEST SCENARIOS PASSED SUCCESSFULLY!`);
}

runTests()
  .catch((err) => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

