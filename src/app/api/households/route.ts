import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createHouseholdSchema } from "@/lib/validation/household";
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
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
  });

  return NextResponse.json({ household }, { status: 201 });
}
