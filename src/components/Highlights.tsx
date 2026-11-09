"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AuraRing } from "./AuraRing";
import { DEFAULT_AURA, type AuraStyle } from "@/lib/social/aura-style";

export type HighlightItem = { videoUrl: string; posterUrl: string; label?: string; caption?: string };
export type HighlightGroup = { id: string; title: string; items: HighlightItem[] };

/**
 * Highlights como en Instagram: un círculo por escena (cada deseo animado).
 * Al tocar se ven a pantalla completa, sin sonido, y siguen con las demás.
 */
export function Highlights({
  groups,
  closeLabel,
  aiLabel,
  aura = DEFAULT_AURA,
  extra,
}: {
  groups: HighlightGroup[];
  closeLabel: string;
  aiLabel: string;
  /** Aura que eligió el dueño del perfil. */
  aura?: AuraStyle;
  /** Círculo extra al final (en tu perfil: "Editar"). */
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState<number | null>(null);
  // Todas las escenas visibles, en orden, como una sola secuencia de historias.
  const all: HighlightGroup = {
    id: "all",
    title: "",
    // Bajo el círculo, solo lo que eligió (emoji, palabra o nada); en el visor, el título.
    items: groups.flatMap((g) => g.items.map((it) => ({ ...it, caption: it.label, label: g.title }))),
  };
  return (
    <div className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-2 pb-2 pt-2">
      {all.items.map((it, i) => (
        <button key={it.posterUrl} type="button" onClick={() => setOpen(i)} className="interactive flex w-[76px] shrink-0 flex-col items-center gap-1.5">
          <AuraRing style={aura}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.posterUrl} alt="" className="block h-[66px] w-[66px] rounded-full border-2 border-[var(--color-surface-1)] object-cover" />
          </AuraRing>
          {it.caption && <span className="t-caption w-full truncate text-center text-[var(--color-label-2)]">{it.caption}</span>}
        </button>
      ))}
      {extra}
      {open !== null && <Viewer group={all} start={open} onClose={() => setOpen(null)} closeLabel={closeLabel} aiLabel={aiLabel} />}
    </div>
  );
}

export function Viewer({ group, start, onClose, closeLabel, aiLabel }: { group: HighlightGroup; start: number; onClose: () => void; closeLabel: string; aiLabel: string }) {
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
    <div data-dark className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" role="dialog" aria-modal="true">
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
        <p className="t-caption absolute left-3 top-6 max-w-[75%] truncate text-white/90">{item.label || group.title}</p>
        {/* Aviso de contenido generado con IA (AI Act art. 50). */}
        <span className="pointer-events-none absolute bottom-4 left-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white/85">✦ {aiLabel}</span>
        <button type="button" onClick={prev} className="absolute inset-y-0 left-0 w-1/3" aria-label="←" />
        <button type="button" onClick={next} className="absolute inset-y-0 right-0 w-2/3" aria-label="→" />
        <button type="button" onClick={onClose} className="absolute right-3 top-5 rounded-full bg-black/40 px-3 py-1 text-[13px] text-white">
          {closeLabel}
        </button>
      </div>
    </div>
  );
}
