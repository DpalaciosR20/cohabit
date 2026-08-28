ALTER TABLE "Bill" ADD COLUMN "totalInstallments" INTEGER;

-- Para los Bill "a meses" que ya existían, la mejor suposición disponible es
-- que las mensualidades restantes actuales también eran el total (no
-- sabemos si tuvieron pagos previos a la existencia de esta columna).
UPDATE "Bill"
SET "totalInstallments" = "installmentsRemaining"
WHERE "installmentsRemaining" IS NOT NULL AND "totalInstallments" IS NULL;
