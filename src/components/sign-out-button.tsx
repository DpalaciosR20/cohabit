"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm font-semibold text-ink-soft hover:text-ink"
    >
      Cerrar sesión
    </button>
  );
}
