import { prisma } from "@/lib/prisma";
import { computeBalances, type MemberBalance } from "@/lib/balance";
import type { ProfileColor } from "@/lib/profile-colors";

export type MemberBalanceWithColor = MemberBalance & { color: ProfileColor };

export async function getHouseholdBalances(
  householdId: string
): Promise<MemberBalanceWithColor[]> {
  const [members, expenses, splits, settlements] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { id: true, name: true, color: true } } },
    }),
    prisma.expense.findMany({
      where: { householdId },
      select: { paidById: true, amount: true },
    }),
    prisma.expenseSplit.findMany({
      where: { expense: { householdId } },
      select: { userId: true, shareAmount: true },
    }),
    prisma.settlement.findMany({
      where: { householdId },
      select: { fromUserId: true, toUserId: true, amount: true },
    }),
  ]);

  const balances = computeBalances(
    members.map((m) => ({ userId: m.userId, name: m.user.name })),
    expenses.map((e) => ({ paidById: e.paidById, amount: Number(e.amount) })),
    splits.map((s) => ({ userId: s.userId, shareAmount: Number(s.shareAmount) })),
    settlements.map((s) => ({
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amount: Number(s.amount),
    }))
  );

  const colorByUserId = new Map(members.map((m) => [m.userId, m.user.color]));
  return balances.map((b) => ({ ...b, color: colorByUserId.get(b.userId) ?? "INDIGO" }));
}
