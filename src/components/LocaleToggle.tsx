"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_LABELS, type Locale } from "@/lib/i18n/locale";

/**
 * Selector de idioma.
 *
 * Escribe la cookie desde el cliente y pide a Next que vuelva a renderizar.
 * No hace falta ruta de API: la cookie no es httpOnly porque no guarda nada
 * sensible — solo en qué idioma quieres leer.
 *
 * `useTransition` evita el parpadeo: la interfaz vieja se queda en pantalla,
 * atenuada, hasta que llega la nueva.
 */
export function LocaleToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    // Un año, en la raíz, para que valga en todas las rutas.
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={`flex items-center rounded-full border border-[var(--color-hairline)] p-0.5 transition-opacity ${
        pending ? "opacity-50" : ""
      }`}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          onClick={() => choose(locale)}
          aria-current={locale === current}
          title={LOCALE_LABELS[locale]}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors duration-200 ${
            locale === current
              ? "bg-white text-black"
              : "text-[var(--color-label-2)] hover:text-[var(--color-label-1)]"
          }`}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
