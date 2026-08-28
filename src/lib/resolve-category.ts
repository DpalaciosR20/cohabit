import { prisma } from "@/lib/prisma";
import type { ExpenseCategoryName } from "@/lib/expense-categories";

/**
 * Convierte el nombre curado de una categoría en su Category.id para ese
 * hogar, creando la fila la primera vez que se usa (en vez de sembrar las 8
 * categorías por adelantado en cada hogar nuevo). null/undefined = sin
 * categoría.
 */
export async function resolveCategoryId(
  householdId: string,
  name: ExpenseCategoryName | null | undefined
): Promise<string | null> {
  if (!name) return null;

  const category = await prisma.category.upsert({
    where: { householdId_name: { householdId, name } },
    update: {},
    create: { householdId, name },
  });

  return category.id;
}
