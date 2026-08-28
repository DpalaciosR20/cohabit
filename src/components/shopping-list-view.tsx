"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRealtimeRefetch } from "@/lib/use-realtime-refetch";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

type ShoppingItem = {
  id: string;
  name: string;
  quantity: number;
  isPurchased: boolean;
  addedBy: { id: string; name: string };
  purchasedBy: { id: string; name: string } | null;
};

export function ShoppingListView({ householdName }: { householdName: string }) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [listId, setListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadItems() {
    const res = await fetch("/api/shopping-items");
    const data = await res.json();
    setItems(data.items ?? []);
    setListId(data.listId ?? null);
    setIsLoading(false);
  }

  useEffect(() => {
    // Carga inicial al montar (no estado derivado de props/estado existente),
    // por eso es una excepción legítima a esta regla.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems();
  }, []);

  // Cuando conocemos el listId, escuchamos cambios en tiempo real de esa lista
  // (ej. tu pareja agrega o tacha un item) y recargamos automáticamente.
  useRealtimeRefetch(
    "ShoppingItem",
    listId ? `listId=eq.${listId}` : null,
    loadItems
  );

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const res = await fetch("/api/shopping-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantity: 1 }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo agregar el item");
      return;
    }

    setName("");
    await loadItems();
  }

  async function togglePurchased(item: ShoppingItem) {
    await fetch(`/api/shopping-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPurchased: !item.isPurchased }),
    });
    await loadItems();
  }

  async function removeItem(id: string) {
    await fetch(`/api/shopping-items/${id}`, { method: "DELETE" });
    await loadItems();
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-ink">Lista de compras</h1>
        <p className="text-xs font-semibold text-ink-soft">{householdName}</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <TextField
          className="flex-1"
          type="text"
          placeholder="Agregar item…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Button type="submit">Agregar</Button>
      </form>

      {error && <p className="text-sm font-semibold text-negative">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-ink-soft">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-soft">La lista está vacía.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <ShoppingListItemRow
              key={item.id}
              item={item}
              onTogglePurchased={() => togglePurchased(item)}
              onRemove={() => removeItem(item.id)}
              onChanged={loadItems}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function ShoppingListItemRow({
  item,
  onTogglePurchased,
  onRemove,
  onChanged,
}: {
  item: ShoppingItem;
  onTogglePurchased: () => void;
  onRemove: () => void;
  onChanged: () => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/shopping-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity: Number(quantity) }),
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

  if (isEditing) {
    return (
      <li className="rounded-2xl border border-rule bg-surface px-4 py-3">
        <form onSubmit={handleSave} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <TextField
              className="flex-1"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              className="w-20"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
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
    <li className="flex items-center gap-3 rounded-2xl border border-rule bg-surface px-4 py-3">
      <input
        type="checkbox"
        checked={item.isPurchased}
        onChange={onTogglePurchased}
        className="h-4 w-4 accent-accent"
      />
      <div className="flex-1">
        <p className={`text-sm font-semibold ${item.isPurchased ? "text-ink-soft line-through" : "text-ink"}`}>
          {item.name}
          {item.quantity > 1 ? ` ×${item.quantity}` : ""}
        </p>
        <p className="text-xs text-ink-soft">
          {item.isPurchased && item.purchasedBy
            ? `Comprado por ${item.purchasedBy.name}`
            : `Agregado por ${item.addedBy.name}`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        aria-label={`Editar ${item.name}`}
        className="text-xs font-semibold text-ink-soft hover:text-ink"
      >
        Editar
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Eliminar ${item.name}`}
        className="text-ink-soft hover:text-negative"
      >
        ✕
      </button>
    </li>
  );
}
