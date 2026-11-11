import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  const beforeCounts = {
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    customPosters: await prisma.customPoster.count(),
  };
  console.log('Before migration counts:', beforeCounts);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CustomPoster"
      ALTER COLUMN "frameName" DROP NOT NULL,
      ALTER COLUMN "frameName" SET DEFAULT '';
  `);

  const updatedVariants = await prisma.$executeRawUnsafe(`
    UPDATE "ProductVariant"
    SET "frameId" = NULL,
        "additionalPrice" = 0
    WHERE "frameId" IS NOT NULL OR "additionalPrice" != 0;
  `);

  console.log('Updated variants with frameId/additionalPrice cleared:', updatedVariants);

  const afterCounts = {
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    customPosters: await prisma.customPoster.count(),
  };
  console.log('After migration counts:', afterCounts);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

