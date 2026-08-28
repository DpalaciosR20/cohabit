import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { computeBalances } from "@/lib/balance";

export async function GET() {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const [members, expenses, splits, settlements] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId: context.householdId },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.expense.findMany({
      where: { householdId: context.householdId },
      select: { paidById: true, amount: true },
    }),
    prisma.expenseSplit.findMany({
      where: { expense: { householdId: context.householdId } },
      select: { userId: true, shareAmount: true },
    }),
    prisma.settlement.findMany({
      where: { householdId: context.householdId },
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

  return NextResponse.json({ balances });
}
