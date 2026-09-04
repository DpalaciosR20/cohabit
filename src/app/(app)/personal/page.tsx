import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PersonalExpensesView } from "@/components/personal-expenses-view";

export default async function PersonalExpensesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { monthlyIncome: true },
  });

  return (
    <PersonalExpensesView
      monthlyIncome={
        user?.monthlyIncome !== null && user?.monthlyIncome !== undefined
          ? Number(user.monthlyIncome)
          : null
      }
    />
  );
}
