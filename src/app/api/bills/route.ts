import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { createBillSchema } from "@/lib/validation/bill";
import { computeBillStatus } from "@/lib/bill-status";

export async function GET() {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const bills = await prisma.bill.findMany({
    where: { householdId: context.householdId, isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      payments: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
    },
  });

  const today = new Date();
  const billsWithStatus = bills
    .map((bill) => {
      const lastPaymentDate = bill.payments[0]?.date ?? null;
      const { dueDate, status } = computeBillStatus(bill.dueDay, lastPaymentDate, today);
      return {
        id: bill.id,
        name: bill.name,
        amount: bill.amount,
        dueDay: bill.dueDay,
        installmentsRemaining: bill.installmentsRemaining,
        category: bill.category,
        dueDate,
        status,
      };
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return NextResponse.json({ bills: billsWithStatus });
}

export async function POST(request: Request) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json();
  const parsed = createBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const bill = await prisma.bill.create({
    data: {
      householdId: context.householdId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      dueDay: parsed.data.dueDay,
      installmentsRemaining: parsed.data.installmentsRemaining ?? null,
    },
  });

  return NextResponse.json({ bill }, { status: 201 });
}
