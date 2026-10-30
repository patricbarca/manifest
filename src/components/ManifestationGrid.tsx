"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Manifestation } from "@/lib/types";

type SceneEditLabels = { open: string; hint: string; placeholder: string; change: string; changing: string; current: string; next: string; left: string; animate: string; changePaid: string; costNote: string; paidNote: string; discardNote: string; animatePaid: string; animateHint: string; discard: string; errors: Record<string, string> };
type Labels = { remove: Record<string, string>; sceneEdit: SceneEditLabels; edit: string; save: string; cancel: string; titleLabel: string; phraseLabel: string; editHint: string; textBlocked: string; manifested: string; markManifested: string; unmark: string; onProfile: string; profileHint: string; showOnProfile: string; hideFromProfile: string; generating: string; waitingFunds: string; failed: string; close: string; empty: string; options: string; manifestedHint: string };

/** Puede reproducirse en el visor (tiene su clip animado). */
const playable = (m: Manifestation) => m.status === "ready" && !!m.clipUrl;

/**
 * Vista previa animada en la cuadrícula: primero la foto (instantánea) y,
 * cuando la tarjeta entra en pantalla, el highlight de 6 s en bucle
 * (MP4 de ~480p: mucho más ligero que un GIF). Sin animación si la persona
 * pidió menos movimiento o ahorro de datos.
 */
function Preview({ poster, video }: { poster?: string; video?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !video) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (calm) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [video]);
  return (
    <span ref={ref} className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {poster && <img src={poster} alt="" className="h-full w-full object-cover" />}
      {live && video && <video src={video} poster={poster} autoPlay loop muted playsInline preload="auto" className="absolute inset-0 h-full w-full object-cover" />}
    </span>
  );
}

