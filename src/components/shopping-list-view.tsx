"use client";

import { useEffect, useState, type FormEvent } from "react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadItems() {
    const res = await fetch("/api/shopping-items");
    const data = await res.json();
    setItems(data.items ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    // Carga inicial al montar (no estado derivado de props/estado existente),
    // por eso es una excepción legítima a esta regla.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems();
  }, []);

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Lista de compras</h1>
        <p className="text-sm text-zinc-600">{householdName}</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          type="text"
          placeholder="Agregar item…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Agregar
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-zinc-500">La lista está vacía.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded border px-3 py-2"
            >
              <input
                type="checkbox"
                checked={item.isPurchased}
                onChange={() => togglePurchased(item)}
              />
              <div className="flex-1">
                <p
                  className={
                    item.isPurchased ? "text-zinc-400 line-through" : ""
                  }
                >
                  {item.name}
                  {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  {item.isPurchased && item.purchasedBy
                    ? `Comprado por ${item.purchasedBy.name}`
                    : `Agregado por ${item.addedBy.name}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Eliminar ${item.name}`}
                className="text-sm text-zinc-400 hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
