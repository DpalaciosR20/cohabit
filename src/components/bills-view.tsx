"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRealtimeRefetch } from "@/lib/use-realtime-refetch";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

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
  paid: "bg-[color-mix(in_srgb,var(--color-positive)_14%,transparent)] text-positive",
  overdue: "bg-[color-mix(in_srgb,var(--color-negative)_14%,transparent)] text-negative",
  "due-soon": "bg-accent-soft text-accent",
  upcoming: "bg-rule text-ink-soft",
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
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Pagos recurrentes</h1>
        <p className="text-xs font-semibold text-ink-soft">{householdName}</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-2xl border border-rule bg-surface p-4">
        <TextField
          type="text"
          placeholder="Nombre (ej. Internet)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
          <input
            type="checkbox"
            checked={isInstallment}
            onChange={(e) => setIsInstallment(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Es una compra a meses
        </label>
        {isInstallment && (
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
            <input
              type="checkbox"
              checked={useTotalAmount}
              onChange={(e) => setUseTotalAmount(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            Conozco el monto total (calcular la mensualidad)
          </label>
        )}
        <div className="flex gap-2">
          {useTotalAmount ? (
            <>
              <TextField
                className="flex-1"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Monto total"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
              <TextField
                className="w-32"
                type="number"
                min="1"
                placeholder="Núm. de mensualidades"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                required
              />
            </>
          ) : (
            <TextField
              className="flex-1"
              type="number"
              step="0.01"
              min="0.01"
              placeholder={isInstallment ? "Monto mensual" : "Monto estimado"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          )}
          <TextField
            className="w-24"
            type="number"
            min="1"
            max="31"
            placeholder="Día"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            required
          />
        </div>
        {useTotalAmount && computedMonthlyAmount !== null && (
          <p className="text-xs text-ink-soft">
            Mensualidad calculada:{" "}
            <strong className="font-tabular text-ink">${computedMonthlyAmount.toFixed(2)}</strong>
          </p>
        )}
        {isInstallment && !useTotalAmount && (
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
            Total de mensualidades
            <TextField
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
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
            Mensualidades restantes
            <TextField
              type="number"
              min="1"
              placeholder="ej. si ya pagaste algunas, cuántas te faltan"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
              required
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
          Primer mes de cobro
          <TextField
            type="month"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </label>
        <Button type="submit">Agregar</Button>
      </form>

      {error && <p className="text-sm font-semibold text-negative">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-ink-soft">Cargando…</p>
      ) : bills.length === 0 ? (
        <p className="text-sm text-ink-soft">No hay pagos recurrentes registrados.</p>
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
    <li className="rounded-2xl border border-rule bg-surface px-4 py-3.5">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold text-ink">{bill.name}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[bill.status]}`}
        >
          {STATUS_LABEL[bill.status]}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-ink-soft">
        <span className="font-tabular">{formatMoney(bill.amount)}</span> · vence{" "}
        {formatDate(bill.dueDate)}
        {bill.installmentsRemaining !== null &&
          (bill.totalInstallments
            ? ` · ${bill.installmentsRemaining}/${bill.totalInstallments} mensualidades restantes`
            : ` · ${bill.installmentsRemaining} mensualidad(es) restante(s)`)}
      </p>

      {bill.installmentsRemaining !== null && bill.totalInstallments && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-rule">
          <div
            className="h-1.5 rounded-full bg-accent"
            style={{
              width: `${((bill.totalInstallments - bill.installmentsRemaining) / bill.totalInstallments) * 100}%`,
            }}
          />
        </div>
      )}

      {isPaying ? (
        <form onSubmit={handlePay} className="mt-2 flex flex-col gap-2">
          <TextField
            type="number"
            step="0.01"
            min="0.01"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            required
          />
          {error && <p className="text-sm font-semibold text-negative">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving} className="px-3 py-1.5 text-xs">
              {isSaving ? "Guardando…" : "Confirmar pago"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPaying(false)}
              className="px-3 py-1.5 text-xs"
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-2 flex gap-3 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsPaying(true)}
            className="text-ink-soft hover:text-ink"
          >
            Marcar como pagado
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-ink-soft hover:text-negative"
          >
            Eliminar
          </button>
        </div>
      )}
    </li>
  );
}
