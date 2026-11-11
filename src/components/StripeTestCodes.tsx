"use client";

import { useState } from "react";

type Code = { code: string; what: string };

/** Botón del panel: crea 2 códigos de prueba de un solo uso en Stripe. */
export function StripeTestCodes() {
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<Code[]>();
  const [err, setErr] = useState<string>();

  async function create() {
    setBusy(true);
    setErr(undefined);
    const res = await fetch("/api/admin/stripe-codes", { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok && data?.codes) setCodes(data.codes);
    else setErr(data?.error ?? "No se pudieron crear.");
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={create}
        className="interactive t-sub rounded-full bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
      >
        {busy ? "Creando…" : "Crear códigos de prueba"}
      </button>
      {codes && (
        <ul className="space-y-2">
          {codes.map((c) => (
            <li key={c.code} className="rounded-[var(--radius-md)] border border-[var(--color-hairline)] p-3">
              <code className="t-sub select-all font-semibold">{c.code}</code>
              <p className="t-caption text-[var(--color-label-2)]">{c.what} Un solo uso.</p>
            </li>
          ))}
        </ul>
      )}
      {err && <p className="t-caption text-rose-300">{err}</p>}
    </div>
  );
}
