"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { BodyBuild, BodyHeight } from "@/lib/body";
import { BodyFeatures } from "./BodyFeatures";
import { FaceCapture } from "./FaceCapture";

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
  scanStart: string;
  scanHint: string;
  scanSteps: string[];
  scanNoFace: string;
  scanOneFace: string;
  scanCloser: string;
  scanFarther: string;
  scanCenter: string;
  scanFront: string;
  scanTurn: string;
  scanTurnLess: string;
  scanDark: string;
  scanHold: string;
  scanShutter: string;
  scanLoading: string;
  scanDenied: string;
  scanManual: string;
  scanUse: string;
  scanRetake: string;
  scanClose: string;
  guidedCamera: string;
  bodyTitle: string;
  bodyHint: string;
  bodyBuild: string;
  bodyHeight: string;
  builds: Record<BodyBuild, string>;
  heights: Record<BodyHeight, string>;
  bodySkip: string;
  photoN: string;
  consentTitle: string;
  consentAccept: string;
  consentWho: string;
  tipsBubble: string;
  close: string;
};

/** Resultado del análisis de una foto recién subida (lo devuelve onPick). */
export type SlotResult = { ok: boolean; warn?: boolean; message?: string };
type SlotStatus = { state: "ok" | "bad"; message?: string; preview?: string };

