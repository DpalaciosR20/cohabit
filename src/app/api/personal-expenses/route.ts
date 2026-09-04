import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPersonalExpenseSchema } from "@/lib/validation/personal-expense";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const expenses = await prisma.personalExpense.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPersonalExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const expense = await prisma.personalExpense.create({
    data: {
      userId: session.user.id,
      description: parsed.data.description,
      amount: parsed.data.amount,
      category: parsed.data.category ?? null,
    },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
