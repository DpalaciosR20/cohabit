import { NextResponse } from "next/server";
import { requireHouseholdMember } from "@/lib/require-household";
import { getHouseholdBalances } from "@/lib/get-household-balances";

export async function GET() {
  const context = await requireHouseholdMember();
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const balances = await getHouseholdBalances(context.householdId);
  return NextResponse.json({ balances });
}
