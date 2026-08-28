"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRealtimeRefetch } from "@/lib/use-realtime-refetch";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

type MemberBalance = { userId: string; name: string; balance: number };

type Settlement = {
  id: string;
  amount: string;
  date: string;
  fromUser: { id: string; name: string };
  toUser: { id: string; name: string };
};

function describe(balance: number, name: string, currentUserId: string, userId: string) {
  if (Math.abs(balance) < 0.005) {
    return userId === currentUserId ? "Estás a mano" : `${name} está a mano`;
  }
  if (userId === currentUserId) {
    return balance > 0
      ? `Te deben $${balance.toFixed(2)}`
      : `Debes $${Math.abs(balance).toFixed(2)}`;
  }
  return balance > 0
    ? `Le deben $${balance.toFixed(2)}`
    : `Debe $${Math.abs(balance).toFixed(2)}`;
}

function formatMoney(value: string) {
  return `$${Number(value).toFixed(2)}`;
}

export function BalanceView({
  householdName,
  householdId,
  currentUserId,
}: {
  householdName: string;
  householdId: string;
  currentUserId: string;
}) {
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingUserId, setPayingUserId] = useState<string | null>(null);

  async function loadBalances() {
    const res = await fetch("/api/balance");
    const data = await res.json();
    setBalances(data.balances ?? []);
    setIsLoading(false);
  }

  async function loadSettlements() {
    const res = await fetch("/api/settlements");
    const data = await res.json();
    setSettlements(data.settlements ?? []);
  }

  async function loadAll() {
    await Promise.all([loadBalances(), loadSettlements()]);
  }

  // El balance se deriva de los gastos y los pagos que lo saldan, así que
  // basta con escuchar cambios en esas dos tablas para saber cuándo recargar.
  useRealtimeRefetch("Expense", `householdId=eq.${householdId}`, loadAll);
  useRealtimeRefetch("Settlement", `householdId=eq.${householdId}`, loadAll);

  useEffect(() => {
    // Carga inicial al montar (no estado derivado de props/estado existente).
    // loadAll se recrea cada render, así que listarla como dependencia
    // causaría un loop; solo queremos que esto corra una vez.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentUserBalance = balances.find((b) => b.userId === currentUserId)?.balance ?? 0;

  async function handleDeleteSettlement(id: string) {
    if (!confirm("¿Eliminar este registro de pago?")) return;
    await fetch(`/api/settlements/${id}`, { method: "DELETE" });
    await loadAll();
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Balance</h1>
        <p className="text-xs font-semibold text-ink-soft">{householdName}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-soft">Cargando…</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {balances.map((b, i) => (
            <li
              key={b.userId}
              className="flex items-center gap-3 rounded-2xl border border-rule bg-surface px-4 py-3.5"
            >
              <div
                className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: i % 2 === 0 ? "var(--color-accent)" : "var(--color-partner)" }}
              >
                {b.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-ink">
                  {b.name}
                  {b.userId === currentUserId ? " (tú)" : ""}
                </div>
                <div
                  className={`font-tabular text-xs font-semibold ${
                    b.balance > 0.005
                      ? "text-positive"
                      : b.balance < -0.005
                        ? "text-negative"
                        : "text-ink-soft"
                  }`}
                >
                  {describe(b.balance, b.name, currentUserId, b.userId)}
                </div>

                {/* Solo se muestra el botón cuando TÚ eres quien debe en general
                    — quien paga registra su propio pago; la persona a la que
                    le deben no puede "pagarse a sí misma" desde aquí. */}
                {b.userId !== currentUserId &&
                  currentUserBalance < -0.005 &&
                  (payingUserId === b.userId ? (
                    <SettlementForm
                      toUserId={b.userId}
                      maxAmount={-currentUserBalance}
                      onCancel={() => setPayingUserId(null)}
                      onSaved={async () => {
                        setPayingUserId(null);
                        await loadAll();
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPayingUserId(b.userId)}
                      className="mt-1.5 text-xs font-bold text-accent"
                    >
                      Registrar pago a {b.name}
                    </button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {settlements.length > 0 && (
        <div>
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft">
            Pagos registrados
          </h2>
          <ul className="flex flex-col gap-2">
            {settlements.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-rule bg-surface px-3 py-2 text-sm"
              >
                <span className="text-ink">
                  {s.fromUser.name} → {s.toUser.name}:{" "}
                  <span className="font-tabular font-semibold">{formatMoney(s.amount)}</span>
                  <span className="ml-2 text-xs text-ink-soft">
                    {new Date(s.date).toLocaleDateString()}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteSettlement(s.id)}
                  className="text-ink-soft hover:text-negative"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function SettlementForm({
  toUserId,
  maxAmount,
  onCancel,
  onSaved,
}: {
  toUserId: string;
  maxAmount: number;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [amount, setAmount] = useState(maxAmount > 0 ? maxAmount.toFixed(2) : "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const exceedsDebt = Number(amount) > maxAmount + 0.01;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (exceedsDebt) {
      setError(`No puedes registrar un pago mayor a lo que debes ($${maxAmount.toFixed(2)})`);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, amount: Number(amount) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo registrar el pago");
        return;
      }

      await onSaved();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
      <TextField
        type="number"
        step="0.01"
        min="0.01"
        max={maxAmount}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      {exceedsDebt && !error && (
        <p className="text-xs font-semibold text-negative">
          No puedes pagar más de lo que debes (${maxAmount.toFixed(2)})
        </p>
      )}
      {error && <p className="text-xs font-semibold text-negative">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSaving || exceedsDebt} className="px-3 py-1.5 text-xs">
          {isSaving ? "Guardando…" : "Confirmar pago"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
