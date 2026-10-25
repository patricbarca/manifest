"use client";

import { useEffect, useRef, useState } from "react";

export type HighlightGroup = { id: string; title: string; items: { videoUrl: string; posterUrl: string }[] };

/**
 * Highlights como en Instagram: un círculo por vídeo. Al tocar se ven sus
 * escenas animadas a pantalla completa, sin sonido, una detrás de otra.
 */
export function Highlights({ groups, closeLabel }: { groups: HighlightGroup[]; closeLabel: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
      {groups.map((group, g) => (
        <button key={group.id} type="button" onClick={() => setOpen(g)} className="interactive flex w-[76px] shrink-0 flex-col items-center gap-1.5">
          <span className="rounded-full bg-gradient-to-tr from-amber-300 via-rose-400 to-fuchsia-500 p-[2px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={group.items[0].posterUrl} alt="" className="h-[68px] w-[68px] rounded-full border-2 border-[var(--color-bg,#000)] object-cover" />
          </span>
          <span className="t-caption w-full truncate text-center text-[var(--color-label-2)]">{group.title}</span>
        </button>
      ))}
      {open !== null && <Viewer group={groups[open]} start={0} onClose={() => setOpen(null)} closeLabel={closeLabel} />}
    </div>
  );
}

export function Viewer({ group, start, onClose, closeLabel }: { group: HighlightGroup; start: number; onClose: () => void; closeLabel: string }) {
  const [i, setI] = useState(start);
  const [progress, setProgress] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);
  const next = () => (i + 1 < group.items.length ? (setI(i + 1), setProgress(0)) : onClose());
  const prev = () => (i > 0 ? (setI(i - 1), setProgress(0)) : undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const item = group.items[i];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" role="dialog" aria-modal="true">
      <div className="relative aspect-[9/16] h-full max-h-[100dvh] w-auto max-w-full overflow-hidden sm:max-h-[90dvh] sm:rounded-2xl">
        <video
          ref={ref}
          key={item.videoUrl}
          src={item.videoUrl}
          poster={item.posterUrl}
          autoPlay
          muted
          playsInline
          onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
          onEnded={next}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-3 top-3 flex gap-1">
          {group.items.map((_, k) => (
            <span key={k} className="h-0.5 flex-1 overflow-hidden rounded bg-white/30">
              <span className="block h-full bg-white" style={{ width: `${k < i ? 100 : k === i ? progress * 100 : 0}%` }} />
            </span>
          ))}
        </div>
        <p className="t-caption absolute left-3 top-6 max-w-[75%] truncate text-white/90">{group.title}</p>
        <button type="button" onClick={prev} className="absolute inset-y-0 left-0 w-1/3" aria-label="←" />
        <button type="button" onClick={next} className="absolute inset-y-0 right-0 w-2/3" aria-label="→" />
        <button type="button" onClick={onClose} className="absolute right-3 top-5 rounded-full bg-black/40 px-3 py-1 text-[13px] text-white">
          {closeLabel}
        </button>
      </div>
    </div>
  );
}
