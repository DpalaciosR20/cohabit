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
      include: { user: { select: { id: true, name: true, color: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    getHouseholdBalances(householdId),
  ]);

  const balanceByUserId = new Map(balances.map((b) => [b.userId, b.balance]));

  return (
    <HouseholdMembersView
      householdName={membership.household.name}
      targetMemberCount={membership.household.targetMemberCount}
      currentUserId={session.user.id}
      currentUserRole={
        members.find((m) => m.userId === session.user.id)?.role ?? "MEMBER"
      }
      members={members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        color: m.user.color,
        role: m.role,
        balance: balanceByUserId.get(m.userId) ?? 0,
      }))}
    />
  );
}
