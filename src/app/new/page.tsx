import { redirect } from "next/navigation";
import { NewManifestation } from "@/components/NewManifestation";
import { me } from "@/lib/social/me";
import { db } from "@/lib/db/store";
import { livePhotos } from "@/lib/manifest/photos";
import { creditPacks } from "@/lib/pricing";
import { stripeEnabled } from "@/lib/stripe";
import { VOICES } from "@/lib/voices";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locale";
import { TrackPurchase } from "@/components/Tracking";

export const dynamic = "force-dynamic";

/** Nueva manifestación: escribe un deseo y se crea una escena animada tuya. */
export default async function ManifestarPage({ searchParams }: { searchParams: Promise<{ bought?: string; sid?: string }> }) {
  const { bought, sid } = await searchParams;
  const pack = creditPacks().find((p) => String(p.qty) === bought);
  const who = await me();
  if (!who) redirect("/login?next=/new");
  const { t, locale } = await getDictionary();
  const user = (await db.getUser(who.user.id)) ?? who.user;
  const photos = await livePhotos(user);
  const m = t.manifest;
  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:px-6">
      {pack && sid?.startsWith("cs_") && <TrackPurchase id={sid.slice(0, 80)} value={pack.priceUsd} />}
      <div>
        <h1 className="t-title">{m.newTitle}</h1>
        <p className="t-sub mt-1 text-[var(--color-label-2)]">{m.newSub}</p>
      </div>
      <NewManifestation
        initialPhotos={photos.length}
        credits={user.credits ?? 0}
        paymentsOn={stripeEnabled()}
        packs={creditPacks()}
        voices={VOICES.map((v) => ({ id: v.id, label: v.label[locale as Locale] }))}
        locale={locale as Locale}
        t={{
          desire: m.desire, desirePlaceholder: m.desirePlaceholder, language: m.language, voice: m.voice,
          photosTitle: m.photosTitle, photosHint: m.photosHint, consent: t.consent, biometric: t.biometricConsent,
          upload: m.upload, uploading: m.uploading, photosOk: m.photosOk, waiver: t.create.waiver,
          create: m.create, creating: m.creating, credits: m.credits, noCredits: m.noCredits, buy: m.buy, each: m.each,
          accessForm: t.access,
          errors: { ...t.aura.errors, photos: m.errPhotos, credits: m.noCredits, access: m.errAccess, payments_off: m.errPayments, ...t.safety },
        }}
      />
    </div>
  );
}
