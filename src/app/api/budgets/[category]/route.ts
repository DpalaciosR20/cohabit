import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { isExpenseCategoryName } from "@/lib/expense-categories";
import { resolveCategoryId } from "@/lib/resolve-category";
import { upsertPersonalBudgetSchema } from "@/lib/validation/personal-budget";

function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { category } = await params;
  if (!isExpenseCategoryName(category)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = upsertPersonalBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const categoryId = (await resolveCategoryId(context.householdId, category)) as string;
  const { month, year } = currentMonthYear();

  const budget = await prisma.budget.upsert({
    where: {
      householdId_categoryId_month_year: {
        householdId: context.householdId,
        categoryId,
        month,
        year,
      },
    },
    update: { monthlyLimit: parsed.data.monthlyLimit },
    create: {
      householdId: context.householdId,
      categoryId,
      monthlyLimit: parsed.data.monthlyLimit,
      month,
      year,
    },
  });

  return NextResponse.json({ budget });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { category } = await params;
  const { month, year } = currentMonthYear();

  const categoryRow = await prisma.category.findUnique({
    where: { householdId_name: { householdId: context.householdId, name: category } },
  });

  if (categoryRow) {
    await prisma.budget.deleteMany({
      where: { householdId: context.householdId, categoryId: categoryRow.id, month, year },
    });
  }

  return new NextResponse(null, { status: 204 });
}
