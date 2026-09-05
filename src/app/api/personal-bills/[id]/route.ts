import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateBillSchema } from "@/lib/validation/bill";

async function getOwnBill(id: string, userId: string) {
  const bill = await prisma.personalBill.findUnique({ where: { id } });
  if (!bill || bill.userId !== userId) return null;
  return bill;
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
  const parsed = updateBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const existing = await getOwnBill(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Pago recurrente no encontrado" }, { status: 404 });
  }

  const data: Prisma.PersonalBillUpdateInput = { ...parsed.data };

  if (parsed.data.totalInstallments !== undefined) {
    if (existing.totalInstallments === null) {
      return NextResponse.json(
        { error: "Este pago no es una compra a meses" },
        { status: 400 }
      );
    }

    const paymentCount = await prisma.personalExpense.count({ where: { billId: id } });
    if (parsed.data.totalInstallments < paymentCount) {
      return NextResponse.json(
        { error: `El total no puede ser menor a los ${paymentCount} pagos ya registrados` },
        { status: 400 }
      );
    }

    // installmentsRemaining nunca viene del cliente — siempre se deriva del
    // total y los pagos reales (mismo criterio que el Bill de hogar, #55).
    data.installmentsRemaining = parsed.data.totalInstallments - paymentCount;
  }

  const bill = await prisma.personalBill.update({ where: { id }, data });
  return NextResponse.json({ bill });
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
  const existing = await getOwnBill(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Pago recurrente no encontrado" }, { status: 404 });
  }

  const paymentCount = await prisma.personalExpense.count({ where: { billId: id } });
  if (paymentCount > 0) {
    return NextResponse.json(
      { error: "Ya tiene pagos registrados; desactívalo en vez de eliminarlo" },
      { status: 409 }
    );
  }

  await prisma.personalBill.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
