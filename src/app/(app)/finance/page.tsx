import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserHouseholdMembership } from "@/lib/households";
import { FinanceView } from "@/components/finance-view";

export default async function FinancePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const membership = await getUserHouseholdMembership(session.user.id);
  if (!membership) {
    redirect("/household");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { monthlyIncome: true },
  });

  return (
    <FinanceView
      householdName={membership.household.name}
      householdId={membership.householdId}
      currentUserId={session.user.id}
      monthlyIncome={
        user?.monthlyIncome !== null && user?.monthlyIncome !== undefined
          ? Number(user.monthlyIncome)
          : null
      }
    />
  );
}
