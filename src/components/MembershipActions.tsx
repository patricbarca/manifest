"use client";

import { useState } from "react";

/**
 * Botones que llevan a Stripe: alta (mensual o anual) o portal de gestión.
 * Sin sesión, mandan a entrar y vuelven a /precios.
 */
export function MembershipActions({
  mode,
  signedIn,
  labels,
}: {
  mode: "join" | "manage";
  signedIn: boolean;
  labels: { monthly: string; yearly: string; manage: string; failed: string };
}) {
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  async function go(endpoint: string, body?: object, key = endpoint) {
    if (!signedIn) {
      window.location.href = `/entrar?next=${encodeURIComponent("/precios#socio")}`;
      return;
    }
    setBusy(key);
    setError(undefined);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? labels.failed);
      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setBusy(undefined);
    }
  }

  const primary =
    "interactive rounded-full bg-white px-5 py-2.5 text-center text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90 disabled:opacity-60";
  const secondary =
    "interactive rounded-full border border-[var(--color-hairline)] px-5 py-2.5 text-center text-[15px] font-medium tracking-[-0.011em] text-[var(--color-label-1)] disabled:opacity-60";

  return (
    <div>
      {mode === "manage" ? (
        <button type="button" className={secondary} disabled={!!busy} onClick={() => go("/api/membership/portal")}>
          {labels.manage}
        </button>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            className={secondary}
            disabled={!!busy}
            onClick={() => go("/api/membership/checkout", { plan: "monthly" }, "monthly")}
          >
            {labels.monthly}
          </button>
          <button
            type="button"
            className={primary}
            disabled={!!busy}
            onClick={() => go("/api/membership/checkout", { plan: "yearly" }, "yearly")}
          >
            {labels.yearly}
          </button>
        </div>
      )}
      {error && <p className="t-caption mt-3 text-red-300">{error}</p>}
    </div>
  );
}
