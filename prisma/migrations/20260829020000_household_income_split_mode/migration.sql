CREATE TYPE "SplitMode" AS ENUM ('EVEN', 'MANUAL', 'INCOME');

ALTER TABLE "Household" ADD COLUMN "splitMode" "SplitMode" NOT NULL DEFAULT 'EVEN';
ALTER TABLE "User" ADD COLUMN "monthlyIncome" DECIMAL(10, 2);

-- Los hogares que ya tenían un split manual configurado (vía
-- HouseholdMember.splitPercent, de la historia anterior a este modo
-- explícito) se marcan como MANUAL para no perder esa configuración.
UPDATE "Household" h
SET "splitMode" = 'MANUAL'
WHERE EXISTS (SELECT 1 FROM "HouseholdMember" hm WHERE hm."householdId" = h.id)
  AND NOT EXISTS (
    SELECT 1 FROM "HouseholdMember" hm
    WHERE hm."householdId" = h.id AND hm."splitPercent" IS NULL
  );
