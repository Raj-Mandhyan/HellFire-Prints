import { prisma } from '../lib/prisma';

const SIZE_DEFAULTS: Record<string, { retailMrp: number; baseSellingPrice: number; diwaliSellingPrice: number }> = {
  A3: { retailMrp: 99, baseSellingPrice: 49, diwaliSellingPrice: 32 },
  A4: { retailMrp: 59, baseSellingPrice: 29, diwaliSellingPrice: 16 },
  A5: { retailMrp: 39, baseSellingPrice: 15, diwaliSellingPrice: 8 },
  A6: { retailMrp: 19, baseSellingPrice: 7, diwaliSellingPrice: 4 },
};

async function main() {
  console.log('=== Applying Three-Tier Pricing Non-Destructive Migration ===');

  const preProductCount = await prisma.product.count();
  const preVariantCount = await prisma.productVariant.count();
  const preOrderCount = await prisma.order.count();
  const preOrderItemCount = await prisma.orderItem.count();

  console.log(`Pre-migration counts: Products=${preProductCount}, Variants=${preVariantCount}, Orders=${preOrderCount}, OrderItems=${preOrderItemCount}`);

  // 1. Add columns safely
  await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "diwaliPrice" DOUBLE PRECISION;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "retailMrp" DOUBLE PRECISION;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "baseSellingPrice" DOUBLE PRECISION;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "diwaliSellingPrice" DOUBLE PRECISION;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "retailMrp" DOUBLE PRECISION;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "baseSellingPrice" DOUBLE PRECISION;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "diwaliSellingPrice" DOUBLE PRECISION;`);

  console.log('Columns verified / added on Product, ProductVariant, and OrderItem.');

  // 2. Standardize ProductVariant per size to the authoritative Three-Tier hierarchy
  // (A3: 99/49/32, A4: 59/29/16, A5: 39/15/8, A6: 19/7/4)
  const sizes = await prisma.productSize.findMany();
  for (const size of sizes) {
    const key = size.name.trim().toUpperCase();
    const defaults = SIZE_DEFAULTS[key] || SIZE_DEFAULTS.A4;

    const updatedCount = await prisma.$executeRawUnsafe(
      `UPDATE "ProductVariant"
       SET
         "retailMrp" = $1,
         "baseSellingPrice" = $2,
         "price" = $2,
         "diwaliSellingPrice" = $3
       WHERE "sizeId" = $4`,
      defaults.retailMrp,
      defaults.baseSellingPrice,
      defaults.diwaliSellingPrice,
      size.id
    );
    console.log(`Backfilled size ${key} (${size.id}): ${updatedCount} variants updated (MRP=₹${defaults.retailMrp}, Base=₹${defaults.baseSellingPrice}, Diwali=₹${defaults.diwaliSellingPrice})`);
  }

  // 3. Standardize Product A4 default fields (MRP=59, price=29, diwaliPrice=16)
  const updatedProducts = await prisma.$executeRawUnsafe(
    `UPDATE "Product"
     SET
       "MRP" = 59,
       "price" = 29,
       "diwaliPrice" = 16`
  );
  console.log(`Updated ${updatedProducts} Product records with standardized A4 Three-Tier prices (MRP=₹59, Base=₹29, Diwali=₹16).`);

  // 4. Verify post-migration counts and hierarchy
  const postProductCount = await prisma.product.count();
  const postVariantCount = await prisma.productVariant.count();
  const postOrderCount = await prisma.order.count();
  const postOrderItemCount = await prisma.orderItem.count();

  console.log(`Post-migration counts: Products=${postProductCount}, Variants=${postVariantCount}, Orders=${postOrderCount}, OrderItems=${postOrderItemCount}`);

  if (
    preProductCount !== postProductCount ||
    preVariantCount !== postVariantCount ||
    preOrderCount !== postOrderCount ||
    preOrderItemCount !== postOrderItemCount
  ) {
    throw new Error('Count mismatch detected during migration!');
  }

  // Check sample variants across sizes
  const sampleProduct = await prisma.product.findFirst({
    where: { active: true },
    include: { variants: { include: { size: true } } },
  });
  if (sampleProduct) {
    console.log(`Sample product "${sampleProduct.title}" (A4 summary: MRP=₹${sampleProduct.MRP}, Base=₹${sampleProduct.price}, Diwali=₹${sampleProduct.diwaliPrice}):`);
    for (const v of sampleProduct.variants) {
      if (['A3', 'A4', 'A5', 'A6'].includes(v.size.name)) {
        console.log(` - [${v.size.name}]: retailMrp=₹${v.retailMrp}, baseSellingPrice=₹${v.baseSellingPrice} (price=₹${v.price}), diwaliSellingPrice=₹${v.diwaliSellingPrice}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
