import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";

const updateBillSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  amount: z.number().positive().max(1_000_000).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  installmentsRemaining: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

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

  const bill = await prisma.bill.update({ where: { id }, data: parsed.data });
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
