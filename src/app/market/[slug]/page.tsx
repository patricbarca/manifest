import Link from "next/link";
import { notFound } from "next/navigation";
import { TEMPLATES, templateBySlug } from "@/lib/templates";
import { PRODUCTS, formatUsd } from "@/lib/pricing";
import { Icon } from "@/components/Icon";
import { fill } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bp = templateBySlug(slug);
  if (!bp) notFound();

  const { t, locale } = await getDictionary();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <Link
        href="/market"
        className="t-sub inline-flex items-center gap-1.5 text-[var(--color-label-2)] transition-opacity hover:text-[var(--color-label-1)]"
      >
        <Icon name="arrow-left" size={15} />
        {t.nav.market}
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[320px_1fr] lg:items-start">
        <div
          className="aspect-[9/16] rounded-[var(--radius-xl)] ring-1 ring-[var(--color-hairline)]"
          style={{ background: `linear-gradient(150deg, ${bp.cover.from}, ${bp.cover.to})` }}
        />

        <div>
          <p className="t-eyebrow text-[var(--color-label-3)]">
            {t.areas[bp.area].label} · {t.products[bp.tier].name} · {bp.durationSec}{" "}
            {t.common.seconds}
          </p>
          <h1 className="t-title mt-3 text-balance">{bp.title[locale]}</h1>
          <p className="t-caption mt-2.5 text-[var(--color-label-3)]">
            {t.market.by} {bp.author}
            {bp.uses > 0 &&
              ` · ${bp.uses.toLocaleString(locale)} ${
                bp.uses === 1 ? t.market.usedBySingular : t.market.usedByPlural
              }`}
          </p>
          <p className="t-body mt-6 text-[var(--color-label-2)]">{bp.summary[locale]}</p>

          <div className="card mt-9 flex flex-wrap items-center justify-between gap-5 rounded-[var(--radius-lg)] p-6">
            <div>
              <p className="text-[2rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                {formatUsd(PRODUCTS[bp.tier].priceUsd)}
              </p>
              <p className="t-caption mt-2 text-[var(--color-label-2)]">
                {t.market.priceNote}
              </p>
            </div>
            <Link
              href={`/crear?template=${bp.slug}`}
              className="interactive rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black hover:bg-white/90"
            >
              {t.market.useTemplate}
            </Link>
          </div>

          {bp.protocol && (
            <section className="mt-12">
              <h2 className="t-headline">{t.market.howToUse}</h2>
              <p className="t-body mt-3 text-[var(--color-label-2)]">
                {bp.protocol[locale]}
              </p>
            </section>
          )}

          <section className="mt-12">
            <h2 className="t-headline">{t.market.affirmationsTitle}</h2>
            <ol className="mt-5 space-y-3">
              {bp.affirmations[locale].map((a, i) => (
                <li key={i} className="t-body flex gap-3.5">
                  <span className="t-caption mt-[5px] w-4 shrink-0 text-right tabular-nums text-[var(--color-label-3)]">
                    {i + 1}
                  </span>
                  {a}
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12">
            <h2 className="t-headline">{t.market.scenesTitle}</h2>
            <p className="t-caption mt-1.5 text-[var(--color-label-3)]">
              {fill(t.market.scenesNote, {
                style: t.styles[bp.style].toLowerCase(),
              })}
            </p>
            <ul className="t-sub mt-5 space-y-2 text-[var(--color-label-2)]">
              {bp.sceneBriefs.map((s, i) => (
                <li
                  key={i}
                  className="rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
