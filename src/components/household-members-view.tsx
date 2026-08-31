"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { MoneyInput } from "@/components/ui/money-input";
import { PROFILE_COLOR_HEX, type ProfileColor } from "@/lib/profile-colors";
import { formatCurrency } from "@/lib/format-currency";

type HouseholdRole = "OWNER" | "MEMBER";
type SplitMode = "EVEN" | "MANUAL" | "INCOME";

type Member = {
  userId: string;
  name: string;
  color: ProfileColor;
  role: HouseholdRole;
  balance: number;
  splitPercent: number | null;
  hasIncome: boolean;
};

function describeBalance(balance: number) {
  if (Math.abs(balance) < 0.005) return "A mano";
  return balance > 0 ? `Le deben ${formatCurrency(balance)}` : `Debe ${formatCurrency(Math.abs(balance))}`;
}

export function HouseholdMembersView({
  householdName,
  targetMemberCount,
  splitMode,
  currentUserId,
  currentUserRole,
  myMonthlyIncome,
  members,
}: {
  householdName: string;
  targetMemberCount: number | null;
  splitMode: SplitMode;
  currentUserId: string;
  currentUserRole: HouseholdRole;
  myMonthlyIncome: number | null;
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
        <HouseholdNameEditor
          householdName={householdName}
          targetMemberCount={targetMemberCount}
          memberCount={members.length}
          onChanged={() => router.refresh()}
        />
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

      <SplitConfig
        splitMode={splitMode}
        members={members}
        currentUserId={currentUserId}
        myMonthlyIncome={myMonthlyIncome}
        onChanged={() => router.refresh()}
      />

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

const MODE_LABEL: Record<SplitMode, string> = {
  EVEN: "Parejo",
  MANUAL: "Personalizado",
  INCOME: "Basado en ingresos",
};

function SplitConfig({
  splitMode,
  members,
  currentUserId,
  myMonthlyIncome,
  onChanged,
}: {
  splitMode: SplitMode;
  members: Member[];
  currentUserId: string;
  myMonthlyIncome: number | null;
  onChanged: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftMode, setDraftMode] = useState<SplitMode>(splitMode);
  const [manualInputs, setManualInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      members.map((m) => [
        m.userId,
        m.splitPercent !== null ? String(m.splitPercent) : (100 / members.length).toFixed(2),
      ])
    )
  );
  const [incomeInput, setIncomeInput] = useState(
    myMonthlyIncome !== null ? myMonthlyIncome.toFixed(2) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const manualSum = Object.values(manualInputs).reduce((total, v) => total + (Number(v) || 0), 0);
  const manualSumIsValid = Math.abs(manualSum - 100) < 0.01;
  const everyoneHasIncome = members.every((m) => m.hasIncome);

  function startEditing() {
    setDraftMode(splitMode);
    setManualInputs(
      Object.fromEntries(
        members.map((m) => [
          m.userId,
          m.splitPercent !== null ? String(m.splitPercent) : (100 / members.length).toFixed(2),
        ])
      )
    );
    setError(null);
    setIsEditing(true);
  }

  async function saveMyIncome() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyIncome: Number(incomeInput) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo guardar tu ingreso");
        return;
      }
      onChanged();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (draftMode === "MANUAL" && !manualSumIsValid) return;

    setError(null);
    setIsSaving(true);
    try {
      const body =
        draftMode === "MANUAL"
          ? {
              mode: "MANUAL",
              shares: members.map((m) => ({
                userId: m.userId,
                percent: Number(manualInputs[m.userId]),
              })),
            }
          : { mode: draftMode };

      const res = await fetch("/api/households/split", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        <form onSubmit={handleSave} className="mt-3 flex flex-col gap-3">
          <div className="flex gap-1.5 rounded-xl bg-accent-soft p-1 text-xs">
            {(["EVEN", "MANUAL", "INCOME"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDraftMode(mode)}
                className={`flex-1 rounded-lg px-2 py-1.5 font-bold transition-colors ${
                  draftMode === mode ? "bg-accent text-accent-ink" : "text-ink-soft"
                }`}
              >
                {MODE_LABEL[mode]}
              </button>
            ))}
          </div>

          {draftMode === "MANUAL" && (
            <div className="flex flex-col gap-2.5">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-semibold text-ink">{m.name}</span>
                  <TextField
                    className="w-20 text-right"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    value={manualInputs[m.userId]}
                    onChange={(e) =>
                      setManualInputs({ ...manualInputs, [m.userId]: e.target.value })
                    }
                  />
                  <span className="text-sm text-ink-soft">%</span>
                </div>
              ))}
              <p
                className={`text-xs font-semibold ${manualSumIsValid ? "text-ink-soft" : "text-negative"}`}
              >
                Suma: {manualSum.toFixed(2)}% {manualSumIsValid ? "" : "— debe sumar 100%"}
              </p>
            </div>
          )}

          {draftMode === "INCOME" && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-end gap-2">
                <label className="flex-1 flex flex-col gap-1 text-xs font-semibold text-ink-soft">
                  Tu ingreso mensual (privado — nadie más ve el monto)
                  <MoneyInput value={incomeInput} onChange={setIncomeInput} />
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={saveMyIncome}
                  disabled={isSaving}
                  className="px-3 py-2.5 text-xs"
                >
                  Guardar
                </Button>
              </div>
              <ul className="flex flex-col gap-1">
                {members.map((m) => (
                  <li key={m.userId} className="flex justify-between text-xs text-ink-soft">
                    <span>{m.userId === currentUserId ? `${m.name} (tú)` : m.name}</span>
                    <span
                      className={
                        m.userId === currentUserId
                          ? incomeInput && Number(incomeInput) > 0
                            ? "font-semibold text-positive"
                            : "font-semibold text-ink-soft"
                          : m.hasIncome
                            ? "font-semibold text-positive"
                            : "font-semibold text-ink-soft"
                      }
                    >
                      {m.userId === currentUserId
                        ? incomeInput && Number(incomeInput) > 0
                          ? "Registrado"
                          : "Falta"
                        : m.hasIncome
                          ? "Registrado"
                          : "Falta"}
                    </span>
                  </li>
                ))}
              </ul>
              {!everyoneHasIncome && (
                <p className="text-xs text-ink-soft">
                  Todos deben registrar su ingreso antes de activar este modo.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-xs font-semibold text-negative">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={
                isSaving ||
                (draftMode === "MANUAL" && !manualSumIsValid) ||
                (draftMode === "INCOME" && !everyoneHasIncome)
              }
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
          <p className="text-xs font-semibold text-ink">{MODE_LABEL[splitMode]}</p>
          {splitMode === "EVEN" && (
            <p className="text-xs text-ink-soft">{(100 / members.length).toFixed(1)}% cada quien</p>
          )}
          {splitMode === "MANUAL" &&
            members.map((m) => (
              <div key={m.userId} className="flex justify-between text-xs text-ink-soft">
                <span>{m.name}</span>
                <span className="font-tabular font-semibold text-ink">{m.splitPercent}%</span>
              </div>
            ))}
          {splitMode === "INCOME" && (
            <p className="text-xs text-ink-soft">
              {everyoneHasIncome
                ? "% proporcional al ingreso de cada quien"
                : "Falta que todos registren su ingreso — usando parejo mientras tanto"}
            </p>
          )}
          {error && <p className="mt-1 text-xs font-semibold text-negative">{error}</p>}
        </div>
      )}
    </div>
  );
}

function HouseholdNameEditor({
  householdName,
  targetMemberCount,
  memberCount,
  onChanged,
}: {
  householdName: string;
  targetMemberCount: number | null;
  memberCount: number;
  onChanged: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(householdName);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/households", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo renombrar el hogar");
        return;
      }

      setIsEditing(false);
      onChanged();
    } finally {
      setIsSaving(false);
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="mt-1 flex flex-col gap-1.5">
        <div className="flex gap-2">
          <TextField
            className="flex-1"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Button type="submit" disabled={isSaving} className="px-3 py-1.5 text-xs">
            {isSaving ? "Guardando…" : "Guardar"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setName(householdName);
              setError(null);
              setIsEditing(false);
            }}
            className="px-3 py-1.5 text-xs"
          >
            Cancelar
          </Button>
        </div>
        {error && <p className="text-xs font-semibold text-negative">{error}</p>}
      </form>
    );
  }

  return (
    <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
      {householdName}
      {targetMemberCount ? ` · ${memberCount} de ${targetMemberCount} personas` : ""}
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="text-accent hover:underline"
      >
        Editar
      </button>
    </p>
  );
}
