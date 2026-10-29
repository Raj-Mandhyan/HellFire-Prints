import prisma from '../lib/prisma';
import { POSTER_SIZES, calculateCustomPosterPrice } from '../lib/customPosterPricing';
import { DEFAULT_SIZE_PRICES, SIZE_DISPLAY_DIMENSIONS } from '../lib/pricing';

async function verifyCustomPosterStudio() {
  console.log('===============================================================');
  console.log('HELLFIRE PRINTS - CUSTOM POSTER STUDIO VERIFICATION');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   ${detail}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   ${detail}`);
    }
  }

  // 1. Verify poster sizes and prices
  console.log('--- Test 1: Sizing and Pricing Consistency ---');
  for (const s of POSTER_SIZES) {
    const calcPrice = calculateCustomPosterPrice({ sizeName: s.name });
    assert(
      calcPrice === s.price,
      `Size ${s.name} price matches calculateCustomPosterPrice (${s.price} INR)`,
      `Dimensions: ${s.dimensions}, Aspect Ratio: ${s.aspectRatio.toFixed(3)}`
    );
  }

  // 2. Verify Database CustomPoster Model & Cart Item Integration
  console.log('\n--- Test 2: Custom Poster Cart Integration ---');
  let testUser = await prisma.user.findFirst({
    where: { email: 'customer@hellfireprints.com' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        name: 'Studio Test User',
        email: 'customer@hellfireprints.com',
        role: 'CUSTOMER',
      },
    });
  }

  // Create or retrieve user's cart
  let cart = await prisma.cart.findUnique({
    where: { userId: testUser.id },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: testUser.id },
    });
  }

  // Find or create base product
  let baseProduct = await prisma.product.findFirst({
    where: { slug: 'custom-poster' },
  });
  if (!baseProduct) {
    const category = await prisma.category.findFirst() || await prisma.category.create({
      data: { name: 'Custom', slug: 'custom', description: 'Custom Posters' },
    });
    baseProduct = await prisma.product.create({
      data: {
        title: 'Custom Poster Print',
        slug: 'custom-poster',
        description: 'Personalized artwork print',
        price: 29.0,
        MRP: 99.0,
        discount: 0,
        SKU: 'HFP-CUST-VERIFY',
        categoryId: category.id,
      },
    });
  }

  // Test creating a custom poster record
  const customPoster = await prisma.customPoster.create({
    data: {
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      orientation: 'PORTRAIT',
      sizeName: 'A4',
      frameName: 'No Frame',
      paperType: 'Matte',
      price: calculateCustomPosterPrice({ sizeName: 'A4' }),
      configuration: {
        objects: [{ type: 'image', src: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80' }],
      },
    },
  });

  const cartItem = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: baseProduct.id,
      customPosterId: customPoster.id,
      quantity: 1,
    },
  });

  assert(
    cartItem.customPosterId === customPoster.id,
    'Custom poster attaches to cart item correctly',
    `CartItemId: ${cartItem.id}, CustomPosterId: ${customPoster.id}`
  );

  // Verify Cart Item retrieval matches price
  const retrievedItem = await prisma.cartItem.findUnique({
    where: { id: cartItem.id },
    include: { customPoster: true },
  });

  assert(
    retrievedItem?.customPoster?.price === calculateCustomPosterPrice({ sizeName: 'A4' }),
    'Retrieved cart item price strictly matches calculateCustomPosterPrice',
    `Price: ₹${retrievedItem?.customPoster?.price}`
  );

  // 3. Test Saved Designs API Integration
  console.log('\n--- Test 3: Saved Designs Database Integration ---');
  const savedDesign = await prisma.customPosterDesign.create({
    data: {
      userId: testUser.id,
      name: 'Test Cyberpunk Studio Layout',
      configuration: { version: '5.3.0', objects: [] },
      previewImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    },
  });

  assert(
    savedDesign.name === 'Test Cyberpunk Studio Layout',
    'Custom poster design saved under user profile',
    `Design ID: ${savedDesign.id}`
  );

  // Cleanup test artifacts
  console.log('\n--- Cleaning up test artifacts ---');
  await prisma.cartItem.delete({ where: { id: cartItem.id } });
  await prisma.customPoster.delete({ where: { id: customPoster.id } });
  await prisma.customPosterDesign.delete({ where: { id: savedDesign.id } });
  console.log('Cleanup completed successfully.');

  console.log('\n===============================================================');
  console.log(`VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('===============================================================');
}

verifyCustomPosterStudio()
  .catch((e) => {
    console.error('Studio verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
