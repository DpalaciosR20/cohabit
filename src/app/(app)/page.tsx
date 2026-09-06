import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserHouseholdMembership } from "@/lib/households";
import { getHouseholdBalances } from "@/lib/get-household-balances";
import { SignOutButton } from "@/components/sign-out-button";
import { ProfileSettingsButton } from "@/components/profile-settings-button";
import { HomeFab } from "@/components/home-fab";
import { Button } from "@/components/ui/button";
import { PROFILE_COLOR_HEX } from "@/lib/profile-colors";
import { formatCurrency } from "@/lib/format-currency";

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Cohabit</h1>
        <p className="text-ink-soft">No has iniciado sesión.</p>
        <div className="flex gap-3">
          <Link href="/signin">
            <Button>Iniciar sesión</Button>
          </Link>
          <Link href="/signup">
            <Button variant="secondary">Crear cuenta</Button>
          </Link>
        </div>
      </main>
    );
  }

  const membership = await getUserHouseholdMembership(session.user.id);

  if (!membership) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Cohabit</h1>
        <p className="text-ink-soft">
          Sesión iniciada como <strong className="text-ink">{session.user.name}</strong>
        </p>
        <Link href="/household">
          <Button>Configura tu hogar</Button>
        </Link>
        <SignOutButton />
      </main>
    );
  }

  const householdId = membership.householdId;

  const [members, paidTotals] = await Promise.all([
    prisma.householdMember.findMany({
      where: { householdId },
      include: { user: { select: { id: true, name: true, color: true } } },
    }),
    prisma.expense.groupBy({
      by: ["paidById"],
      where: { householdId },
      _sum: { amount: true },
    }),
  ]);

  const balances = await getHouseholdBalances(householdId);
  const myBalance = balances.find((b) => b.userId === session.user.id)?.balance ?? 0;
  const otherMember = members.find((m) => m.userId !== session.user.id);

  const paidByMember = new Map(
    paidTotals.map((row) => [row.paidById, Number(row._sum.amount ?? 0)])
  );
  const totalPaid = [...paidByMember.values()].reduce((sum, v) => sum + v, 0);

  // "Le debes a X" solo tiene sentido sin ambigüedad cuando el hogar es de
  // 2 personas — con 3+ miembros, a quién le debes puede no ser el mismo
  // "otro" que se elija arbitrariamente, así que se deja el desglose
  // completo para la pantalla de Balance.
  const balanceHeadline =
    Math.abs(myBalance) < 0.005
      ? "Estás a mano"
      : myBalance < 0 && otherMember && members.length === 2
        ? `Le debes a ${otherMember.user.name}`
        : myBalance < 0
          ? "Debes"
          : "Te deben";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 pb-8 pt-6">
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-ink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11l9-7 9 7" />
              <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
            </svg>
          </div>
          <span className="text-sm font-extrabold tracking-tight text-ink">
            {membership.household.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex">
            {members.map((m) => (
              <div
                key={m.userId}
                className="-ml-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold text-white first:ml-0"
                style={{ background: PROFILE_COLOR_HEX[m.user.color] }}
              >
                {initials(m.user.name)}
              </div>
            ))}
          </div>
          <ProfileSettingsButton
            initialColor={
              members.find((m) => m.userId === session.user.id)?.user.color ?? "INDIGO"
            }
          />
          <SignOutButton />
        </div>
      </div>

      <div className="px-5">
        <div className="text-xs font-bold uppercase tracking-wide text-ink-soft">
          {balanceHeadline}
        </div>
        <div className="mt-1.5 font-tabular text-[38px] font-semibold leading-none tracking-tight">
          {formatCurrency(Math.abs(myBalance))}
        </div>

        {totalPaid > 0 && members.length > 0 && (
          <>
            <div className="mt-3.5 flex h-2.5 overflow-hidden rounded-full bg-rule">
              {members.map((m) => {
                const paid = paidByMember.get(m.userId) ?? 0;
                const pct = totalPaid > 0 ? (paid / totalPaid) * 100 : 0;
                return (
                  <div
                    key={m.userId}
                    style={{
                      width: `${pct}%`,
                      background: PROFILE_COLOR_HEX[m.user.color],
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[11.5px] font-semibold text-ink-soft">
              {members.map((m) => (
                <span key={m.userId} className="font-tabular">
                  {m.user.name} {formatCurrency(paidByMember.get(m.userId) ?? 0)}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <HomeFab />
    </main>
  );
}
