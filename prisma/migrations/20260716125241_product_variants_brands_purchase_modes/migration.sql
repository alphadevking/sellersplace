-- CreateEnum
CREATE TYPE "PurchaseMode" AS ENUM ('PAY_ONLINE', 'CONTACT_SELLER', 'BOTH');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "variantId" TEXT,
ADD COLUMN     "variantName" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "purchaseMode" "PurchaseMode" NOT NULL DEFAULT 'PAY_ONLINE';

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(12,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
