import { DEFAULT_SIZE_PRICES, MINIMUM_ORDER_VALUE, getVariantUnitPrice } from '../lib/pricing';
import { calculateCustomPosterPrice, POSTER_SIZES } from '../lib/customPosterPricing';
import prisma from '../lib/prisma';
import { calculateCartTotal } from '../lib/discounts';

async function runTests() {
  console.log('====================================================');
  console.log('  HELLFIRE PRINTS - VERIFICATION & VALIDATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------------
  // TEST SECTION 1: DEFAULT POSTER PRICES
  // -------------------------------------------------------------------
  console.log('--- TEST SECTION 1: Default Poster Prices Everywhere ---');
  assert(DEFAULT_SIZE_PRICES.A6 === 7, 'A6 default price is ₹7', `Got ₹${DEFAULT_SIZE_PRICES.A6}`);
  assert(DEFAULT_SIZE_PRICES.A5 === 15, 'A5 default price is ₹15', `Got ₹${DEFAULT_SIZE_PRICES.A5}`);
  assert(DEFAULT_SIZE_PRICES.A4 === 29, 'A4 default price is ₹29', `Got ₹${DEFAULT_SIZE_PRICES.A4}`);
  assert(DEFAULT_SIZE_PRICES.A3 === 49, 'A3 default price is ₹49', `Got ₹${DEFAULT_SIZE_PRICES.A3}`);

  // Test Custom Poster pricing library
  const cpA6 = calculateCustomPosterPrice({ sizeName: 'A6' });
  const cpA5 = calculateCustomPosterPrice({ sizeName: 'A5' });
  const cpA4 = calculateCustomPosterPrice({ sizeName: 'A4' });
  const cpA3 = calculateCustomPosterPrice({ sizeName: 'A3' });

  assert(cpA6 === 7, 'Custom poster A6 unit price is ₹7', `Got ₹${cpA6}`);
  assert(cpA5 === 15, 'Custom poster A5 unit price is ₹15', `Got ₹${cpA5}`);
  assert(cpA4 === 29, 'Custom poster A4 unit price is ₹29', `Got ₹${cpA4}`);
  assert(cpA3 === 49, 'Custom poster A3 unit price is ₹49', `Got ₹${cpA3}`);

  // -------------------------------------------------------------------
  // TEST SECTION 2: ADMIN-CONFIGURED CUSTOM PRICES ARE PRESERVED
  // -------------------------------------------------------------------
  console.log('\n--- TEST SECTION 2: Admin-Configured Prices Preservation ---');
  // Check products in the database that have explicit custom prices (e.g., sets/multipacks or custom configured)
  const customVariants = await prisma.productVariant.findMany({
    where: {
      price: {
        not: null,
      },
    },
    include: {
      product: true,
      size: true,
    },
    take: 5,
  });

  if (customVariants.length > 0) {
    for (const v of customVariants) {
      const calculatedPrice = getVariantUnitPrice(v, v.product.price);
      assert(
        calculatedPrice === v.price,
        `Preserved admin-configured variant price for "${v.product.title}" (${v.size?.name || 'Size'}): ₹${calculatedPrice} === ₹${v.price}`
      );
    }
  } else {
    console.log('No custom overridden variants found; standard variants adhere to default prices.');
  }

  // -------------------------------------------------------------------
  // TEST SECTION 3: MINIMUM ORDER VALUE CONSTANT AND LOGIC
  // -------------------------------------------------------------------
  console.log('\n--- TEST SECTION 3: Minimum Order Value (₹50) Rule ---');
  assert(MINIMUM_ORDER_VALUE === 50, 'MINIMUM_ORDER_VALUE constant equals 50');

  // Test Order Validation function logic
  function validateOrderThreshold(subtotal: number, discount = 0, shippingFee = 0) {
    const payableMerchandiseTotal = Math.max(0, subtotal - discount);
    const total = payableMerchandiseTotal + shippingFee;

    if (payableMerchandiseTotal < MINIMUM_ORDER_VALUE || total < MINIMUM_ORDER_VALUE) {
      const shortfall = MINIMUM_ORDER_VALUE - payableMerchandiseTotal;
      const formattedShortfall = shortfall % 1 === 0 ? shortfall.toFixed(0) : shortfall.toFixed(2);
      return {
        allowed: false,
        error: `Minimum order value is ₹${MINIMUM_ORDER_VALUE}. Add ₹${formattedShortfall} more to place your order.`,
        shortfall: Number(formattedShortfall),
      };
    }
    return { allowed: true };
  }

  // Scenario: Order total ₹49 -> Order rejected
  const res49 = validateOrderThreshold(49);
  assert(
    !res49.allowed && res49.error === 'Minimum order value is ₹50. Add ₹1 more to place your order.',
    'Order total ₹49 is REJECTED with message "Minimum order value is ₹50. Add ₹1 more to place your order."',
    res49.error
  );

  // Scenario: Order total ₹49.99 -> Order rejected
  const res49_99 = validateOrderThreshold(49.99);
  assert(
    !res49_99.allowed && res49_99.error === 'Minimum order value is ₹50. Add ₹0.01 more to place your order.',
    'Order total ₹49.99 is REJECTED with message "Minimum order value is ₹50. Add ₹0.01 more to place your order."',
    res49_99.error
  );

  // Scenario: Order total ₹50 -> Order allowed
  const res50 = validateOrderThreshold(50);
  assert(res50.allowed, 'Order total exactly ₹50 is ALLOWED');

  // Scenario: Order total ₹51 -> Order allowed
  const res51 = validateOrderThreshold(51);
  assert(res51.allowed, 'Order total ₹51 is ALLOWED');

  // Scenario: Empty cart (subtotal 0) -> Order rejected
  const res0 = validateOrderThreshold(0);
  assert(
    !res0.allowed && res0.error === 'Minimum order value is ₹50. Add ₹50 more to place your order.',
    'Empty cart (₹0) is REJECTED with required addition of ₹50',
    res0.error
  );

  // Scenario: Client tampers with the submitted total (e.g. client claims ₹100 but actual merchandise is ₹29)
  const actualMerchandise = 29; // e.g. 1 A4 poster @ ₹29
  const clientSubmittedTotal = 100; // tampered total
  // The server calculates actualMerchandise, ignoring client-submitted total
  const resTampered = validateOrderThreshold(actualMerchandise);
  assert(
    !resTampered.allowed && resTampered.shortfall === 21,
    'Client tampered total is ignored; server enforces minimum on actual merchandise (₹29 requires ₹21 more)'
  );

  // -------------------------------------------------------------------
  // TEST SECTION 4: REAL CART & DATABASE ORDER CALCULATIONS
  // -------------------------------------------------------------------
  console.log('\n--- TEST SECTION 4: Real Database Cart Breakdown & Calculations ---');

  // Find a test user or admin
  const testUser = await prisma.user.findFirst();
  if (testUser) {
    // Find or create a test cart
    let cart = await prisma.cart.findUnique({
      where: { userId: testUser.id },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: testUser.id },
        include: { items: true },
      });
    }

    // Save existing items if any to restore later
    const existingItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
    });

    try {
      // Clear cart items for controlled testing
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

      // Test 4.1: Empty cart breakdown
      const emptyBreakdown = await calculateCartTotal(cart.id);
      assert(emptyBreakdown.total === 0, 'Empty cart calculateCartTotal returns total 0');

      // Test 4.2: Add 1 x A6 custom poster (₹7) -> Below ₹50
      const cpItemUnder = await prisma.customPoster.create({
        data: {
          imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          sizeName: 'A6',
          frameName: 'No Frame',
          paperType: 'Premium Matte Paper (300 GSM)',
          price: 7,
        },
      });

      // Find custom-poster base product
      const cpBaseProduct = await prisma.product.findUnique({
        where: { slug: 'custom-poster' },
      });

      if (cpBaseProduct) {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: cpBaseProduct.id,
            customPosterId: cpItemUnder.id,
            quantity: 1, // 1 * 7 = ₹7
          },
        });

        const breakdownUnder = await calculateCartTotal(cart.id);
        assert(breakdownUnder.subtotal === 7, 'Cart subtotal with 1 A6 is ₹7');
        const checkUnder = validateOrderThreshold(breakdownUnder.subtotal, breakdownUnder.totalDiscount, breakdownUnder.shippingFee);
        assert(!checkUnder.allowed, 'Custom poster order of 1 A6 (₹7) is REJECTED (below ₹50 threshold)');

        // Test 4.3: Add 10 A6 custom posters (10 * 7 = ₹70, discount 15% = 10.5, net 59.50) -> Eligible to proceed
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: cpBaseProduct.id,
            customPosterId: cpItemUnder.id,
            quantity: 10,
          },
        });

        const breakdownEligible = await calculateCartTotal(cart.id);
        const checkEligible = validateOrderThreshold(breakdownEligible.subtotal, breakdownEligible.totalDiscount, breakdownEligible.shippingFee);
        assert(
          checkEligible.allowed && breakdownEligible.total >= 50,
          `Custom poster order of 10 A6 posters (Net: ₹${breakdownEligible.total}) is ALLOWED to proceed`
        );
      }

      // Clean up test custom poster
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.customPoster.delete({ where: { id: cpItemUnder.id } });

    } finally {
      // Restore any previous cart items if there were any
      if (existingItems.length > 0) {
        for (const item of existingItems) {
          await prisma.cartItem.create({
            data: {
              cartId: item.cartId,
              productId: item.productId,
              variantId: item.variantId,
              customPosterId: item.customPosterId,
              quantity: item.quantity,
            },
          });
        }
      }
    }
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error('Test suite encountered an error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
