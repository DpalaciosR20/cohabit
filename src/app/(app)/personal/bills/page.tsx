import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PersonalBillsView } from "@/components/personal-bills-view";

export default async function PersonalBillsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  return <PersonalBillsView />;
}
