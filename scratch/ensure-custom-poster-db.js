require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = process.env.DATABASE_URL.replace(
  /([?&]sslmode=)(?:require|prefer|verify-ca)(?=&|$)/g,
  '$1verify-full'
);
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PRICES = {
  A6: 19,
  A5: 39,
  A4: 59,
  A3: 99,
};

async function ensureCustomPosterProduct() {
  const category = await prisma.category.findFirst({
    where: { slug: 'custom' },
  });
  const categoryId = category?.id || (await prisma.category.findFirst()).id;

  const sizes = await prisma.productSize.findMany({
    where: { name: { in: ['A6', 'A5', 'A4', 'A3'] } }
  });

  let product = await prisma.product.findUnique({
    where: { slug: 'custom-poster' },
    include: { variants: { include: { size: true } } }
  });

  if (!product) {
    console.log('Creating custom-poster product...');
    product = await prisma.product.create({
      data: {
        title: 'Custom Poster Print',
        slug: 'custom-poster',
        description: 'Create your own personalized design. Upload custom artwork and overlay text. Handcrafted to order.',
        price: 19,
        MRP: 99,
        discount: 0,
        SKU: 'HFP-CUST-POSTER',
        featured: false,
        trending: false,
        active: true,
        categoryId,
      },
      include: { variants: { include: { size: true } } }
    });
    console.log('Created custom-poster product:', product.id);
  } else {
    console.log('Found existing custom-poster product:', product.id);
    if (product.price !== 19) {
      await prisma.product.update({
        where: { id: product.id },
        data: { price: 19 }
      });
    }
  }

  // Ensure variants exist for A6, A5, A4, A3 with exact prices
  for (const size of sizes) {
    const existingVariant = product.variants?.find(v => v.sizeId === size.id);
    const targetPrice = DEFAULT_PRICES[size.name] ?? 59;
    if (!existingVariant) {
      console.log(`Creating variant for ${size.name} at ₹${targetPrice}...`);
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sizeId: size.id,
          price: targetPrice,
          additionalPrice: 0,
          stock: 9999,
          SKU: `HFP-CUST-${size.name}`,
        }
      });
    } else {
      console.log(`Updating variant for ${size.name} to ₹${targetPrice}...`);
      await prisma.productVariant.update({
        where: { id: existingVariant.id },
        data: {
          price: targetPrice,
          additionalPrice: 0,
        }
      });
    }
  }

  const updated = await prisma.product.findUnique({
    where: { slug: 'custom-poster' },
    include: { variants: { include: { size: true } } }
  });
  console.log('Updated custom-poster product variants:');
  console.log(updated.variants.map(v => ({ size: v.size.name, price: v.price })));
}

ensureCustomPosterProduct()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
