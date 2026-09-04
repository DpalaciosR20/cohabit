"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { MoneyInput } from "@/components/ui/money-input";
import { CategorySelect } from "@/components/ui/category-select";
import { formatCurrency } from "@/lib/format-currency";

type PersonalExpense = {
  id: string;
  description: string;
  amount: string;
  category: string | null;
  date: string;
};

function isSameMonth(dateStr: string, reference: Date) {
  const d = new Date(dateStr);
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth();
}

export function PersonalExpensesView({ monthlyIncome }: { monthlyIncome: number | null }) {
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadExpenses() {
    const res = await fetch("/api/personal-expenses");
    const data = await res.json();
    setExpenses(data.expenses ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    // Carga inicial al montar (no estado derivado de props/estado existente).
    // Sin Realtime: es un dato de un solo usuario, nadie más lo edita.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadExpenses();
  }, []);

  const now = useMemo(() => new Date(), []);
  const expensesThisMonth = useMemo(
    () => expenses.filter((e) => isSameMonth(e.date, now)),
    [expenses, now]
  );
  const totalSpentThisMonth = expensesThisMonth.reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = (monthlyIncome ?? 0) - totalSpentThisMonth;

  const categoriesInUse = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.category).filter((c): c is string => !!c))),
    [expenses]
  );
  const visibleExpenses = categoryFilter
    ? expenses.filter((e) => e.category === categoryFilter)
    : expenses;

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const res = await fetch("/api/personal-expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: Number(amount), category: category || null }),
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
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Gastos personales</h1>
        <p className="text-xs font-semibold text-ink-soft">
          Privado — nadie más ve esta información
        </p>
      </div>

      <BalanceCard
        monthlyIncome={monthlyIncome}
        totalSpentThisMonth={totalSpentThisMonth}
        balance={balance}
        onIncomeChanged={loadExpenses}
      />

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <TextField
          type="text"
          placeholder="Descripción (ej. Gimnasio)"
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
          <CategorySelect className="flex-1" value={categoryFilter} onChange={setCategoryFilter} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-soft">Cargando…</p>
      ) : visibleExpenses.length === 0 ? (
        <p className="text-sm text-ink-soft">
          {categoryFilter ? "No hay gastos en esta categoría." : "Aún no hay gastos personales registrados."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleExpenses.map((expense) => (
            <PersonalExpenseRow key={expense.id} expense={expense} onChanged={loadExpenses} />
          ))}
        </ul>
      )}
    </main>
  );
}

function BalanceCard({
  monthlyIncome,
  totalSpentThisMonth,
  balance,
  onIncomeChanged,
}: {
  monthlyIncome: number | null;
  totalSpentThisMonth: number;
  balance: number;
  onIncomeChanged: () => void;
}) {
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(
    monthlyIncome !== null ? monthlyIncome.toFixed(2) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSaveIncome(event: FormEvent) {
    event.preventDefault();
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

      setIsEditingIncome(false);
      onIncomeChanged();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-rule bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
          Balance del mes
        </span>
        {!isEditingIncome && (
          <button
            type="button"
            onClick={() => setIsEditingIncome(true)}
            className="text-xs font-semibold text-accent"
          >
            {monthlyIncome === null ? "Agregar ingreso" : "Editar ingreso"}
          </button>
        )}
      </div>

      {isEditingIncome ? (
        <form onSubmit={handleSaveIncome} className="mt-2 flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
            Tu ingreso mensual
            <MoneyInput value={incomeInput} onChange={setIncomeInput} />
          </label>
          {error && <p className="text-xs font-semibold text-negative">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving} className="px-3 py-1.5 text-xs">
              {isSaving ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditingIncome(false)}
              className="px-3 py-1.5 text-xs"
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="mt-1.5 font-tabular text-[32px] font-semibold leading-none tracking-tight text-ink">
            {formatCurrency(balance)}
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] font-semibold text-ink-soft">
            <span>Ingresos: {formatCurrency(monthlyIncome ?? 0)}</span>
            <span>Egresos: {formatCurrency(totalSpentThisMonth)}</span>
          </div>
          {monthlyIncome === null && (
            <p className="mt-1.5 text-[11px] text-ink-soft">
              Agrega tu ingreso mensual para ver el balance completo.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PersonalExpenseRow({
  expense,
  onChanged,
}: {
  expense: PersonalExpense;
  onChanged: () => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(expense.amount);
  const [category, setCategory] = useState(expense.category ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/personal-expenses/${expense.id}`, {
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
    await fetch(`/api/personal-expenses/${expense.id}`, { method: "DELETE" });
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
          <span>{new Date(expense.date).toLocaleDateString()}</span>
          {expense.category && (
            <span className="rounded-full bg-rule px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">
              {expense.category}
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2.5 flex gap-3 border-t border-rule pt-2.5 text-xs font-semibold">
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
      )}
    </li>
  );
}