/** Una pantalla del visor: el clip se reproduce solo cuando es la que se ve. */
function Slide({ m, active, near, onSeen }: { m: Manifestation; active: boolean; near: boolean; onSeen: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  // El vídeo aparece (fundido) solo cuando ya puede pintar: hasta entonces se ve su primera imagen.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && onSeen(m.id), { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [m.id, onSeen]);
  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    if (active) void v.play().catch(() => {});
    else v.pause();
  }, [active]);
  // La imagen de la escena ES el primer fotograma de la animación (y en buena calidad).
  const first = m.imageUrl ?? m.highlight?.posterUrl;
  const media = "absolute inset-0 m-auto h-full w-full object-cover sm:max-w-md sm:rounded-2xl";
  return (
    <div ref={ref} data-id={m.id} className="relative h-dvh w-full snap-start snap-always">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {first && <img src={first} alt="" decoding="async" className={media} />}
      {/* Solo la que se ve y sus vecinas cargan el vídeo (copia ligera si la hay). */}
      {near && (
        <video
          ref={vid}
          src={m.playUrl ?? m.clipUrl}
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => setReady(true)}
          onPlaying={() => setReady(true)}
          className={`${media} transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {/* Rueda de carga sobre la primera imagen mientras llega la animación. */}
      {active && !ready && (
        <span role="status" aria-live="polite" className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="rounded-full bg-black/40 p-2.5 backdrop-blur-sm">
            <span className="block h-9 w-9 animate-spin rounded-full border-[3px] border-white/25 border-t-white" />
          </span>
        </span>
      )}
    </div>
  );
}

/**
 * Tus manifestaciones, una por tarjeta. Al tocar se ve su escena; desde ahí
 * se puede marcar como cumplida (✓ Manifestado).
 */
export function ManifestationGrid({ initial, t, locale, paymentsOn = false }: { initial: Manifestation[]; t: Labels; locale: string; paymentsOn?: boolean }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<Manifestation | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ title: "", affirmation: "" });
  const [err, setErr] = useState<string>();
  const [removing, setRemoving] = useState(false);
  const [sceneOpen, setSceneOpen] = useState(false);
  const [sceneNote, setSceneNote] = useState("");
  const [sceneBusy, setSceneBusy] = useState(false);
  // Visor a pantalla completa (deslizar para ver todas) y hoja de opciones de la activa.
  const [viewing, setViewing] = useState(false);
  const [sheet, setSheet] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const pending = items.some((m) => m.status === "queued" || m.status === "generating");

  // Mientras alguna se está creando, se refresca sola cada pocos segundos.
  useEffect(() => {
    if (!pending) return;
    const id = setInterval(async () => {
      const res = await fetch("/api/manifestations").catch(() => null);
      if (res?.ok) setItems((await res.json()).manifestations);
    }, 8000);
    return () => clearInterval(id);
  }, [pending]);

  function show(m: Manifestation | null) {
    setOpen(m);
    // Las que tienen clip se abren en el visor; las fallidas, directamente en opciones (borrar, rehacer).
    setViewing(!!m && playable(m));
    setSheet(!!m && !playable(m));
    setEditing(false);
    setRemoving(false);
    setSceneOpen(false);
    setErr(undefined);
  }

  function replace(m: Manifestation) {
    setItems((xs) => xs.map((x) => (x.id === m.id ? m : x)));
    setOpen(m);
  }

  // Editar escena, paso 1: imagen nueva a partir de la guardada (la animación actual no cambia).
  async function changeImage(m: Manifestation) {
    setSceneBusy(true);
    setErr(undefined);
    const res = await fetch(`/api/manifestations/${m.id}/edit-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: sceneNote.trim() }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setSceneBusy(false);
    if (!res?.ok) return setErr(t.sceneEdit.errors[data?.error] ?? t.sceneEdit.errors.failed);
    replace(data.manifestation);
    setSceneNote("");
  }

  // Paso 2: animar la imagen nueva (1 manifestación). Paso alternativo: descartarla.
  async function animateDraft(m: Manifestation) {
    setSceneBusy(true);
    setErr(undefined);
    const res = await fetch(`/api/manifestations/${m.id}/animate`, { method: "POST" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setSceneBusy(false);
    if (!res?.ok) return setErr(t.sceneEdit.errors[data?.error] ?? t.sceneEdit.errors.failed);
    setItems((xs) => xs.map((x) => (x.id === m.id ? data.manifestation : x)));
    show(null);
  }

  async function discardDraft(m: Manifestation) {
    const res = await fetch(`/api/manifestations/${m.id}/edit-image`, { method: "DELETE" }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) return setErr(t.sceneEdit.errors[data?.error] ?? t.sceneEdit.errors.failed);
    replace(data.manifestation);
  }

  // Borrar para siempre: el registro y sus ficheros.
  async function remove(m: Manifestation) {
    const res = await fetch(`/api/manifestations?id=${encodeURIComponent(m.id)}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return setErr(t.remove.failed);
    setItems((xs) => xs.filter((x) => x.id !== m.id));
    show(null);
  }

  async function toggle(m: Manifestation, change: { manifested?: boolean; onProfile?: boolean; title?: string; affirmation?: string }) {
    const res = await fetch("/api/manifestations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, ...change }),
    });
    if (!res.ok) {
      setErr(t.textBlocked);
      return false;
    }
    const { manifestation } = await res.json();
    setItems((xs) => xs.map((x) => (x.id === m.id ? manifestation : x)));
    setOpen(manifestation);
    return true;
  }

  async function saveText(m: Manifestation) {
    const title = draft.title.trim();
    const affirmation = draft.affirmation.trim();
    const ok = await toggle(m, {
      ...(title && title !== m.title ? { title } : {}),
      ...(affirmation && affirmation !== m.affirmation ? { affirmation } : {}),
    });
    if (ok) setEditing(false);
  }

  const reel = items.filter(playable);
  const activeIdx = open ? reel.findIndex((x) => x.id === open.id) : -1;

  // Al abrir el visor, salta a la que se tocó.
  useEffect(() => {
    if (!viewing || !open) return;
    feed.current?.querySelector(`[data-id="${open.id}"]`)?.scrollIntoView({ block: "start" });
    // Solo al abrir: después manda el scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing]);

  // Mientras el visor está abierto, la página de detrás no se desplaza.
  useEffect(() => {
    if (!viewing && !sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [viewing, sheet]);

  // La que entra en pantalla pasa a ser la activa (sus opciones, su título).
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onSeen = useCallback((id: string) => {
    setOpen((cur) => (cur?.id === id ? cur : (itemsRef.current.find((x) => x.id === id) ?? cur)));
  }, []);
  // Al cambiar de manifestación, se cierran los paneles a medio usar.
  useEffect(() => {
    setEditing(false);
    setRemoving(false);
    setSceneOpen(false);
    setErr(undefined);
  }, [open?.id]);

  if (!items.length) return <p className="t-sub py-6 text-center text-[var(--color-label-2)]">{t.empty}</p>;

  /** Opciones de la manifestación activa: editar texto, editar escena, mostrar en perfil, borrar. */
  const details = open && (
    <>
      {editing ? (
        <div className="space-y-2">
          <label className="block">
            <span className="t-caption text-[var(--color-label-2)]">{t.titleLabel}</span>
            <input value={draft.title} maxLength={60} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="t-body mt-1 w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 outline-none" />
          </label>
          <label className="block">
            <span className="t-caption text-[var(--color-label-2)]">{t.phraseLabel}</span>
            <textarea value={draft.affirmation} maxLength={120} rows={2} onChange={(e) => setDraft((d) => ({ ...d, affirmation: e.target.value }))} className="t-body mt-1 w-full resize-none rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 outline-none" />
          </label>
          <p className="t-caption text-[var(--color-label-3)]">{t.editHint}</p>
          {err && <p className="t-caption text-rose-500">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => saveText(open)} className="interactive t-sub flex-1 rounded-full bg-white px-4 py-2 font-medium text-black">{t.save}</button>
            <button type="button" onClick={() => setEditing(false)} className="t-sub rounded-full bg-white/10 px-4 py-2">{t.cancel}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className="t-headline">{open.title}</p>
            <button
              type="button"
              onClick={() => {
                setDraft({ title: open.title, affirmation: open.affirmation ?? "" });
                setErr(undefined);
                setEditing(true);
              }}
              className="t-caption shrink-0 rounded-full bg-white/10 px-3 py-1"
            >
              ✎ {t.edit}
            </button>
          </div>
          {open.affirmation && <p className="t-sub mt-1 italic text-[var(--color-label-2)]">“{open.affirmation}”</p>}
        </>
      )}
      {playable(open) && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => toggle(open, { manifested: !open.manifestedAt })} className={`interactive t-sub flex-1 rounded-full px-4 py-2 font-medium ${open.manifestedAt ? "bg-white/10" : "bg-emerald-400 text-black"}`}>
              {open.manifestedAt ? t.unmark : `✓ ${t.markManifested}`}
            </button>
            {open.highlight && (
              <button type="button" onClick={() => toggle(open, { onProfile: !open.onProfile })} className="interactive t-sub flex-1 rounded-full bg-white/10 px-4 py-2 font-medium">
                {open.onProfile ? t.hideFromProfile : t.showOnProfile}
              </button>
            )}
          </div>
          <p className="t-caption mt-2 text-[var(--color-label-3)]">{t.manifestedHint}</p>
          {open.highlight && <p className="t-caption mt-1 text-[var(--color-label-3)]">{t.profileHint}</p>}
        </>
      )}
      {sceneOpen ? (
        <div className="mt-4 space-y-2 rounded-[var(--radius-md)] border border-[var(--color-hairline)] p-3">
          {open.draftImageUrl && (
            <div className="grid grid-cols-2 gap-2">
              {[{ src: open.imageUrl, label: t.sceneEdit.current }, { src: open.draftImageUrl, label: t.sceneEdit.next }].map((x) => (
                <figure key={x.label}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={x.src} alt="" className="aspect-[9/16] w-full rounded-[var(--radius-ctl)] object-cover" />
                  <figcaption className="t-caption mt-1 text-center text-[var(--color-label-3)]">{x.label}</figcaption>
                </figure>
              ))}
            </div>
          )}
          <p className="t-caption text-[var(--color-label-2)]">{t.sceneEdit.hint}</p>
          {paymentsOn && <p className="t-caption text-amber-200/90">{open.editPaid ? t.sceneEdit.paidNote : t.sceneEdit.costNote}</p>}
          {(open.draftTries ?? 0) < 3 && (
            <>
              <input
                value={sceneNote}
                onChange={(e) => setSceneNote(e.target.value)}
                maxLength={160}
                placeholder={t.sceneEdit.placeholder}
                className="t-caption w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 outline-none"
              />
              <button type="button" disabled={sceneBusy || sceneNote.trim().length < 2} onClick={() => changeImage(open)} className="interactive t-sub w-full rounded-full bg-white/10 px-4 py-2 font-medium disabled:opacity-40">
                {sceneBusy ? t.sceneEdit.changing : paymentsOn && !open.editPaid ? t.sceneEdit.changePaid : t.sceneEdit.change}
              </button>
            </>
          )}
          <p className="t-caption text-[var(--color-label-3)]">{t.sceneEdit.left.replace("{n}", String(Math.max(0, 3 - (open.draftTries ?? 0))))}</p>
          {open.draftImageUrl && (
            <>
              <p className="t-caption text-[var(--color-label-2)]">{t.sceneEdit.animateHint}</p>
              <div className="flex gap-2">
                <button type="button" disabled={sceneBusy} onClick={() => animateDraft(open)} className="interactive t-sub flex-1 rounded-full bg-white px-4 py-2 font-medium text-black disabled:opacity-40">
                  {paymentsOn && !open.editPaid ? t.sceneEdit.animatePaid : t.sceneEdit.animate}
                </button>
                <button type="button" disabled={sceneBusy} onClick={() => discardDraft(open)} className="t-sub rounded-full bg-white/10 px-4 py-2">{t.sceneEdit.discard}</button>
              </div>
              {paymentsOn && open.editPaid && <p className="t-caption text-[var(--color-label-3)]">{t.sceneEdit.discardNote}</p>}
            </>
          )}
          <button type="button" onClick={() => setSceneOpen(false)} className="t-caption underline text-[var(--color-label-3)]">{t.cancel}</button>
        </div>
      ) : (
        !removing && open.imageUrl && open.status === "ready" && (
          <button type="button" onClick={() => { setSceneOpen(true); setSceneNote(""); setErr(undefined); }} className="t-caption mr-4 mt-4 underline text-[var(--color-label-1)]">
            ✎ {t.sceneEdit.open}
          </button>
        )
      )}
      {err && (removing || sceneOpen) && <p className="t-caption mt-2 text-rose-500">{err}</p>}
      {removing ? (
        <div className="mt-4 space-y-2 rounded-[var(--radius-md)] border border-rose-400/40 p-3">
          <p className="t-caption text-[var(--color-label-2)]">{t.remove.confirm}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => remove(open)} className="interactive t-sub flex-1 rounded-full bg-rose-400 px-4 py-2 font-medium text-black">{t.remove.yes}</button>
            <button type="button" onClick={() => setRemoving(false)} className="t-sub rounded-full bg-white/10 px-4 py-2">{t.cancel}</button>
          </div>
        </div>
      ) : (
        !sceneOpen && (
          <button type="button" onClick={() => { setRemoving(true); setErr(undefined); }} className="t-caption mt-4 underline text-rose-500">
            {t.remove.open}
          </button>
        )
      )}
    </>
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((m) => {
          const poster = m.highlight?.posterUrl ?? m.imageUrl;
          return (
            <button key={m.id} type="button" disabled={m.status === "queued" || m.status === "generating"} onClick={() => show(m)} className="group text-left">
              <span className="relative block aspect-[9/16] overflow-hidden rounded-[var(--radius-md)] bg-white/5">
                {poster ? (
                  <Preview poster={poster} video={m.status === "ready" ? m.highlight?.videoUrl : undefined} />
                ) : (
                  <span className="t-caption grid h-full place-items-center p-3 text-center text-[var(--color-label-3)]">
                    {m.status === "failed" ? t.failed : m.waitingFunds ? t.waitingFunds : t.generating}
                  </span>
                )}
                {m.onProfile && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white" title={t.onProfile}>👁</span>
                )}
                {m.manifestedAt && (
                  <span className="absolute left-2 top-2 rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-medium text-black">✓ {t.manifested}</span>
                )}
              </span>
              <span className="t-sub mt-1.5 block truncate">{m.title}</span>
              <span className="t-caption block text-[var(--color-label-3)]">{new Date(m.createdAt).toLocaleDateString(locale)}</span>
            </button>
          );
        })}
      </div>

      {/* Visor: una manifestación por pantalla, se desliza hacia arriba para ver la siguiente. */}
      {viewing && open && createPortal(
        <div data-dark className="fixed inset-0 z-50 bg-black text-white" role="dialog" aria-modal="true">
          <div ref={feed} className="h-dvh snap-y snap-mandatory overflow-y-auto overscroll-contain">
            {reel.map((m, i) => (
              <Slide key={m.id} m={m} active={m.id === open.id} near={Math.abs(i - activeIdx) <= 1} onSeen={onSeen} />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-[max(14px,env(safe-area-inset-top))]">
            <span className="t-caption text-white/80">{activeIdx + 1}/{reel.length}</span>
            <button type="button" onClick={() => show(null)} aria-label={t.close} className="pointer-events-auto grid h-9 w-9 place-items-center rounded-full bg-white/15 text-lg">✕</button>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-16">
            <div className="mx-auto max-w-md">
              {open.manifestedAt && <span className="t-caption mb-2 inline-block rounded-full bg-emerald-400 px-2 py-0.5 font-medium text-black">✓ {t.manifested}</span>}
              <p className="t-headline">{open.title}</p>
              {open.affirmation && <p className="t-sub mt-1 italic text-white/80">“{open.affirmation}”</p>}
              <div className="pointer-events-auto mt-3 flex gap-2">
                <button type="button" onClick={() => toggle(open, { manifested: !open.manifestedAt })} className={`interactive t-sub flex-1 rounded-full px-4 py-2 font-medium ${open.manifestedAt ? "bg-white/15" : "bg-emerald-400 text-black"}`}>
                  {open.manifestedAt ? t.unmark : `✓ ${t.markManifested}`}
                </button>
                <button type="button" onClick={() => setSheet(true)} className="interactive t-sub rounded-full bg-white/15 px-4 py-2 font-medium">
                  ⋯ {t.options}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Opciones de la activa (o de una fallida), en una hoja que sube desde abajo. */}
      {sheet && open && createPortal(
        <div className="fixed inset-0 z-[60] flex items-end bg-black/60 sm:items-center" role="dialog" aria-modal="true" onClick={() => (viewing ? setSheet(false) : show(null))}>
          <div className="max-h-[85dvh] w-full overflow-y-auto overscroll-contain rounded-t-[var(--radius-xl)] bg-[var(--color-surface-2)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-[var(--color-label-1)] sm:mx-auto sm:max-w-md sm:rounded-[var(--radius-xl)]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-hairline-strong)] sm:hidden" />
            {details}
            <button type="button" onClick={() => (viewing ? setSheet(false) : show(null))} className="t-sub mt-5 w-full rounded-full bg-white/10 px-4 py-2">{t.close}</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
