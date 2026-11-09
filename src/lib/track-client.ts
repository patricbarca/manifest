"use client";

/** Eventos de anuncios desde el navegador. Si no hay consentimiento o no hay píxeles, no hace nada. */
type Ev = { name: "begin_checkout" | "purchase"; value?: number; currency?: string; id?: string };

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
