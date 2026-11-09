"use client";

import { useState } from "react";

type Labels = { send: string; sending: string; sent: string; tooSoon: string; failed: string };

/** Botón para recibir ahora el recordatorio diario y ver cómo llega. */
export function ReminderTest({ t }: { t: Labels }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "soon" | "fail">("idle");
  async function send() {
    setState("busy");
    const res = await fetch("/api/settings/test-reminder", { method: "POST" }).catch(() => null);
    setState(res?.ok ? "sent" : res?.status === 429 ? "soon" : "fail");
  }
  const msg = { sent: t.sent, soon: t.tooSoon, fail: t.failed }[state as "sent" | "soon" | "fail"];
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      <button type="button" onClick={send} disabled={state === "busy"} className="t-caption text-[var(--color-label-2)] underline disabled:opacity-50">
        {state === "busy" ? t.sending : t.send}
      </button>
      {msg && <span className={`t-caption ${state === "sent" ? "text-emerald-300" : "text-rose-300"}`}>{msg}</span>}
    </div>
  );
}
