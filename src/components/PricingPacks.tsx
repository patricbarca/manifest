"use client";

import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "@/lib/track-client";
import { formatUsd, type CreditPack, type PackKind } from "@/lib/pricing";
import type { Dictionary } from "@/lib/i18n";

type Labels = Dictionary["packs"];

/**
 * Packs de deseos (animados) y de fotos con movimiento, en dos pestañas. El
 * del medio va destacado. En la landing cada tarjeta lleva a empezar; dentro
 * de la app abre el pago de Stripe.
 */
export function PricingPacks({
  wishes,
  stills,
  t,
  mode,
  href = "/start",
  balance,
  upsell,
  initial = "wishes",
}: {
  wishes: CreditPack[];
  stills: CreditPack[];
  t: Labels;
  mode: "buy" | "link";
  href?: string;
  balance?: { wishes: number; stills: number };
  /** "Completa tu vídeo": 2 deseos más a precio de pack (solo si le toca). */
  upsell?: CreditPack;
  initial?: PackKind;
}) {
  const [kind, setKind] = useState<PackKind>(initial);
  const [busy, setBusy] = useState<string>();
  const [err, setErr] = useState<string>();
  const packs = kind === "stills" ? stills : wishes;
  const unit = packs.find((p) => p.qty === 1)?.priceUsd ?? packs[0]?.priceUsd ?? 0;
  const mid = packs.length === 3 ? 1 : -1;
  const label = (k: PackKind, n: number) => (n === 1 ? t.one[k] : t.many[k].replace("{n}", String(n)));

  async function buy(qty: number, k: PackKind, upsellBuy = false) {
    const key = `${k}:${qty}`;
    setBusy(key);
    setErr(undefined);
    const res = await fetch("/api/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qty, kind: k, upsell: upsellBuy || undefined }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (res?.ok && data?.url) {
      trackEvent({ name: "begin_checkout" });
      window.location.href = data.url;
      return;
    }
    setBusy(undefined);
    setErr(t.error);
  }

  const tab = (k: PackKind, text: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={kind === k}
      onClick={() => setKind(k)}
      className={`interactive t-sub flex-1 rounded-full px-4 py-2 font-medium ${
        kind === k ? "bg-[var(--color-label-1)] text-[var(--color-surface-1)]" : "text-[var(--color-label-2)]"
      }`}
    >
      {text}
    </button>
  );

  return (
    <div className="space-y-5">
      {balance && (
        <p className="t-sub text-center text-[var(--color-label-2)]">
          {t.balance.replace("{w}", label("wishes", balance.wishes)).replace("{s}", label("stills", balance.stills))}
        </p>
      )}

      {upsell && mode === "buy" && (
        <div className="card flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border-[var(--color-hairline-strong)] p-4">
          <div>
            <p className="t-sub font-medium">✨ {t.upsellTitle}</p>
            <p className="t-caption text-[var(--color-label-2)]">{t.upsellBody.replace("{p}", formatUsd(upsell.priceUsd))}</p>
          </div>
          <button
            type="button"
            disabled={busy !== undefined}
            onClick={() => buy(upsell.qty, "wishes", true)}
            className="interactive t-sub shrink-0 rounded-full bg-white px-4 py-2 font-medium text-black disabled:opacity-50"
          >
            {busy === `wishes:${upsell.qty}` ? "…" : t.upsellCta}
          </button>
        </div>
      )}

      <div role="tablist" className="mx-auto flex max-w-sm gap-1 rounded-full border border-[var(--color-hairline)] p-1">
        {tab("wishes", t.tabWishes)}
        {tab("stills", t.tabStills)}
      </div>
      <p className="t-sub text-center text-[var(--color-label-2)]">{kind === "stills" ? t.ledeStills : t.ledeWishes}</p>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {packs.map((p, i) => {
          const hot = i === mid;
          const save = p.qty > 1 && unit ? Math.round((1 - p.priceUsd / (unit * p.qty)) * 100) : 0;
          const inner = (
            <>
              {hot && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--color-label-1)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-surface-1)] sm:text-[11px]">
                  ⭐ {t.popular}
                </span>
              )}
              <span className="t-caption text-center text-[var(--color-label-2)]">{label(kind, p.qty)}</span>
              <span className="mt-1 text-[1.35rem] font-semibold leading-none tracking-[-0.02em] tabular-nums sm:text-[2rem]">
                {busy === `${kind}:${p.qty}` ? "…" : formatUsd(p.priceUsd)}
              </span>
              {p.qty > 1 && (
                <span className="t-caption mt-1.5 text-center text-[11px] text-[var(--color-label-3)]">
                  {t.each.replace("{p}", formatUsd(+(p.priceUsd / p.qty).toFixed(2)))}
                </span>
              )}
              {save > 0 && <span className="t-caption mt-0.5 text-center text-[11px] font-medium text-emerald-400">{t.save.replace("{p}", String(save))}</span>}
            </>
          );
          const cls = `interactive relative flex flex-col items-center rounded-[var(--radius-lg)] border px-2 pb-4 pt-5 disabled:opacity-50 ${
            hot ? "border-[var(--color-label-1)] bg-[var(--color-surface-2)]" : "border-[var(--color-hairline-strong)]"
          }`;
          return mode === "link" ? (
            <Link key={p.qty} href={href} className={cls}>
              {inner}
            </Link>
          ) : (
            <button key={p.qty} type="button" disabled={busy !== undefined} onClick={() => buy(p.qty, kind)} className={cls}>
              {inner}
            </button>
          );
        })}
      </div>

      <div className="t-caption space-y-1 text-center text-[var(--color-label-3)]">
        {kind === "wishes" && <p>{t.fullVideo} {t.elevated}</p>}
        <p>{t.note}</p>
        <p>{t.guarantee}</p>
      </div>
      {err && <p className="t-caption text-center text-rose-300">{err}</p>}
    </div>
  );
}
