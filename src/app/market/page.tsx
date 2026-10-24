import Link from "next/link";
import { TemplateCard } from "@/components/TemplateCard";
import { TEMPLATES } from "@/lib/templates";
import { CREATOR_SHARE, PRODUCTS, formatUsd } from "@/lib/pricing";
import { LIFE_AREAS, type LifeArea } from "@/lib/types";
import { fill } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n/server";

export const metadata = { title: "Market — ManifestLifeAI" };

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { t, locale } = await getDictionary();
  const raw = (await searchParams).area;
  const area = LIFE_AREAS.find((a) => a.id === raw)?.id as LifeArea | undefined;
  const templates = area ? TEMPLATES.filter((tpl) => tpl.area === area) : TEMPLATES;
  const chip = (active: boolean) =>
    active
      ? "t-caption rounded-full bg-white px-4 py-1.5 font-medium text-black"
      : "interactive t-caption rounded-full border border-[var(--color-hairline)] px-4 py-1.5 text-[var(--color-label-2)]";
  return (
    <div className="mx-auto max-w-[1120px] px-6 py-20">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="t-display">{t.market.title}</h1>
        <p className="t-body mx-auto mt-6 max-w-lg text-pretty text-[var(--color-label-2)]">
          {t.market.lede}
        </p>
        <p className="t-caption mx-auto mt-4 max-w-md text-[var(--color-label-3)]">
          {fill(t.market.note, { share: Math.round(CREATOR_SHARE * 100) })}
        </p>
      </header>

      <div className="no-scrollbar mt-14 flex flex-wrap justify-center gap-2">
        <Link href="/market" scroll={false} aria-current={!area ? "page" : undefined} className={chip(!area)}>
          {t.market.all}
        </Link>
        {LIFE_AREAS.map((a) => (
          <Link
            key={a.id}
            href={`/market?area=${a.id}`}
            scroll={false}
            aria-current={area === a.id ? "page" : undefined}
            className={chip(area === a.id)}
          >
            {t.areas[a.id].label}
          </Link>
        ))}
      </div>

      {templates.length === 0 && (
        <p className="t-sub mt-16 text-center text-[var(--color-label-3)]">{t.market.empty}</p>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((bp) => (
          <TemplateCard
            key={bp.slug}
            template={bp}
            title={bp.title[locale]}
            summary={bp.summary[locale]}
            by={t.market.by}
            seconds={t.common.seconds}
            membersBadge={t.market.membersBadge}
            options={[
              { variant: "stills", label: t.products.vision.name, price: formatUsd(PRODUCTS.vision.priceUsd) },
              { variant: "animated", label: t.products.cinematic.name, price: formatUsd(PRODUCTS.cinematic.priceUsd) },
              { variant: "elevated", label: t.products.elevated.name, price: formatUsd(PRODUCTS.elevated.priceUsd) },
            ]}
          />
        ))}
      </div>
    </div>
  );
}
