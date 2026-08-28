"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRealtimeRefetch } from "@/lib/use-realtime-refetch";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

type Expense = {
  id: string;
  description: string;
  amount: string;
  date: string;
  paidBy: { id: string; name: string };
  splits: { userId: string; shareAmount: string; user: { id: string; name: string } }[];
};

function formatMoney(value: string) {
  return `$${Number(value).toFixed(2)}`;
}

export function ExpensesView({
  householdName,
  householdId,
}: {
  householdName: string;
  householdId: string;
}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadExpenses() {
    const res = await fetch("/api/expenses");
    const data = await res.json();
    setExpenses(data.expenses ?? []);
    setIsLoading(false);
  }

  useRealtimeRefetch("Expense", `householdId=eq.${householdId}`, loadExpenses);

  useEffect(() => {
    // Carga inicial al montar (no estado derivado de props/estado existente).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExpenses();
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: Number(amount) }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo registrar el gasto");
      return;
    }

    setDescription("");
    setAmount("");
    await loadExpenses();
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Gastos</h1>
        <p className="text-xs font-semibold text-ink-soft">{householdName}</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <TextField
          type="text"
          placeholder="Descripción (ej. Supermercado)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <TextField
            className="flex-1"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Button type="submit">Registrar</Button>
        </div>
      </form>

      {error && <p className="text-sm font-semibold text-negative">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-ink-soft">Cargando…</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-ink-soft">Aún no hay gastos registrados.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {expenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} onChanged={loadExpenses} />
          ))}
        </ul>
      )}
    </main>
  );
}

function ExpenseRow({
  expense,
  onChanged,
}: {
  expense: Expense;
  onChanged: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount: Number(amount) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo guardar el cambio");
        return;
      }

      setIsEditing(false);
      await onChanged();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el gasto "${expense.description}"?`)) return;
    await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
    await onChanged();
  }

  if (isEditing) {
    return (
      <li className="rounded-2xl border border-rule bg-surface px-4 py-3">
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          <TextField
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <TextField
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {error && <p className="text-sm font-semibold text-negative">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving} className="px-3 py-1.5 text-xs">
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
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-rule bg-surface px-4 py-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold text-ink">{expense.description}</p>
        <p className="font-tabular text-sm font-bold text-ink">{formatMoney(expense.amount)}</p>
      </div>
      <p className="text-xs text-ink-soft">
        Pagado por {expense.paidBy.name} ·{" "}
        {new Date(expense.date).toLocaleDateString()}
      </p>
      <ul className="mt-2 flex flex-col gap-0.5 text-xs text-ink-soft">
        {expense.splits.map((split) => (
          <li key={split.userId} className="font-tabular">
            {split.user.name}: {formatMoney(split.shareAmount)}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-ink-soft hover:text-ink"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="text-ink-soft hover:text-negative"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
