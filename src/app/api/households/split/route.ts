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

  if (parsed.data.mode === "MANUAL") {
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

    await prisma.$transaction([
      prisma.household.update({
        where: { id: context.householdId },
        data: { splitMode: "MANUAL" },
      }),
      ...parsed.data.shares.map((s) =>
        prisma.householdMember.update({
          where: { userId_householdId: { userId: s.userId, householdId: context.householdId } },
          data: { splitPercent: s.percent },
        })
      ),
    ]);

    return new NextResponse(null, { status: 204 });
  }

  if (parsed.data.mode === "INCOME") {
    const members = await prisma.householdMember.findMany({
      where: { householdId: context.householdId },
      select: { user: { select: { monthlyIncome: true } } },
    });
    const everyoneHasIncome = members.every(
      (m) => m.user.monthlyIncome !== null && Number(m.user.monthlyIncome) > 0
    );
    if (!everyoneHasIncome) {
      return NextResponse.json(
        { error: "Todos los miembros deben registrar su ingreso mensual antes de activar este modo" },
        { status: 400 }
      );
    }
  }

  // EVEN o INCOME: splitPercent deja de ser la fuente de verdad — se limpia
  // para no dejar datos viejos que confundan si se vuelve a MANUAL después.
  await prisma.$transaction([
    prisma.household.update({
      where: { id: context.householdId },
      data: { splitMode: parsed.data.mode },
    }),
    prisma.householdMember.updateMany({
      where: { householdId: context.householdId },
      data: { splitPercent: null },
    }),
  ]);

  return new NextResponse(null, { status: 204 });
}
