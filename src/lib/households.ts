import { prisma } from "@/lib/prisma";

export function getUserHouseholdMembership(userId: string) {
  return prisma.householdMember.findFirst({
    where: { userId },
    include: { household: true },
    orderBy: { joinedAt: "asc" },
  });
}
