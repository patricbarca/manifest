"use client";

import { useEffect } from "react";
import type { Theme } from "@/lib/theme";

/**
 * Con "Automático", mantiene el tema igual que el del dispositivo (también
 * tras cambiarlo en Ajustes, cuando el servidor vuelve a pintar <html>).
 */
export function ThemeSync({ pref }: { pref: Theme }) {
  useEffect(() => {
    if (pref !== "system") return;
    const m = matchMedia("(prefers-color-scheme: light)");
    const apply = () => (document.documentElement.dataset.theme = m.matches ? "light" : "dark");
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, [pref]);
  return null;
}
