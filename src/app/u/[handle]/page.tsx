import type { Metadata } from "next";
import Link from "next/link";
import { ProfileHeader } from "@/components/ProfileHeader";
import { CircleRequestButton } from "@/components/CircleRequestButton";
import { Highlights } from "@/components/Highlights";
import { manifestPosts } from "@/lib/social/feed";
import { manifests } from "@/lib/manifest/store";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";
import { canSee, localDay, statsFrom } from "@/lib/social/aura";
import { getDictionary } from "@/lib/i18n/server";
import { clip, pageMeta } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const profile = await social.getProfileByHandle(handle);
  if (!profile) return { robots: { index: false } };
  const title = `${profile.displayName} (@${profile.handle}) — ManifestLifeAI`;
  // Solo los perfiles públicos van a Google; los de círculo o privados, no.
  if (profile.visibility !== "public") return { title, robots: { index: false, follow: false } };
  return pageMeta({
    title,
    description: clip(profile.mantra || profile.bio || `${profile.displayName} on ManifestLifeAI.`),
    path: `/u/${profile.handle}`,
  });
}

/**
 * Perfil público de alguien. Los visitantes ven sus datos, aura y solo los
 * highlights de las manifestaciones que activó. Si eres tú, ves esa misma vista previa.
 */
export default async function UserPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [{ t, locale }, profile, who] = await Promise.all([getDictionary(), social.getProfileByHandle(handle), me()]);
  if (!profile) {
    return <p className="t-body mx-auto max-w-md px-6 py-28 text-center text-[var(--color-label-2)]">{t.aura.notFound}</p>;
  }
  const viewerId = who?.user.id;
  const owner = viewerId === profile.userId;
  const link = viewerId && !owner ? await social.getLink(profile.userId, viewerId) : undefined;
  const circleState = link?.status === "accepted" ? "member" : link ? "pending" : "none";
  const btn = "interactive t-sub flex-1 rounded-[var(--radius-md)] bg-white/10 px-4 py-2 text-center font-medium hover:bg-white/15";
  const requestBtn = viewerId ? (
    <CircleRequestButton handle={profile.handle} initial={circleState} t={t.aura} className={btn} />
  ) : (
    <Link href={`/login?next=/u/${profile.handle}`} className={btn}>{t.aura.requestJoin}</Link>
  );

  if (!(await canSee(profile, viewerId))) {
    return (
      <div className="mx-auto max-w-md space-y-5 px-6 py-24 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/10 text-3xl">{(profile.displayName || "?")[0].toUpperCase()}</span>
        <p className="t-headline">{profile.displayName} <span className="text-[var(--color-label-3)]">@{profile.handle}</span></p>
        <p className="t-sub text-[var(--color-label-2)]">🔒 {profile.visibility === "circle" ? t.aura.circleOnly : t.aura.privateProfile}</p>
        {profile.visibility === "circle" && <div className="flex justify-center">{requestBtn}</div>}
      </div>
    );
  }

  const [views, mine, circle] = await Promise.all([
    social.listViews(profile.userId),
    manifests.list(profile.userId),
    social.listCircle(profile.userId),
  ]);
  const stats = statsFrom(views, localDay("UTC"));
  // Siempre la vista de visitante: un highlight por cada manifestación que activó.
  const posts = manifestPosts(mine);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      {owner && (
        <p className="t-caption rounded-[var(--radius-md)] bg-white/[0.04] px-4 py-3 text-[var(--color-label-2)]">
          👀 {t.aura.previewBanner}
        </p>
      )}
      <ProfileHeader
        profile={profile}
        stats={stats}
        posts={posts.length}
        circle={circle.filter((c) => c.status === "accepted").length}
        t={t}
        locale={locale as Locale}
        actions={
          owner ? (
            <>
              <Link href="/profile" className={btn}>← {t.aura.nav}</Link>
              <Link href="/profile/edit" className={btn}>{t.aura.editProfile}</Link>
            </>
          ) : (
            requestBtn
          )
        }
      />
      {posts.length > 0 ? (
        <Highlights groups={posts} closeLabel={t.aura.close} aiLabel={t.aiLabel} />
      ) : (
        <p className="t-sub py-8 text-center text-[var(--color-label-2)]">{t.aura.noPosts}</p>
      )}
    </div>
  );
}
