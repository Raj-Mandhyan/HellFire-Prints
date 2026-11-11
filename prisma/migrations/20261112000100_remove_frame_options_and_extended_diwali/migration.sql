-- Safe, non-destructive migration for Frame Option Removal
-- 1. Allow CustomPoster.frameName to be optional/empty for new frameless custom posters while preserving all historical records
ALTER TABLE "CustomPoster"
  ALTER COLUMN "frameName" DROP NOT NULL,
  ALTER COLUMN "frameName" SET DEFAULT '';

-- 2. Ensure no ProductVariant carries a frame surcharge or frame association while preserving all ProductVariant rows and historical OrderItem.frameName values
UPDATE "ProductVariant"
SET "frameId" = NULL,
    "additionalPrice" = 0
WHERE "frameId" IS NOT NULL OR "additionalPrice" != 0;

