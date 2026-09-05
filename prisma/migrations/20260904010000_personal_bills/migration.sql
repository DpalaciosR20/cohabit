CREATE TABLE "PersonalBill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10, 2) NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "category" TEXT,
    "installmentsRemaining" INTEGER,
    "totalInstallments" INTEGER,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalBill_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PersonalBill" ADD CONSTRAINT "PersonalBill_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonalExpense" ADD COLUMN "billId" TEXT;

ALTER TABLE "PersonalExpense" ADD CONSTRAINT "PersonalExpense_billId_fkey"
    FOREIGN KEY ("billId") REFERENCES "PersonalBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
