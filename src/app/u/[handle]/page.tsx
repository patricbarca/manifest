import Link from "next/link";
import { AuraSummary } from "@/components/AuraSummary";
import { CircleRequestButton } from "@/components/CircleRequestButton";
import { Highlights } from "@/components/Highlights";
import { ProfileFeed } from "@/components/ProfileFeed";
import { feedPosts } from "@/lib/social/feed";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";
import { canSee, localDay, statsFrom } from "@/lib/social/aura";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

/** Perfil de otra persona: datos del perfil, aura y highlights, si su visibilidad lo permite. */
export default async function UserPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [{ t, locale }, profile, who] = await Promise.all([getDictionary(), social.getProfileByHandle(handle), me()]);
  if (!profile) {
    return <p className="t-body mx-auto max-w-md px-6 py-28 text-center text-[var(--color-label-2)]">{t.aura.notFound}</p>;
  }
  const viewerId = who?.user.id;
  if (await canSee(profile, viewerId)) {
    const [views, projects] = await Promise.all([social.listViews(profile.userId), db.listProjects(profile.userId)]);
    const stats = statsFrom(views, localDay("UTC"));
    // Visitantes: solo highlights (escenas animadas sin sonido) de los vídeos que la persona eligió mostrar.
    // Dueño: todos sus vídeos, y al tocar abre el vídeo completo.
    const owner = viewerId === profile.userId;
    const posts = feedPosts(projects, owner);
    const groups = posts.filter((p) => p.shared);
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-14">
        <AuraSummary profile={profile} stats={stats} t={t} locale={locale as Locale} />
        <section className="card rounded-[var(--radius-lg)] p-5 sm:p-7">
          {groups.length > 0 && (
            <>
              <h2 className="t-headline mb-4">{t.aura.highlights}</h2>
              <Highlights groups={groups} closeLabel={t.aura.close} />
            </>
          )}
          <h2 className={`t-headline mb-4 ${groups.length ? "mt-7" : ""}`}>{t.aura.posts}</h2>
          {posts.length ? (
            <ProfileFeed posts={posts} owner={owner} labels={{ close: t.aura.close, onlyYou: t.aura.onlyYou, scenes: t.aura.scenes }} />
          ) : (
            <p className="t-sub text-[var(--color-label-2)]">{t.aura.noPosts}</p>
          )}
        </section>
      </div>
    );
  }
  const link = viewerId ? await social.getLink(profile.userId, viewerId) : undefined;
  return (
    <div className="mx-auto max-w-md space-y-5 px-6 py-24 text-center">
      <p className="t-headline">{profile.displayName} <span className="text-[var(--color-label-3)]">@{profile.handle}</span></p>
      <p className="t-sub text-[var(--color-label-2)]">{profile.visibility === "circle" ? t.aura.circleOnly : t.aura.privateProfile}</p>
      {profile.visibility === "circle" &&
        (viewerId ? (
          <CircleRequestButton handle={profile.handle} initial={link ? "pending" : "none"} t={t.aura} />
        ) : (
          <Link href={`/entrar?next=/u/${profile.handle}`} className="t-sub underline">{t.aura.signInToRequest}</Link>
        ))}
    </div>
  );
}
