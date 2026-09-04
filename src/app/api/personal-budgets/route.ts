import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [budgets, expenses] = await Promise.all([
    prisma.personalBudget.findMany({ where: { userId: session.user.id } }),
    prisma.personalExpense.findMany({
      where: { userId: session.user.id, date: { gte: startOfMonth }, category: { not: null } },
      select: { category: true, amount: true },
    }),
  ]);

  const spentByCategory = new Map<string, number>();
  for (const expense of expenses) {
    const category = expense.category as string;
    spentByCategory.set(category, (spentByCategory.get(category) ?? 0) + Number(expense.amount));
  }

  const result = budgets.map((b) => ({
    category: b.category,
    monthlyLimit: Number(b.monthlyLimit),
    spentThisMonth: spentByCategory.get(b.category) ?? 0,
  }));

  return NextResponse.json({ budgets: result });
}
