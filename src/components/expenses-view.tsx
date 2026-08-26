"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRealtimeRefetch } from "@/lib/use-realtime-refetch";

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Gastos</h1>
        <p className="text-sm text-zinc-600">{householdName}</p>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <input
          className="rounded border px-3 py-2"
          type="text"
          placeholder="Descripción (ej. Supermercado)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border px-3 py-2"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button type="submit" className="rounded bg-black px-4 py-2 text-white">
            Registrar
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay gastos registrados.</p>
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
      <li className="rounded border px-4 py-3">
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          <input
            className="rounded border px-3 py-2"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
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
              {isSaving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded border px-3 py-1.5 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded border px-4 py-3">
      <div className="flex items-baseline justify-between">
        <p className="font-medium">{expense.description}</p>
        <p className="font-medium">{formatMoney(expense.amount)}</p>
      </div>
      <p className="text-xs text-zinc-500">
        Pagado por {expense.paidBy.name} ·{" "}
        {new Date(expense.date).toLocaleDateString()}
      </p>
      <ul className="mt-2 flex flex-col gap-0.5 text-xs text-zinc-600">
        {expense.splits.map((split) => (
          <li key={split.userId}>
            {split.user.name}: {formatMoney(split.shareAmount)}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-3 text-xs">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-zinc-500 hover:text-black"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="text-zinc-500 hover:text-red-600"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
