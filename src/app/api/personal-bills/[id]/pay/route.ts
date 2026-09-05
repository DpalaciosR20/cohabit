import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { payBillSchema } from "@/lib/validation/bill";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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

  const bill = await prisma.personalBill.findUnique({ where: { id } });
  if (!bill || bill.userId !== session.user.id || !bill.isActive) {
    return NextResponse.json({ error: "Pago recurrente no encontrado" }, { status: 404 });
  }

  const nextInstallments =
    bill.installmentsRemaining !== null ? bill.installmentsRemaining - 1 : null;

  const expense = await prisma.$transaction(async (tx) => {
    const created = await tx.personalExpense.create({
      data: {
        userId: session.user.id,
        description: bill.name,
        amount: parsed.data.amount,
        category: bill.category,
        billId: bill.id,
      },
    });

    await tx.personalBill.update({
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
