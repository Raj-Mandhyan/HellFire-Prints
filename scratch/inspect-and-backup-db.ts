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

async function inspectAndBackup() {
  console.log('======================================================================');
  console.log('STEP 1 & 4: DATABASE INSPECTION & PRE-ROLLBACK FULL BACKUP');
  console.log('======================================================================\n');

  const [
    users,
    categories,
    products,
    productImages,
    productVariants,
    productSizes,
    productFrames,
    productRatings,
    productLikes,
    reviews,
    inventories,
    carts,
    cartItems,
    orders,
    orderItems,
    payments,
    addresses,
    coupons,
    couponUsages,
    customPosters,
    customPosterDesigns,
    promotionalCampaigns,
    promotionAuditLogs,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.category.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.product.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.productImage.findMany(),
    prisma.productVariant.findMany(),
    prisma.productSize.findMany(),
    prisma.productFrame.findMany(),
    prisma.productRating.findMany(),
    prisma.productLike.findMany(),
    prisma.review.findMany(),
    prisma.inventory.findMany(),
    prisma.cart.findMany(),
    prisma.cartItem.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
    prisma.payment.findMany(),
    prisma.address.findMany(),
    prisma.coupon.findMany(),
    prisma.couponUsage.findMany(),
    prisma.customPoster.findMany(),
    prisma.customPosterDesign.findMany(),
    prisma.$queryRawUnsafe<Array<{ id: string; slug: string }>>('SELECT * FROM "PromotionalCampaign"').catch(() => []),
    prisma.$queryRawUnsafe<Array<{ id: string }>>('SELECT * FROM "PromotionAuditLog"').catch(() => []),
  ]);

  // Separate original vs previous-session products
  const newSessionProducts = products.filter((p) => p.SKU.startsWith('HFP-CAT-'));
  const originalProducts = products.filter((p) => !p.SKU.startsWith('HFP-CAT-'));
  const newProductIds = new Set(newSessionProducts.map((p) => p.id));

  // Separate original vs previous-session categories
  const newSessionCategories = categories.filter((c) => NEW_CATEGORY_SLUGS.includes(c.slug));
  const originalCategories = categories.filter((c) => !NEW_CATEGORY_SLUGS.includes(c.slug));
  const newCategoryIds = new Set(newSessionCategories.map((c) => c.id));

  // Child records belonging to the 335 new products
  const newProductImages = productImages.filter((i) => newProductIds.has(i.productId));
  const originalProductImages = productImages.filter((i) => !newProductIds.has(i.productId));

  const newProductVariants = productVariants.filter((v) => newProductIds.has(v.productId));
  const originalProductVariants = productVariants.filter((v) => !newProductIds.has(v.productId));

  const newInventories = inventories.filter((inv) => newProductIds.has(inv.productId));
  const originalInventories = inventories.filter((inv) => !newProductIds.has(inv.productId));

  const newProductRatings = productRatings.filter((r) => newProductIds.has(r.productId));
  const originalProductRatings = productRatings.filter((r) => !newProductIds.has(r.productId));

  // Check if any orders, cartItems, reviews, or likes reference any of the 335 new products
  const orderItemsReferencingNew = orderItems.filter((oi) => oi.productId !== null && newProductIds.has(oi.productId));
  const cartItemsReferencingNew = cartItems.filter((ci) => newProductIds.has(ci.productId));
  const reviewsReferencingNew = reviews.filter((rev) => newProductIds.has(rev.productId));
  const likesReferencingNew = productLikes.filter((lk) => newProductIds.has(lk.productId));

  // Check if any original products reference any of the 11 new categories
  const originalProductsInNewCategories = originalProducts.filter((p) => newCategoryIds.has(p.categoryId));

  // Check if any original products have non-empty franchise or tags
  const originalProductsWithFranchiseOrTags = originalProducts.filter((p) => {
    const rec = p as Record<string, unknown>;
    return (
      (typeof rec.franchise === 'string' && rec.franchise.length > 0) ||
      (Array.isArray(rec.tags) && rec.tags.length > 0)
    );
  });

  console.log('--- 1. ORIGINAL RECORDS (PRE-SESSION STATE) ---');
  console.log(`Original Categories:       ${originalCategories.length} (${originalCategories.map((c) => c.slug).join(', ')})`);
  console.log(`Original Products:         ${originalProducts.length}`);
  for (const p of originalProducts) {
    console.log(`  - [${p.id}] ${p.SKU} | ${p.slug} | "${p.title}" (createdAt: ${p.createdAt.toISOString()})`);
  }
  console.log(`Original ProductImages:    ${originalProductImages.length}`);
  console.log(`Original ProductVariants:  ${originalProductVariants.length}`);
  console.log(`Original Inventories:      ${originalInventories.length}`);
  console.log(`Original ProductRatings:   ${originalProductRatings.length}`);
  console.log(`Original Reviews:          ${reviews.length}`);
  console.log(`Original ProductLikes:     ${productLikes.length}`);
  console.log(`Original Users:            ${users.length}`);
  console.log(`Original Orders:           ${orders.length}`);
  console.log(`Original OrderItems:       ${orderItems.length}`);
  console.log(`Original Payments:         ${payments.length}`);
  console.log(`Original Addresses:        ${addresses.length}`);
  console.log(`Original Coupons:          ${coupons.length}`);
  console.log(`Original CustomPosters:    ${customPosters.length}`);

  console.log('\n--- 2. PREVIOUS SESSION ADDITIONS IDENTIFIED FOR ROLLBACK ---');
  console.log(`New Categories (to delete):           ${newSessionCategories.length}`);
  for (const c of newSessionCategories) {
    console.log(`  - [${c.id}] ${c.slug} | "${c.name}" (createdAt: ${c.createdAt.toISOString()})`);
  }
  console.log(`New Products (to delete):             ${newSessionProducts.length} (SKU: HFP-CAT-MOV-001 .. HFP-CAT-BIK-015)`);
  console.log(`New ProductImages (to delete):        ${newProductImages.length}`);
  console.log(`New ProductVariants (to delete):      ${newProductVariants.length}`);
  console.log(`New Inventories (to delete):          ${newInventories.length}`);
  console.log(`New ProductRatings (to delete):       ${newProductRatings.length}`);
  console.log(`PromotionalCampaigns (to drop/del):   ${promotionalCampaigns.length} (${promotionalCampaigns.map((c) => `${c.id}:${c.slug}`).join(', ')})`);
  console.log(`PromotionAuditLogs (to drop/del):     ${promotionAuditLogs.length}`);

  console.log('\n--- 3. SAFETY & REFERENTIAL INTEGRITY CHECKS ---');
  console.log(`OrderItems referencing new products:          ${orderItemsReferencingNew.length}`);
  console.log(`CartItems referencing new products:           ${cartItemsReferencingNew.length}`);
  console.log(`Reviews referencing new products:             ${reviewsReferencingNew.length}`);
  console.log(`ProductLikes referencing new products:        ${likesReferencingNew.length}`);
  console.log(`Original products in new categories:          ${originalProductsInNewCategories.length}`);
  console.log(`Original products using franchise/tags cols:  ${originalProductsWithFranchiseOrTags.length}`);

  // 4. Write Full Backup & Targeted Rollback Snapshot
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const fullBackupPath = path.join(backupDir, 'neondb-full-backup-before-rollback.json');
  const targetedBackupPath = path.join(backupDir, 'rollback-target-records-backup.json');

  const fullBackupPayload = {
    createdAt: new Date().toISOString(),
    database: 'neondb',
    counts: {
      users: users.length,
      categories: categories.length,
      products: products.length,
      productImages: productImages.length,
      productVariants: productVariants.length,
      productSizes: productSizes.length,
      productFrames: productFrames.length,
      productRatings: productRatings.length,
      productLikes: productLikes.length,
      reviews: reviews.length,
      inventories: inventories.length,
      carts: carts.length,
      cartItems: cartItems.length,
      orders: orders.length,
      orderItems: orderItems.length,
      payments: payments.length,
      addresses: addresses.length,
      coupons: coupons.length,
      couponUsages: couponUsages.length,
      customPosters: customPosters.length,
      customPosterDesigns: customPosterDesigns.length,
      promotionalCampaigns: promotionalCampaigns.length,
      promotionAuditLogs: promotionAuditLogs.length,
    },
    tables: {
      users,
      categories,
      products,
      productImages,
      productVariants,
      productSizes,
      productFrames,
      productRatings,
      productLikes,
      reviews,
      inventories,
      carts,
      cartItems,
      orders,
      orderItems,
      payments,
      addresses,
      coupons,
      couponUsages,
      customPosters,
      customPosterDesigns,
      promotionalCampaigns,
      promotionAuditLogs,
    },
  };

  const targetedBackupPayload = {
    createdAt: new Date().toISOString(),
    description: 'Exact records and schema items added during the previous session (Task 3)',
    newSessionCategories,
    newSessionProducts,
    newProductImages,
    newProductVariants,
    newInventories,
    newProductRatings,
    promotionalCampaigns,
    promotionAuditLogs,
  };

  fs.writeFileSync(fullBackupPath, JSON.stringify(fullBackupPayload, null, 2), 'utf8');
  fs.writeFileSync(targetedBackupPath, JSON.stringify(targetedBackupPayload, null, 2), 'utf8');

  // Verify backups
  const fullStat = fs.statSync(fullBackupPath);
  const targetStat = fs.statSync(targetedBackupPath);
  const parsedVerify = JSON.parse(fs.readFileSync(fullBackupPath, 'utf8'));

  console.log('\n--- 4. BACKUP VERIFICATION ---');
  console.log(`Full DB Backup File:     ${fullBackupPath} (${(fullStat.size / 1024).toFixed(1)} KB)`);
  console.log(`Targeted Rollback File:  ${targetedBackupPath} (${(targetStat.size / 1024).toFixed(1)} KB)`);
  console.log(`Verified JSON Integrity: ${parsedVerify.tables.products.length === 356 ? 'VALID (356 products backed up)' : 'MISMATCH'}`);
}

inspectAndBackup()
  .catch((err) => {
    console.error('Inspection/Backup failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

