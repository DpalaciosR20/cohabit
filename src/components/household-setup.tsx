"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Mode = "create" | "join";

export function HouseholdSetup() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = mode === "create" ? "/api/households" : "/api/households/join";
      const body = mode === "create" ? { name } : { inviteCode };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Algo salió mal");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Configura tu hogar</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Crea un hogar nuevo o únete a uno existente con un código de invitación.
        </p>
      </div>

      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 rounded border px-3 py-2 ${
            mode === "create" ? "border-black bg-black text-white" : ""
          }`}
        >
          Crear hogar
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`flex-1 rounded border px-3 py-2 ${
            mode === "join" ? "border-black bg-black text-white" : ""
          }`}
        >
          Unirme con código
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "create" ? (
          <label className="flex flex-col gap-1 text-sm">
            Nombre del hogar
            <input
              className="rounded border px-3 py-2"
              type="text"
              placeholder="Nuestro depa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            Código de invitación
            <input
              className="rounded border px-3 py-2"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
          </label>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting
            ? mode === "create"
              ? "Creando…"
              : "Uniéndote…"
            : mode === "create"
              ? "Crear hogar"
              : "Unirme"}
        </button>
      </form>
    </main>
  );
}
