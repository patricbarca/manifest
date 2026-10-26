"use client";

import { useState } from "react";

/** "Ya lo vi hoy" (fuera de la app): suma +5 aura y mantiene la racha. */
export function CheckinButton({ projectId, t }: { projectId: string; t: { checkin: string; done: string; already: string; hint: string } }) {
  const [state, setState] = useState<"idle" | "done" | "already">("idle");
  const [busy, setBusy] = useState(false);
  async function checkin() {
    setBusy(true);
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch("/api/aura/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, tz }) });
    setBusy(false);
    if (!res.ok) return;
    const data = await res.json();
    setState(data.awarded ? "done" : "already");
  }
  return (
    <div className="mt-3 text-center">
      {state === "idle" ? (
        <button type="button" onClick={checkin} disabled={busy} className="t-caption rounded-full border border-[var(--color-hairline)] px-4 py-1.5 text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">
          {t.checkin}
        </button>
      ) : (
        <p className="t-caption text-emerald-300">{state === "done" ? t.done : t.already}</p>
      )}
      <p className="t-caption mt-1 text-[var(--color-label-3)]">{t.hint}</p>
    </div>
  );
}
