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
};

/** Silueta de ejemplo para cada hueco: de frente sonriendo, de frente suave, de tres cuartos, de cintura para arriba. */
function Guide({ kind }: { kind: number }) {
  const turned = kind === 2;
  const body = kind === 3;
  const smile = kind === 0 ? "M41 60 Q50 69 59 60" : "M43 61 Q50 64 57 61";
  return (
    <svg viewBox="0 0 100 133" className="h-full w-full text-[var(--color-label-3)]" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {body ? (
          <>
            <ellipse cx="50" cy="40" rx="15" ry="19" />
            <path d="M22 133 Q24 80 50 74 Q76 80 78 133" />
            <path d="M44 38 h1 M55 38 h1" strokeWidth="3" />
            <path d="M45 48 Q50 51 55 48" />
          </>
        ) : (
          <>
            <ellipse cx={turned ? 54 : 50} cy="50" rx={turned ? 21 : 24} ry="30" />
            <path d="M14 133 Q18 96 50 90 Q82 96 86 133" />
            {turned ? (
              <>
                <path d="M50 46 h2 M64 46 h2" strokeWidth="3" />
                <path d="M62 52 l3 6 h-4" />
                <path d="M53 62 Q59 66 65 62" />
              </>
            ) : (
              <>
                <path d="M40 46 h2 M58 46 h2" strokeWidth="3" />
                <path d="M50 50 v7" />
                <path d={smile} />
              </>
            )}
          </>
        )}
      </g>
    </svg>
  );
}

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
                  <span className="absolute inset-2 opacity-70"><Guide kind={i} /></span>
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
        <div className="grid gap-3 rounded-[var(--radius-md)] bg-white/[0.04] p-3 sm:grid-cols-2">
          <ul className="t-caption space-y-1 text-[var(--color-label-2)]">
            {t.good.map((g) => <li key={g}>✓ {g}</li>)}
          </ul>
          <ul className="t-caption space-y-1 text-[var(--color-label-3)]">
            {t.bad.map((b) => <li key={b}>✗ {b}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
