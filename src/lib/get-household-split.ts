import { prisma } from "@/lib/prisma";
import {
  incomeRatioShares,
  splitByShares,
  splitEvenly,
  type MemberShare,
} from "@/lib/expense-split";

/**
 * Devuelve el split configurado del hogar según su SplitMode, o null si usa
 * el split parejo — ya sea porque el modo es EVEN, o como fallback
 * defensivo cuando MANUAL/INCOME no tienen datos completos (ej. alguien
 * nuevo en el hogar aún no registró su %/ingreso).
 */
export async function getHouseholdSplitShares(householdId: string): Promise<MemberShare[] | null> {
  const household = await prisma.household.findUnique({
    where: { id: householdId },
    select: { splitMode: true },
  });
  if (!household || household.splitMode === "EVEN") return null;

  if (household.splitMode === "MANUAL") {
    const members = await prisma.householdMember.findMany({
      where: { householdId },
      select: { userId: true, splitPercent: true },
    });
    if (members.length === 0 || members.some((m) => m.splitPercent === null)) return null;
    return members.map((m) => ({ userId: m.userId, percent: Number(m.splitPercent) }));
  }

  // INCOME
  const members = await prisma.householdMember.findMany({
    where: { householdId },
    select: { userId: true, user: { select: { monthlyIncome: true } } },
  });
  return incomeRatioShares(
    members.map((m) => ({
      userId: m.userId,
      income: m.user.monthlyIncome !== null ? Number(m.user.monthlyIncome) : null,
    }))
  );
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
