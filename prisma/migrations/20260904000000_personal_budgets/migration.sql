CREATE TABLE "PersonalBudget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "monthlyLimit" DECIMAL(10, 2) NOT NULL,

    CONSTRAINT "PersonalBudget_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonalBudget_userId_category_key" ON "PersonalBudget"("userId", "category");

ALTER TABLE "PersonalBudget" ADD CONSTRAINT "PersonalBudget_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
