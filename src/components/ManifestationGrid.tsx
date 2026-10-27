"use client";

import { useEffect, useState } from "react";
import type { Manifestation } from "@/lib/types";

type Labels = { manifested: string; markManifested: string; unmark: string; onProfile: string; profileHint: string; showOnProfile: string; hideFromProfile: string; generating: string; failed: string; close: string; empty: string };

/**
 * Tus manifestaciones, una por tarjeta. Al tocar se ve su escena; desde ahí
 * se puede marcar como cumplida (✓ Manifestado).
 */
export function ManifestationGrid({ initial, t, locale }: { initial: Manifestation[]; t: Labels; locale: string }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<Manifestation | null>(null);
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

  async function toggle(m: Manifestation, change: { manifested?: boolean; onProfile?: boolean }) {
    const res = await fetch("/api/manifestations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, ...change }),
    });
    if (!res.ok) return;
    const { manifestation } = await res.json();
    setItems((xs) => xs.map((x) => (x.id === m.id ? manifestation : x)));
    setOpen(manifestation);
  }

  if (!items.length) return <p className="t-sub py-6 text-center text-[var(--color-label-2)]">{t.empty}</p>;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((m) => {
          const poster = m.highlight?.posterUrl ?? m.imageUrl;
          return (
            <button key={m.id} type="button" disabled={m.status !== "ready"} onClick={() => setOpen(m)} className="group text-left">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-black">
              <video key={open.id} src={open.clipUrl} poster={open.highlight?.posterUrl ?? open.imageUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
            </div>
            <p className="t-headline mt-3">{open.title}</p>
            {open.affirmation && <p className="t-sub mt-1 italic text-[var(--color-label-2)]">“{open.affirmation}”</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => toggle(open, { manifested: !open.manifestedAt })} className={`interactive t-sub flex-1 rounded-full px-4 py-2 font-medium ${open.manifestedAt ? "bg-white/10" : "bg-emerald-400 text-black"}`}>
                {open.manifestedAt ? t.unmark : `✓ ${t.markManifested}`}
              </button>
              {open.highlight && (
                <button type="button" onClick={() => toggle(open, { onProfile: !open.onProfile })} className="interactive t-sub flex-1 rounded-full bg-white/10 px-4 py-2 font-medium">
                  {open.onProfile ? t.hideFromProfile : t.showOnProfile}
                </button>
              )}
              <button type="button" onClick={() => setOpen(null)} className="t-sub rounded-full bg-white/10 px-4 py-2">{t.close}</button>
            </div>
            {open.highlight && <p className="t-caption mt-2 text-[var(--color-label-3)]">{t.profileHint}</p>}
          </div>
        </div>
      )}
    </>
  );
}
