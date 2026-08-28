"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRealtimeRefetch } from "@/lib/use-realtime-refetch";

type Bill = {
  id: string;
  name: string;
  amount: string;
  dueDay: number;
  installmentsRemaining: number | null;
  totalInstallments: number | null;
  category: { id: string; name: string } | null;
  dueDate: string;
  status: "paid" | "overdue" | "due-soon" | "upcoming";
};

const STATUS_LABEL: Record<Bill["status"], string> = {
  paid: "Al día",
  overdue: "Vencido",
  "due-soon": "Vence pronto",
  upcoming: "Próximo",
};

const STATUS_STYLE: Record<Bill["status"], string> = {
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  "due-soon": "bg-amber-100 text-amber-800",
  upcoming: "bg-zinc-100 text-zinc-600",
};

function formatMoney(value: string) {
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function BillsView({
  householdName,
  householdId,
}: {
  householdName: string;
  householdId: string;
}) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState("");
  const [startsAt, setStartsAt] = useState(currentMonthValue());
  const [useTotalAmount, setUseTotalAmount] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [error, setError] = useState<string | null>(null);

  const computedMonthlyAmount =
    useTotalAmount && Number(totalAmount) > 0 && Number(totalInstallments) > 0
      ? Number(totalAmount) / Number(totalInstallments)
      : null;
  const effectiveAmount = useTotalAmount ? computedMonthlyAmount : Number(amount);

  async function loadBills() {
    const res = await fetch("/api/bills");
    const data = await res.json();
    setBills(data.bills ?? []);
    setIsLoading(false);
  }

  useRealtimeRefetch("Bill", `householdId=eq.${householdId}`, loadBills);
  // Un pago crea un Expense — cuando eso pasa, el estado del Bill (¿ya se
  // pagó este mes?) también cambió, así que hay que recargar.
  useRealtimeRefetch("Expense", `householdId=eq.${householdId}`, loadBills);

  useEffect(() => {
    // Carga inicial al montar (no estado derivado de props/estado existente).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBills();
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!effectiveAmount || effectiveAmount <= 0) {
      setError("El monto mensual debe ser mayor a cero");
      return;
    }

    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount: effectiveAmount,
        dueDay: Number(dueDay),
        installmentsRemaining: isInstallment ? Number(installments) : null,
        totalInstallments: isInstallment ? Number(totalInstallments) : null,
        startsAt,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo crear el pago recurrente");
      return;
    }

    setName("");
    setAmount("");
    setDueDay("");
    setIsInstallment(false);
    setInstallments("");
    setStartsAt(currentMonthValue());
    setUseTotalAmount(false);
    setTotalAmount("");
    setTotalInstallments("");
    await loadBills();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Pagos recurrentes</h1>
        <p className="text-sm text-zinc-600">{householdName}</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <input
          className="rounded border px-3 py-2"
          type="text"
          placeholder="Nombre (ej. Internet)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={isInstallment}
            onChange={(e) => setIsInstallment(e.target.checked)}
          />
          Es una compra a meses
        </label>
        {isInstallment && (
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={useTotalAmount}
              onChange={(e) => setUseTotalAmount(e.target.checked)}
            />
            Conozco el monto total (calcular la mensualidad)
          </label>
        )}
        <div className="flex gap-2">
          {useTotalAmount ? (
            <>
              <input
                className="flex-1 rounded border px-3 py-2"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Monto total"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
              <input
                className="w-32 rounded border px-3 py-2"
                type="number"
                min="1"
                placeholder="Núm. de mensualidades"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                required
              />
            </>
          ) : (
            <input
              className="flex-1 rounded border px-3 py-2"
              type="number"
              step="0.01"
              min="0.01"
              placeholder={isInstallment ? "Monto mensual" : "Monto estimado"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          )}
          <input
            className="w-28 rounded border px-3 py-2"
            type="number"
            min="1"
            max="31"
            placeholder="Día vence"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            required
          />
        </div>
        {useTotalAmount && computedMonthlyAmount !== null && (
          <p className="text-xs text-zinc-500">
            Mensualidad calculada: <strong>${computedMonthlyAmount.toFixed(2)}</strong>
          </p>
        )}
        {isInstallment && !useTotalAmount && (
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Total de mensualidades
            <input
              className="rounded border px-3 py-2 text-zinc-900"
              type="number"
              min="1"
              placeholder="ej. 12"
              value={totalInstallments}
              onChange={(e) => setTotalInstallments(e.target.value)}
              required
            />
          </label>
        )}
        {isInstallment && (
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Mensualidades restantes
            <input
              className="rounded border px-3 py-2 text-zinc-900"
              type="number"
              min="1"
              placeholder="ej. si ya pagaste algunas, cuántas te faltan"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              required
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Primer mes de cobro
          <input
            className="rounded border px-3 py-2 text-zinc-900"
            type="month"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Agregar
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : bills.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay pagos recurrentes registrados.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {bills.map((bill) => (
            <BillRow key={bill.id} bill={bill} onChanged={loadBills} />
          ))}
        </ul>
      )}
    </main>
  );
}

function BillRow({ bill, onChanged }: { bill: Bill; onChanged: () => Promise<void> }) {
  const [isPaying, setIsPaying] = useState(false);
  const [payAmount, setPayAmount] = useState(bill.amount);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handlePay(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/bills/${bill.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payAmount) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo registrar el pago");
        return;
      }

      setIsPaying(false);
      await onChanged();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar "${bill.name}"?`)) return;
    const res = await fetch(`/api/bills/${bill.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "No se pudo eliminar");
      return;
    }
    await onChanged();
  }

  return (
    <li className="rounded border px-4 py-3">
      <div className="flex items-baseline justify-between">
        <p className="font-medium">{bill.name}</p>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[bill.status]}`}
        >
          {STATUS_LABEL[bill.status]}
        </span>
      </div>
      <p className="text-xs text-zinc-500">
        {formatMoney(bill.amount)} · vence {formatDate(bill.dueDate)}
        {bill.installmentsRemaining !== null &&
          (bill.totalInstallments
            ? ` · ${bill.installmentsRemaining}/${bill.totalInstallments} mensualidades restantes`
            : ` · ${bill.installmentsRemaining} mensualidad(es) restante(s)`)}
      </p>

      {bill.installmentsRemaining !== null && bill.totalInstallments && (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-1 rounded-full bg-black"
            style={{
              width: `${((bill.totalInstallments - bill.installmentsRemaining) / bill.totalInstallments) * 100}%`,
            }}
          />
        </div>
      )}

      {isPaying ? (
        <form onSubmit={handlePay} className="mt-2 flex flex-col gap-2">
          <input
            className="rounded border px-3 py-2"
            type="number"
            step="0.01"
            min="0.01"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
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
            <button
              type="button"
              onClick={() => setIsPaying(false)}
              className="rounded border px-3 py-1.5 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-2 flex gap-3 text-xs">
          <button
            type="button"
            onClick={() => setIsPaying(true)}
            className="text-zinc-600 hover:text-black"
          >
            Marcar como pagado
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-zinc-400 hover:text-red-600"
          >
            Eliminar
          </button>
        </div>
      )}
    </li>
  );
}
