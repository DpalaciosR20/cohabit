import { auth } from "@/auth";
import { getUserHouseholdMembership } from "@/lib/households";

export async function requireHouseholdMember() {
  const session = await auth();
  if (!session?.user) {
    return { error: "No autorizado" as const, status: 401 as const };
  }

  const membership = await getUserHouseholdMembership(session.user.id);
  if (!membership) {
    return { error: "No perteneces a ningún hogar" as const, status: 403 as const };
  }

  return {
    userId: session.user.id,
    householdId: membership.householdId,
  };
}
