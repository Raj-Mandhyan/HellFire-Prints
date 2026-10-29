require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL.replace(
  /([?&]sslmode=)(?:require|prefer|verify-ca)(?=&|$)/g,
  '$1verify-full'
);
const isNeon = connectionString.includes('neon.tech');
const adapter = isNeon ? new PrismaNeon({ connectionString }) : new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log('--- 1. Testing calculateCustomPosterPrice logic ---');
  const { calculateCustomPosterPrice, POSTER_SIZES } = require('../lib/customPosterPricing');
  
  console.log('POSTER_SIZES:', POSTER_SIZES);

  const priceA6 = calculateCustomPosterPrice({ sizeName: 'A6' });
  const priceA5 = calculateCustomPosterPrice({ sizeName: 'A5' });
  const priceA4 = calculateCustomPosterPrice({ sizeName: 'A4' });
  const priceA3 = calculateCustomPosterPrice({ sizeName: 'A3' });

  console.log(`A6 Price: ₹${priceA6} (Expected: 7) -> ${priceA6 === 7 ? 'PASS' : 'FAIL'}`);
  console.log(`A5 Price: ₹${priceA5} (Expected: 15) -> ${priceA5 === 15 ? 'PASS' : 'FAIL'}`);
  console.log(`A4 Price: ₹${priceA4} (Expected: 29) -> ${priceA4 === 29 ? 'PASS' : 'FAIL'}`);
  console.log(`A3 Price: ₹${priceA3} (Expected: 49) -> ${priceA3 === 49 ? 'PASS' : 'FAIL'}`);

  // Test with legacy paperType and frameName passed - should not alter price
  const priceA4WithAddons = calculateCustomPosterPrice({ sizeName: 'A4', paperType: 'Glossy', frameName: 'Wooden' });
  console.log(`A4 with legacy addons: ₹${priceA4WithAddons} (Expected: 29) -> ${priceA4WithAddons === 29 ? 'PASS' : 'FAIL'}`);

  // Test Subtotals
  const subtotalA4Qty1 = priceA4 * 1;
  const subtotalA3Qty2 = priceA3 * 2;
  console.log(`A4 Qty 1 Subtotal: ₹${subtotalA4Qty1} (Expected: 29) -> ${subtotalA4Qty1 === 29 ? 'PASS' : 'FAIL'}`);
  console.log(`A3 Qty 2 Subtotal: ₹${subtotalA3Qty2} (Expected: 98) -> ${subtotalA3Qty2 === 98 ? 'PASS' : 'FAIL'}`);

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
  });
