-- AlterEnum
ALTER TYPE "CustomerStatus" ADD VALUE 'whitelisted';
ALTER TYPE "CustomerStatus" ADD VALUE 'blacklisted';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN "adminNote" TEXT;
