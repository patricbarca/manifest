"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Botones Feed / Perfil de la cabecera, con el actual marcado. */
export function NavPills({ feed, profile }: { feed: string; profile: string }) {
  const path = usePathname();
  const items = [
    { href: "/feed", label: feed, active: path.startsWith("/feed") },
    { href: "/profile", label: profile, active: path.startsWith("/profile") },
  ];
  return (
    <nav className="flex items-center rounded-full border border-[var(--color-hairline)] p-0.5">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.active ? "page" : undefined}
          className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
            it.active ? "bg-white/15 text-[var(--color-label-1)]" : "text-[var(--color-label-2)] hover:text-[var(--color-label-1)]"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
