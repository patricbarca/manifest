"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Highlights, type HighlightGroup } from "./Highlights";
import { AuraRing } from "./AuraRing";
import { AURA_COLORS, AURA_MOTIONS, AURA_PALETTE, type AuraColor, type AuraMotion, type AuraStyle } from "@/lib/social/aura-style";

export type MyHighlightItem = { id: string; title: string; videoUrl: string; posterUrl: string; onProfile: boolean; label?: string };
type Labels = {
  edit: string;
  add: string;
  title: string;
  pick: string;
  pickHint: string;
  labelHint: string;
  labelPlaceholder: string;
  none: string;
  auraTitle: string;
  color: string;
  motion: string;
  colors: Record<AuraColor, string>;
  motions: Record<AuraMotion, string>;
  done: string;
  error: string;
};

/**
 * Tus highlights en el perfil, con un círculo "Editar" al final: ahí eliges
 * qué manifestaciones se ven y el aura (color y movimiento) de los círculos.
 */
export function MyHighlights({
  initial,
  aura: initialAura,
  closeLabel,
  aiLabel,
  t,
}: {
  initial: MyHighlightItem[];
  aura: AuraStyle;
  closeLabel: string;
  aiLabel: string;
  t: Labels;
}) {
  const [items, setItems] = useState(initial);
  const [aura, setAura] = useState(initialAura);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string>();

  const groups: HighlightGroup[] = items
    .filter((m) => m.onProfile)
    .map((m) => ({ id: m.id, title: m.title, items: [{ videoUrl: m.videoUrl, posterUrl: m.posterUrl, label: m.label }] }));

  async function toggle(id: string) {
    const cur = items.find((m) => m.id === id);
    if (!cur) return;
    setErr(undefined);
    setItems((xs) => xs.map((m) => (m.id === id ? { ...m, onProfile: !m.onProfile } : m)));
    const res = await fetch("/api/manifestations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, onProfile: !cur.onProfile }),
    }).catch(() => null);
    if (!res?.ok) {
      setItems((xs) => xs.map((m) => (m.id === id ? { ...m, onProfile: cur.onProfile } : m)));
      setErr(t.error);
    }
  }

  /** Texto bajo el círculo: emoji, palabra o nada. Se guarda al salir del campo. */
  async function saveLabel(id: string, label: string) {
    const cur = items.find((m) => m.id === id);
    if (!cur || (cur.label ?? "") === label) return;
    setErr(undefined);
    setItems((xs) => xs.map((m) => (m.id === id ? { ...m, label: label || undefined } : m)));
    const res = await fetch("/api/manifestations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, highlightLabel: label }),
    }).catch(() => null);
    if (!res?.ok) {
      setItems((xs) => xs.map((m) => (m.id === id ? { ...m, label: cur.label } : m)));
      setErr(t.error);
    }
  }

  async function saveAura(next: AuraStyle) {
    const prev = aura;
    setAura(next);
    setErr(undefined);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ highlightAura: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setAura(prev);
      setErr(t.error);
    }
  }

  const editCircle = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={groups.length ? t.edit : t.add}
      title={groups.length ? t.edit : t.add}
      className="interactive flex w-[76px] shrink-0 flex-col items-center gap-1.5"
    >
      <span className="grid h-[72px] w-[72px] place-items-center rounded-full border-2 border-dashed border-[var(--color-hairline-strong)] text-2xl text-[var(--color-label-2)]">
        {groups.length ? "✎" : "+"}
      </span>
    </button>
  );

  return (
    <>
      <Highlights groups={groups} aura={aura} closeLabel={closeLabel} aiLabel={aiLabel} extra={editCircle} />
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-end bg-black/60 sm:items-center" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
            <div
              className="max-h-[88dvh] w-full overflow-y-auto overscroll-contain rounded-t-[var(--radius-xl)] bg-[var(--color-surface-2)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] text-[var(--color-label-1)] sm:mx-auto sm:max-w-md sm:rounded-[var(--radius-xl)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--color-hairline-strong)] sm:hidden" />
              <h2 className="t-headline">{t.title}</h2>

              {/* Qué se ve */}
              <p className="t-sub mt-4 font-medium">{t.pick}</p>
              <p className="t-caption text-[var(--color-label-3)]">{t.pickHint} {t.labelHint}</p>
              {items.length ? (
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {items.map((m) => (
                    <div key={m.id} className="flex flex-col items-center gap-1">
                    <button type="button" aria-pressed={m.onProfile} onClick={() => toggle(m.id)} className="flex flex-col items-center gap-1">
                      <span className="relative">
                        {m.onProfile ? (
                          <AuraRing style={{ ...aura, motion: "still" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.posterUrl} alt="" className="block h-14 w-14 rounded-full border-2 border-[var(--color-surface-2)] object-cover" />
                          </AuraRing>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.posterUrl} alt="" className="m-[3px] block h-14 w-14 rounded-full object-cover opacity-45 grayscale" />
                        )}
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-[var(--color-surface-2)] text-[10px] font-bold ${
                            m.onProfile ? "bg-emerald-400 text-black" : "bg-[var(--color-surface-3)] text-[var(--color-label-2)]"
                          }`}
                        >
                          {m.onProfile ? "✓" : "+"}
                        </span>
                      </span>
                      <span className="t-caption w-full truncate text-center text-[var(--color-label-3)]">{m.title}</span>
                    </button>
                    {m.onProfile && (
                      <input
                        defaultValue={m.label ?? ""}
                        maxLength={14}
                        placeholder={t.labelPlaceholder}
                        aria-label={t.labelHint}
                        onBlur={(e) => saveLabel(m.id, e.target.value.trim())}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        className="t-caption w-full rounded-full border border-[var(--color-hairline)] bg-[var(--color-surface-1)] px-2 py-1 text-center outline-none focus:border-[var(--color-hairline-strong)]"
                      />
                    )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="t-caption mt-3 text-[var(--color-label-3)]">{t.none}</p>
              )}

              {/* Aura */}
              <div className="mt-6 border-t border-[var(--color-hairline)] pt-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="t-sub font-medium">{t.auraTitle}</p>
                  <AuraRing style={aura}>
                    <span className="block h-12 w-12 rounded-full border-2 border-[var(--color-surface-2)] bg-[var(--color-surface-3)]" />
                  </AuraRing>
                </div>
                <p className="t-caption mt-3 text-[var(--color-label-2)]">{t.color}</p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {AURA_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={aura.color === c}
                      onClick={() => saveAura({ ...aura, color: c })}
                      className={`flex flex-col items-center gap-1 rounded-[var(--radius-md)] border p-2 ${aura.color === c ? "border-[var(--color-label-1)]" : "border-[var(--color-hairline)]"}`}
                    >
                      <span className="h-7 w-7 rounded-full" style={{ background: `conic-gradient(${[...AURA_PALETTE[c].stops, AURA_PALETTE[c].stops[0]].join(", ")})` }} />
                      <span className="t-caption text-[11px] text-[var(--color-label-2)]">{t.colors[c]}</span>
                    </button>
                  ))}
                </div>
                <p className="t-caption mt-4 text-[var(--color-label-2)]">{t.motion}</p>
                <div className="mt-2 grid grid-cols-3 gap-1 rounded-full bg-white/10 p-1">
                  {AURA_MOTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={aura.motion === m}
                      onClick={() => saveAura({ ...aura, motion: m })}
                      className={`t-caption rounded-full px-3 py-1.5 font-medium ${aura.motion === m ? "bg-[var(--color-surface-2)] text-[var(--color-label-1)] shadow-sm" : "text-[var(--color-label-2)]"}`}
                    >
                      {t.motions[m]}
                    </button>
                  ))}
                </div>
              </div>

              {err && <p className="t-caption mt-3 text-rose-300">{err}</p>}
              <button type="button" onClick={() => setOpen(false)} className="interactive t-sub mt-6 w-full rounded-full bg-white px-4 py-2.5 font-medium text-black">
                {t.done}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
