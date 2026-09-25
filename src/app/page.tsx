import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TEMPLATES } from "@/lib/templates";
import { PRODUCTS, estimateCostCents, formatUsd } from "@/lib/pricing";
import { LIFE_AREAS } from "@/lib/types";
import type { Tier } from "@/lib/types";
import { isDemoMode } from "@/lib/ai";
import { fill, type Dictionary, type Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";

export default async function HomePage() {
  const { t, locale } = await getDictionary();
  const demo = isDemoMode();

  return (
    <div>
      {demo && (
        <div className="border-b border-[var(--color-hairline)] px-6 py-2.5 text-center">
          <p className="t-caption text-[var(--color-label-3)]">{t.home.demoBanner}</p>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 pt-20 pb-16 sm:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="t-eyebrow rise text-[var(--color-label-3)]">{t.home.eyebrow}</p>
          <h1 className="t-display rise mt-5 text-balance">
            {t.home.titleA}
            <br />
            <span className="text-[var(--color-label-2)]">{t.home.titleB}</span>
          </h1>
          <p className="t-body rise mx-auto mt-5 max-w-md text-pretty text-[var(--color-label-2)]">
            {t.home.lede}
          </p>

          <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/crear"
              className="interactive rounded-full bg-white px-6 py-3 text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90"
            >
              {t.home.ctaPrimary}
            </Link>
            <Link
              href="/market"
              className="interactive t-sub inline-flex items-center gap-1.5 rounded-full border border-[var(--color-hairline)] px-6 py-3 text-[var(--color-label-1)]"
            >
              {t.home.ctaSecondary}
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
          <p className="t-caption mt-4 text-[var(--color-label-3)]">{t.home.freeNote}</p>
        </div>

        {/* El reproductor, centrado y grande: es el producto. */}
        <div className="relative mx-auto mt-14 w-full max-w-[272px]">
          <div className="absolute -inset-16 -z-10 rounded-full bg-white/[0.045] blur-3xl" />
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-hairline)] bg-black shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
            <div className="relative aspect-[9/16] w-full">
              <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_15%,#2b3350_0%,#161a28_45%,#08090d_100%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="text-[1.6rem] font-semibold leading-[1.15] tracking-[-0.03em]">
                  {t.home.previewLine}
                </p>
                <p className="t-sub pulse-soft mt-3 flex items-center gap-2 text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  {t.home.previewCue}
                </p>
                <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-white/15">
                  <div className="h-full w-2/5 rounded-full bg-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-hairline)] sm:grid-cols-3">
          {t.home.steps.map((step) => (
            <div key={step.n} className="bg-[var(--color-surface-2)] p-8">
              <span className="t-eyebrow text-[var(--color-label-3)]">{step.n}</span>
              <h3 className="t-headline mt-4">{step.title}</h3>
              <p className="t-sub mt-2 text-[var(--color-label-2)]">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Los dos productos ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="t-title">{t.home.productsTitle}</h2>
          <p className="t-body mt-3 text-[var(--color-label-2)]">{t.home.productsLede}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
          {(["vision", "cinematic"] as const).map((id) => (
            <TierCard key={id} id={id} t={t} />
          ))}
        </div>

        <p className="t-sub mt-8 text-center text-[var(--color-label-2)]">
          {t.home.freeAfterProducts}
        </p>
      </section>

      {/* ── Áreas ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <h2 className="t-title text-center">{t.home.areasTitle}</h2>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LIFE_AREAS.map((area) => (
            <Link
              key={area.id}
              href={`/crear?area=${area.id}`}
              className="card interactive group rounded-[var(--radius-md)] p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.07] text-[var(--color-label-1)]">
                <Icon name={area.icon} size={18} />
              </span>
              <h3 className="t-headline mt-4">{t.areas[area.id].label}</h3>
              <p className="t-sub mt-1 text-[var(--color-label-2)]">
                {t.areas[area.id].blurb}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Market ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-lg">
            <h2 className="t-title">{t.home.marketTitle}</h2>
            <p className="t-body mt-3 text-[var(--color-label-2)]">{t.home.marketLede}</p>
          </div>
          <Link
            href="/market"
            className="t-sub inline-flex shrink-0 items-center gap-1.5 text-[var(--color-label-1)] transition-opacity hover:opacity-60"
          >
            {t.common.seeAll}
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>

        <div className="no-scrollbar mt-10 flex gap-4 overflow-x-auto pb-2">
          {TEMPLATES.slice(0, 4).map((tpl) => (
            <Link
              key={tpl.slug}
              href={`/market/${tpl.slug}`}
              className="card interactive w-[264px] shrink-0 overflow-hidden rounded-[var(--radius-md)]"
            >
              <div
                className="h-40"
                style={{ background: `linear-gradient(150deg, ${tpl.cover.from}, ${tpl.cover.to})` }}
              />
              <div className="p-5">
                <h3 className="t-headline">{tpl.title[locale as Locale]}</h3>
                <p className="t-caption mt-1.5 line-clamp-2 text-[var(--color-label-2)]">
                  {tpl.summary[locale as Locale]}
                </p>
                <p className="t-sub mt-4 tabular-nums">
                  {formatUsd(PRODUCTS[tpl.tier].priceUsd)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Cierre ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-6 py-28 text-center">
        <h2 className="t-title text-balance">{t.home.closingTitle}</h2>
        <Link
          href="/crear"
          className="interactive mt-9 inline-block rounded-full bg-white px-7 py-3 text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90"
        >
          {t.home.closingCta}
        </Link>
      </section>
    </div>
  );
}

function TierCard({ id, t }: { id: Tier; t: Dictionary }) {
  const copy = t.products[id];
  return (
    <div
      className={`card rounded-[var(--radius-lg)] p-8 ${
        id === "cinematic" ? "border-[var(--color-hairline-strong)]" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="t-headline">{copy.name}</h3>
        <span className="t-caption text-[var(--color-label-3)]">{t.home.durationBoth}</span>
      </div>
      <p className="t-sub mt-1 text-[var(--color-label-2)]">{copy.tagline}</p>

      <p className="mt-7 text-[2.5rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
        {formatUsd(PRODUCTS[id].priceUsd)}
      </p>
      <p className="t-caption mt-2 text-[var(--color-label-2)]">
        {t.common.perVideo} · {copy.waitLabel}
      </p>

      <ul className="mt-7 space-y-3">
        {copy.points.map((point) => (
          <li key={point} className="t-sub flex gap-3 text-[var(--color-label-2)]">
            <Icon
              name="check"
              size={15}
              className="mt-[3px] shrink-0 text-[var(--color-label-1)]"
            />
            {point}
          </li>
        ))}
      </ul>

      <p className="t-caption mt-7 border-t border-[var(--color-hairline)] pt-5 text-[var(--color-label-3)]">
        {fill(t.home.costNote, { cost: formatUsd(estimateCostCents(id, 60) / 100) })}
      </p>
    </div>
  );
}
