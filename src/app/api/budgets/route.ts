import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";

export async function GET() {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, now.getMonth(), 1);

  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { householdId: context.householdId, month, year },
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.expense.findMany({
      where: {
        householdId: context.householdId,
        date: { gte: startOfMonth },
        categoryId: { not: null },
      },
      select: { categoryId: true, amount: true },
    }),
  ]);

  const spentByCategoryId = new Map<string, number>();
  for (const expense of expenses) {
    const categoryId = expense.categoryId as string;
    spentByCategoryId.set(
      categoryId,
      (spentByCategoryId.get(categoryId) ?? 0) + Number(expense.amount)
    );
  }

  const result = budgets.map((b) => ({
    category: b.category.name,
    monthlyLimit: Number(b.monthlyLimit),
    spentThisMonth: spentByCategoryId.get(b.categoryId) ?? 0,
  }));

  return NextResponse.json({ budgets: result });
}
