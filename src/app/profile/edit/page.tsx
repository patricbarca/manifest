import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileSettings } from "@/components/ProfileSettings";
import { MyPhotos } from "@/components/MyPhotos";
import { livePhotos } from "@/lib/manifest/photos";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ReminderToggle } from "@/components/ReminderToggle";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locale";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Privada: fuera de Google. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Ajustes del perfil: foto, datos, visibilidad y qué vídeos se muestran. */
export default async function EditarPerfilPage() {
  const who = await me();
  if (!who) redirect("/login?next=/profile/edit");
  const { t, locale } = await getDictionary();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const photos = await livePhotos((await db.getUser(who.user.id)) ?? who.user);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/profile" className="t-sub text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">← {t.aura.nav}</Link>
        <h1 className="t-headline">{t.aura.editProfile}</h1>
        <span className="w-14" />
      </div>

      <ProfileSettings initial={who.profile} origin={origin} t={t.aura} />

      <MyPhotos
        initial={photos}
        t={{ title: t.manifest.myPhotos, hint: t.manifest.myPhotosHint, empty: t.manifest.noPhotos, remove: t.manifest.removePhoto, upload: t.manifest.upload, uploading: t.manifest.uploading, consent: t.consent, biometric: t.biometricConsent, error: t.aura.errors.invalid }}
      />

      <section className="card rounded-[var(--radius-lg)] p-7">
        <h2 className="t-headline">{t.aura.account}</h2>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="t-sub text-[var(--color-label-2)]">{t.aura.language}</span>
          <LocaleToggle current={locale as Locale} />
        </div>
        <div className="mt-5 border-t border-[var(--color-hairline)] pt-5">
          <ReminderToggle initial={who.user.reminders !== false} label={t.aura.reminders} />
          <p className="t-caption mt-1 text-[var(--color-label-3)]">{t.aura.remindersHint}</p>
        </div>
        <div className="mt-5 border-t border-[var(--color-hairline)] pt-5">
          <p className="t-sub text-[var(--color-label-2)]">{t.aura.installTitle}</p>
          <p className="t-caption mt-1 text-[var(--color-label-3)]">{t.aura.installHow}</p>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-[var(--color-hairline)] pt-5">
          <span className="t-caption min-w-0 truncate text-[var(--color-label-3)]">{who.user.email ? fill(t.aura.signedInAs, { email: who.user.email }) : ""}</span>
          <form action="/auth/logout" method="post">
            <button type="submit" className="t-sub shrink-0 rounded-full border border-[var(--color-hairline-strong)] px-4 py-1.5 hover:bg-white/5">
              {t.auth.signOut}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
