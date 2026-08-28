import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserHouseholdMembership } from "@/lib/households";
import { ShoppingListView } from "@/components/shopping-list-view";

export default async function ShoppingListPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const membership = await getUserHouseholdMembership(session.user.id);
  if (!membership) {
    redirect("/household");
  }

  return <ShoppingListView householdName={membership.household.name} />;
}
