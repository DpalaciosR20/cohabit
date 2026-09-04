import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isExpenseCategoryName } from "@/lib/expense-categories";
import { upsertPersonalBudgetSchema } from "@/lib/validation/personal-budget";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

  const budget = await prisma.personalBudget.upsert({
    where: { userId_category: { userId: session.user.id, category } },
    update: { monthlyLimit: parsed.data.monthlyLimit },
    create: { userId: session.user.id, category, monthlyLimit: parsed.data.monthlyLimit },
  });

  return NextResponse.json({ budget });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { category } = await params;

  await prisma.personalBudget.deleteMany({
    where: { userId: session.user.id, category },
  });

  return new NextResponse(null, { status: 204 });
}
