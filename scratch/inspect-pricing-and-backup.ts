import prisma from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function inspectAndBackupBeforePricingUpdate() {
  console.log('======================================================================');
  console.log('INSPECTING CURRENT PRICING & CREATING PRE-UPDATE BACKUP');
  console.log('======================================================================\n');

  const [products, productSizes, productFrames, productVariants, orders, payments, customPosters] =
    await Promise.all([
      prisma.product.findMany({
        include: {
          category: true,
          inventory: true,
          images: true,
          variants: {
            include: {
              size: true,
              frame: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.productSize.findMany({ orderBy: { name: 'asc' } }),
      prisma.productFrame.findMany({ orderBy: { name: 'asc' } }),
      prisma.productVariant.findMany({
        include: { size: true, frame: true },
      }),
      prisma.order.count(),
      prisma.payment.count(),
      prisma.customPoster.findMany(),
    ]);

  console.log(`Total Products:        ${products.length}`);
  console.log(`Total ProductSizes:    ${productSizes.length}`);
  for (const s of productSizes) {
    console.log(`  - Size [${s.id}] ${s.name} (${s.dimensions}) additionalPrice=${s.additionalPrice}`);
  }
  console.log(`Total ProductFrames:   ${productFrames.length}`);
  for (const f of productFrames) {
    console.log(`  - Frame [${f.id}] ${f.name} additionalPrice=${f.additionalPrice}`);
  }
  console.log(`Total ProductVariants: ${productVariants.length}`);
  console.log(`Total CustomPosters:   ${customPosters.length}`);
  console.log(`Total Orders:          ${orders}`);
  console.log(`Total Payments:        ${payments}\n`);

  console.log('--- Product & Variant Pricing Summary ---');
  for (const p of products) {
    const sizeSummary: Record<string, number[]> = {};
    for (const v of p.variants) {
      const sName = v.size?.name || 'UNKNOWN';
      if (!sizeSummary[sName]) sizeSummary[sName] = [];
      sizeSummary[sName].push(v.price ?? -1);
    }
    const sizeStr = Object.entries(sizeSummary)
      .map(([k, vals]) => `${k}:[${Array.from(new Set(vals)).join(',')}] (${vals.length} vars)`)
      .join(' | ');
    console.log(
      `[${p.SKU}] ${p.slug} | price=₹${p.price}, MRP=₹${p.MRP}, discount=${p.discount}% | Variants(${p.variants.length}): ${sizeStr}`
    );
  }

  // Save pre-pricing-update backup
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, 'neondb-backup-before-global-pricing-update.json');
  const backupPayload = {
    createdAt: new Date().toISOString(),
    description: 'Pre-update backup of all products, sizes, frames, variants, and customPosters before Global Regular Pricing Update (A3=49, A4=29, A5=15, A6=7)',
    counts: {
      products: products.length,
      productSizes: productSizes.length,
      productFrames: productFrames.length,
      productVariants: productVariants.length,
      customPosters: customPosters.length,
      orders,
      payments,
    },
    productSizes,
    productFrames,
    products,
    customPosters,
  };

  fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), 'utf8');
  const stat = fs.statSync(backupPath);
  console.log(`\nBackup saved to: ${backupPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

inspectAndBackupBeforePricingUpdate()
  .catch((err) => {
    console.error('Inspection failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

