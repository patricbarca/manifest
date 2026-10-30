import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MyPhotos } from "@/components/MyPhotos";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ReminderToggle } from "@/components/ReminderToggle";
import { ReminderTest } from "@/components/ReminderTest";
import { ThemePicker } from "@/components/ThemePicker";
import { CookieSettingsLink } from "@/components/Tracking";
import { livePhotos } from "@/lib/manifest/photos";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locale";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { getDictionary } from "@/lib/i18n/server";
import { siteBase } from "@/lib/hosts";
import { trackingConfig } from "@/lib/tracking";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

const CONTACT = process.env.CONTACT_EMAIL;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card rounded-[var(--radius-lg)] p-6">
      <h2 className="t-headline mb-4">{title}</h2>
      {children}
    </section>
  );
}

/** Ajustes de la cuenta (lo que no es el perfil público): apariencia, idioma, avisos, fotos, privacidad. */
export default async function SettingsPage() {
  const who = await me();
  if (!who) redirect("/login?next=/settings");
  const { t, locale } = await getDictionary();
  const user = (await db.getUser(who.user.id)) ?? who.user;
  const photos = await livePhotos(user);
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  const site = siteBase();
  const tracking = trackingConfig();
  const row = "flex items-center justify-between gap-4";
  const link = "t-sub text-[var(--color-label-1)] underline-offset-4 hover:underline";

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/profile" className="t-sub text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">← {t.aura.nav}</Link>
        <h1 className="t-headline">{t.settings.title}</h1>
        <span className="w-14" />
      </div>

      <Section title={t.settings.appearance}>
        <ThemePicker current={theme} labels={t.settings.themes} />
        <p className="t-caption mt-2 text-[var(--color-label-3)]">{t.settings.themeHint}</p>
        <div className={`${row} mt-5 border-t border-[var(--color-hairline)] pt-5`}>
          <span className="t-sub text-[var(--color-label-2)]">{t.settings.language}</span>
          <LocaleToggle current={locale as Locale} />
        </div>
      </Section>

      <Section title={t.settings.notifications}>
        <ReminderToggle initial={user.reminders !== false} label={t.aura.reminders} />
        <p className="t-caption mt-1 text-[var(--color-label-3)]">{t.aura.remindersHint}</p>
        <ReminderTest t={t.aura.reminderTest} />
      </Section>

      <MyPhotos
        initial={photos}
        guide={t.photoGuide}
        t={{ title: t.settings.photos, hint: t.manifest.myPhotosHint, empty: t.manifest.noPhotos, remove: t.manifest.removePhoto, upload: t.manifest.upload, uploading: t.manifest.uploading, consent: t.consent, biometric: t.biometricConsent, error: t.aura.errors.invalid }}
      />

      <Section title={t.settings.app}>
        <p className="t-sub text-[var(--color-label-2)]">{t.aura.installTitle}</p>
        <p className="t-caption mt-1 text-[var(--color-label-3)]">{t.aura.installHow}</p>
      </Section>

      <Section title={t.settings.privacy}>
        <p className="t-caption mb-4 text-[var(--color-label-3)]">{t.settings.privacyHint}</p>
        <div className="flex flex-col items-start gap-2.5">
          <a href={`${site}/privacy`} className={link}>{t.footer.privacy}</a>
          <a href={`${site}/terms`} className={link}>{t.footer.terms}</a>
          <a href={`${site}/refunds`} className={link}>{t.footer.refunds}</a>
          {tracking && <CookieSettingsLink label={t.cookies.settings} domain={tracking.cookieDomain} />}
          {CONTACT && <a href={`mailto:${CONTACT}`} className={link}>{t.footer.contact}</a>}
        </div>
        {CONTACT && (
          <div className="mt-5 border-t border-[var(--color-hairline)] pt-5">
            <a
              href={`mailto:${CONTACT}?subject=${encodeURIComponent(t.settings.deleteAccount)}`}
              className="t-sub text-rose-300 underline-offset-4 hover:underline"
            >
              {t.settings.deleteAccount}
            </a>
            <p className="t-caption mt-1 text-[var(--color-label-3)]">{t.settings.deleteHint}</p>
          </div>
        )}
      </Section>

      <Section title={t.settings.account}>
        <Link href="/profile/edit" className={link}>{t.settings.editProfile} →</Link>
        <div className={`${row} mt-5 border-t border-[var(--color-hairline)] pt-5`}>
          <span className="t-caption min-w-0 truncate text-[var(--color-label-3)]">{user.email ? fill(t.aura.signedInAs, { email: user.email }) : ""}</span>
          <form action="/auth/logout" method="post">
            <button type="submit" className="t-sub shrink-0 rounded-full border border-[var(--color-hairline-strong)] px-4 py-1.5 hover:bg-white/5">
              {t.auth.signOut}
            </button>
          </form>
        </div>
      </Section>
    </div>
  );
}
