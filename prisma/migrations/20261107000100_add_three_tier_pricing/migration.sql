-- AlterTable: Add optional diwaliPrice on Product (A4 default Diwali Selling Price)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "diwaliPrice" DOUBLE PRECISION;

-- AlterTable: Add Three-Tier Pricing fields on ProductVariant (per size)
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "retailMrp" DOUBLE PRECISION;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "baseSellingPrice" DOUBLE PRECISION;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "diwaliSellingPrice" DOUBLE PRECISION;

-- AlterTable: Add optional historical Three-Tier Pricing snapshot fields on OrderItem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "retailMrp" DOUBLE PRECISION;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "baseSellingPrice" DOUBLE PRECISION;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "diwaliSellingPrice" DOUBLE PRECISION;

