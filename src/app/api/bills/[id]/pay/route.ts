import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { payBillSchema } from "@/lib/validation/bill";
import { splitEvenly } from "@/lib/expense-split";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = payBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill || bill.householdId !== context.householdId || !bill.isActive) {
    return NextResponse.json({ error: "Pago recurrente no encontrado" }, { status: 404 });
  }

  const members = await prisma.householdMember.findMany({
    where: { householdId: context.householdId },
    select: { userId: true },
  });
  const shares = splitEvenly(
    parsed.data.amount,
    members.map((m) => m.userId),
    context.userId
  );

  const nextInstallments =
    bill.installmentsRemaining !== null ? bill.installmentsRemaining - 1 : null;

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.expense.create({
      data: {
        householdId: context.householdId,
        description: bill.name,
        amount: parsed.data.amount,
        paidById: context.userId,
        categoryId: bill.categoryId,
        billId: bill.id,
        splits: {
          create: shares.map((s) => ({ userId: s.userId, shareAmount: s.shareAmount })),
        },
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    await tx.bill.update({
      where: { id: bill.id },
      data: {
        installmentsRemaining: nextInstallments,
        isActive: nextInstallments === null || nextInstallments > 0,
      },
    });

    return created;
  });

  return NextResponse.json({ expense }, { status: 201 });
}
