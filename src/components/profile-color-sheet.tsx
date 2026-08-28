"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  PROFILE_COLORS,
  PROFILE_COLOR_HEX,
  PROFILE_COLOR_LABEL,
  type ProfileColor,
} from "@/lib/profile-colors";

export function ProfileColorSheet({
  initialColor,
  onClose,
}: {
  initialColor: ProfileColor;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<ProfileColor>(initialColor);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color: selected }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "No se pudo guardar el color");
        return;
      }

      router.refresh();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/40"
      onClick={onClose}
    >
      <div
        className="flex flex-col gap-4 rounded-t-[20px] border-t border-rule bg-surface px-5 pb-7 pt-2.5 shadow-[0_-8px_30px_-10px_rgba(20,23,28,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1 w-9 rounded-full bg-rule" />

        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold text-white"
            style={{ background: PROFILE_COLOR_HEX[selected] }}
          />
          <div>
            <div className="text-[15px] font-bold text-ink">Tu color</div>
            <div className="text-xs text-ink-soft">Te identifica en balance y actividad</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3.5">
          {PROFILE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelected(color)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: PROFILE_COLOR_HEX[color],
                  boxShadow: selected === color ? `0 0 0 2.5px ${PROFILE_COLOR_HEX[color]}` : undefined,
                  border: selected === color ? "2.5px solid var(--color-surface)" : undefined,
                }}
              >
                {selected === color && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span
                className={`text-[11px] ${selected === color ? "font-bold text-ink" : "font-semibold text-ink-soft"}`}
              >
                {PROFILE_COLOR_LABEL[color]}
              </span>
            </button>
          ))}
        </div>

        {error && <p className="text-sm font-semibold text-negative">{error}</p>}

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
