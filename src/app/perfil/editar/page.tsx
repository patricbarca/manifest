import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileSettings } from "@/components/ProfileSettings";
import { HighlightToggle } from "@/components/HighlightToggle";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Ajustes del perfil: foto, datos, visibilidad y qué vídeos se muestran. */
export default async function EditarPerfilPage() {
  const who = await me();
  if (!who) redirect("/entrar?next=/perfil/editar");
  const { t } = await getDictionary();
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
          <ul className="divide-y divide-[var(--color-hairline)]">
            {ready.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                {p.highlights?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.highlights[0].posterUrl} alt="" className="h-14 w-10 shrink-0 rounded object-cover" />
                ) : (
                  <span className="h-14 w-10 shrink-0 rounded bg-white/10" />
                )}
                <span className="t-sub min-w-0 flex-1 truncate">{p.script?.title || p.title}</span>
                {p.highlights?.length ? (
                  <HighlightToggle projectId={p.id} initial={!!p.showOnProfile} label={t.aura.showOnProfile} />
                ) : (
                  <span className="t-caption text-[var(--color-label-3)]">{t.aura.noHighlights}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
