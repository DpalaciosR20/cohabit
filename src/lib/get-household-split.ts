import { prisma } from "@/lib/prisma";
import { splitByShares, splitEvenly, type MemberShare } from "@/lib/expense-split";

/**
 * Devuelve el split configurado del hogar (uno por cada miembro actual,
 * sumando 100%), o null si usa el split parejo por default — ocurre cuando
 * ningún miembro tiene splitPercent configurado (el estado normal, y el
 * que queda tras cualquier cambio de membresía).
 */
export async function getHouseholdSplitShares(householdId: string): Promise<MemberShare[] | null> {
  const members = await prisma.householdMember.findMany({
    where: { householdId },
    select: { userId: true, splitPercent: true },
  });

  if (members.length === 0 || members.some((m) => m.splitPercent === null)) return null;

  return members.map((m) => ({ userId: m.userId, percent: Number(m.splitPercent) }));
}

/**
 * Reparte un gasto usando el split configurado del hogar si existe, o parejo
 * si no — el único punto donde crear/editar un gasto y pagar un bill deciden
 * cuál de los dos usar, para no duplicar esa rama en cada endpoint.
 */
export async function resolveExpenseShares(
  householdId: string,
  amount: number,
  memberIds: string[],
  payerId: string
): Promise<{ userId: string; shareAmount: number }[]> {
  const configuredShares = await getHouseholdSplitShares(householdId);
  return configuredShares
    ? splitByShares(amount, configuredShares, payerId)
    : splitEvenly(amount, memberIds, payerId);
}
