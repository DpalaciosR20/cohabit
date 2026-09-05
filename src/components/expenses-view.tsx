"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRealtimeRefetch } from "@/lib/use-realtime-refetch";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { MoneyInput } from "@/components/ui/money-input";
import { CategorySelect } from "@/components/ui/category-select";
import { formatCurrency } from "@/lib/format-currency";
import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

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
  const [monthFilter, setMonthFilter] = useState("");
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

  const expensesThisMonth = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [expenses]);

  const monthOptions = useMemo(() => {
    const keys = new Set(
      expenses.map((e) => {
        const d = new Date(e.date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      })
    );
    return Array.from(keys).sort().reverse();
  }, [expenses]);

  const visibleExpenses = expenses.filter((e) => {
    if (categoryFilter && e.category?.name !== categoryFilter) return false;
    if (monthFilter) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key !== monthFilter) return false;
    }
    return true;
  });

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

      <SpendingSummary expensesThisMonth={expensesThisMonth} />

      <HouseholdBudgets refreshKey={expenses.length} />

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

      {(categoriesInUse.length > 0 || monthOptions.length > 1) && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-ink-soft">Filtrar:</span>
          <div className="flex flex-1 gap-2">
            {monthOptions.length > 1 && (
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="flex-1 rounded-xl border border-rule bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              >
                <option value="">Todos los meses</option>
                {monthOptions.map((key) => (
                  <option key={key} value={key}>
                    {formatMonthLabel(key)}
                  </option>
                ))}
              </select>
            )}
            {categoriesInUse.length > 0 && (
              <CategorySelect
                className="flex-1"
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-soft">Cargando…</p>
      ) : visibleExpenses.length === 0 ? (
        <p className="text-sm text-ink-soft">
          {categoryFilter || monthFilter
            ? "No hay gastos que coincidan con el filtro."
            : "Aún no hay gastos registrados."}
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

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1)
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const SUMMARY_BAR_COLORS = [
  "var(--color-accent)",
  "var(--color-partner)",
  "var(--color-positive)",
  "#C79A2E",
  "#B23B7A",
  "#0F9AA6",
  "#4B5563",
  "#E0562B",
  "var(--color-ink-soft)",
];

function SpendingSummary({ expensesThisMonth }: { expensesThisMonth: Expense[] }) {
  const total = expensesThisMonth.reduce((sum, e) => sum + Number(e.amount), 0);

  const categoryTotals = new Map<string, number>();
  for (const e of expensesThisMonth) {
    const name = e.category?.name ?? "Sin categoría";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + Number(e.amount));
  }
  const byCategory = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  if (total === 0) return null;

  return (
    <div className="rounded-2xl border border-rule bg-surface p-4">
      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
        Resumen del mes
      </span>
      <div className="mt-1.5 font-tabular text-2xl font-semibold leading-none tracking-tight text-ink">
        {formatCurrency(total)}
      </div>

      <div className="mt-3.5 flex h-2.5 overflow-hidden rounded-full bg-rule">
        {byCategory.map((c, i) => (
          <div
            key={c.category}
            style={{
              width: `${(c.amount / total) * 100}%`,
              background: SUMMARY_BAR_COLORS[i % SUMMARY_BAR_COLORS.length],
            }}
          />
        ))}
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {byCategory.map((c, i) => (
          <li key={c.category} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 flex-none rounded-full"
              style={{ background: SUMMARY_BAR_COLORS[i % SUMMARY_BAR_COLORS.length] }}
            />
            <span className="flex-1 font-semibold text-ink-soft">{c.category}</span>
            <span className="font-tabular font-semibold text-ink">{formatCurrency(c.amount)}</span>
            <span className="w-10 text-right text-[11px] text-ink-soft">
              {((c.amount / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type HouseholdBudget = {
  category: string;
  monthlyLimit: number;
  spentThisMonth: number;
};

function budgetBarColor(pct: number) {
  if (pct >= 100) return "var(--color-negative)";
  if (pct >= 80) return "var(--color-accent)";
  return "var(--color-positive)";
}

function HouseholdBudgets({ refreshKey }: { refreshKey: number }) {
  const [budgets, setBudgets] = useState<HouseholdBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function loadBudgets() {
    const res = await fetch("/api/budgets");
    const data = await res.json();
    setBudgets(data.budgets ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    // Carga inicial y cada vez que cambia la cantidad de gastos (para
    // reflejar cuánto se lleva gastado del presupuesto del mes en curso).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBudgets();
  }, [refreshKey]);

  const categoriesWithoutBudget = EXPENSE_CATEGORIES.filter(
    (c) => !budgets.some((b) => b.category === c)
  );

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!newCategory) return;
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/budgets/${newCategory}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyLimit: Number(newLimit) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo guardar el presupuesto");
        return;
      }

      setNewCategory("");
      setNewLimit("");
      setIsAdding(false);
      await loadBudgets();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove(category: string) {
    if (!confirm(`¿Quitar el presupuesto de "${category}"?`)) return;
    await fetch(`/api/budgets/${category}`, { method: "DELETE" });
    await loadBudgets();
  }

  if (isLoading) return null;

  return (
    <div className="rounded-2xl border border-rule bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          Presupuestos del mes
        </span>
        {!isAdding && categoriesWithoutBudget.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setNewCategory(categoriesWithoutBudget[0]);
              setIsAdding(true);
            }}
            className="text-xs font-semibold text-accent"
          >
            Agregar
          </button>
        )}
      </div>

      {budgets.length === 0 && !isAdding && (
        <p className="mt-2 text-xs text-ink-soft">
          Aún no hay presupuestos definidos por categoría.
        </p>
      )}

      <ul className="mt-2 flex flex-col gap-3">
        {budgets.map((b) => {
          const pct = Math.min((b.spentThisMonth / b.monthlyLimit) * 100, 100);
          return (
            <li key={b.category} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-semibold text-ink">{b.category}</span>
                <span className="font-tabular text-ink-soft">
                  {formatCurrency(b.spentThisMonth)} / {formatCurrency(b.monthlyLimit)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule">
                <div
                  className="h-1.5 rounded-full"
                  style={{ width: `${pct}%`, background: budgetBarColor(pct) }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(b.category)}
                className="self-start text-[11px] font-semibold text-ink-soft hover:text-negative"
              >
                Quitar
              </button>
            </li>
          );
        })}
      </ul>

      {isAdding && (
        <form onSubmit={handleAdd} className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 rounded-xl border border-rule bg-surface px-3 py-2.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            >
              {categoriesWithoutBudget.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <MoneyInput className="w-28" value={newLimit} onChange={setNewLimit} />
          </div>
          {error && <p className="text-xs font-semibold text-negative">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving || !newCategory} className="px-3 py-1.5 text-xs">
              {isSaving ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs"
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
