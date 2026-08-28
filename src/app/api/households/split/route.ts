import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";
import { setHouseholdSplitSchema } from "@/lib/validation/household-split";

export async function PUT(request: Request) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json();
  const parsed = setHouseholdSplitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const members = await prisma.householdMember.findMany({
    where: { householdId: context.householdId },
    select: { userId: true },
  });
  const memberIds = new Set(members.map((m) => m.userId));
  const shareIds = new Set(parsed.data.shares.map((s) => s.userId));

  const coversExactlyCurrentMembers =
    memberIds.size === shareIds.size && [...memberIds].every((id) => shareIds.has(id));
  if (!coversExactlyCurrentMembers) {
    return NextResponse.json(
      { error: "Los porcentajes deben cubrir exactamente a los miembros actuales del hogar" },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    parsed.data.shares.map((s) =>
      prisma.householdMember.update({
        where: { userId_householdId: { userId: s.userId, householdId: context.householdId } },
        data: { splitPercent: s.percent },
      })
    )
  );

  return new NextResponse(null, { status: 204 });
}

export async function DELETE() {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  await prisma.householdMember.updateMany({
    where: { householdId: context.householdId },
    data: { splitPercent: null },
  });

  return new NextResponse(null, { status: 204 });
}
