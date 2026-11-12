import { CreateWizard } from "@/components/CreateWizard";
import { hasPhotoConsent } from "@/lib/consent";
import { currentUser, freeVideosLeft, isSignedIn } from "@/lib/db/session";
import { redirect } from "next/navigation";
import { templateBySlug } from "@/lib/templates";
import { LIFE_AREAS, TIERS } from "@/lib/types";
import type { LifeArea } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";
import { creditPacks, elevatedPacks, stillPacks } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function CrearPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; template?: string; tier?: string; qty?: string }>;
}) {
  const { area, template, tier, qty } = await searchParams;
  // Con cuentas activas, crear exige sesión: así el vídeo (y lo pagado) queda en su cuenta.
  if (!(await isSignedIn())) {
    const q = new URLSearchParams();
    if (area) q.set("area", area);
    if (template) q.set("template", template);
    if (tier) q.set("tier", tier);
    if (qty) q.set("qty", qty);
    const back = `/create${q.size ? `?${q}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }
  const [user, { t, locale }] = await Promise.all([currentUser(), getDictionary()]);

  const initialArea = LIFE_AREAS.some((a) => a.id === area)
    ? (area as LifeArea)
    : undefined;

  return (
    <CreateWizard
      initialArea={initialArea}
      template={template ? templateBySlug(template) : undefined}
      initialTier={TIERS.find((x) => x === tier)}
      freeLeft={freeVideosLeft(user)}
      consented={hasPhotoConsent(user)}
      packs={{ vision: stillPacks(), cinematic: creditPacks(), elevated: elevatedPacks() }}
      initialQty={Number(qty) > 0 ? Math.min(100, Math.floor(Number(qty))) : undefined}
      t={t}
      locale={locale}
    />
  );
}
