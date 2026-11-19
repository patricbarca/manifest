"use client";

/** Eventos de anuncios desde el navegador. Si no hay consentimiento o no hay píxeles, no hace nada. */
type Ev = { name: "begin_checkout" | "purchase" | "free_scene"; value?: number; currency?: string; id?: string };

declare global {
  interface Window {
    __mlTrack?: (e: Ev) => void;
    __mlQueue?: Ev[];
  }
}

export function trackEvent(e: Ev): void {
  if (typeof window === "undefined") return;
  if (window.__mlTrack) window.__mlTrack(e);
  else (window.__mlQueue ??= []).push(e);
}

/** Paso del embudo desde el navegador (ver /api/funnel). Nunca falla ni retrasa la navegación. */
export function funnel(step: "cta_click" | "login_view" | "auth_start", meta?: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ step, path: window.location.pathname, meta });
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/funnel", blob)) return;
    void fetch("/api/funnel", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {
    /* medir nunca rompe nada */
  }
}
