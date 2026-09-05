import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createBillSchema } from "@/lib/validation/bill";
import { computeBillStatus } from "@/lib/bill-status";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const bills = await prisma.personalBill.findMany({
    where: { userId: session.user.id, isActive: true },
    include: {
      payments: { orderBy: { date: "desc" }, take: 1, select: { date: true } },
    },
  });

  const today = new Date();
  const billsWithStatus = bills
    .map((bill) => {
      const lastPaymentDate = bill.payments[0]?.date ?? null;
      const { dueDate, status } = computeBillStatus(
        bill.dueDay,
        lastPaymentDate,
        today,
        bill.startsAt
      );
      return {
        id: bill.id,
        name: bill.name,
        amount: bill.amount,
        dueDay: bill.dueDay,
        installmentsRemaining: bill.installmentsRemaining,
        totalInstallments: bill.totalInstallments,
        category: bill.category,
        dueDate,
        status,
      };
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return NextResponse.json({ bills: billsWithStatus });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const startsAt = parsed.data.startsAt
    ? new Date(`${parsed.data.startsAt}-01T00:00:00`)
    : new Date();

  const bill = await prisma.personalBill.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      amount: parsed.data.amount,
      dueDay: parsed.data.dueDay,
      installmentsRemaining: parsed.data.installmentsRemaining ?? null,
      totalInstallments: parsed.data.totalInstallments ?? null,
      category: parsed.data.category ?? null,
      startsAt,
    },
  });

  return NextResponse.json({ bill }, { status: 201 });
}
