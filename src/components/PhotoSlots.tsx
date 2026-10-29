"use client";

import { useRef, useState } from "react";

export type PhotoGuideLabels = {
  slots: { title: string; hint: string }[];
  camera: string;
  gallery: string;
  cancel: string;
  remove: string;
  uploading: string;
  tipsTitle: string;
  good: string[];
  bad: string[];
  needConsent: string;
  example: string;
  badLabels: string[];
  aiNote: string;
};

/** Fotos de ejemplo (persona ficticia generada con IA), en el mismo orden que los huecos. */
const GOOD = ["good-smile", "good-soft", "good-three-quarter", "good-waist"];
const BAD = ["bad-profile", "bad-covered", "bad-dark", "bad-filter", "bad-group"];

/**
 * Huecos guiados para las selfies. Cada hueco dice qué foto va ahí y, al
 * tocarlo, deja elegir entre la cámara o la galería. Mejores fotos de
 * referencia = caras más parecidas en las escenas.
 */
export function PhotoSlots({
  urls,
  onPick,
  onRemove,
  disabled,
  busySlot,
  t,
}: {
  urls: (string | undefined)[];
  onPick: (file: File, slot: number) => void;
  onRemove?: (slot: number) => void;
  disabled?: boolean;
  busySlot?: number;
  t: PhotoGuideLabels;
}) {
  const [open, setOpen] = useState<number>();
  const [tips, setTips] = useState(false);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (file && open !== undefined) onPick(file, open);
    setOpen(undefined);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2.5">
        {t.slots.map((slot, i) => {
          const url = urls[i];
          return (
            <div key={i} className="space-y-1">
              <button
                type="button"
                disabled={disabled && !url}
                onClick={() => (url ? undefined : setOpen(open === i ? undefined : i))}
                className={`relative block aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-md)] border ${
                  url ? "border-transparent" : "border-dashed border-[var(--color-hairline-strong)] bg-[var(--color-surface-2)]"
                } ${open === i ? "ring-2 ring-white" : ""} disabled:opacity-50`}
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/photo-guide/${GOOD[i]}.webp`} alt="" className="h-full w-full object-cover opacity-45" />
                    <span className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[9px] uppercase tracking-wide text-white/80">{t.example}</span>
                  </>
                )}
                {!url && <span className="absolute bottom-1 right-1.5 text-[18px] leading-none text-[var(--color-label-2)]">+</span>}
                {busySlot === i && (
                  <span className="t-caption pulse-soft absolute inset-0 grid place-items-center bg-black/60 text-white">{t.uploading}</span>
                )}
              </button>
              {url && onRemove ? (
                <button type="button" onClick={() => onRemove(i)} className="t-caption w-full text-center text-[var(--color-label-3)] underline">
                  {t.remove}
                </button>
              ) : (
                <p className="text-center text-[11px] leading-tight text-[var(--color-label-2)]">{slot.title}</p>
              )}
            </div>
          );
        })}
      </div>

      {disabled && <p className="t-caption text-[var(--color-label-3)]">{t.needConsent}</p>}

      {open !== undefined && !disabled && (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface-2)] p-3">
          <p className="t-caption text-[var(--color-label-2)]">
            <strong className="text-[var(--color-label-1)]">{t.slots[open].title}:</strong> {t.slots[open].hint}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => camera.current?.click()} className="interactive t-sub flex-1 rounded-full bg-white px-4 py-2 font-medium text-black">
              📷 {t.camera}
            </button>
            <button type="button" onClick={() => gallery.current?.click()} className="interactive t-sub flex-1 rounded-full bg-white/10 px-4 py-2 font-medium">
              🖼 {t.gallery}
            </button>
          </div>
          <button type="button" onClick={() => setOpen(undefined)} className="t-caption w-full text-center text-[var(--color-label-3)] underline">
            {t.cancel}
          </button>
        </div>
      )}

      {/* La cámara frontal en el móvil; en el ordenador abre el selector de archivos. */}
      <input ref={camera} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />

      <button type="button" onClick={() => setTips((v) => !v)} className="t-caption text-[var(--color-label-2)] underline">
        {tips ? "−" : "+"} {t.tipsTitle}
      </button>
      {tips && (
        <div className="space-y-3 rounded-[var(--radius-md)] bg-white/[0.04] p-3">
          <div className="grid grid-cols-4 gap-1.5">
            {GOOD.map((g) => (
              <figure key={g} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/photo-guide/${g}.webp`} alt="" loading="lazy" className="aspect-[3/4] w-full rounded object-cover" />
                <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-400 text-[11px] font-bold text-black">✓</span>
              </figure>
            ))}
          </div>
          <ul className="t-caption space-y-1 text-[var(--color-label-2)]">
            {t.good.map((g) => <li key={g}>✓ {g}</li>)}
          </ul>
          <div className="grid grid-cols-5 gap-1.5">
            {BAD.map((b, i) => (
              <figure key={b} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/photo-guide/${b}.webp`} alt="" loading="lazy" className="aspect-[3/4] w-full rounded object-cover opacity-80" />
                <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-400 text-[11px] font-bold text-black">✗</span>
                <figcaption className="mt-0.5 text-center text-[10px] leading-tight text-[var(--color-label-3)]">{t.badLabels[i]}</figcaption>
              </figure>
            ))}
          </div>
          <ul className="t-caption space-y-1 text-[var(--color-label-3)]">
            {t.bad.map((b) => <li key={b}>✗ {b}</li>)}
          </ul>
          <p className="text-[10px] text-[var(--color-label-3)]">{t.aiNote}</p>
        </div>
      )}
    </div>
  );
}
