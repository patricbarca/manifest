import type { ReactNode } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locale";
import { fill } from "@/lib/i18n";
import { ACHIEVEMENTS, levelFor, type AuraStats } from "@/lib/social/aura";
import type { Profile } from "@/lib/social/types";

/** Cabecera del perfil, como en Instagram: foto, cifras, nombre, bio y acciones. */
export function ProfileHeader({
  profile,
  stats,
  posts,
  circle,
  t,
  locale,
  actions,
}: {
  profile: Profile;
  stats: AuraStats;
  posts: number;
  circle: number;
  t: Dictionary;
  locale: Locale;
  actions?: ReactNode;
}) {
  const { level, next, progress } = levelFor(stats.aura);
  const got = ACHIEVEMENTS.filter((a) => a.test(stats));
  const stat = (n: number | string, label: string) => (
    <div className="text-center">
      <p className="text-[1.15rem] font-semibold leading-tight tabular-nums">{n}</p>
      <p className="t-caption text-[var(--color-label-3)]">{label}</p>
    </div>
  );
  return (
    <section>
      <div className="flex items-center gap-5 sm:gap-8">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt={profile.displayName} referrerPolicy="no-referrer" className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white/10 sm:h-24 sm:w-24" />
        ) : (
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-white/10 text-3xl sm:h-24 sm:w-24">{(profile.displayName || "?")[0].toUpperCase()}</span>
        )}
        <div className="grid flex-1 grid-cols-4 gap-1">
          {stat(posts, t.aura.posts)}
          {stat(stats.aura, t.aura.aura)}
          {stat(stats.streak, t.aura.streak)}
          {stat(circle, t.aura.circleShort)}
        </div>
      </div>

      <div className="mt-4">
        <h1 className="t-headline flex flex-wrap items-center gap-2">
          {profile.displayName}
          <span className="t-caption rounded-full bg-gradient-to-r from-[#FFB27A]/25 via-[#F2B8A6]/25 to-[#8B78C4]/25 px-2.5 py-0.5 text-[var(--color-label-1)]">✨ {level.name[locale]}</span>
        </h1>
        <p className="t-caption text-[var(--color-label-3)]">
          @{profile.handle}
          {profile.location && <> · {profile.location}</>}
        </p>
        {profile.mantra && <p className="t-sub mt-3 italic text-[var(--color-label-1)]">“{profile.mantra}”</p>}
        {profile.bio && <p className="t-sub mt-2 whitespace-pre-line text-[var(--color-label-2)]">{profile.bio}</p>}
        {profile.link && (
          <a href={profile.link} target="_blank" rel="noopener noreferrer nofollow ugc" className="t-sub mt-1 inline-block text-sky-300 underline-offset-2 hover:underline">
            🔗 {linkLabel(profile.link)}
          </a>
        )}
      </div>

      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#FFB27A] via-[#F2B8A6] to-[#8B78C4]" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p className="t-caption mt-1.5 text-[var(--color-label-3)]">
          {next ? fill(t.aura.toNext, { n: next.min - stats.aura, level: next.name[locale] }) : t.aura.maxLevel}
          {" · "}
          {stats.bestStreak === 1 ? t.aura.bestOne : fill(t.aura.best, { n: stats.bestStreak })}
        </p>
      </div>

      {got.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {got.map((a) => (
            <span key={a.id} className="t-caption rounded-full border border-[var(--color-hairline-strong)] px-2.5 py-0.5">✨ {a.name[locale]}</span>
          ))}
        </div>
      )}

      {actions && <div className="mt-5 flex gap-2">{actions}</div>}
    </section>
  );
}

function linkLabel(url: string): string {
  try {
    const u = new URL(url);
    return (u.host + u.pathname).replace(/^www\./, "").replace(/\/$/, "");
  } catch {
    return url;
  }
}
