"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { MoneyInput } from "@/components/ui/money-input";
import { CategorySelect } from "@/components/ui/category-select";

// Formulario de "agregar gasto de hogar" extraído de ExpensesView para poder
// abrirlo como hoja bajo demanda desde el FAB de Inicio y desde el propio
// tab Finanzas (Gastos), sin duplicar la llamada a la API en dos lugares.
export function AddExpenseSheet({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
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

      onAdded();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <h2 className="text-[15px] font-bold text-ink">Agregar gasto</h2>
      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <TextField
          type="text"
          placeholder="Descripción (ej. Supermercado)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          autoFocus
        />
        <MoneyInput value={amount} onChange={setAmount} />
        <CategorySelect value={category} onChange={setCategory} />
        {error && <p className="text-sm font-semibold text-negative">{error}</p>}
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? "Guardando…" : "Registrar"}
        </Button>
      </form>
    </Sheet>
  );
}
