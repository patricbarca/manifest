import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/locale";
import { ACHIEVEMENTS, levelFor, type AuraStats } from "@/lib/social/aura";
import type { Profile } from "@/lib/social/types";
import { fill } from "@/lib/i18n";

/** Nombre, aura, nivel, racha y logros. Es lo único que ven los demás. */
export function AuraSummary({ profile, stats, t, locale }: { profile: Profile; stats: AuraStats; t: Dictionary; locale: Locale }) {
  const { level, next, progress } = levelFor(stats.aura);
  const got = ACHIEVEMENTS.filter((a) => a.test(stats));
  return (
    <section className="card rounded-[var(--radius-lg)] p-7">
      <div className="flex items-center gap-4">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-white/10 text-xl">{(profile.displayName || "?")[0].toUpperCase()}</span>
        )}
        <div>
          <p className="t-headline">{profile.displayName}</p>
          <p className="t-caption text-[var(--color-label-3)]">@{profile.handle}</p>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-[var(--radius-md)] bg-white/[0.04] p-4">
          <p className="text-[2rem] font-semibold leading-none tabular-nums">{stats.aura}</p>
          <p className="t-caption mt-2 text-[var(--color-label-3)]">{t.aura.aura}</p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-white/[0.04] p-4">
          <p className="text-[1.25rem] font-semibold leading-tight">{level.name[locale]}</p>
          <p className="t-caption mt-2 text-[var(--color-label-3)]">{t.aura.level}</p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-white/[0.04] p-4">
          <p className="text-[2rem] font-semibold leading-none tabular-nums">{stats.streak}</p>
          <p className="t-caption mt-2 text-[var(--color-label-3)]">{t.aura.streak} · {t.aura.days}</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#FFB27A] via-[#F2B8A6] to-[#8B78C4]" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p className="t-caption mt-2 text-[var(--color-label-3)]">
          {next ? fill(t.aura.toNext, { n: next.min - stats.aura, level: next.name[locale] }) : t.aura.maxLevel}
          {" · "}
          {fill(t.aura.best, { n: stats.bestStreak })}
        </p>
      </div>

      {got.length > 0 && (
        <div className="mt-6">
          <p className="t-caption mb-2 text-[var(--color-label-2)]">{t.aura.achievements}</p>
          <div className="flex flex-wrap gap-2">
            {got.map((a) => (
              <span key={a.id} className="t-caption rounded-full border border-[var(--color-hairline-strong)] px-3 py-1">✨ {a.name[locale]}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
