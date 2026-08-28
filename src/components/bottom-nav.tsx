"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
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
    href: "/expenses",
    label: "Gastos",
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21V3Z" />
        <path d="M9.5 8h5M9.5 11.5h5" />
      </svg>
    ),
  },
  {
    href: "/balance",
    label: "Balance",
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <path d="M12 3v18M6 8l-3 5a3 3 0 0 0 6 0l-3-5Zm12 0l-3 5a3 3 0 0 0 6 0l-3-5ZM4 8h5M15 8h5" />
      </svg>
    ),
  },
  {
    href: "/bills",
    label: "Pagos",
    icon: (active) => (
      <svg {...ICON_PROPS(active)}>
        <rect x="4" y="5" width="16" height="16" rx="3" />
        <path d="M4 10h16M8 3v4M16 3v4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 flex items-center justify-around border-t border-rule bg-surface px-2 pt-2"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-2.5 py-1"
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
