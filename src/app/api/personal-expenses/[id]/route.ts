import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updatePersonalExpenseSchema } from "@/lib/validation/personal-expense";

async function getOwnExpense(id: string, userId: string) {
  const expense = await prisma.personalExpense.findUnique({ where: { id } });
  if (!expense || expense.userId !== userId) return null;
  return expense;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updatePersonalExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const existing = await getOwnExpense(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
  }

  const expense = await prisma.personalExpense.update({
    where: { id },
    data: {
      description: parsed.data.description,
      amount: parsed.data.amount,
      category: parsed.data.category ?? null,
    },
  });

  return NextResponse.json({ expense });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getOwnExpense(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.personalExpense.delete({ where: { id } });

    // Si este gasto venía de un PersonalBill, borrarlo significa que ese
    // pago nunca ocurrió — hay que devolverle su mensualidad y, si se había
    // desactivado al llegar a 0, reactivarlo (mismo criterio que Expense de
    // hogar con Bill).
    if (existing.billId) {
      const bill = await tx.personalBill.findUnique({ where: { id: existing.billId } });
      if (bill?.installmentsRemaining !== null && bill?.installmentsRemaining !== undefined) {
        await tx.personalBill.update({
          where: { id: existing.billId },
          data: { installmentsRemaining: bill.installmentsRemaining + 1, isActive: true },
        });
      }
    }
  });

  return new NextResponse(null, { status: 204 });
}
