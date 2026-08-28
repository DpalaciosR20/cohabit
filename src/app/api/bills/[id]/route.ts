import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { updateBillSchema } from "@/lib/validation/bill";

async function getBillInHousehold(billId: string, householdId: string) {
  const bill = await prisma.bill.findUnique({ where: { id: billId } });
  if (!bill || bill.householdId !== householdId) return null;
  return bill;
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
  const parsed = updateBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const existing = await getBillInHousehold(id, context.householdId);
  if (!existing) {
    return NextResponse.json({ error: "Pago recurrente no encontrado" }, { status: 404 });
  }

  const data: Prisma.BillUpdateInput = { ...parsed.data };

  if (parsed.data.totalInstallments !== undefined) {
    if (existing.totalInstallments === null) {
      return NextResponse.json(
        { error: "Este pago no es una compra a meses" },
        { status: 400 }
      );
    }

    const paymentCount = await prisma.expense.count({ where: { billId: id } });
    if (parsed.data.totalInstallments < paymentCount) {
      return NextResponse.json(
        { error: `El total no puede ser menor a los ${paymentCount} pagos ya registrados` },
        { status: 400 }
      );
    }

    // installmentsRemaining nunca viene del cliente — siempre se deriva del
    // total y los pagos reales, para que nunca pueda desincronizarse.
    data.installmentsRemaining = parsed.data.totalInstallments - paymentCount;
  }

  const bill = await prisma.bill.update({ where: { id }, data });
  return NextResponse.json({ bill });
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
  const existing = await getBillInHousehold(id, context.householdId);
  if (!existing) {
    return NextResponse.json({ error: "Pago recurrente no encontrado" }, { status: 404 });
  }

  const paymentCount = await prisma.expense.count({ where: { billId: id } });
  if (paymentCount > 0) {
    return NextResponse.json(
      { error: "Ya tiene pagos registrados; desactívalo en vez de eliminarlo" },
      { status: 409 }
    );
  }

  await prisma.bill.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
