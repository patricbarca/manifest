import Link from "next/link";
import { AuraSummary } from "@/components/AuraSummary";
import { CircleRequestButton } from "@/components/CircleRequestButton";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";
import { canSee, localDay, statsFrom } from "@/lib/social/aura";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

/** Perfil de otra persona: solo aura, nivel y racha, si su visibilidad lo permite. */
export default async function UserPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [{ t, locale }, profile, who] = await Promise.all([getDictionary(), social.getProfileByHandle(handle), me()]);
  if (!profile) {
    return <p className="t-body mx-auto max-w-md px-6 py-28 text-center text-[var(--color-label-2)]">{t.aura.notFound}</p>;
  }
  const viewerId = who?.user.id;
  if (await canSee(profile, viewerId)) {
    const stats = statsFrom(await social.listViews(profile.userId), localDay("UTC"));
    return (
      <div className="mx-auto max-w-2xl px-6 py-14">
        <AuraSummary profile={profile} stats={stats} t={t} locale={locale as Locale} />
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
