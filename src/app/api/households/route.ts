import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createHouseholdSchema, renameHouseholdSchema } from "@/lib/validation/household";
import { getUserHouseholdMembership } from "@/lib/households";
import { requireHouseholdMember } from "@/lib/require-household";

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
  const parsed = createHouseholdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const household = await prisma.household.create({
    data: {
      name: parsed.data.name,
      targetMemberCount: parsed.data.targetMemberCount,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
  });

  return NextResponse.json({ household }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = await request.json();
  const parsed = renameHouseholdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const household = await prisma.household.update({
    where: { id: context.householdId },
    data: { name: parsed.data.name },
  });

  return NextResponse.json({ household });
}
