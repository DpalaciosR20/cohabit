import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserHouseholdMembership } from "@/lib/households";
import { ExpensesView } from "@/components/expenses-view";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const membership = await getUserHouseholdMembership(session.user.id);
  if (!membership) {
    redirect("/household");
  }

  return (
    <ExpensesView
      householdName={membership.household.name}
      householdId={membership.householdId}
    />
  );
}
