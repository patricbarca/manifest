import Link from "next/link";
import { Icon } from "@/components/Icon";
import {
  CREATOR_SHARE,
  PRODUCTS,
  creatorPayoutUsd,
  estimateCostCents,
  formatUsd,
} from "@/lib/pricing";
import { fill } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";

export const metadata = { title: "Pricing — Manifest" };

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

      <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
        {(["vision", "cinematic"] as const).map((id) => {
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
                href="/crear"
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

      {/* ── El market ────────────────────────────────────────────────────── */}
      <section className="mx-auto mt-28 max-w-3xl">
        <h2 className="t-title text-center">{t.pricing.marketTitle}</h2>
        <p className="t-body mx-auto mt-4 max-w-lg text-center text-pretty text-[var(--color-label-2)]">
          {fill(t.pricing.marketLede, { share: Math.round(CREATOR_SHARE * 100) })}
        </p>

        <div className="card mt-10 rounded-[var(--radius-lg)] p-8">
          <h3 className="t-headline">{t.pricing.publishTitle}</h3>
          <p className="t-sub mt-2 leading-relaxed text-[var(--color-label-2)]">
            {fill(t.pricing.publishBody, {
              stills: formatUsd(creatorPayoutUsd("vision")),
              animated: formatUsd(creatorPayoutUsd("cinematic")),
            })}
          </p>
          <p className="t-caption mt-4 text-[var(--color-label-3)]">
            {t.pricing.publishNote}
          </p>
        </div>
      </section>

      {/* ── Transparencia de coste ───────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-lg text-center">
        <p className="t-caption leading-relaxed text-[var(--color-label-3)]">
          {fill(t.pricing.transparency, {
            stills: formatUsd(estimateCostCents("vision", 60) / 100),
            animated: formatUsd(estimateCostCents("cinematic", 60) / 100),
          })}
        </p>
      </section>
    </div>
  );
}
