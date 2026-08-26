import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserHouseholdMembership } from "@/lib/households";
import { BalanceView } from "@/components/balance-view";

export default async function BalancePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const membership = await getUserHouseholdMembership(session.user.id);
  if (!membership) {
    redirect("/household");
  }

  return (
    <BalanceView householdName={membership.household.name} currentUserId={session.user.id} />
  );
}
