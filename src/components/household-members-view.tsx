"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { PROFILE_COLOR_HEX, type ProfileColor } from "@/lib/profile-colors";
import { formatCurrency } from "@/lib/format-currency";

type HouseholdRole = "OWNER" | "MEMBER";

type Member = {
  userId: string;
  name: string;
  color: ProfileColor;
  role: HouseholdRole;
  balance: number;
  splitPercent: number | null;
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

      <SplitConfig members={members} onChanged={() => router.refresh()} />

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

function SplitConfig({
  members,
  onChanged,
}: {
  members: Member[];
  onChanged: () => void;
}) {
  const isCustom = members.every((m) => m.splitPercent !== null);
  const [isEditing, setIsEditing] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      members.map((m) => [
        m.userId,
        m.splitPercent !== null
          ? String(m.splitPercent)
          : (100 / members.length).toFixed(2),
      ])
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sum = Object.values(inputs).reduce((total, v) => total + (Number(v) || 0), 0);
  const sumIsValid = Math.abs(sum - 100) < 0.01;

  function startEditing() {
    setInputs(
      Object.fromEntries(
        members.map((m) => [
          m.userId,
          m.splitPercent !== null
            ? String(m.splitPercent)
            : (100 / members.length).toFixed(2),
        ])
      )
    );
    setError(null);
    setIsEditing(true);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!sumIsValid) return;

    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/households/split", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shares: members.map((m) => ({ userId: m.userId, percent: Number(inputs[m.userId]) })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo guardar el split");
        return;
      }

      setIsEditing(false);
      onChanged();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/households/split", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo restablecer el split");
        return;
      }
      setIsEditing(false);
      onChanged();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-rule bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          Cómo se reparten los gastos
        </span>
        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="text-xs font-semibold text-accent"
          >
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="mt-3 flex flex-col gap-2.5">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-2">
              <span className="flex-1 text-sm font-semibold text-ink">{m.name}</span>
              <TextField
                className="w-20 text-right"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={inputs[m.userId]}
                onChange={(e) => setInputs({ ...inputs, [m.userId]: e.target.value })}
              />
              <span className="text-sm text-ink-soft">%</span>
            </div>
          ))}
          <p className={`text-xs font-semibold ${sumIsValid ? "text-ink-soft" : "text-negative"}`}>
            Suma: {sum.toFixed(2)}% {sumIsValid ? "" : "— debe sumar 100%"}
          </p>
          {error && <p className="text-xs font-semibold text-negative">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!sumIsValid || isSaving}
              className="px-3 py-1.5 text-xs"
            >
              {isSaving ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs"
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-2 flex flex-col gap-1">
          {isCustom ? (
            members.map((m) => (
              <div key={m.userId} className="flex justify-between text-xs text-ink-soft">
                <span>{m.name}</span>
                <span className="font-tabular font-semibold text-ink">{m.splitPercent}%</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-ink-soft">
              Parejo — {(100 / members.length).toFixed(1)}% cada quien
            </p>
          )}
          {isCustom && (
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="mt-1.5 self-start text-xs font-semibold text-ink-soft hover:text-ink disabled:opacity-50"
            >
              Volver a parejo
            </button>
          )}
          {error && <p className="mt-1 text-xs font-semibold text-negative">{error}</p>}
        </div>
      )}
    </div>
  );
}
