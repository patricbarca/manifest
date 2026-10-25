"use client";

import { useState } from "react";

/** Copia el enlace del perfil (o abre el menú de compartir del móvil). */
export function ShareProfileButton({ url, label, copied, className }: { url: string; label: string; copied: string; className: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
    } catch {
      return; // canceló el menú
    }
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  }
  return (
    <button type="button" onClick={share} className={className}>
      {done ? copied : label}
    </button>
  );
}
