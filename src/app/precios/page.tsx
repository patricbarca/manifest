import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PRODUCTS, formatUsd } from "@/lib/pricing";
import { TIERS } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";
import { MembershipCard } from "@/components/MembershipCard";
import { currentUser, isSignedIn } from "@/lib/db/session";
import { isMember } from "@/lib/membership";

export const metadata = { title: "Pricing — ManifestLifeAI" };

export default async function PreciosPage() {
  const { t } = await getDictionary();
  const signedIn = await isSignedIn();
  const member = signedIn ? isMember(await currentUser()) : false;

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

      <MembershipCard t={t} signedIn={signedIn} member={member} />
    </div>
  );
}
