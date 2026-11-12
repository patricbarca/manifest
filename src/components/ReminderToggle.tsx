"use client";

import { useState } from "react";

/** Activar o quitar el email diario de racha. */
/** `field` = qué ajuste cambia: el recordatorio diario (por defecto) o los emails de novedades. */
export function ReminderToggle({ initial, label, field = "reminders" }: { initial: boolean; label: string; field?: "reminders" | "marketing" }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: !on }) });
    setBusy(false);
    if (res.ok) setOn(!on);
  }
  return (
    <button type="button" role="switch" aria-checked={on} disabled={busy} onClick={toggle} className="t-sub flex w-full items-center justify-between gap-4 text-left text-[var(--color-label-2)]">
      <span>{label}</span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-emerald-400" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
    </button>
  );
}
