import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { updateShoppingItemSchema } from "@/lib/validation/shopping-item";

async function getItemInHousehold(itemId: string, householdId: string) {
  const item = await prisma.shoppingItem.findUnique({
    where: { id: itemId },
    include: { list: true },
  });
  if (!item || item.list.householdId !== householdId) return null;
  return item;
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
  const parsed = updateShoppingItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const existing = await getItemInHousehold(id, context.householdId);
  if (!existing) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }

  const data: Prisma.ShoppingItemUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.quantity !== undefined) data.quantity = parsed.data.quantity;
  if (parsed.data.isPurchased !== undefined) {
    data.isPurchased = parsed.data.isPurchased;
    data.purchasedBy = parsed.data.isPurchased
      ? { connect: { id: context.userId } }
      : { disconnect: true };
    data.purchasedAt = parsed.data.isPurchased ? new Date() : null;
  }

  const item = await prisma.shoppingItem.update({
    where: { id },
    data,
    include: {
      addedBy: { select: { id: true, name: true } },
      purchasedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ item });
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
  const existing = await getItemInHousehold(id, context.householdId);
  if (!existing) {
    return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
  }

  await prisma.shoppingItem.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
