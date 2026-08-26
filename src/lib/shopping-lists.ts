import { prisma } from "@/lib/prisma";

export async function getOrCreateDefaultList(householdId: string) {
  const existing = await prisma.shoppingList.findFirst({
    where: { householdId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.shoppingList.create({
    data: { householdId, name: "Lista de compras" },
  });
}
