import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserHouseholdMembership } from "@/lib/households";
import { getHouseholdBalances } from "@/lib/get-household-balances";
import { HouseholdMembersView } from "@/components/household-members-view";

export default async function HouseholdMembersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const membership = await getUserHouseholdMembership(session.user.id);
  if (!membership) {
    redirect("/household");
  }

  const householdId = membership.householdId;

  const [members, balances] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId },
      include: {
        user: { select: { id: true, name: true, color: true, monthlyIncome: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    getHouseholdBalances(householdId),
  ]);

  const balanceByUserId = new Map(balances.map((b) => [b.userId, b.balance]));
  const myIncome = members.find((m) => m.userId === session.user.id)?.user.monthlyIncome;

  return (
    <HouseholdMembersView
      householdName={membership.household.name}
      targetMemberCount={membership.household.targetMemberCount}
      splitMode={membership.household.splitMode}
      currentUserId={session.user.id}
      currentUserRole={
        members.find((m) => m.userId === session.user.id)?.role ?? "MEMBER"
      }
      myMonthlyIncome={myIncome !== null && myIncome !== undefined ? Number(myIncome) : null}
      members={members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        color: m.user.color,
        role: m.role,
        balance: balanceByUserId.get(m.userId) ?? 0,
        splitPercent: m.splitPercent !== null ? Number(m.splitPercent) : null,
        // Nunca se expone el ingreso de nadie más, solo si ya lo registró.
        hasIncome: m.user.monthlyIncome !== null,
      }))}
    />
  );
}
