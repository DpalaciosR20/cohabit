import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { updateExpenseSchema } from "@/lib/validation/expense";
import { resolveExpenseShares } from "@/lib/get-household-split";

async function getExpenseInHousehold(expenseId: string, householdId: string) {
  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense || expense.householdId !== householdId) return null;
  return expense;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const existing = await getExpenseInHousehold(id, context.householdId);
  if (!existing) {
    return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
  }

  const members = await prisma.householdMember.findMany({
    where: { householdId: context.householdId },
    select: { userId: true },
  });
  const shares = await resolveExpenseShares(
    context.householdId,
    parsed.data.amount,
    members.map((m) => m.userId),
    existing.paidById
  );

  const expense = await prisma.$transaction(async (tx) => {
    await tx.expenseSplit.deleteMany({ where: { expenseId: id } });
    return tx.expense.update({
      where: { id },
      data: {
        description: parsed.data.description,
        amount: parsed.data.amount,
        splits: {
          create: shares.map((s) => ({ userId: s.userId, shareAmount: s.shareAmount })),
        },
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        splits: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  });

  return NextResponse.json({ expense });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { id } = await params;
  const existing = await getExpenseInHousehold(id, context.householdId);
  if (!existing) {
    return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.expense.delete({ where: { id } });

    // Si este gasto venía de un Bill (pago de una compra a meses/recurrente),
    // borrarlo significa que ese pago nunca ocurrió — hay que devolverle su
    // mensualidad y, si se había desactivado al llegar a 0, reactivarlo.
    if (existing.billId) {
      const bill = await tx.bill.findUnique({ where: { id: existing.billId } });
      if (bill?.installmentsRemaining !== null && bill?.installmentsRemaining !== undefined) {
        await tx.bill.update({
          where: { id: existing.billId },
          data: { installmentsRemaining: bill.installmentsRemaining + 1, isActive: true },
        });
      }
    }
  });

  return new NextResponse(null, { status: 204 });
}
