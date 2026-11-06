import prisma from '../lib/prisma';
import { REGULAR_SIZE_PRICES } from '../lib/pricing';

async function main() {
  console.log('=== EXECUTING GLOBAL PRODUCT REGULAR PRICING UPDATE ===');
  console.log('Target Regular Prices:', REGULAR_SIZE_PRICES);

  const beforeCounts = {
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    categories: await prisma.category.count(),
    images: await prisma.productImage.count(),
    reviews: await prisma.review.count(),
    likes: await prisma.productLike.count(),
    orders: await prisma.order.count(),
    payments: await prisma.payment.count(),
    users: await prisma.user.count(),
  };
  console.log('Pre-update record counts:', beforeCounts);

  const dbSizes = await prisma.productSize.findMany({
    where: { name: { in: ['A3', 'A4', 'A5', 'A6'] } },
  });
  const sizeMap = new Map(dbSizes.map((s) => [s.name, s]));

  for (const reqSize of ['A3', 'A4', 'A5', 'A6'] as const) {
    if (!sizeMap.has(reqSize)) {
      throw new Error(`Required size ${reqSize} is missing from ProductSize table.`);
    }
  }

  // 1. Bulk update all existing Products to regular A4 base price (₹29)
  const prodRes = await prisma.product.updateMany({
    data: {
      price: REGULAR_SIZE_PRICES.A4, // 29
    },
  });

  // 2. Bulk update all ProductVariants for A3, A4, A5, A6
  let updatedVariantsCount = 0;
  for (const sizeName of ['A3', 'A4', 'A5', 'A6'] as const) {
    const sizeRecord = sizeMap.get(sizeName)!;
    const targetPrice = REGULAR_SIZE_PRICES[sizeName];
    const varRes = await prisma.productVariant.updateMany({
      where: {
        sizeId: sizeRecord.id,
      },
      data: {
        price: targetPrice,
      },
    });
    console.log(`Updated ${varRes.count} variants for size ${sizeName} -> ₹${targetPrice}`);
    updatedVariantsCount += varRes.count;
  }

  // 3. Ensure every product has at least one variant for each of A3, A4, A5, A6
  const allProducts = await prisma.product.findMany({
    include: {
      inventory: true,
      variants: {
        include: { size: true },
      },
    },
  });

  let createdVariantsCount = 0;
  for (const product of allProducts) {
    const stock = product.inventory?.quantity ?? 100;
    for (const sizeName of ['A3', 'A4', 'A5', 'A6'] as const) {
      const sizeRecord = sizeMap.get(sizeName)!;
      const hasSize = product.variants.some((v) => v.sizeId === sizeRecord.id);
      if (!hasSize) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sizeId: sizeRecord.id,
            frameId: null,
            price: REGULAR_SIZE_PRICES[sizeName],
            stock,
            SKU: `${product.SKU}-${sizeName}`,
          },
        });
        createdVariantsCount++;
      }
    }
  }

  const afterCounts = {
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    categories: await prisma.category.count(),
    images: await prisma.productImage.count(),
    reviews: await prisma.review.count(),
    likes: await prisma.productLike.count(),
    orders: await prisma.order.count(),
    payments: await prisma.payment.count(),
    users: await prisma.user.count(),
  };

  console.log('\n=== UPDATE SUMMARY ===');
  console.log(`Products updated to base A4 regular price (₹29): ${prodRes.count}`);
  console.log(`ProductVariants updated across A3 (₹49), A4 (₹29), A5 (₹15), A6 (₹7): ${updatedVariantsCount}`);
  console.log(`Missing size variants created: ${createdVariantsCount}`);
  console.log('Post-update record counts:', afterCounts);

  // Verification check across all products
  const verifyProducts = await prisma.product.findMany({
    include: {
      variants: {
        include: { size: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  let mismatches = 0;
  for (const p of verifyProducts) {
    if (p.price !== REGULAR_SIZE_PRICES.A4) {
      console.error(`Mismatch on Product ${p.SKU}: price=${p.price}`);
      mismatches++;
    }
    for (const sizeName of ['A3', 'A4', 'A5', 'A6'] as const) {
      const sv = p.variants.filter((v) => v.size?.name === sizeName);
      if (sv.length === 0) {
        console.error(`Missing size ${sizeName} on Product ${p.SKU}`);
        mismatches++;
      }
      for (const v of sv) {
        if (v.price !== REGULAR_SIZE_PRICES[sizeName]) {
          console.error(`Mismatch on Variant ${v.SKU} (${sizeName}): price=${v.price}, expected=${REGULAR_SIZE_PRICES[sizeName]}`);
          mismatches++;
        }
      }
    }
  }

  console.log(`\nVerification complete across ${verifyProducts.length} products. Mismatches: ${mismatches}`);
  if (mismatches > 0) {
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
