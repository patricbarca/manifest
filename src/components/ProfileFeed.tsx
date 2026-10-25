"use client";

import Link from "next/link";
import { useState } from "react";
import { Viewer, type HighlightGroup } from "./Highlights";

export type FeedPost = HighlightGroup & { shared: boolean };

/**
 * Feed del perfil, en rejilla como Instagram. Quien visita solo ve las escenas
 * animadas (sin sonido); el dueño abre su vídeo completo.
 */
export function ProfileFeed({
  posts,
  owner,
  labels,
}: {
  posts: FeedPost[];
  owner: boolean;
  labels: { close: string; onlyYou: string; scenes: string; create?: string };
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {owner && labels.create && (
          <Link
            href="/crear"
            className="interactive grid aspect-[9/16] place-items-center rounded-sm border border-dashed border-[var(--color-hairline-strong)] text-center hover:bg-white/5"
          >
            <span>
              <span className="block text-3xl leading-none">+</span>
              <span className="t-caption mt-2 block px-2 text-[var(--color-label-2)]">{labels.create}</span>
            </span>
          </Link>
        )}
        {posts.map((post, i) => {
          const cover = post.items[0]?.posterUrl;
          const tile = (
            <>
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              ) : (
                <span className="t-caption grid h-full w-full place-items-center bg-gradient-to-br from-rose-300/30 via-fuchsia-400/20 to-sky-400/30 p-2 text-center">{post.title}</span>
              )}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
                <span className="block truncate text-[12px] font-medium text-white">{post.title}</span>
                {post.items.length > 0 && <span className="text-[11px] text-white/70">{post.items.length} {labels.scenes}</span>}
              </span>
              <span className="absolute right-1.5 top-1.5 text-white drop-shadow" aria-hidden>
                ▶
              </span>
              {owner && !post.shared && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">{labels.onlyYou}</span>
              )}
            </>
          );
          const cls = "group relative aspect-[9/16] overflow-hidden rounded-sm bg-white/5";
          return owner ? (
            <Link key={post.id} href={`/video/${post.id}`} className={cls}>
              {tile}
            </Link>
          ) : (
            <button key={post.id} type="button" onClick={() => setOpen(i)} className={cls}>
              {tile}
            </button>
          );
        })}
      </div>
      {open !== null && <Viewer group={posts[open]} start={0} onClose={() => setOpen(null)} closeLabel={labels.close} />}
    </>
  );
}
