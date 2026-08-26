"use client";

import { useEffect, useState } from "react";

type MemberBalance = { userId: string; name: string; balance: number };

function describe(balance: number, name: string, currentUserId: string, userId: string) {
  if (Math.abs(balance) < 0.005) {
    return userId === currentUserId ? "Estás a mano" : `${name} está a mano`;
  }
  if (userId === currentUserId) {
    return balance > 0
      ? `Te deben $${balance.toFixed(2)}`
      : `Debes $${Math.abs(balance).toFixed(2)}`;
  }
  return balance > 0
    ? `Le deben $${balance.toFixed(2)}`
    : `Debe $${Math.abs(balance).toFixed(2)}`;
}

export function BalanceView({
  householdName,
  currentUserId,
}: {
  householdName: string;
  currentUserId: string;
}) {
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadBalances() {
    const res = await fetch("/api/balance");
    const data = await res.json();
    setBalances(data.balances ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    // Carga inicial al montar (no estado derivado de props/estado existente).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBalances();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Balance</h1>
        <p className="text-sm text-zinc-600">{householdName}</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {balances.map((b) => (
            <li
              key={b.userId}
              className="flex items-center justify-between rounded border px-4 py-3"
            >
              <span className="font-medium">{b.name}</span>
              <span
                className={
                  b.balance > 0.005
                    ? "text-green-700"
                    : b.balance < -0.005
                      ? "text-red-600"
                      : "text-zinc-500"
                }
              >
                {describe(b.balance, b.name, currentUserId, b.userId)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
