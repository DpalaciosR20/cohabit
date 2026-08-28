import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserHouseholdMembership } from "@/lib/households";
import { BillsView } from "@/components/bills-view";

export default async function BillsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const membership = await getUserHouseholdMembership(session.user.id);
  if (!membership) {
    redirect("/household");
  }

  return (
    <BillsView
      householdName={membership.household.name}
      householdId={membership.householdId}
    />
  );
}
