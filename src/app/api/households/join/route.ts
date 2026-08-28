import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { joinHouseholdSchema } from "@/lib/validation/household";
import { getUserHouseholdMembership } from "@/lib/households";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const existingMembership = await getUserHouseholdMembership(session.user.id);
  if (existingMembership) {
    return NextResponse.json(
      { error: "Ya perteneces a un hogar" },
      { status: 409 }
    );
  }

  const body = await request.json();
  const parsed = joinHouseholdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const household = await prisma.household.findUnique({
    where: { inviteCode: parsed.data.inviteCode },
  });
  if (!household) {
    return NextResponse.json(
      { error: "Código de invitación inválido" },
      { status: 404 }
    );
  }

  await prisma.$transaction([
    prisma.householdMember.create({
      data: { userId: session.user.id, householdId: household.id, role: "MEMBER" },
    }),
    // Un split personalizado configurado antes ya no cubre a todos los
    // miembros con esta persona nueva — se resetea a parejo para no dejar
    // una configuración a medias hasta que alguien la vuelva a definir.
    prisma.householdMember.updateMany({
      where: { householdId: household.id },
      data: { splitPercent: null },
    }),
  ]);

  return NextResponse.json({ household }, { status: 201 });
}
