import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserHouseholdMembership } from "@/lib/households";
import { getHouseholdBalances } from "@/lib/get-household-balances";
import { SignOutButton } from "@/components/sign-out-button";
import { ProfileSettingsButton } from "@/components/profile-settings-button";
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
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [members, paidTotals, pendingItems, expensesThisMonth, activeBills] =
    await Promise.all([
      prisma.householdMember.findMany({
        where: { householdId },
        include: { user: { select: { id: true, name: true, color: true } } },
      }),
      prisma.expense.groupBy({
        by: ["paidById"],
        where: { householdId },
        _sum: { amount: true },
      }),
      prisma.shoppingItem.count({
        where: { list: { householdId }, isPurchased: false },
      }),
      prisma.expense.count({
        where: { householdId, date: { gte: startOfMonth } },
      }),
      prisma.bill.count({ where: { householdId, isActive: true } }),
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

      <div className="mx-5 h-px bg-rule" />

      <div className="flex flex-col px-5">
        <span className="pb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          Secciones
        </span>

        <Link
          href="/shopping-list"
          className="flex items-center gap-3 border-b border-rule py-3"
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-accent-soft">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8h12l-1 12H7L6 8Z" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" />
            </svg>
          </span>
          <span className="flex-1 text-sm font-semibold">Lista de compras</span>
          <span className="font-tabular text-xs text-ink-soft">{pendingItems}</span>
        </Link>

        <Link href="/expenses" className="flex items-center gap-3 border-b border-rule py-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-accent-soft">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3Z" />
              <path d="M9.5 8h5M9.5 11.5h5" />
            </svg>
          </span>
          <span className="flex-1 text-sm font-semibold">Gastos</span>
          <span className="font-tabular text-xs text-ink-soft">{expensesThisMonth} · mes</span>
        </Link>

        <Link
          href="/bills"
          className="flex items-center gap-3 border-b border-rule py-3"
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-accent-soft">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="5" width="16" height="16" rx="3" />
              <path d="M4 10h16M8 3v4M16 3v4" />
            </svg>
          </span>
          <span className="flex-1 text-sm font-semibold">Pagos recurrentes</span>
          <span className="font-tabular text-xs text-ink-soft">{activeBills}</span>
        </Link>

        <Link href="/household/members" className="flex items-center gap-3 py-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-accent-soft">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
              <circle cx="10" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <span className="flex-1 text-sm font-semibold">Miembros del hogar</span>
          <span className="font-tabular text-xs text-ink-soft">{members.length}</span>
        </Link>
      </div>

      <div className="px-5 text-[11.5px] text-ink-soft">
        Código: <span className="font-tabular text-ink">{membership.household.inviteCode}</span>
      </div>
    </main>
  );
}
