import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileSettings } from "@/components/ProfileSettings";
import { ShowcaseEditor } from "@/components/ShowcaseEditor";
import { LocaleToggle } from "@/components/LocaleToggle";
import { ReminderToggle } from "@/components/ReminderToggle";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locale";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Ajustes del perfil: foto, datos, visibilidad y qué vídeos se muestran. */
export default async function EditarPerfilPage() {
  const who = await me();
  if (!who) redirect("/entrar?next=/perfil/editar");
  const { t, locale } = await getDictionary();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const ready = (await db.listProjects(who.user.id)).filter((p) => p.status === "ready");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/perfil" className="t-sub text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">← {t.aura.nav}</Link>
        <h1 className="t-headline">{t.aura.editProfile}</h1>
        <span className="w-14" />
      </div>

      <ProfileSettings initial={who.profile} origin={origin} t={t.aura} />

      <section className="card rounded-[var(--radius-lg)] p-7">
        <h2 className="t-headline">{t.aura.showcaseTitle}</h2>
        <p className="t-caption mb-4 mt-1 text-[var(--color-label-3)]">{t.aura.highlightsHint}</p>
        {ready.length === 0 ? (
          <p className="t-sub text-[var(--color-label-2)]">{t.aura.noManifestations}</p>
        ) : (
          <div className="divide-y divide-[var(--color-hairline)]">
            {ready.map((p) =>
              p.highlights?.length ? (
                <ShowcaseEditor
                  key={p.id}
                  projectId={p.id}
                  title={p.script?.title || p.title}
                  initialShow={!!p.showOnProfile}
                  initialItems={p.highlights}
                  t={{ showOnProfile: t.aura.showOnProfile, hiddenScene: t.aura.hiddenScene, labelPlaceholder: t.aura.labelPlaceholder, tapToHide: t.aura.tapToHide }}
                />
              ) : (
                <div key={p.id} className="flex items-center justify-between gap-3 py-4">
                  <span className="t-sub min-w-0 truncate">{p.script?.title || p.title}</span>
                  <span className="t-caption text-[var(--color-label-3)]">{t.aura.noHighlights}</span>
                </div>
              ),
            )}
          </div>
        )}
      </section>

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
          <form action="/auth/salir" method="post">
            <button type="submit" className="t-sub shrink-0 rounded-full border border-[var(--color-hairline-strong)] px-4 py-1.5 hover:bg-white/5">
              {t.auth.signOut}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
