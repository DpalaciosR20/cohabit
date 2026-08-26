import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { getOrCreateDefaultList } from "@/lib/shopping-lists";
import { createShoppingItemSchema } from "@/lib/validation/shopping-item";

export async function GET() {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const list = await getOrCreateDefaultList(context.householdId);
  const items = await prisma.shoppingItem.findMany({
    where: { listId: list.id },
    include: {
      addedBy: { select: { id: true, name: true } },
      purchasedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ isPurchased: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ items, listId: list.id });
}

export async function POST(request: Request) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json();
  const parsed = createShoppingItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const list = await getOrCreateDefaultList(context.householdId);
  const item = await prisma.shoppingItem.create({
    data: {
      listId: list.id,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      addedById: context.userId,
    },
    include: {
      addedBy: { select: { id: true, name: true } },
      purchasedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
