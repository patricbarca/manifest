"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

/**
 * Segunda fila de la cabecera en la app: Feed, Perfil y Crear a partes
 * iguales, con la actual marcada, y Ajustes (engranaje) al final.
 */
export function NavPills({ feed, profile, create, settings }: { feed: string; profile: string; create: string; settings: string }) {
  const path = usePathname();
  const items = [
    { href: "/feed", label: feed, active: path.startsWith("/feed") },
    { href: "/profile", label: profile, active: path.startsWith("/profile") },
    { href: "/create", label: `+ ${create}`, active: path.startsWith("/create") || path.startsWith("/new") },
  ];
  return (
    <div className="mx-auto flex max-w-[1120px] items-center gap-2 px-4 pb-2 sm:px-6">
      <nav className="grid flex-1 grid-cols-3 rounded-full border border-[var(--color-hairline)] p-0.5">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            aria-current={it.active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-center text-[13px] font-medium transition-colors ${
              it.active ? "bg-white/15 text-[var(--color-label-1)]" : "text-[var(--color-label-2)] hover:text-[var(--color-label-1)]"
            }`}
          >
            {it.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/settings"
        aria-label={settings}
        title={settings}
        aria-current={path.startsWith("/settings") ? "page" : undefined}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-hairline)] transition-colors ${
          path.startsWith("/settings") ? "bg-white/15 text-[var(--color-label-1)]" : "text-[var(--color-label-2)] hover:text-[var(--color-label-1)]"
        }`}
      >
        <Icon name="settings" size={18} />
      </Link>
    </div>
  );
}
