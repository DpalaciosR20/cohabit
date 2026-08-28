import { prisma } from "@/lib/prisma";
import { computeBalances, type MemberBalance } from "@/lib/balance";

export async function getHouseholdBalances(householdId: string): Promise<MemberBalance[]> {
  const [members, expenses, splits, settlements] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { id: true, name: true } } },
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

  return computeBalances(
    members.map((m) => ({ userId: m.userId, name: m.user.name })),
    expenses.map((e) => ({ paidById: e.paidById, amount: Number(e.amount) })),
    splits.map((s) => ({ userId: s.userId, shareAmount: Number(s.shareAmount) })),
    settlements.map((s) => ({
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amount: Number(s.amount),
    }))
  );
}
