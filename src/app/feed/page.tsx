import Link from "next/link";
import { redirect } from "next/navigation";
import { CirclePostCard, MarketCard } from "@/components/FeedCards";
import { PeopleSearch } from "@/components/PeopleSearch";
import { feedPosts } from "@/lib/social/feed";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";
import { canSee } from "@/lib/social/aura";
import { TEMPLATES, templatePreview } from "@/lib/templates";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locale";
import type { Profile } from "@/lib/social/types";
import type { FeedPost } from "@/components/ProfileFeed";

export const dynamic = "force-dynamic";

type Item = { kind: "post"; author: Profile; post: FeedPost } | { kind: "market"; slug: string };
const MARKET_EVERY = 2;
const MARKET_MAX = 8;

/**
 * Feed: lo que comparten las personas de cuyos círculos formas parte (y lo
 * tuyo), mezclado con plantillas del market para hacerlas.
 */
type Filter = "all" | "circle" | "market";
const FILTERS: Filter[] = ["all", "circle", "market"];

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const who = await me();
  if (!who) redirect("/entrar?next=/feed");
  const { t, locale } = await getDictionary();
  const loc = locale as Locale;
  const { f } = await searchParams;
  const filter: Filter = FILTERS.includes(f as Filter) ? (f as Filter) : "all";

  const memberships = (await social.listMemberships(who.user.id)).filter((m) => m.status === "accepted");
  const authors = [who.profile, ...(await social.getProfiles(memberships.map((m) => m.ownerId)))];
  const posts: { author: Profile; post: FeedPost }[] = [];
  for (const author of authors) {
    // Lo mismo que vería en su perfil: si ahora es privado, no sale.
    if (!(await canSee(author, who.user.id))) continue;
    for (const post of feedPosts(await db.listProjects(author.userId), false)) posts.push({ author, post });
  }
  posts.sort((a, b) => (b.post.createdAt ?? 0) - (a.post.createdAt ?? 0));

  // Plantillas con clip, en un orden que cambia cada día.
  const day = Math.floor(Date.now() / 86_400_000);
  const market = TEMPLATES.filter((tpl) => templatePreview(tpl.slug).video)
    .map((tpl, i) => ({ tpl, k: (i * 7919 + day * 104729) % 1009 }))
    .sort((a, b) => a.k - b.k)
    .slice(0, filter === "market" ? undefined : MARKET_MAX)
    .map((x) => x.tpl.slug);

  const items: Item[] = [];
  if (filter === "circle") {
    posts.forEach((p) => items.push({ kind: "post", ...p }));
  } else if (filter === "market") {
    market.forEach((slug) => items.push({ kind: "market", slug }));
  } else {
    let m = 0;
    posts.forEach((p, i) => {
      items.push({ kind: "post", ...p });
      if ((i + 1) % MARKET_EVERY === 0 && m < market.length) items.push({ kind: "market", slug: market[m++] });
    });
    while (m < market.length) items.push({ kind: "market", slug: market[m++] });
  }
  const filterLabel: Record<Filter, string> = { all: t.feed.all, circle: t.feed.circle, market: t.feed.market };

  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-10">
      <div>
        <h1 className="t-title">{t.feed.title}</h1>
        <p className="t-sub mt-1 text-[var(--color-label-2)]">{t.feed.subtitle}</p>
      </div>
      <nav className="flex gap-2">
        {FILTERS.map((k) => (
          <Link
            key={k}
            href={k === "all" ? "/feed" : `/feed?f=${k}`}
            scroll={false}
            className={`t-sub rounded-full px-4 py-1.5 ${filter === k ? "bg-white font-medium text-black" : "border border-[var(--color-hairline)] text-[var(--color-label-2)]"}`}
          >
            {filterLabel[k]}
          </Link>
        ))}
      </nav>
      {filter === "circle" && (
        <PeopleSearch t={{ placeholder: t.feed.searchPlaceholder, none: t.feed.searchNone, circleOnly: t.feed.searchCircleOnly }} />
      )}
      {posts.length === 0 && filter !== "market" && (
        <p className="t-caption rounded-[var(--radius-md)] bg-white/[0.04] px-4 py-3 text-[var(--color-label-2)]">
          {t.feed.empty}{" "}
          {filter !== "circle" && <Link href="/feed?f=circle" className="underline">{t.feed.findPeople}</Link>}
        </p>
      )}
      {items.map((it) => {
        if (it.kind === "post") {
          return (
            <CirclePostCard
              key={it.post.id}
              author={{ handle: it.author.handle, displayName: it.author.displayName, avatarUrl: it.author.avatarUrl }}
              post={it.post}
              closeLabel={t.aura.close}
              youLabel={t.feed.you}
              isYou={it.author.userId === who.user.id}
              aiLabel={t.aiLabel}
            />
          );
        }
        const tpl = TEMPLATES.find((x) => x.slug === it.slug)!;
        const pv = templatePreview(tpl.slug);
        return (
          <MarketCard
            key={`m-${tpl.slug}`}
            slug={tpl.slug}
            tier={tpl.tier}
            title={tpl.title[loc]}
            summary={tpl.summary[loc]}
            video={pv.video}
            poster={pv.poster}
            labels={{ fromMarket: t.feed.fromMarket, makeIt: t.feed.makeIt }}
          />
        );
      })}
      {filter !== "circle" && <Link href="/market" className="t-sub block text-center underline">{t.feed.more}</Link>}
    </div>
  );
}
