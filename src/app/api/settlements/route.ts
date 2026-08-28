import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { createSettlementSchema } from "@/lib/validation/settlement";
import { getHouseholdBalances } from "@/lib/get-household-balances";
import { formatCurrency } from "@/lib/format-currency";

const OVERPAYMENT_TOLERANCE = 0.01;

export async function GET() {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const settlements = await prisma.settlement.findMany({
    where: { householdId: context.householdId },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ settlements });
}

export async function POST(request: Request) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json();
  const parsed = createSettlementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  if (parsed.data.toUserId === context.userId) {
    return NextResponse.json(
      { error: "No puedes registrar un pago a ti mismo" },
      { status: 400 }
    );
  }

  const recipientMembership = await prisma.householdMember.findUnique({
    where: {
      userId_householdId: { userId: parsed.data.toUserId, householdId: context.householdId },
    },
  });
  if (!recipientMembership) {
    return NextResponse.json(
      { error: "Esa persona no pertenece a tu hogar" },
      { status: 400 }
    );
  }

  const balances = await getHouseholdBalances(context.householdId);
  const currentBalance = balances.find((b) => b.userId === context.userId)?.balance ?? 0;
  const amountOwed = currentBalance < 0 ? -currentBalance : 0;

  if (parsed.data.amount > amountOwed + OVERPAYMENT_TOLERANCE) {
    return NextResponse.json(
      {
        error: `No puedes registrar un pago mayor a lo que debes (${formatCurrency(amountOwed)})`,
      },
      { status: 400 }
    );
  }

  const settlement = await prisma.settlement.create({
    data: {
      householdId: context.householdId,
      fromUserId: context.userId,
      toUserId: parsed.data.toUserId,
      amount: parsed.data.amount,
    },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ settlement }, { status: 201 });
}
