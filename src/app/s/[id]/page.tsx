import type { Metadata } from "next";
import Link from "next/link";
import { CirclePostCard } from "@/components/FeedCards";
import { db } from "@/lib/db/store";
import { social } from "@/lib/social/store";
import { canSee } from "@/lib/social/aura";
import { me } from "@/lib/social/me";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/** Lo que se puede enseñar de un vídeo compartido: solo sus escenas visibles. */
async function load(id: string) {
  const project = await db.getProject(id);
  if (!project?.shared || project.status !== "ready") return null;
  const items = (project.highlights ?? []).filter((h) => !h.hidden);
  if (!items.length) return null;
  const profile = await social.getProfile(project.ownerId);
  return { project, items, profile };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [data, { t }] = await Promise.all([load(id), getDictionary()]);
  if (!data) return { robots: { index: false } };
  const name = data.profile?.displayName || "ManifestLifeAI";
  const title = fill(t.share.pageTitle, { name });
  return {
    title,
    description: t.share.ctaSub,
    robots: { index: false },
    openGraph: { title, description: t.share.ctaSub, images: [data.items[0].posterUrl] },
  };
}

/**
 * Página pública de un vídeo compartido. Enseña las escenas animadas (sin voz
 * ni frases) y lleva a crear el tuyo con el enlace de quien lo compartió.
 */
export default async function SharedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, { t }, who] = await Promise.all([load(id), getDictionary(), me()]);
  if (!data) return <p className="t-body mx-auto max-w-md px-6 py-28 text-center text-[var(--color-label-2)]">{t.share.notShared}</p>;
  const { project, items, profile } = data;
  const name = profile?.displayName || "ManifestLifeAI";
  const ref = profile?.handle ? `?ref=${encodeURIComponent(profile.handle)}` : "";
  const profileVisible = profile ? await canSee(profile, who?.user.id) : false;

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-10">
      <div className="text-center">
        <h1 className="t-headline text-balance">{fill(t.share.pageTitle, { name })}</h1>
        <p className="t-sub mt-1 text-[var(--color-label-2)]">{t.share.pageSub}</p>
      </div>
      <CirclePostCard
        author={{ handle: profile?.handle ?? "", displayName: name, avatarUrl: profileVisible ? profile?.avatarUrl : undefined }}
        post={{ id: project.id, title: project.script?.title || project.title, items }}
        closeLabel={t.aura.close}
        youLabel={t.feed.you}
        isYou={who?.user.id === project.ownerId}
        aiLabel={t.aiLabel}
      />
      <div className="card rounded-[var(--radius-lg)] p-6 text-center">
        <p className="t-sub text-[var(--color-label-2)]">{t.share.ctaSub}</p>
        <Link href={`/${ref}`} className="interactive mt-4 inline-block rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black">
          {t.share.cta}
        </Link>
        {profileVisible && profile && (
          <Link href={`/u/${profile.handle}`} className="t-caption mt-3 block underline">{t.share.seeProfile}</Link>
        )}
      </div>
    </div>
  );
}
