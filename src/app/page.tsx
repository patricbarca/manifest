import Link from "next/link";
import { Icon } from "@/components/Icon";
import { HeroVideo } from "@/components/HeroVideo";
import { TEMPLATES } from "@/lib/templates";
import { TemplateMedia } from "@/components/TemplateMedia";
import { creditPacks, elevatedPacks, formatUsd, stillPacks } from "@/lib/pricing";
import { PricingPacks } from "@/components/PricingPacks";
import { LIFE_AREAS, type LifeArea } from "@/lib/types";
import { isDemoMode } from "@/lib/ai";
import { getDictionary } from "@/lib/i18n/server";
import { pageMeta, siteJsonLd } from "@/lib/seo";

export const metadata = pageMeta({
  title: "ManifestLifeAI — see yourself living it",
  description:
    "Upload a photo and get a visualization video with your face, your script and a voice that guides you while you repeat your affirmations out loud.",
  path: "/",
});

/** Muestra de cada área: su primera plantilla animada, o la primera que haya. */
function areaSample(area: LifeArea) {
  const own = TEMPLATES.filter((tpl) => tpl.area === area);
  return own.find((tpl) => tpl.tier !== "vision") ?? own[0];
}

export default async function HomePage() {
  const { t } = await getDictionary();
  const demo = isDemoMode();

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }} />
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
          <p className="t-body rise mx-auto mt-5 max-w-sm text-pretty text-[var(--color-label-2)]">
            {t.home.lede}
          </p>

          <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/create"
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
          <p className="t-caption rise mt-4 text-[var(--color-label-3)]">
            {t.packs.heroNote.replace("{p}", formatUsd(Math.min(...stillPacks().map((x) => x.priceUsd))))}
          </p>
        </div>

        {/* El reproductor, centrado y grande: es el producto. */}
        <div className="relative mx-auto mt-14 w-full max-w-[300px]">
          <div className="absolute -inset-16 -z-10 rounded-full bg-white/[0.045] blur-3xl" />
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-hairline)] bg-black shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]">
            <HeroVideo src="/videos/promo-en.mp4" poster="/videos/promo-en.jpg" soundLabel={t.home.soundOn} />
          </div>
        </div>
      </section>

      {/* ── Tipos de deseo: una muestra en vídeo de cada área ────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <h2 className="t-title text-center">{t.home.areasTitle}</h2>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {LIFE_AREAS.map((area) => {
            const sample = areaSample(area.id);
            return (
              <Link
                key={area.id}
                href={`/create?area=${area.id}`}
                className="card interactive group relative overflow-hidden rounded-[var(--radius-md)]"
              >
                {sample && (
                  <TemplateMedia template={sample} variant="animated" className="aspect-[4/5] w-full" />
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/85 to-transparent p-4 pt-12">
                  <Icon name={area.icon} size={16} />
                  <h3 className="t-headline">{t.areas[area.id].label}</h3>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/market"
            className="t-sub inline-flex items-center gap-1.5 text-[var(--color-label-1)] transition-opacity hover:opacity-60"
          >
            {t.common.seeAll}
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>
      </section>

      {/* ── Ejemplos reales ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="t-title">{t.home.examplesTitle}</h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-2xl gap-6 sm:grid-cols-2">
          {(["woman", "man"] as const).map((who) => (
            <figure key={who} className="card overflow-hidden rounded-[var(--radius-lg)]">
              <video
                src={`/videos/demo-${who}-en.mp4`}
                poster={`/videos/demo-${who}-en.jpg`}
                controls
                playsInline
                preload="none"
                className="aspect-[9/16] w-full bg-black object-cover"
              />
              <figcaption className="t-sub p-5 text-[var(--color-label-2)]">{t.home.examples[who]}</figcaption>
            </figure>
          ))}
        </div>
        <p className="t-caption mt-6 text-center text-[var(--color-label-3)]">{t.home.examplesNote}</p>
      </section>

      {/* ── Cómo funciona ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1120px] px-6 py-20">
        <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-hairline)] sm:grid-cols-3">
          {t.home.steps.map((step) => (
            <div key={step.n} className="bg-[var(--color-surface-2)] p-6">
              <span className="t-eyebrow text-[var(--color-label-3)]">{step.n}</span>
              <h3 className="t-headline mt-4">{step.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* ── Precios: packs de deseos y de fotos con movimiento ─────────────── */}
      <section id="pricing" className="mx-auto max-w-[1000px] scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="t-title">{t.packs.title}</h2>
          <p className="t-body mt-3 text-[var(--color-label-2)]">{t.packs.lede}</p>
        </div>
        <PricingPacks mode="link" href="/create" wishes={creditPacks()} stills={stillPacks()} elevated={elevatedPacks()} products={t.products} t={t.packs} examples />
      </section>

      {/* ── Preguntas ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-6 py-20">
        <h2 className="t-title text-center">{t.home.faqTitle}</h2>
        <div className="mt-10 divide-y divide-[var(--color-hairline)] border-y border-[var(--color-hairline)]">
          {t.home.faq.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="t-headline flex cursor-pointer list-none items-center justify-between gap-4">
                {item.q}
                <span className="text-[var(--color-label-3)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="t-sub mt-3 text-pretty text-[var(--color-label-2)]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Cierre ───────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-2xl px-6 py-28 text-center">
        <h2 className="t-title text-balance">{t.home.closingTitle}</h2>
        <Link
          href="/create"
          className="interactive mt-9 inline-block rounded-full bg-white px-7 py-3 text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90"
        >
          {t.home.closingCta}
        </Link>
      </section>
    </div>
  );
}

