import type { Metadata } from "next";
import Link from "next/link";
import { clip, pageMeta } from "@/lib/seo";
import { templatePreview } from "@/lib/templates";
import { TemplateMedia } from "@/components/TemplateMedia";
import { notFound } from "next/navigation";
import { TEMPLATES, templateBySlug } from "@/lib/templates";
import { PRODUCTS, formatUsd } from "@/lib/pricing";
import { Icon } from "@/components/Icon";
import { fill } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const bp = templateBySlug(slug);
  if (!bp) return {};
  const { locale } = await getDictionary();
  return pageMeta({
    title: `${bp.title[locale]} — ManifestLifeAI`,
    description: clip(bp.summary[locale]),
    path: `/market/${bp.slug}`,
    image: templatePreview(bp.slug).still,
  });
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

      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,640px)_1fr] lg:items-start">
        {/* El mismo ejemplo en las dos versiones, lado a lado. */}
        <div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(
              [
                { variant: "stills", tier: "vision" },
                { variant: "animated", tier: "cinematic" },
                { variant: "elevated", tier: "elevated" },
              ] as const
            ).map(({ variant, tier }) => (
              <div key={variant}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="t-sub font-medium">{t.products[tier].name}</span>
                  <span className="t-sub tabular-nums text-[var(--color-label-2)]">
                    {formatUsd(PRODUCTS[tier].priceUsd)}
                  </span>
                </div>
                <TemplateMedia
                  template={bp}
                  variant={variant}
                  alt={`${bp.title[locale]} — ${t.products[tier].name}`}
                  className="aspect-[9/16] w-full rounded-[var(--radius-lg)] ring-1 ring-[var(--color-hairline)]"
                />
                <Link
                  href={`/create?template=${bp.slug}&tier=${tier}`}
                  className={`interactive mt-3 block rounded-full px-4 py-2 text-center text-[14px] font-medium ${
                    tier === bp.tier
                      ? "bg-white text-black hover:bg-white/90"
                      : "border border-[var(--color-hairline)] text-[var(--color-label-1)]"
                  }`}
                >
                  {fill(t.market.useWith, { name: t.products[tier].name })}
                </Link>
              </div>
            ))}
          </div>
          {templatePreview(bp.slug).video && (
            <p className="t-caption mt-4 text-center text-[var(--color-label-3)]">{t.market.previewNote}</p>
          )}
        </div>

        <div>
          <p className="t-eyebrow text-[var(--color-label-3)]">
            {t.areas[bp.area].label} · {t.home.durationBoth}
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

          <p className="t-sub mt-8 text-[var(--color-label-2)]">
            {t.market.compareNote}
          </p>

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
