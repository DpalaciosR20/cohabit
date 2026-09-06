"use client";

import type { ReactNode } from "react";

export function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-ink/40"
      onClick={onClose}
    >
      <div
        className="glass-strong flex flex-col gap-4 rounded-t-card border-t px-5 pb-7 pt-2.5 backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto h-1 w-9 rounded-full bg-rule" />
        {children}
      </div>
    </div>
  );
}
