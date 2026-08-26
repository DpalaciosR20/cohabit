import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserHouseholdMembership } from "@/lib/households";
import { HouseholdSetup } from "@/components/household-setup";

export default async function HouseholdPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const membership = await getUserHouseholdMembership(session.user.id);
  if (membership) {
    redirect("/");
  }

  return <HouseholdSetup />;
}
