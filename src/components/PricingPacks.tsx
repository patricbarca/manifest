"use client";

import Link from "next/link";
import { useState } from "react";
import { trackEvent } from "@/lib/track-client";
import { formatUsd, type CreditPack, type PackKind } from "@/lib/pricing";
import type { Dictionary } from "@/lib/i18n";
import type { Tier } from "@/lib/types";
import { Icon } from "./Icon";
import { TierExamples } from "./TierExamples";

type Labels = Dictionary["packs"];
type Products = Dictionary["products"];

/** Pestañas en orden: de la más barata a la premium. Cada una con su tipo de escena. */
const KINDS: { kind: PackKind; tier: Tier }[] = [
  { kind: "stills", tier: "vision" },
  { kind: "wishes", tier: "cinematic" },
  { kind: "elevated", tier: "elevated" },
];

/**
 * La sección de precios: una pestaña por tipo de escena (Fotos con movimiento,
 * Animado, Elevado), con qué es y sus 3 packs (el del medio, destacado). En la
 * landing cada tarjeta lleva a empezar; dentro de la app abre el pago de Stripe.
 */
export function PricingPacks({
  wishes,
  stills,
  elevated,
  products,
  t,
  mode,
  href = "/start",
  balance,
  upsell,
  initial = "wishes",
  examples = false,
}: {
  wishes: CreditPack[];
  stills: CreditPack[];
  elevated: CreditPack[];
  products: Products;
  t: Labels;
  mode: "buy" | "link";
  href?: string;
  balance?: { wishes: number; stills: number };
  /** "Completa tu vídeo": 2 deseos más a precio de pack (solo si le toca). */
  upsell?: CreditPack;
  initial?: PackKind;
  /** Los 3 tipos a la vez, cada uno con su ejemplo y sus precios (landing y /pricing). */
  examples?: boolean;
}) {
  const [kind, setKind] = useState<PackKind>(initial);
  const [busy, setBusy] = useState<string>();
  const [err, setErr] = useState<string>();
  const packs = kind === "stills" ? stills : kind === "elevated" ? elevated : wishes;
  const copy = products[KINDS.find((k) => k.kind === kind)!.tier];
  const unit = packs.find((p) => p.qty === 1)?.priceUsd ?? packs[0]?.priceUsd ?? 0;
  const mid = packs.length === 3 ? 1 : -1;
  const label = (k: PackKind, n: number) => (n === 1 ? t.one[k] : t.many[k].replace("{n}", String(n)));

  async function buy(qty: number, k: PackKind, upsellBuy = false) {
    setBusy(`${k}:${qty}`);
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

  // Landing y /pricing: los tres tipos a la vez, cada uno con un ejemplo y sus precios.
  if (examples) {
    const packsOf = (k: PackKind) => (k === "stills" ? stills : k === "elevated" ? elevated : wishes);
    return (
      <div className="space-y-5">
        <TierExamples tiers={KINDS.map((k) => ({ tier: k.tier, name: products[k.tier].name, tagline: products[k.tier].tagline }))}>
          {(tr) => {
            const k = KINDS.find((x) => x.tier === tr)!.kind;
            const list = packsOf(k);
            const one = list.find((x) => x.qty === 1)?.priceUsd ?? 0;
            return (
              <ul className="divide-y divide-[var(--color-hairline)] border-y border-[var(--color-hairline)]">
                {list.map((pk, i) => {
                  const save = pk.qty > 1 && one ? Math.round((1 - pk.priceUsd / (one * pk.qty)) * 100) : 0;
                  // El más elegido: el pack del medio de Animado (3 deseos).
                  const hot = k === "wishes" && list.length === 3 && i === 1;
                  return (
                    <li key={pk.qty}>
                      <Link
                        href={`/create?tier=${tr}&qty=${pk.qty}`}
                        className={`flex items-baseline justify-between gap-2 py-2.5 transition-opacity hover:opacity-70 ${hot ? "-mx-2 rounded-[var(--radius-sm,8px)] bg-[var(--color-surface-2)] px-2 ring-1 ring-[var(--color-label-1)]" : ""}`}
                      >
                        <span className="t-sub flex flex-wrap items-baseline gap-x-2 text-[var(--color-label-2)]">
                          <span className={hot ? "font-medium text-[var(--color-label-1)]" : ""}>{label(k, pk.qty)}</span>
                          {hot && (
                            <span className="whitespace-nowrap rounded-full bg-[var(--color-label-1)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-surface-1)]">
                              ⭐ {t.popular}
                            </span>
                          )}
                        </span>
                        <span className="flex items-baseline gap-2">
                          {save > 0 && <span className="text-[11px] font-medium text-emerald-400">−{save}%</span>}
                          <span className="t-headline tabular-nums">{formatUsd(pk.priceUsd)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            );
          }}
        </TierExamples>
        <div className="t-caption space-y-1 text-center text-[var(--color-label-3)]">
          <p>{t.note}</p>
          <p>{t.guarantee}</p>
        </div>
      </div>
    );
  }

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

      <div role="tablist" className="mx-auto grid max-w-md grid-cols-3 gap-1 rounded-full border border-[var(--color-hairline)] p-1">
        {KINDS.map(({ kind: k, tier }) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            onClick={() => setKind(k)}
            className={`rounded-full px-2 py-2 text-[13px] transition-colors font-medium leading-tight sm:text-[14px] ${
              kind === k ? "bg-[var(--color-label-1)] text-[var(--color-surface-1)]" : "text-[var(--color-label-2)] hover:text-[var(--color-label-1)]"
            }`}
          >
            {products[tier].name}
          </button>
        ))}
      </div>

      {/* Qué es este tipo de escena. */}
      <div className="text-center">
        <p className="t-sub text-[var(--color-label-1)]">{copy.tagline}</p>
        <ul className="mx-auto mt-3 grid max-w-lg gap-x-5 gap-y-1.5 text-left sm:grid-cols-2">
          {copy.points.map((point) => (
            <li key={point} className="t-caption flex gap-2 text-[var(--color-label-2)]">
              <Icon name="check" size={13} className="mt-[3px] shrink-0 text-[var(--color-label-1)]" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 sm:gap-4">
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
        <p>
          {kind === "elevated" ? t.noteElevated : kind === "stills" ? t.noteStills : t.fullVideo} · {copy.waitLabel}
        </p>
        <p>{t.note}</p>
        <p>{t.guarantee}</p>
      </div>
      {err && <p className="t-caption text-center text-rose-300">{err}</p>}
    </div>
  );
}
