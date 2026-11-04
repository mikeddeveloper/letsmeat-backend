-- AlterTable
ALTER TABLE "supplier_waitlist_entries" ADD COLUMN "phoneKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "supplier_waitlist_entries_phoneKey_key" ON "supplier_waitlist_entries"("phoneKey");
