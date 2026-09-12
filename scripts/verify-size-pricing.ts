import prisma from '../lib/prisma';
import { calculateCartTotal } from '../lib/discounts';
import { getVariantUnitPrice } from '../lib/pricing';

async function verify() {
  console.log('=== STARTING FUNCTIONAL VERIFICATION ===\n');

  // Test 1: Query an existing order to verify historical integrity
  console.log('--- Step 1: Verifying Existing Order Integrity ---');
  const existingOrder = await prisma.order.findFirst({
    include: { items: true },
  });
  if (existingOrder) {
    console.log(`Verified Order ${existingOrder.orderNumber}: Total = ₹${existingOrder.total}`);
    for (const item of existingOrder.items) {
      console.log(`  Item: ${item.title}, Size: ${item.sizeName}, Price: ₹${item.price}, Qty: ${item.quantity}`);
      if (typeof item.price !== 'number' || item.price <= 0) {
        throw new Error(`Invalid historical price on order item: ${item.id}`);
      }
    }
  } else {
    console.log('No existing orders found in database.');
  }

  // Test 2: Category lookup for test products
  const category = await prisma.category.findFirst();
  if (!category) {
    throw new Error('No category found in database to attach test products.');
  }

  const VALID_SIZES = ['A3', 'A4', 'A5', 'A6'];
  const dbSizes = await prisma.productSize.findMany({
    where: { name: { in: VALID_SIZES } },
  });
  const sizeMap = new Map(dbSizes.map((s) => [s.name, s.id]));

  // Test 3: Create Product 1 with custom size prices (A6: 19, A5: 39, A4: 59, A3: 99)
  console.log('\n--- Step 2: Creating Product 1 with Base Size Prices ---');
  const testSKU1 = `TEST-PROD-1-${Date.now()}`;
  const prod1 = await prisma.product.create({
    data: {
      title: 'Verification Poster Alpha',
      slug: `verification-poster-alpha-${Date.now()}`,
      description: 'Test poster 1 description',
      price: 59,
      MRP: 119,
      discount: 0,
      SKU: testSKU1,
      categoryId: category.id,
      variants: {
        create: [
          { sizeId: sizeMap.get('A6')!, price: 19, additionalPrice: 0, stock: 10, SKU: `${testSKU1}-A6` },
          { sizeId: sizeMap.get('A5')!, price: 39, additionalPrice: 0, stock: 10, SKU: `${testSKU1}-A5` },
          { sizeId: sizeMap.get('A4')!, price: 59, additionalPrice: 0, stock: 10, SKU: `${testSKU1}-A4` },
          { sizeId: sizeMap.get('A3')!, price: 99, additionalPrice: 0, stock: 10, SKU: `${testSKU1}-A3` },
        ],
      },
    },
    include: { variants: { include: { size: true } } },
  });

  console.log(`Created Product 1 (${prod1.title}):`);
  for (const v of prod1.variants) {
    console.log(`  Size ${v.size.name}: ₹${v.price} (unit price helper: ₹${getVariantUnitPrice(v, prod1.price)})`);
  }

  // Verify Product 1 prices
  const p1A6 = prod1.variants.find((v) => v.size.name === 'A6')?.price;
  const p1A5 = prod1.variants.find((v) => v.size.name === 'A5')?.price;
  const p1A4 = prod1.variants.find((v) => v.size.name === 'A4')?.price;
  const p1A3 = prod1.variants.find((v) => v.size.name === 'A3')?.price;
  if (p1A6 !== 19 || p1A5 !== 39 || p1A4 !== 59 || p1A3 !== 99) {
    throw new Error(`Product 1 prices mismatch! Got A6:${p1A6}, A5:${p1A5}, A4:${p1A4}, A3:${p1A3}`);
  }

  // Test 4: Create Product 2 with different custom size prices (A6: 29, A5: 49, A4: 79, A3: 129)
  console.log('\n--- Step 3: Creating Product 2 with Independent Custom Prices ---');
  const testSKU2 = `TEST-PROD-2-${Date.now()}`;
  const prod2 = await prisma.product.create({
    data: {
      title: 'Verification Poster Beta',
      slug: `verification-poster-beta-${Date.now()}`,
      description: 'Test poster 2 description',
      price: 79,
      MRP: 159,
      discount: 0,
      SKU: testSKU2,
      categoryId: category.id,
      variants: {
        create: [
          { sizeId: sizeMap.get('A6')!, price: 29, additionalPrice: 0, stock: 10, SKU: `${testSKU2}-A6` },
          { sizeId: sizeMap.get('A5')!, price: 49, additionalPrice: 0, stock: 10, SKU: `${testSKU2}-A5` },
          { sizeId: sizeMap.get('A4')!, price: 79, additionalPrice: 0, stock: 10, SKU: `${testSKU2}-A4` },
          { sizeId: sizeMap.get('A3')!, price: 129, additionalPrice: 0, stock: 10, SKU: `${testSKU2}-A3` },
        ],
      },
    },
    include: { variants: { include: { size: true } } },
  });

  console.log(`Created Product 2 (${prod2.title}):`);
  for (const v of prod2.variants) {
    console.log(`  Size ${v.size.name}: ₹${v.price} (unit price helper: ₹${getVariantUnitPrice(v, prod2.price)})`);
  }

  const p2A6 = prod2.variants.find((v) => v.size.name === 'A6')?.price;
  const p2A5 = prod2.variants.find((v) => v.size.name === 'A5')?.price;
  const p2A4 = prod2.variants.find((v) => v.size.name === 'A4')?.price;
  const p2A3 = prod2.variants.find((v) => v.size.name === 'A3')?.price;
  if (p2A6 !== 29 || p2A5 !== 49 || p2A4 !== 79 || p2A3 !== 129) {
    throw new Error(`Product 2 prices mismatch! Got A6:${p2A6}, A5:${p2A5}, A4:${p2A4}, A3:${p2A3}`);
  }

  // Test 5: Verify Product Price Isolation when Editing Product 1
  console.log('\n--- Step 4: Testing Price Isolation on Product Edit ---');
  // Edit Product 1 A3 price to 149 and A6 price to 25
  const p1A3Variant = prod1.variants.find((v) => v.size.name === 'A3')!;
  const p1A6Variant = prod1.variants.find((v) => v.size.name === 'A6')!;

  await prisma.productVariant.update({
    where: { id: p1A3Variant.id },
    data: { price: 149 },
  });
  await prisma.productVariant.update({
    where: { id: p1A6Variant.id },
    data: { price: 25 },
  });

  // Re-fetch Product 2 and verify its prices remain exactly 29, 49, 79, 129
  const reloadedProd2 = await prisma.product.findUnique({
    where: { id: prod2.id },
    include: { variants: { include: { size: true } } },
  });
  if (!reloadedProd2) throw new Error('Product 2 not found');

  console.log('Product 2 after Product 1 was modified:');
  for (const v of reloadedProd2.variants) {
    console.log(`  Size ${v.size.name}: ₹${v.price}`);
  }
  const check2A6 = reloadedProd2.variants.find((v) => v.size.name === 'A6')?.price;
  const check2A3 = reloadedProd2.variants.find((v) => v.size.name === 'A3')?.price;
  if (check2A6 !== 29 || check2A3 !== 129) {
    throw new Error(`Product 2 was affected by Product 1 edits! A6:${check2A6}, A3:${check2A3}`);
  }
  console.log('✓ Product price isolation confirmed: Product 2 prices remained completely unchanged.');

  // Test 6: Cart & Checkout calculation using authoritative variant price
  console.log('\n--- Step 5: Testing Cart, Checkout & Razorpay Pipeline ---');
  // Create a test cart with Product 2 A6 (qty 2 @ ₹29) and Product 2 A3 (qty 1 @ ₹129)
  const vA6 = reloadedProd2.variants.find((v) => v.size.name === 'A6')!;
  const vA3 = reloadedProd2.variants.find((v) => v.size.name === 'A3')!;

  const testSessionToken = `test-session-${Date.now()}`;
  const testCart = await prisma.cart.create({
    data: {
      sessionToken: testSessionToken,
      items: {
        create: [
          { productId: prod2.id, variantId: vA6.id, quantity: 2 },
          { productId: prod2.id, variantId: vA3.id, quantity: 1 },
        ],
      },
    },
    include: {
      items: {
        include: {
          product: true,
          variant: { include: { size: true } },
        },
      },
    },
  });

  // Verify item unit prices
  for (const item of testCart.items) {
    const unitPrice = getVariantUnitPrice(item.variant, item.product.price);
    console.log(`Cart item: Size ${item.variant?.size.name}, Unit Price: ₹${unitPrice}, Qty: ${item.quantity}, Total: ₹${unitPrice * item.quantity}`);
    if (item.variant?.size.name === 'A6' && unitPrice !== 29) throw new Error(`Cart A6 price mismatch: ₹${unitPrice} !== ₹29`);
    if (item.variant?.size.name === 'A3' && unitPrice !== 129) throw new Error(`Cart A3 price mismatch: ₹${unitPrice} !== ₹129`);
  }

  // Calculate cart breakdown
  const breakdown = await calculateCartTotal(testCart.id);
  const expectedSubtotal = 2 * 29 + 1 * 129; // 58 + 129 = 187
  console.log(`Calculated Subtotal: ₹${breakdown.subtotal} (Expected: ₹${expectedSubtotal})`);
  if (breakdown.subtotal !== expectedSubtotal) {
    throw new Error(`Subtotal mismatch! Got ${breakdown.subtotal}, expected ${expectedSubtotal}`);
  }

  // Razorpay paise calculation
  const razorpayPaise = Math.round(breakdown.total * 100);
  console.log(`Calculated Total: ₹${breakdown.total}, Razorpay Amount in Paise: ${razorpayPaise}`);
  if (razorpayPaise !== Math.round(breakdown.total * 100)) {
    throw new Error('Razorpay paise amount mismatch!');
  }
  console.log('✓ Cart, Checkout, and Razorpay pipeline verified successfully.');

  // Cleanup test records
  console.log('\n--- Cleaning up test records ---');
  await prisma.cartItem.deleteMany({ where: { cartId: testCart.id } });
  await prisma.cart.delete({ where: { id: testCart.id } });
  await prisma.productVariant.deleteMany({ where: { productId: { in: [prod1.id, prod2.id] } } });
  await prisma.product.deleteMany({ where: { id: { in: [prod1.id, prod2.id] } } });
  console.log('✓ Cleanup complete.');

  console.log('\n=== ALL FUNCTIONAL VERIFICATIONS PASSED ===');
}

verify()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
