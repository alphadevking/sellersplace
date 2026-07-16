-- CreateEnum
CREATE TYPE "OfferingType" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'FROM', 'QUOTE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerNote" TEXT,
ADD COLUMN     "serviceDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "offeringType" "OfferingType" NOT NULL DEFAULT 'PRODUCT',
ADD COLUMN     "priceType" "PriceType" NOT NULL DEFAULT 'FIXED';
