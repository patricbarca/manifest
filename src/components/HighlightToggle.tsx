"use client";

import { useState } from "react";

/** Interruptor «Mostrar en mi perfil» de un vídeo. */
export function HighlightToggle({ projectId, initial, label }: { projectId: string; initial: boolean; label: string }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, show: !on }),
    });
    setBusy(false);
    if (res.ok) setOn(!on);
  }
  return (
    <label className="t-caption inline-flex cursor-pointer items-center gap-2 text-[var(--color-label-2)]">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={busy}
        onClick={toggle}
        className={`relative h-5 w-9 rounded-full transition-colors ${on ? "bg-emerald-400" : "bg-white/20"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </button>
      {label}
    </label>
  );
}
