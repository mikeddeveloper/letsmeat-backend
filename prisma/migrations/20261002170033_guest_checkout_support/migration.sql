-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_supplierId_fkey";

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "phone" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "condition" TEXT,
ADD COLUMN     "processingType" TEXT,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryCity" TEXT,
ADD COLUMN     "deliveryName" TEXT,
ADD COLUMN     "deliveryPhone" TEXT,
ALTER COLUMN "supplierId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
