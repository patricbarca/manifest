import { creditPacks, elevatedPacks, stillPacks } from "@/lib/pricing";
import { PricingPacks } from "@/components/PricingPacks";
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

      <div className="mx-auto mt-12 max-w-[720px]">
        <PricingPacks mode="link" href="/create" wishes={creditPacks()} stills={stillPacks()} elevated={elevatedPacks()} products={t.products} t={t.packs} examples />
      </div>

      <p className="t-sub mx-auto mt-8 max-w-md text-center text-[var(--color-label-2)]">
        {t.pricing.freeNote}
      </p>

    </div>
  );
}
