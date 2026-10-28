import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ShareProfileButton } from "@/components/ShareProfileButton";
import { CirclePanel } from "@/components/CirclePanel";
import { PeopleSearch } from "@/components/PeopleSearch";
import { Highlights } from "@/components/Highlights";
import { manifestPosts } from "@/lib/social/feed";
import { manifests } from "@/lib/manifest/store";
import { ManifestationGrid } from "@/components/ManifestationGrid";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";
import { localDay, statsFrom } from "@/lib/social/aura";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

type Tab = "manifest" | "today" | "circle";
const TABS: Tab[] = ["manifest", "today", "circle"];

/** Tu perfil: cabecera, highlights y pestañas (publicaciones, hoy, círculo). Los ajustes están en /perfil/editar. */
export default async function PerfilPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const who = await me();
  if (!who) redirect("/entrar?next=/perfil");
  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "manifest";
  const { t, locale } = await getDictionary();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const [views, projects, circle, memberships, mine] = await Promise.all([
    social.listViews(who.user.id),
    db.listProjects(who.user.id),
    social.listCircle(who.user.id),
    social.listMemberships(who.user.id),
    manifests.list(who.user.id),
  ]);
  // Sin zona horaria del navegador en el servidor: se usa UTC para "hoy" en la página.
  const stats = statsFrom(views, localDay("UTC"));
  const people = await social.getProfiles([...circle.map((c) => c.memberId), ...memberships.map((m) => m.ownerId)]);
  const person = (id: string) => {
    const p = people.find((x) => x.userId === id);
    return { userId: id, handle: p?.handle ?? "", displayName: p?.displayName ?? "", avatarUrl: p?.avatarUrl };
  };
  const ready = projects.filter((p) => p.status === "ready");
  // Arriba, los mismos círculos que ven los demás: las manifestaciones que muestra.
  const groups = manifestPosts(mine);
  const members = circle.filter((c) => c.status === "accepted");
  const pending = circle.filter((c) => c.status === "pending");
  const btn = "interactive t-sub flex-1 rounded-[var(--radius-md)] bg-white/10 px-4 py-2 text-center font-medium hover:bg-white/15";
  const tabLabel: Record<Tab, string> = { manifest: t.manifest.tab, today: t.aura.tabToday, circle: t.aura.circleShort };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <ProfileHeader
        profile={who.profile}
        stats={stats}
        posts={groups.length}
        circle={members.length}
        t={t}
        locale={locale as Locale}
        actions={
          <>
            <Link href="/perfil/editar" className={btn}>{t.aura.editProfile}</Link>
            {who.profile.visibility === "private" ? (
              <Link href={`/u/${who.profile.handle}`} className={btn}>{t.aura.viewAsVisitor}</Link>
            ) : (
              <ShareProfileButton url={`${origin}/u/${who.profile.handle}`} label={t.aura.shareProfile} copied={t.aura.copied} className={btn} />
            )}
          </>
        }
      />

      {who.profile.visibility === "private" && (
        <p className="t-caption rounded-[var(--radius-md)] bg-white/[0.04] px-4 py-3 text-[var(--color-label-2)]">
          🔒 {t.aura.privateNote}{" "}
          <Link href="/perfil/editar" className="underline">{t.aura.change}</Link>
        </p>
      )}

      {pending.length > 0 && tab !== "circle" && (
        <Link href="/perfil?tab=circle" className="t-sub block rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] px-4 py-3">
          👋 {fill(t.aura.pendingRequests, { n: pending.length })}
        </Link>
      )}

      {groups.length > 0 && <Highlights groups={groups} closeLabel={t.aura.close} aiLabel={t.aiLabel} />}

      <nav className="flex border-b border-[var(--color-hairline)]">
        {TABS.map((k) => (
          <Link
            key={k}
            href={k === "manifest" ? "/perfil" : `/perfil?tab=${k}`}
            scroll={false}
            className={`t-sub flex-1 border-b-2 pb-3 text-center ${tab === k ? "border-white font-medium text-[var(--color-label-1)]" : "border-transparent text-[var(--color-label-3)]"}`}
          >
            {tabLabel[k]}
            {k === "circle" && pending.length > 0 && <span className="ml-1.5 rounded-full bg-rose-400 px-1.5 text-[11px] text-black">{pending.length}</span>}
          </Link>
        ))}
      </nav>

      {tab === "manifest" && (
        <div className="flex gap-2">
          <Link href="/manifestar" className="interactive t-sub flex-1 rounded-full bg-white px-4 py-2 text-center font-medium text-black">+ {t.manifest.newButton}</Link>
          {mine.some((x) => x.status === "ready") && (
            <Link href="/mi-video" className="interactive t-sub flex-1 rounded-full border border-[var(--color-hairline-strong)] px-4 py-2 text-center font-medium">▶ {t.manifest.composeButton}</Link>
          )}
        </div>
      )}
      {tab === "manifest" && (
        <ManifestationGrid
          initial={mine}
          locale={locale}
          t={{ edit: t.manifest.edit, save: t.manifest.save, cancel: t.manifest.cancel, titleLabel: t.manifest.titleField, phraseLabel: t.manifest.phraseField, editHint: t.manifest.editHint, textBlocked: t.aura.errors.text_blocked, manifested: t.manifest.manifested, markManifested: t.manifest.markManifested, unmark: t.manifest.unmark, onProfile: t.manifest.onProfile, profileHint: t.manifest.profileHint, showOnProfile: t.manifest.showOnProfile, hideFromProfile: t.manifest.hideFromProfile, generating: t.manifest.generating, failed: t.manifest.failed, close: t.aura.close, empty: t.manifest.empty }}
        />
      )}

      {tab === "today" && (
        <section>
          {ready.length === 0 ? (
            <p className="t-sub text-[var(--color-label-2)]">{t.aura.noManifestations}</p>
          ) : (
            <ul className="divide-y divide-[var(--color-hairline)]">
              {ready.map((p) => (
                <li key={p.id}>
                  <Link href={`/video/${p.id}`} className="flex items-center gap-3 py-3">
                    {p.highlights?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.highlights[0].posterUrl} alt="" className="h-14 w-10 shrink-0 rounded object-cover" />
                    ) : (
                      <span className="h-14 w-10 shrink-0 rounded bg-white/10" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="t-sub block truncate">{p.script?.title || p.title}</span>
                      <span className="t-caption text-[var(--color-label-3)]">{(stats.daysByProject[p.id] ?? 0) === 1 ? t.aura.viewedOneDay : fill(t.aura.viewedDays, { n: stats.daysByProject[p.id] ?? 0 })}</span>
                    </span>
                    <span className={`t-caption shrink-0 ${stats.viewedToday.includes(p.id) ? "text-emerald-300" : "text-[var(--color-label-3)]"}`}>
                      {stats.viewedToday.includes(p.id) ? t.aura.viewedToday : t.aura.notToday}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="t-caption mt-4 border-t border-[var(--color-hairline)] pt-4 text-[var(--color-label-3)]">
            <strong className="text-[var(--color-label-2)]">{t.aura.howTitle}:</strong> {t.aura.how}
          </p>
        </section>
      )}

      {tab === "circle" && (
        <PeopleSearch t={{ placeholder: t.feed.searchPlaceholder, none: t.feed.searchNone, circleOnly: t.feed.searchCircleOnly }} />
      )}
      {tab === "circle" && (
        <CirclePanel
          requests={pending.map((c) => person(c.memberId))}
          members={members.map((c) => person(c.memberId))}
          memberOf={memberships.filter((m) => m.status === "accepted").map((m) => person(m.ownerId))}
          t={t.aura}
        />
      )}
    </div>
  );
}
