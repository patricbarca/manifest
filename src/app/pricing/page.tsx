import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PRODUCTS, creditPacks, formatUsd } from "@/lib/pricing";
import { TIERS } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";
import { clip, pageMeta } from "@/lib/seo";

export async function generateMetadata() {
  const { t } = await getDictionary();
  return pageMeta({ title: `${t.pricing.title} — ManifestLifeAI`, description: clip(t.pricing.lede), path: "/pricing" });
}

export default async function PreciosPage() {
  const { t } = await getDictionary();

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-20">
      <header className="mx-auto max-w-xl text-center">
        <h1 className="t-display text-balance">{t.pricing.title}</h1>
        <p className="t-body mx-auto mt-6 text-pretty text-[var(--color-label-2)]">
          {t.pricing.lede}
        </p>
      </header>

      <div className="mx-auto mt-16 grid max-w-5xl gap-4 md:grid-cols-3">
        {TIERS.map((id) => {
          const copy = t.products[id];
          return (
            <div
              key={id}
              className={`card flex flex-col rounded-[var(--radius-lg)] p-8 ${
                id === "cinematic" ? "border-[var(--color-hairline-strong)]" : ""
              }`}
            >
              <h2 className="t-headline">{copy.name}</h2>
              <p className="t-sub mt-1 min-h-10 text-[var(--color-label-2)]">
                {copy.tagline}
              </p>

              <p className="mt-7 text-[3rem] font-semibold leading-none tracking-[-0.035em] tabular-nums">
                {formatUsd(PRODUCTS[id].priceUsd)}
              </p>
              <p className="t-caption mt-2 text-[var(--color-label-2)]">
                {t.pricing.sameDuration}
              </p>

              <ul className="mt-7 flex-1 space-y-2.5">
                {copy.points.map((point) => (
                  <li key={point} className="t-sub flex gap-2.5 text-[var(--color-label-2)]">
                    <Icon
                      name="check"
                      size={14}
                      className="mt-[4px] shrink-0 text-[var(--color-label-1)]"
                    />
                    {point}
                  </li>
                ))}
              </ul>

              <p className="t-caption mt-6 text-[var(--color-label-3)]">{copy.waitLabel}</p>

              <Link
                href="/create"
                className={`interactive mt-7 rounded-full px-5 py-2.5 text-center text-[15px] font-medium tracking-[-0.011em] ${
                  id === "cinematic"
                    ? "bg-white text-black hover:bg-white/90"
                    : "border border-[var(--color-hairline)] text-[var(--color-label-1)]"
                }`}
              >
                {t.pricing.create}
              </Link>
            </div>
          );
        })}
      </div>

      <p className="t-sub mx-auto mt-8 max-w-md text-center text-[var(--color-label-2)]">
        {t.pricing.freeNote}
      </p>

      <section className="card mx-auto mt-14 max-w-2xl rounded-[var(--radius-lg)] p-8 text-center">
        <h2 className="t-headline">{t.pricing.addTitle}</h2>
        <p className="t-sub mx-auto mt-2 max-w-md text-pretty text-[var(--color-label-2)]">{t.pricing.addBody}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {creditPacks().map((p) => (
            <div key={p.qty} className="rounded-[var(--radius-md)] border border-[var(--color-hairline)] px-5 py-3">
              <p className="t-sub font-medium">{p.qty === 1 ? t.pricing.single : t.manifest.buy.replace("{n}", String(p.qty))}</p>
              <p className="text-[1.5rem] font-semibold tabular-nums">{formatUsd(p.priceUsd)}</p>
              {p.qty > 1 && <p className="t-caption text-[var(--color-label-3)]">{t.manifest.each.replace("{p}", (p.priceUsd / p.qty).toFixed(2))}</p>}
            </div>
          ))}
        </div>
        <p className="t-caption mt-5 text-[var(--color-label-3)]">{t.pricing.addNote}</p>
      </section>
    </div>
  );
}
