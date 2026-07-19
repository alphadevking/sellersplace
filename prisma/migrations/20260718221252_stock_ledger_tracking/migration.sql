-- DropIndex
DROP INDEX "Product_brand_trgm_idx";

-- DropIndex
DROP INDEX "Product_name_trgm_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "stockAdjusted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingUrl" TEXT;

