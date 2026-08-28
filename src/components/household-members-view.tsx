"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PROFILE_COLOR_HEX, type ProfileColor } from "@/lib/profile-colors";
import { formatCurrency } from "@/lib/format-currency";

type HouseholdRole = "OWNER" | "MEMBER";

type Member = {
  userId: string;
  name: string;
  color: ProfileColor;
  role: HouseholdRole;
  balance: number;
};

function describeBalance(balance: number) {
  if (Math.abs(balance) < 0.005) return "A mano";
  return balance > 0 ? `Le deben ${formatCurrency(balance)}` : `Debe ${formatCurrency(Math.abs(balance))}`;
}

export function HouseholdMembersView({
  householdName,
  targetMemberCount,
  currentUserId,
  currentUserRole,
  members,
}: {
  householdName: string;
  targetMemberCount: number | null;
  currentUserId: string;
  currentUserRole: HouseholdRole;
  members: Member[];
}) {
  const router = useRouter();
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(member: Member) {
    const isSelf = member.userId === currentUserId;
    const confirmMessage = isSelf
      ? "¿Salir de este hogar?"
      : `¿Expulsar a ${member.name} del hogar?`;
    if (!confirm(confirmMessage)) return;

    setError(null);
    setBusyUserId(member.userId);
    try {
      const res = await fetch(`/api/households/members/${member.userId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo completar la acción");
        return;
      }

      if (isSelf) {
        router.push("/household");
        router.refresh();
      } else {
        router.refresh();
      }
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Miembros del hogar</h1>
        <p className="text-xs font-semibold text-ink-soft">
          {householdName}
          {targetMemberCount ? ` · ${members.length} de ${targetMemberCount} personas` : ""}
        </p>
      </div>

      {error && <p className="text-sm font-semibold text-negative">{error}</p>}

      <ul className="flex flex-col gap-3">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const canRemove = isSelf || currentUserRole === "OWNER";
          return (
            <li
              key={member.userId}
              className="flex items-center gap-3 rounded-2xl border border-rule bg-surface px-4 py-3.5"
            >
              <div
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: PROFILE_COLOR_HEX[member.color] }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
                  {member.name}
                  {isSelf ? " (tú)" : ""}
                  {member.role === "OWNER" && (
                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
                      Dueño
                    </span>
                  )}
                </div>
                <div
                  className={`font-tabular text-xs font-semibold ${
                    member.balance > 0.005
                      ? "text-positive"
                      : member.balance < -0.005
                        ? "text-negative"
                        : "text-ink-soft"
                  }`}
                >
                  {describeBalance(member.balance)}
                </div>
              </div>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => handleRemove(member)}
                  disabled={busyUserId === member.userId}
                  className="text-xs font-semibold text-ink-soft hover:text-negative disabled:opacity-50"
                >
                  {busyUserId === member.userId ? "…" : isSelf ? "Salir" : "Expulsar"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Button
        type="button"
        variant="secondary"
        onClick={() => router.push("/")}
      >
        Volver al inicio
      </Button>
    </main>
  );
}
