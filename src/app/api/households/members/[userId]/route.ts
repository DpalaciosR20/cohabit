import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { getHouseholdBalances } from "@/lib/get-household-balances";
import { formatCurrency } from "@/lib/format-currency";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { userId: targetUserId } = await params;
  const isSelf = targetUserId === context.userId;

  const [requesterMembership, targetMembership] = await Promise.all([
    prisma.householdMember.findUnique({
      where: { userId_householdId: { userId: context.userId, householdId: context.householdId } },
    }),
    prisma.householdMember.findUnique({
      where: { userId_householdId: { userId: targetUserId, householdId: context.householdId } },
    }),
  ]);

  if (!targetMembership) {
    return NextResponse.json({ error: "Esa persona no pertenece a tu hogar" }, { status: 404 });
  }

  if (!isSelf && requesterMembership?.role !== "OWNER") {
    return NextResponse.json(
      { error: "Solo el dueño del hogar puede expulsar a alguien" },
      { status: 403 }
    );
  }

  const balances = await getHouseholdBalances(context.householdId);
  const targetBalance = balances.find((b) => b.userId === targetUserId)?.balance ?? 0;
  if (Math.abs(targetBalance) > 0.005) {
    return NextResponse.json(
      {
        error: `Esta persona tiene un balance pendiente de ${formatCurrency(Math.abs(targetBalance))}; debe saldarse antes de ${isSelf ? "salir" : "expulsarla"}`,
      },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.householdMember.delete({
      where: { userId_householdId: { userId: targetUserId, householdId: context.householdId } },
    });

    // Si quien sale era el dueño y quedan más personas, alguien tiene que
    // heredar el rol para que el hogar no se quede sin OWNER.
    if (targetMembership.role === "OWNER") {
      const nextOwner = await tx.householdMember.findFirst({
        where: { householdId: context.householdId },
        orderBy: { joinedAt: "asc" },
      });
      if (nextOwner) {
        await tx.householdMember.update({
          where: { id: nextOwner.id },
          data: { role: "OWNER" },
        });
      }
    }

    // Un split personalizado ya no cubriría a los miembros restantes
    // correctamente — se resetea a parejo hasta que se reconfigure.
    await tx.householdMember.updateMany({
      where: { householdId: context.householdId },
      data: { splitPercent: null },
    });
  });

  return new NextResponse(null, { status: 204 });
}
