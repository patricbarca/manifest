"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Viewer, type HighlightGroup } from "./Highlights";

type Author = { handle: string; displayName: string; avatarUrl?: string };

/** Avatar pequeño con inicial de respaldo. */
function Avatar({ a }: { a: Author }) {
  return a.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={a.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full object-cover" />
  ) : (
    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm">{(a.displayName || "?")[0].toUpperCase()}</span>
  );
}

/** Reproduce el vídeo solo cuando está en pantalla (ahorra datos y batería). */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

/**
 * Publicación de alguien de tu círculo: sus escenas animadas, sin sonido,
 * una tras otra. Al tocar se abren a pantalla completa.
 */
export function CirclePostCard({ author, post, closeLabel, youLabel, isYou, aiLabel }: { author: Author; post: HighlightGroup; closeLabel: string; youLabel: string; isYou: boolean; aiLabel: string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const { ref, inView } = useInView<HTMLVideoElement>();
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (inView) void v.play().catch(() => undefined);
    else v.pause();
  }, [inView, i, ref]);
  const item = post.items[i];
  return (
    <article className="card overflow-hidden rounded-[var(--radius-lg)]">
      <Link href={`/u/${author.handle}`} className="flex items-center gap-3 px-4 py-3">
        <Avatar a={author} />
        <span className="min-w-0">
          <span className="t-sub block truncate font-medium">{isYou ? youLabel : author.displayName}</span>
          <span className="t-caption block truncate text-[var(--color-label-3)]">@{author.handle}</span>
        </span>
      </Link>
      <button type="button" onClick={() => setOpen(true)} className="relative block aspect-[4/5] w-full bg-black">
        <video
          ref={ref}
          key={item.videoUrl}
          src={item.videoUrl}
          poster={item.posterUrl}
          muted
          playsInline
          preload="none"
          onEnded={() => setI((i + 1) % post.items.length)}
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-x-3 top-3 flex gap-1">
          {post.items.map((_, k) => (
            <span key={k} className={`h-0.5 flex-1 rounded ${k <= i ? "bg-white" : "bg-white/30"}`} />
          ))}
        </span>
        {item.label && <span className="t-caption absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-white">{item.label}</span>}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white/85">✦ {aiLabel}</span>
      </button>
      <p className="t-sub px-4 py-3">{post.title}</p>
      {open && <Viewer group={post} start={i} onClose={() => setOpen(false)} closeLabel={closeLabel} aiLabel={aiLabel} />}
    </article>
  );
}

/** Plantilla del market dentro del feed, con su clip de ejemplo y el botón para hacerla. */
export function MarketCard({
  slug,
  tier,
  title,
  summary,
  video,
  poster,
  labels,
}: {
  slug: string;
  tier: string;
  title: string;
  summary: string;
  video?: string;
  poster?: string;
  labels: { fromMarket: string; makeIt: string };
}) {
  const { ref, inView } = useInView<HTMLVideoElement>();
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (inView) void v.play().catch(() => undefined);
    else v.pause();
  }, [inView, ref]);
  return (
    <article className="card overflow-hidden rounded-[var(--radius-lg)]">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="t-caption rounded-full bg-gradient-to-r from-[#FFB27A]/25 via-[#F2B8A6]/25 to-[#8B78C4]/25 px-2.5 py-1">✨ {labels.fromMarket}</span>
      </div>
      <Link href={`/market/${slug}`} className="relative block aspect-[4/5] w-full bg-black">
        {video ? (
          <video ref={ref} src={video} poster={poster} muted loop playsInline preload="none" className="h-full w-full object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          poster && <img src={poster} alt="" className="h-full w-full object-cover" />
        )}
      </Link>
      <div className="space-y-2 px-4 py-3">
        <p className="t-sub font-medium">{title}</p>
        <p className="t-caption text-[var(--color-label-2)]">{summary}</p>
        <Link href={`/create?template=${slug}&tier=${tier}`} className="interactive mt-1 inline-block rounded-full bg-white px-5 py-2 text-[14px] font-medium text-black">
          {labels.makeIt}
        </Link>
      </div>
    </article>
  );
}
