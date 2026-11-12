import 'dotenv/config';
import prisma from '../lib/prisma';

const NEW_DIWALI_PRICES: Record<string, number> = {
  A3: 40,
  A4: 20,
  A5: 10,
  A6: 5,
};

async function main() {
  console.log('=== Updating ONLY Diwali Selling Prices in Neon PostgreSQL ===');

  const beforeCounts = {
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    customPosters: await prisma.customPoster.count(),
  };
  console.log('Pre-update record counts:', beforeCounts);

  // Snapshot all Product MRP & price values to verify 0 modifications to Retail MRP and Base Selling Price
  const preProducts = await prisma.product.findMany({
    select: { id: true, title: true, MRP: true, price: true, diwaliPrice: true },
  });
  const preVariants = await prisma.productVariant.findMany({
    select: {
      id: true,
      sizeId: true,
      retailMrp: true,
      baseSellingPrice: true,
      price: true,
      diwaliSellingPrice: true,
      size: { select: { name: true } },
    },
  });

  // 1. Update ONLY ProductVariant.diwaliSellingPrice per poster size (A3=40, A4=20, A5=10, A6=5)
  const sizes = await prisma.productSize.findMany();
  for (const size of sizes) {
    const sizeKey = size.name.trim().toUpperCase();
    const newDiwaliPrice = NEW_DIWALI_PRICES[sizeKey];
    if (typeof newDiwaliPrice !== 'number') {
      console.log(`Skipping non-standard size ${sizeKey}`);
      continue;
    }

    const updatedCount = await prisma.$executeRawUnsafe(
      `UPDATE "ProductVariant"
       SET "diwaliSellingPrice" = $1
       WHERE "sizeId" = $2`,
      newDiwaliPrice,
      size.id
    );
    console.log(
      `Updated size ${sizeKey} (${size.id}): ${updatedCount} variants set to diwaliSellingPrice = ₹${newDiwaliPrice} (retailMrp & baseSellingPrice untouched)`
    );
  }

  // 2. Update ONLY Product.diwaliPrice (A4 default Diwali price = ₹20)
  const updatedProductCount = await prisma.$executeRawUnsafe(
    `UPDATE "Product"
     SET "diwaliPrice" = $1`,
    NEW_DIWALI_PRICES.A4
  );
  console.log(
    `Updated ${updatedProductCount} Product rows: diwaliPrice = ₹${NEW_DIWALI_PRICES.A4} (MRP & price untouched)`
  );

  // 3. Verify post-update counts & strict preservation of Retail MRP and Base Selling Price
  const afterCounts = {
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    customPosters: await prisma.customPoster.count(),
  };
  console.log('Post-update record counts:', afterCounts);

  if (JSON.stringify(beforeCounts) !== JSON.stringify(afterCounts)) {
    throw new Error('Record count mismatch detected!');
  }

  const postProducts = await prisma.product.findMany({
    select: { id: true, title: true, MRP: true, price: true, diwaliPrice: true },
  });
  const postVariants = await prisma.productVariant.findMany({
    select: {
      id: true,
      sizeId: true,
      retailMrp: true,
      baseSellingPrice: true,
      price: true,
      diwaliSellingPrice: true,
      size: { select: { name: true } },
    },
  });

  const preProductMap = new Map(preProducts.map((p) => [p.id, p]));
  for (const postP of postProducts) {
    const preP = preProductMap.get(postP.id);
    if (!preP) throw new Error(`Product ${postP.id} missing!`);
    if (preP.MRP !== postP.MRP || preP.price !== postP.price) {
      throw new Error(`Product ${postP.id} MRP or price was modified!`);
    }
    if (postP.diwaliPrice !== 20) {
      throw new Error(`Product ${postP.id} diwaliPrice is ${postP.diwaliPrice}, expected 20!`);
    }
  }

  const preVariantMap = new Map(preVariants.map((v) => [v.id, v]));
  for (const postV of postVariants) {
    const preV = preVariantMap.get(postV.id);
    if (!preV) throw new Error(`Variant ${postV.id} missing!`);
    if (
      preV.retailMrp !== postV.retailMrp ||
      preV.baseSellingPrice !== postV.baseSellingPrice ||
      preV.price !== postV.price
    ) {
      throw new Error(`Variant ${postV.id} retailMrp/baseSellingPrice/price was modified!`);
    }
    const sizeKey = postV.size.name.trim().toUpperCase();
    if (sizeKey in NEW_DIWALI_PRICES && postV.diwaliSellingPrice !== NEW_DIWALI_PRICES[sizeKey]) {
      throw new Error(
        `Variant ${postV.id} (${sizeKey}) diwaliSellingPrice is ${postV.diwaliSellingPrice}, expected ${NEW_DIWALI_PRICES[sizeKey]}!`
      );
    }
  }

  console.log(
    '✅ Verified: 100% of Product IDs, Variant IDs, Retail MRPs, and Base Selling Prices were preserved unchanged, and all Diwali Selling Prices are updated to A3=₹40, A4=₹20, A5=₹10, A6=₹5!'
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

