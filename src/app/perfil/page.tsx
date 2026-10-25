import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuraSummary } from "@/components/AuraSummary";
import { ProfileSettings } from "@/components/ProfileSettings";
import { CirclePanel } from "@/components/CirclePanel";
import { Highlights } from "@/components/Highlights";
import { HighlightToggle } from "@/components/HighlightToggle";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";
import { localDay, statsFrom } from "@/lib/social/aura";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const who = await me();
  if (!who) redirect("/entrar?next=/perfil");
  const { t, locale } = await getDictionary();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const [views, projects, circle, memberships] = await Promise.all([
    social.listViews(who.user.id),
    db.listProjects(who.user.id),
    social.listCircle(who.user.id),
    social.listMemberships(who.user.id),
  ]);
  // Sin zona horaria del navegador en el servidor: se usa UTC para "hoy" en la página.
  const stats = statsFrom(views, localDay("UTC"));
  const people = await social.getProfiles([...circle.map((c) => c.memberId), ...memberships.map((m) => m.ownerId)]);
  const person = (id: string) => {
    const p = people.find((x) => x.userId === id);
    return { userId: id, handle: p?.handle ?? "", displayName: p?.displayName ?? "", avatarUrl: p?.avatarUrl };
  };
  const ready = projects.filter((p) => p.status === "ready");
  // Lo mismo que verán los demás: solo los vídeos que elegiste mostrar.
  const groups = ready
    .filter((p) => p.showOnProfile && p.highlights?.length)
    .map((p) => ({ id: p.id, title: p.script?.title || p.title, items: p.highlights! }));

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-14">
      <h1 className="t-title">{t.aura.title}</h1>
      <AuraSummary profile={who.profile} stats={stats} t={t} locale={locale as Locale} />

      <section className="card rounded-[var(--radius-lg)] p-7">
        <h2 className="t-headline">{t.aura.manifestations}</h2>
        {ready.length === 0 ? (
          <div className="mt-3">
            <p className="t-sub text-[var(--color-label-2)]">{t.aura.noManifestations}</p>
            <Link href="/crear" className="interactive mt-4 inline-block rounded-full bg-white px-5 py-2 text-[14px] font-medium text-black">
              {t.aura.createFirst}
            </Link>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--color-hairline)]">
            {ready.map((p) => (
              <li key={p.id} className="py-3">
                <Link href={`/video/${p.id}`} className="flex items-center justify-between gap-4">
                  <span>
                    <span className="t-sub block">{p.script?.title || p.title}</span>
                    <span className="t-caption text-[var(--color-label-3)]">{fill(t.aura.viewedDays, { n: stats.daysByProject[p.id] ?? 0 })}</span>
                  </span>
                  <span className={`t-caption shrink-0 ${stats.viewedToday.includes(p.id) ? "text-emerald-300" : "text-[var(--color-label-3)]"}`}>
                    {stats.viewedToday.includes(p.id) ? t.aura.viewedToday : t.aura.notToday}
                  </span>
                </Link>
                <div className="mt-2">
                  {p.highlights?.length ? (
                    <HighlightToggle projectId={p.id} initial={!!p.showOnProfile} label={t.aura.showOnProfile} />
                  ) : (
                    <span className="t-caption text-[var(--color-label-3)]">{t.aura.noHighlights}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="t-caption mt-4 border-t border-[var(--color-hairline)] pt-4 text-[var(--color-label-3)]">
          <strong className="text-[var(--color-label-2)]">{t.aura.howTitle}:</strong> {t.aura.how}
        </p>
      </section>

      {groups.length > 0 && (
        <section className="card rounded-[var(--radius-lg)] p-7">
          <h2 className="t-headline">{t.aura.highlights}</h2>
          <p className="t-caption mb-4 mt-1 text-[var(--color-label-3)]">{t.aura.highlightsHint}</p>
          <Highlights groups={groups} closeLabel={t.aura.close} />
        </section>
      )}

      <ProfileSettings initial={who.profile} origin={origin} t={t.aura} />

      <CirclePanel
        requests={circle.filter((c) => c.status === "pending").map((c) => person(c.memberId))}
        members={circle.filter((c) => c.status === "accepted").map((c) => person(c.memberId))}
        memberOf={memberships.filter((m) => m.status === "accepted").map((m) => person(m.ownerId))}
        t={t.aura}
      />
    </div>
  );
}
