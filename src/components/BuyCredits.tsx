"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/track-client";
import { formatUsd } from "@/lib/pricing";

type Pack = { qty: number; priceUsd: number };
type Labels = { title: string; credits: string; none: string; buy: string; each: string; error: string; note: string };

/** Comprar más manifestaciones desde el perfil (paquetes por Stripe). */
export function BuyCredits({ credits, packs, t }: { credits: number; packs: Pack[]; t: Labels }) {
  const [busy, setBusy] = useState<number>();
  const [err, setErr] = useState<string>();

  async function buy(qty: number) {
    setBusy(qty);
    setErr(undefined);
    const res = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qty }) }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok && data?.url) {
      trackEvent({ name: "begin_checkout" });
      window.location.href = data.url;
      return;
    }
    setBusy(undefined);
    setErr(t.error);
  }

  return (
    <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-hairline)] p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="t-sub font-medium">{t.title}</p>
        <p className="t-caption text-[var(--color-label-2)]">{credits > 0 ? t.credits.replace("{n}", String(credits)) : t.none}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {packs.map((p) => (
          <button
            key={p.qty}
            type="button"
            disabled={busy !== undefined}
            onClick={() => buy(p.qty)}
            className="interactive flex flex-col items-center rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] px-2 py-3 disabled:opacity-50"
          >
            <span className="t-caption text-[var(--color-label-2)]">{t.buy.replace("{n}", String(p.qty))}</span>
            <span className="t-headline tabular-nums">{busy === p.qty ? "…" : formatUsd(p.priceUsd)}</span>
            {p.qty > 1 && <span className="t-caption text-[11px] text-[var(--color-label-3)]">{t.each.replace("{p}", (p.priceUsd / p.qty).toFixed(2))}</span>}
          </button>
        ))}
      </div>
      <p className="t-caption text-[var(--color-label-3)]">{t.note}</p>
      {err && <p className="t-caption text-rose-300">{err}</p>}
    </div>
  );
}
