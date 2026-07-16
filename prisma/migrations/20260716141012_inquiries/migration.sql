-- CreateEnum
CREATE TYPE "InquiryChannel" AS ENUM ('WHATSAPP', 'PHONE', 'FORM');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'RESPONDED', 'CLOSED');

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "userId" TEXT,
    "variantName" TEXT,
    "name" TEXT,
    "contact" TEXT,
    "message" TEXT,
    "channel" "InquiryChannel" NOT NULL DEFAULT 'FORM',
    "status" "InquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inquiry" ADD CONSTRAINT "Inquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
