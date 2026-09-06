"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
  // Rutas legadas que hoy redirigen a este destino (ver finance/page.tsx y
  // profile/page.tsx): el navegador termina en la ruta legada, no en `href`,
  // así que sin esto el tab no se marcaría activo. Se quita cuando las PRs
  // siguientes del roadmap de rediseño reemplacen los shells por contenido
  // real servido directamente en `href`.
  activePrefixes?: string[];
};

const ICON_PROPS = (active: boolean) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: active ? "var(--color-accent)" : "var(--color-ink-soft)",
  strokeWidth: active ? 2 : 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Inicio",
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    href: "/shopping-list",
    label: "Lista",
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
    ),
  },
  {
    href: "/finance",
    label: "Finanzas",
    activePrefixes: ["/expenses", "/balance", "/bills", "/personal"],
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3Z" />
        <path d="M9.5 8h5M9.5 11.5h5" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Perfil",
    activePrefixes: ["/household/members"],
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass sticky bottom-0 flex items-center justify-around rounded-t-card border-t px-2 pt-2 backdrop-blur-xl"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.activePrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 rounded-control px-3 py-1.5 transition-colors duration-200 ${
              active ? "bg-accent-soft" : ""
            }`}
          >
            {item.icon(active)}
            <span
              className={`text-[10.5px] ${active ? "font-bold text-accent" : "font-semibold text-ink-soft"}`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
