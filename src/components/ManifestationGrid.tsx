"use client";

import { useEffect, useState } from "react";
import type { Manifestation } from "@/lib/types";

type Labels = { redo: Record<string, string>; edit: string; save: string; cancel: string; titleLabel: string; phraseLabel: string; editHint: string; textBlocked: string; manifested: string; markManifested: string; unmark: string; onProfile: string; profileHint: string; showOnProfile: string; hideFromProfile: string; generating: string; failed: string; close: string; empty: string };

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
  const [redoing, setRedoing] = useState(false);
  const [redoNote, setRedoNote] = useState("");
  const [redoBusy, setRedoBusy] = useState(false);
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
    setEditing(false);
    setRedoing(false);
    setErr(undefined);
  }

  // Rehacer la escena entera (imagen, voz y animación). Cuesta 1 manifestación del paquete.
  async function redo(m: Manifestation) {
    setRedoBusy(true);
    setErr(undefined);
    const res = await fetch(`/api/manifestations/${m.id}/redo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: redoNote.trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setRedoBusy(false);
    if (!res.ok) return setErr(t.redo[data.error] ?? t.redo.failed);
    setItems((xs) => xs.map((x) => (x.id === m.id ? data.manifestation : x)));
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

  if (!items.length) return <p className="t-sub py-6 text-center text-[var(--color-label-2)]">{t.empty}</p>;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((m) => {
          const poster = m.highlight?.posterUrl ?? m.imageUrl;
          return (
            <button key={m.id} type="button" disabled={m.status !== "ready"} onClick={() => show(m)} className="group text-left">
              <span className="relative block aspect-[9/16] overflow-hidden rounded-[var(--radius-md)] bg-white/5">
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                ) : (
                  <span className="t-caption grid h-full place-items-center p-3 text-center text-[var(--color-label-3)]">
                    {m.status === "failed" ? t.failed : t.generating}
                  </span>
                )}
                {m.onProfile && (
                  <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px]" title={t.onProfile}>👁</span>
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" role="dialog" aria-modal="true" onClick={() => show(null)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-black">
              <video key={open.id} src={open.clipUrl} poster={open.highlight?.posterUrl ?? open.imageUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
            </div>
            {editing ? (
              <div className="mt-3 space-y-2">
                <label className="block">
                  <span className="t-caption text-[var(--color-label-2)]">{t.titleLabel}</span>
                  <input value={draft.title} maxLength={60} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} className="t-body mt-1 w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 outline-none" />
                </label>
                <label className="block">
                  <span className="t-caption text-[var(--color-label-2)]">{t.phraseLabel}</span>
                  <textarea value={draft.affirmation} maxLength={120} rows={2} onChange={(e) => setDraft((d) => ({ ...d, affirmation: e.target.value }))} className="t-body mt-1 w-full resize-none rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 outline-none" />
                </label>
                <p className="t-caption text-[var(--color-label-3)]">{t.editHint}</p>
                {err && <p className="t-caption text-rose-300">{err}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => saveText(open)} className="interactive t-sub flex-1 rounded-full bg-white px-4 py-2 font-medium text-black">{t.save}</button>
                  <button type="button" onClick={() => setEditing(false)} className="t-sub rounded-full bg-white/10 px-4 py-2">{t.cancel}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-3 flex items-start justify-between gap-3">
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
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => toggle(open, { manifested: !open.manifestedAt })} className={`interactive t-sub flex-1 rounded-full px-4 py-2 font-medium ${open.manifestedAt ? "bg-white/10" : "bg-emerald-400 text-black"}`}>
                {open.manifestedAt ? t.unmark : `✓ ${t.markManifested}`}
              </button>
              {open.highlight && (
                <button type="button" onClick={() => toggle(open, { onProfile: !open.onProfile })} className="interactive t-sub flex-1 rounded-full bg-white/10 px-4 py-2 font-medium">
                  {open.onProfile ? t.hideFromProfile : t.showOnProfile}
                </button>
              )}
              <button type="button" onClick={() => show(null)} className="t-sub rounded-full bg-white/10 px-4 py-2">{t.close}</button>
            </div>
            {open.highlight && <p className="t-caption mt-2 text-[var(--color-label-3)]">{t.profileHint}</p>}
            {redoing ? (
              <div className="mt-4 space-y-2 rounded-[var(--radius-md)] border border-[var(--color-hairline)] p-3">
                <p className="t-caption text-[var(--color-label-2)]">{paymentsOn ? t.redo.hintPaid : t.redo.hint}</p>
                <input
                  value={redoNote}
                  onChange={(e) => setRedoNote(e.target.value)}
                  maxLength={160}
                  placeholder={t.redo.placeholder}
                  className="t-caption w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 outline-none"
                />
                <div className="flex gap-2">
                  <button type="button" disabled={redoBusy} onClick={() => redo(open)} className="interactive t-sub flex-1 rounded-full bg-white px-4 py-2 font-medium text-black disabled:opacity-40">
                    {paymentsOn ? t.redo.confirmPaid : t.redo.confirm}
                  </button>
                  <button type="button" onClick={() => setRedoing(false)} className="t-sub rounded-full bg-white/10 px-4 py-2">{t.cancel}</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => { setRedoing(true); setRedoNote(""); setErr(undefined); }} className="t-caption mt-3 underline text-[var(--color-label-2)]">
                ↻ {t.redo.open}
              </button>
            )}
            {err && redoing && <p className="t-caption mt-2 text-rose-300">{err}</p>}
          </div>
        </div>
      )}
    </>
  );
}
