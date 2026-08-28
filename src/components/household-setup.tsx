"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

type Mode = "create" | "join";

export function HouseholdSetup() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [targetMemberCount, setTargetMemberCount] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const endpoint = mode === "create" ? "/api/households" : "/api/households/join";
      const body =
        mode === "create"
          ? {
              name,
              ...(targetMemberCount ? { targetMemberCount: Number(targetMemberCount) } : {}),
            }
          : { inviteCode };

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
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Configura tu hogar</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Crea un hogar nuevo o únete a uno existente con un código de invitación.
        </p>
      </div>

      <div className="flex gap-2 rounded-xl bg-accent-soft p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("create")}
          className={`flex-1 rounded-lg px-3 py-2 font-bold transition-colors ${
            mode === "create" ? "bg-accent text-accent-ink" : "text-ink-soft"
          }`}
        >
          Crear hogar
        </button>
        <button
          type="button"
          onClick={() => setMode("join")}
          className={`flex-1 rounded-lg px-3 py-2 font-bold transition-colors ${
            mode === "join" ? "bg-accent text-accent-ink" : "text-ink-soft"
          }`}
        >
          Unirme con código
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "create" ? (
          <>
            <TextField
              label="Nombre del hogar"
              type="text"
              placeholder="Nuestro depa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField
              label="¿Cuántas personas van a vivir aquí? (opcional)"
              type="number"
              min="1"
              max="20"
              placeholder="ej. 2"
              value={targetMemberCount}
              onChange={(e) => setTargetMemberCount(e.target.value)}
            />
          </>
        ) : (
          <TextField
            label="Código de invitación"
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
        )}

        {error && <p className="text-sm font-semibold text-negative">{error}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "create"
              ? "Creando…"
              : "Uniéndote…"
            : mode === "create"
              ? "Crear hogar"
              : "Unirme"}
        </Button>
      </form>
    </main>
  );
}
