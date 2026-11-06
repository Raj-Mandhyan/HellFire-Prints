import prisma from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

const NEW_CATEGORY_SLUGS = [
  'tv-shows',
  'cartoons',
  'motivational',
  'adventure',
  'mountains-nature',
  'beaches-coastal',
  'tech-futuristic',
  'cafe-food',
  'inspirational-quotes',
  'cars-automobiles',
  'bikes-motorcycles',
];

async function executeTargetedRollback() {
  console.log('======================================================================');
  console.log('EXECUTING TARGETED DATABASE ROLLBACK (NEON POSTGRESQL)');
  console.log('======================================================================\n');

  // 1. Pre-flight check: Ensure verified backup exists before any destructive operation
  const fullBackupPath = path.join(process.cwd(), 'backups/neondb-full-backup-before-rollback.json');
  const targetedBackupPath = path.join(process.cwd(), 'backups/rollback-target-records-backup.json');

  if (!fs.existsSync(fullBackupPath) || !fs.existsSync(targetedBackupPath)) {
    throw new Error('ABORTING: Verified backup files do not exist!');
  }

  const backupData = JSON.parse(fs.readFileSync(fullBackupPath, 'utf8'));
  if (!backupData.tables || backupData.tables.products.length < 21) {
    throw new Error('ABORTING: Backup file failed integrity check!');
  }
  console.log(`✅ Verified backup exists (${fullBackupPath})`);

  // 2. Identify exact target product IDs (SKU starting with HFP-CAT-)
  const targetProducts = await prisma.product.findMany({
    where: { SKU: { startsWith: 'HFP-CAT-' } },
    select: { id: true, SKU: true },
  });
  const targetProductIds = targetProducts.map((p) => p.id);
  console.log(`Identified ${targetProductIds.length} previous-session products (HFP-CAT-*) for deletion.`);

  // 3. Delete child records and target products + categories inside a transaction
  if (targetProductIds.length > 0) {
    const [delImages, delVariants, delInventories, delRatings, delProducts] = await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: { in: targetProductIds } } }),
      prisma.productVariant.deleteMany({ where: { productId: { in: targetProductIds } } }),
      prisma.inventory.deleteMany({ where: { productId: { in: targetProductIds } } }),
      prisma.productRating.deleteMany({ where: { productId: { in: targetProductIds } } }),
      prisma.product.deleteMany({ where: { id: { in: targetProductIds } } }),
    ]);

    console.log(`- Deleted ProductImage records:   ${delImages.count}`);
    console.log(`- Deleted ProductVariant records: ${delVariants.count}`);
    console.log(`- Deleted Inventory records:      ${delInventories.count}`);
    console.log(`- Deleted ProductRating records:  ${delRatings.count}`);
    console.log(`- Deleted Product records:        ${delProducts.count}`);
  }

  // 4. Delete the 11 categories created in the previous session
  const delCategories = await prisma.category.deleteMany({
    where: { slug: { in: NEW_CATEGORY_SLUGS } },
  });
  console.log(`- Deleted Category records:       ${delCategories.count}`);

  // 5. Reverse schema additions from previous session (Drop PromotionAuditLog, PromotionalCampaign, and Product.franchise/tags)
  console.log('\n--- Reversing Previous Session Schema Additions ---');
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "PromotionAuditLog";`);
  console.log('- Dropped table "PromotionAuditLog"');

  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "PromotionalCampaign";`);
  console.log('- Dropped table "PromotionalCampaign"');

  await prisma.$executeRawUnsafe(`ALTER TABLE "Product" DROP COLUMN IF EXISTS "franchise";`);
  console.log('- Dropped column "Product"."franchise"');

  await prisma.$executeRawUnsafe(`ALTER TABLE "Product" DROP COLUMN IF EXISTS "tags";`);
  console.log('- Dropped column "Product"."tags"');

  // 6. Post-Rollback Verification against Original Pre-Session Counts
  console.log('\n--- Post-Rollback Database State Verification ---');
  const [
    usersCount,
    categoriesCount,
    productsCount,
    productImagesCount,
    productVariantsCount,
    productSizesCount,
    productFramesCount,
    productRatingsCount,
    productLikesCount,
    reviewsCount,
    inventoriesCount,
    ordersCount,
    orderItemsCount,
    paymentsCount,
    addressesCount,
    couponsCount,
    customPostersCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.productVariant.count(),
    prisma.productSize.count(),
    prisma.productFrame.count(),
    prisma.productRating.count(),
    prisma.productLike.count(),
    prisma.review.count(),
    prisma.inventory.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.payment.count(),
    prisma.address.count(),
    prisma.coupon.count(),
    prisma.customPoster.count(),
  ]);

  const remainingTables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
    SELECT table_name::text AS table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('PromotionalCampaign', 'PromotionAuditLog');
  `);

  const remainingProductCols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
    SELECT column_name::text AS column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Product'
      AND column_name IN ('franchise', 'tags');
  `);

  const countsReport = {
    usersCount,
    categoriesCount,
    productsCount,
    productImagesCount,
    productVariantsCount,
    productSizesCount,
    productFramesCount,
    productRatingsCount,
    productLikesCount,
    reviewsCount,
    inventoriesCount,
    ordersCount,
    orderItemsCount,
    paymentsCount,
    addressesCount,
    couponsCount,
    customPostersCount,
    remainingPromoTables: remainingTables.length,
    remainingProductCols: remainingProductCols.length,
  };

  console.log(JSON.stringify(countsReport, null, 2));

  if (
    productsCount !== 21 ||
    categoriesCount !== 12 ||
    productImagesCount !== 24 ||
    productVariantsCount !== 470 ||
    inventoriesCount !== 20 ||
    productRatingsCount !== 26 ||
    reviewsCount !== 3 ||
    productLikesCount !== 3 ||
    usersCount !== 29 ||
    ordersCount !== 44 ||
    orderItemsCount !== 57 ||
    paymentsCount !== 31 ||
    addressesCount !== 11 ||
    couponsCount !== 2 ||
    customPostersCount !== 22 ||
    remainingTables.length !== 0 ||
    remainingProductCols.length !== 0
  ) {
    throw new Error('Post-rollback verification detected a mismatch with expected original state!');
  }

  console.log('\n🎉 TARGETED DATABASE ROLLBACK COMPLETED & VERIFIED 100% SUCCESSFULLY!');
}

executeTargetedRollback()
  .catch((err) => {
    console.error('Rollback failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
