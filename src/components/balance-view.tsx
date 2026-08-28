"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRealtimeRefetch } from "@/lib/use-realtime-refetch";

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Balance</h1>
        <p className="text-sm text-zinc-600">{householdName}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {balances.map((b) => (
            <li key={b.userId} className="rounded border px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{b.name}</span>
                <span
                  className={
                    b.balance > 0.005
                      ? "text-green-700"
                      : b.balance < -0.005
                        ? "text-red-600"
                        : "text-zinc-500"
                  }
                >
                  {describe(b.balance, b.name, currentUserId, b.userId)}
                </span>
              </div>

              {/* Solo se muestra el botón cuando TÚ eres quien debe en general
                  — quien paga registra su propio pago; la persona a la que
                  le deben no puede "pagarse a sí misma" desde aquí. */}
              {b.userId !== currentUserId &&
                currentUserBalance < -0.005 &&
                (payingUserId === b.userId ? (
                  <SettlementForm
                    toUserId={b.userId}
                    suggestedAmount={-currentUserBalance}
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
                    className="mt-2 text-xs text-zinc-600 hover:text-black"
                  >
                    Registrar pago a {b.name}
                  </button>
                ))}
            </li>
          ))}
        </ul>
      )}

      {settlements.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-zinc-600">Pagos registrados</h2>
          <ul className="flex flex-col gap-2">
            {settlements.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <span>
                  {s.fromUser.name} → {s.toUser.name}: {formatMoney(s.amount)}
                  <span className="ml-2 text-xs text-zinc-500">
                    {new Date(s.date).toLocaleDateString()}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteSettlement(s.id)}
                  className="text-zinc-400 hover:text-red-600"
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
  suggestedAmount,
  onCancel,
  onSaved,
}: {
  toUserId: string;
  suggestedAmount: number;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [amount, setAmount] = useState(
    suggestedAmount > 0 ? suggestedAmount.toFixed(2) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
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
      <input
        className="rounded border px-3 py-2"
        type="number"
        step="0.01"
        min="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {isSaving ? "Guardando…" : "Confirmar pago"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border px-3 py-1.5 text-sm">
          Cancelar
        </button>
      </div>
    </form>
  );
}
