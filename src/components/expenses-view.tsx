"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRealtimeRefetch } from "@/lib/use-realtime-refetch";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { MoneyInput } from "@/components/ui/money-input";
import { CategorySelect } from "@/components/ui/category-select";
import { formatCurrency } from "@/lib/format-currency";

type Expense = {
  id: string;
  description: string;
  amount: string;
  date: string;
  paidBy: { id: string; name: string };
  splits: { userId: string; shareAmount: string; user: { id: string; name: string } }[];
  bill: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
};

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
  const [category, setCategory] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
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

  const categoriesInUse = useMemo(
    () =>
      Array.from(
        new Set(expenses.map((e) => e.category?.name).filter((name): name is string => !!name))
      ),
    [expenses]
  );

  const visibleExpenses = categoryFilter
    ? expenses.filter((e) => e.category?.name === categoryFilter)
    : expenses;

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        amount: Number(amount),
        category: category || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo registrar el gasto");
      return;
    }

    setDescription("");
    setAmount("");
    setCategory("");
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
          <MoneyInput className="flex-1" value={amount} onChange={setAmount} />
          <Button type="submit">Registrar</Button>
        </div>
        <CategorySelect value={category} onChange={setCategory} />
      </form>

      {error && <p className="text-sm font-semibold text-negative">{error}</p>}

      {categoriesInUse.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-soft">Filtrar:</span>
          <CategorySelect
            className="flex-1"
            value={categoryFilter}
            onChange={setCategoryFilter}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-soft">Cargando…</p>
      ) : visibleExpenses.length === 0 ? (
        <p className="text-sm text-ink-soft">
          {categoryFilter ? "No hay gastos en esta categoría." : "Aún no hay gastos registrados."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleExpenses.map((expense) => (
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount);
  const [category, setCategory] = useState(expense.category?.name ?? "");
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
        body: JSON.stringify({
          description,
          amount: Number(amount),
          category: category || null,
        }),
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
          <MoneyInput value={amount} onChange={setAmount} />
          <CategorySelect value={category} onChange={setCategory} />
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
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full flex-col gap-1 text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-bold text-ink">{expense.description}</p>
          <p className="font-tabular text-sm font-bold text-ink">{formatCurrency(expense.amount)}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span>
            Pagado por {expense.paidBy.name} · {new Date(expense.date).toLocaleDateString()}
          </span>
          {expense.category && (
            <span className="rounded-full bg-rule px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">
              {expense.category.name}
            </span>
          )}
          {expense.bill && (
            <span className="flex items-center gap-0.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-accent">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 2.1l4 4-4 4" />
                <path d="M3 12.7V12a9 9 0 0 1 15-6.7l3 2.8" />
                <path d="M7 21.9l-4-4 4-4" />
                <path d="M21 11.3V12a9 9 0 0 1-15 6.7l-3-2.8" />
              </svg>
              {expense.bill.name}
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2.5 flex flex-col gap-2.5 border-t border-rule pt-2.5">
          {expense.bill && (
            <Link
              href="/bills"
              className="text-xs font-semibold text-accent hover:underline"
            >
              Ver pago recurrente: {expense.bill.name} →
            </Link>
          )}
          <ul className="flex flex-col gap-0.5 text-xs text-ink-soft">
            {expense.splits.map((split) => (
              <li key={split.userId} className="font-tabular">
                {split.user.name}: {formatCurrency(split.shareAmount)}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 text-xs font-semibold">
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
        </div>
      )}
    </li>
  );
}
