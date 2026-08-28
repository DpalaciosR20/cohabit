import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireHouseholdMember } from "@/lib/require-household";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { id } = await params;
  const existing = await prisma.settlement.findUnique({ where: { id } });
  if (!existing || existing.householdId !== context.householdId) {
    return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
  }

  await prisma.settlement.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
