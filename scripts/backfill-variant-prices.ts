import prisma from '../lib/prisma';
import { DEFAULT_SIZE_PRICES } from '../lib/pricing';

async function backfill() {
  console.log('Starting variant pricing backfill...');

  // 1. Reset ProductSize additionalPrice to 0 for standard sizes to remove legacy ₹199
  const resetSizes = await prisma.productSize.updateMany({
    where: {
      name: { in: ['A3', 'A4', 'A5', 'A6'] },
    },
    data: {
      additionalPrice: 0,
    },
  });
  console.log(`Reset additionalPrice to 0 for ${resetSizes.count} standard sizes.`);

  // 2. Fetch all products with variants
  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          size: true,
        },
      },
    },
  });

  let updatedVariants = 0;
  for (const product of products) {
    for (const variant of product.variants) {
      if (variant.price === null || variant.price === undefined) {
        // If variant price is null, assign price
        // For standard sizes, if product has a legacy price, calculate unit price
        let newPrice = product.price + (variant.additionalPrice || 0);
        // If the legacy calculation resulted in 0 or variant has no price, use default
        if (newPrice <= 0 && variant.size?.name && variant.size.name in DEFAULT_SIZE_PRICES) {
          newPrice = DEFAULT_SIZE_PRICES[variant.size.name as keyof typeof DEFAULT_SIZE_PRICES];
        }

        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            price: newPrice,
          },
        });
        updatedVariants++;
      }
    }
  }

  console.log(`Backfill complete: updated ${updatedVariants} variant records with explicit prices.`);
}

backfill()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
