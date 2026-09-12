require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL.replace(
  /([?&]sslmode=)(?:require|prefer|verify-ca)(?=&|$)/g,
  '$1verify-full'
);
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function verify() {
  console.log('--- 1. Testing calculateCustomPosterPrice logic ---');
  const { calculateCustomPosterPrice, POSTER_SIZES } = require('../lib/customPosterPricing');
  
  console.log('POSTER_SIZES:', POSTER_SIZES);

  const priceA6 = calculateCustomPosterPrice({ sizeName: 'A6' });
  const priceA5 = calculateCustomPosterPrice({ sizeName: 'A5' });
  const priceA4 = calculateCustomPosterPrice({ sizeName: 'A4' });
  const priceA3 = calculateCustomPosterPrice({ sizeName: 'A3' });

  console.log(`A6 Price: ₹${priceA6} (Expected: 19) -> ${priceA6 === 19 ? 'PASS' : 'FAIL'}`);
  console.log(`A5 Price: ₹${priceA5} (Expected: 39) -> ${priceA5 === 39 ? 'PASS' : 'FAIL'}`);
  console.log(`A4 Price: ₹${priceA4} (Expected: 59) -> ${priceA4 === 59 ? 'PASS' : 'FAIL'}`);
  console.log(`A3 Price: ₹${priceA3} (Expected: 99) -> ${priceA3 === 99 ? 'PASS' : 'FAIL'}`);

  // Test with legacy paperType and frameName passed - should not alter price
  const priceA4WithAddons = calculateCustomPosterPrice({ sizeName: 'A4', paperType: 'Glossy', frameName: 'Wooden' });
  console.log(`A4 with legacy addons: ₹${priceA4WithAddons} (Expected: 59) -> ${priceA4WithAddons === 59 ? 'PASS' : 'FAIL'}`);

  // Test Subtotals
  const subtotalA4Qty1 = priceA4 * 1;
  const subtotalA3Qty2 = priceA3 * 2;
  console.log(`A4 Qty 1 Subtotal: ₹${subtotalA4Qty1} (Expected: 59) -> ${subtotalA4Qty1 === 59 ? 'PASS' : 'FAIL'}`);
  console.log(`A3 Qty 2 Subtotal: ₹${subtotalA3Qty2} (Expected: 198) -> ${subtotalA3Qty2 === 198 ? 'PASS' : 'FAIL'}`);

  console.log('\n--- 2. Checking Custom Poster Base Product in Neon DB ---');
  const cp = await prisma.product.findUnique({
    where: { slug: 'custom-poster' },
    include: { variants: { include: { size: true } } }
  });

  if (!cp) {
    console.error('Custom poster product NOT found in DB!');
  } else {
    console.log(`Product ID: ${cp.id}, Title: "${cp.title}", Slug: "${cp.slug}", Base Price: ₹${cp.price}`);
    console.log('Variants:');
    for (const v of cp.variants) {
      console.log(`  Size ${v.size.name}: ₹${v.price} (variant id: ${v.id})`);
    }
  }
}

verify()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
