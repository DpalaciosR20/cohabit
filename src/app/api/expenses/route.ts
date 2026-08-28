import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { createExpenseSchema } from "@/lib/validation/expense";
import { resolveExpenseShares } from "@/lib/get-household-split";

export async function GET() {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const expenses = await prisma.expense.findMany({
    where: { householdId: context.householdId },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
      bill: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const members = await prisma.householdMember.findMany({
    where: { householdId: context.householdId },
    select: { userId: true },
  });
  const memberIds = members.map((m) => m.userId);

  const shares = await resolveExpenseShares(
    context.householdId,
    parsed.data.amount,
    memberIds,
    context.userId
  );

  const expense = await prisma.expense.create({
    data: {
      householdId: context.householdId,
      description: parsed.data.description,
      amount: parsed.data.amount,
      paidById: context.userId,
      splits: {
        create: shares.map((s) => ({ userId: s.userId, shareAmount: s.shareAmount })),
      },
    },
    include: {
      paidBy: { select: { id: true, name: true } },
      splits: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
