"use client";

import { useState } from "react";

/** Casilla para escribir el código de la beta privada, sin depender del enlace. */
export function AccessCodeForm({ t, onDone }: { t: { placeholder: string; submit: string; bad: string }; onDone: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [bad, setBad] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setBad(false);
    const res = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    setBusy(false);
    if (res.ok) onDone();
    else setBad(true);
  }
  return (
    <form onSubmit={submit} className="mt-3 flex gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t.placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        className="t-body min-w-0 flex-1 rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-label-1)] outline-none"
      />
      <button type="submit" disabled={!code.trim() || busy} className="interactive rounded-full bg-white px-4 py-2 text-[14px] font-medium text-black disabled:opacity-40">
        {t.submit}
      </button>
      {bad && <p className="t-caption basis-full text-red-300">{t.bad}</p>}
    </form>
  );
}
