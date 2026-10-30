"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { THEME_COOKIE, THEMES, type Theme } from "@/lib/theme";

/** Oscuro / Claro / Automático. Se guarda en una cookie y se aplica al momento. */
export function ThemePicker({ current, labels }: { current: Theme; labels: Record<Theme, string> }) {
  const [theme, setTheme] = useState(current);
  const [, start] = useTransition();
  const router = useRouter();

  function pick(next: Theme) {
    setTheme(next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const d = document.documentElement;
    d.dataset.themePref = next;
    d.dataset.theme = next === "system" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : next;
    // Para el color de la barra del navegador (lo pone el servidor).
    start(() => router.refresh());
  }

  return (
    <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded-full bg-white/10 p-1">
      {THEMES.map((th) => (
        <button
          key={th}
          type="button"
          role="radio"
          aria-checked={theme === th}
          onClick={() => pick(th)}
          className={`t-caption rounded-full px-3 py-1.5 font-medium transition-colors ${theme === th ? "bg-[var(--color-surface-2)] text-[var(--color-label-1)] shadow-sm" : "text-[var(--color-label-2)]"}`}
        >
          {labels[th]}
        </button>
      ))}
    </div>
  );
}