/** Huecos de cara (0–2): se pueden hacer con el escáner. El 3 es de medio cuerpo. */
const FACE_SLOTS = [0, 1, 2];

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
  consent,
  t,
}: {
  urls: (string | undefined)[];
  /** Sube la foto; `scanned` = la hizo el escáner (ya comprobó que hay una sola cara). */
  onPick: (file: File, slot: number, scanned?: boolean) => Promise<SlotResult | void>;
  onRemove?: (slot: number) => void;
  disabled?: boolean;
  busySlot?: number;
  /**
   * Consentimiento para usar fotos de su cara. Si aún no lo dio, se le pide
   * en una ventana al tocar una foto o el escáner (antes de que nada salga del móvil).
   */
  consent?: { given: boolean; text: ReactNode; biometric: ReactNode; onGive: () => void };
  t: PhotoGuideLabels;
}) {
  const [open, setOpen] = useState<number>();
  const [tips, setTips] = useState(false);
  const [scan, setScan] = useState<number[]>();
  const [status, setStatus] = useState<Record<number, SlotStatus>>({});
  const [bubble, setBubble] = useState(true);
  // Lo que quería hacer cuando se le pidió el consentimiento (se hace al aceptar).
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [ticks, setTicks] = useState({ a: false, b: false });
  const guard = (action: () => void) => (consent && !consent.given ? setPending(() => action) : action());
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);

  /** Sube y guarda el veredicto del hueco: borde verde o rojo y su mensaje debajo. */
  async function send(file: File, slot: number, scanned = false) {
    setBubble(false);
    const res = await onPick(file, slot, scanned);
    if (!res) return;
    setStatus((prev) => {
      if (prev[slot]?.preview) URL.revokeObjectURL(prev[slot].preview!);
      const good = res.ok && !res.warn;
      // Rechazada: se enseña igual (en rojo) para que vea cuál era y por qué.
      return { ...prev, [slot]: { state: good ? "ok" : "bad", message: good ? undefined : res.message, preview: res.ok ? undefined : URL.createObjectURL(file) } };
    });
  }

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (file && open !== undefined) void send(file, open);
    setOpen(undefined);
  }

  const clear = (slot: number) =>
    setStatus((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  const notes = Object.entries(status).filter(([, st]) => st.state === "bad" && st.message);
  const empty = urls.every((u) => !u) && !Object.keys(status).length;

  return (
    <div className="space-y-3">
      {!disabled && FACE_SLOTS.some((i) => !urls[i]) && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => guard(() => setScan(FACE_SLOTS.filter((i) => !urls[i])))}
            className="interactive t-sub w-full rounded-full bg-white px-4 py-2.5 font-medium text-black"
          >
            ◎ {t.scanStart}
          </button>
          <p className="t-caption text-center text-[var(--color-label-3)]">{t.scanHint}</p>
        </div>
      )}
      {scan && (
        <FaceCapture
          slots={scan}
          t={t}
          onClose={() => setScan(undefined)}
          onDone={async (shots) => {
            setScan(undefined);
            for (const s of shots) await send(s.file, s.slot, true);
          }}
        />
      )}
      {empty && bubble && (
        <div className="relative rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-3 pr-8 shadow-lg ring-1 ring-[var(--color-hairline-strong)]">
          <p className="t-caption mb-1 font-medium text-[var(--color-label-1)]">{t.tipsBubble}</p>
          <ul className="t-caption space-y-0.5 text-[var(--color-label-2)]">
            {t.good.map((g) => <li key={g}>✓ {g}</li>)}
          </ul>
          <button type="button" aria-label={t.close} onClick={() => setBubble(false)} className="absolute right-2 top-2 text-[var(--color-label-3)]">
            ✕
          </button>
          {/* Pico de la burbuja apuntando a las fotos. */}
          <span className="absolute -bottom-1.5 left-8 h-3 w-3 rotate-45 bg-[var(--color-surface-2)] ring-1 ring-[var(--color-hairline-strong)] [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
        </div>
      )}
      <div className="grid grid-cols-4 gap-2.5">
        {t.slots.map((slot, i) => {
          const st = status[i];
          const url = urls[i] ?? st?.preview;
          const rejected = !urls[i] && !!st?.preview;
          const frame = st?.state === "ok" && urls[i] ? "border-2 border-emerald-400" : st?.state === "bad" ? "border-2 border-rose-500" : url ? "border-transparent" : "border-dashed border-[var(--color-hairline-strong)] bg-[var(--color-surface-2)]";
          return (
            <div key={i} className="space-y-1">
              <button
                type="button"
                disabled={disabled && !url}
                onClick={() => (urls[i] ? undefined : guard(() => setOpen(open === i ? undefined : i)))}
                className={`relative block aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-md)] border ${frame} ${open === i ? "ring-2 ring-white" : ""} disabled:opacity-50`}
              >
                {st && (
                  <span className={`absolute right-1 top-1 z-10 grid h-5 w-5 place-items-center rounded-full text-[11px] font-bold text-black ${st.state === "ok" ? "bg-emerald-400" : "bg-rose-500"}`}>
                    {st.state === "ok" ? "✓" : rejected ? "✗" : "!"}
                  </span>
                )}
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className={`h-full w-full object-cover ${rejected ? "opacity-60" : ""}`} />
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
              {urls[i] && onRemove ? (
                <button type="button" onClick={() => { clear(i); onRemove(i); }} className="t-caption w-full text-center text-[var(--color-label-3)] underline">
                  {t.remove}
                </button>
              ) : (
                <p className="text-center text-[11px] leading-tight text-[var(--color-label-2)]">{slot.title}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Qué falla en cada foto, justo debajo de las fotos. */}
      {notes.length > 0 && (
        <ul className="space-y-1.5">
          {notes.map(([slot, st]) => (
            <li key={slot} className="t-caption rounded-[var(--radius-md)] border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-100">
              <strong>{t.photoN.replace("{n}", String(Number(slot) + 1))}:</strong> {st.message}
            </li>
          ))}
        </ul>
      )}

      {pending &&
        consent &&
        createPortal(
          <div className="fixed inset-0 z-[90] flex items-end bg-black/60 sm:items-center" role="dialog" aria-modal="true" onClick={() => setPending(null)}>
            <div
              className="w-full space-y-4 rounded-t-[var(--radius-xl)] bg-[var(--color-surface-2)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-[var(--color-label-1)] sm:mx-auto sm:max-w-md sm:rounded-[var(--radius-xl)]"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="t-headline">{t.consentTitle}</p>
              <label className="t-sub flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
                <input type="checkbox" checked={ticks.a} onChange={(e) => setTicks((x) => ({ ...x, a: e.target.checked }))} className="mt-[3px] h-4 w-4 shrink-0 accent-emerald-500" />
                <span>{consent.text}</span>
              </label>
              <label className="t-sub flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
                <input type="checkbox" checked={ticks.b} onChange={(e) => setTicks((x) => ({ ...x, b: e.target.checked }))} className="mt-[3px] h-4 w-4 shrink-0 accent-emerald-500" />
                <span>
                  {consent.biometric}{" "}
                  {/* La lista de proveedores, en la política de privacidad (se actualiza sin volver a pedir esto). */}
                  <a href="/privacy#providers" target="_blank" className="underline">{t.consentWho}</a>
                </span>
              </label>
              <button
                type="button"
                disabled={!ticks.a || !ticks.b}
                onClick={() => {
                  const go = pending;
                  consent.onGive();
                  setPending(null);
                  go();
                }}
                className="interactive t-sub w-full rounded-full bg-white px-4 py-2.5 font-medium text-black disabled:opacity-40"
              >
                {t.consentAccept}
              </button>
              <button type="button" onClick={() => setPending(null)} className="t-caption w-full text-center text-[var(--color-label-3)] underline">
                {t.cancel}
              </button>
            </div>
          </div>,
          document.body,
        )}

      {open !== undefined && !disabled && (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface-2)] p-3">
          <p className="t-caption text-[var(--color-label-2)]">
            <strong className="text-[var(--color-label-1)]">{t.slots[open].title}:</strong> {t.slots[open].hint}
          </p>
          <div className="flex flex-wrap gap-2">
            {FACE_SLOTS.includes(open) && (
              <button
                type="button"
                onClick={() => {
                  setScan([open]);
                  setOpen(undefined);
                }}
                className="interactive t-sub w-full rounded-full bg-white px-4 py-2 font-medium text-black"
              >
                ◎ {t.guidedCamera}
              </button>
            )}
            <button type="button" onClick={() => camera.current?.click()} className="interactive t-sub flex-1 rounded-full bg-white/10 px-4 py-2 font-medium">
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

      <BodyFeatures t={t} />

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
