-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "createdByStaffId" TEXT,
ADD COLUMN     "loyaltyRedeemed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyaltyStampsAwarded" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
