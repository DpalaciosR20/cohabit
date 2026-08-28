import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema } from "@/lib/validation/profile";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const data: Prisma.UserUpdateInput = {};
  if (parsed.data.color !== undefined) data.color = parsed.data.color;
  if (parsed.data.monthlyIncome !== undefined) data.monthlyIncome = parsed.data.monthlyIncome;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, color: true, monthlyIncome: true },
  });

  return NextResponse.json({ user });
}
