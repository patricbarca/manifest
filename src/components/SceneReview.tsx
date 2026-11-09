"use client";

import { useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { FREE_REGENS as MAX_REDOS } from "@/lib/regens";

type Labels = {
  title: string; body: string; redo: string; redoing: string; notePlaceholder: string;
  left: string; none: string; approve: string; approving: string; auto: string;
  errors: Record<string, string>;
};


/**
 * Revisión antes de animar: cada escena con su frase, un botón para rehacerla
 * (con un ajuste opcional) y otro para aprobar y seguir.
 */
export function SceneReview({ project, onChange, t }: { project: Project; onChange: (p: Project) => void; t: Labels }) {
  // Cada escena se puede rehacer a la vez que las demás: estado por escena.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string>();
  const affirmations = project.script?.affirmations ?? [];
  const anyBusy = Object.values(busy).some(Boolean);
  const latest = useRef(project);
  latest.current = project;

  async function redo(sceneId: string) {
    setBusy((b) => ({ ...b, [sceneId]: true }));
    setOpen((o) => ({ ...o, [sceneId]: false }));
    setError(undefined);
    const res = await fetch(`/api/projects/${project.id}/redo-scene`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneId, note: notes[sceneId]?.trim() || undefined }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy((b) => ({ ...b, [sceneId]: false }));
    if (!res?.ok) return setError(t.errors[data?.error] ?? t.errors.failed);
    setNotes((n) => ({ ...n, [sceneId]: "" }));
    // Solo se toma la escena rehecha: otra respuesta en vuelo no pisa las demás.
    const fresh = (data.project as Project).scenes.find((x) => x.id === sceneId);
    latest.current = {
      ...latest.current,
      redoCounts: { ...latest.current.redoCounts, [sceneId]: data.project.redoCounts?.[sceneId] ?? 0 },
      costCents: Math.max(latest.current.costCents ?? 0, data.project.costCents ?? 0),
      scenes: latest.current.scenes.map((x) => (x.id === sceneId && fresh ? fresh : x)),
    };
    onChange(latest.current);
  }

  async function approve() {
    setApproving(true);
    setError(undefined);
    const res = await fetch(`/api/projects/${project.id}/approve`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setApproving(false);
    if (!res.ok) return setError(t.errors[data.error] ?? t.errors.failed);
    onChange(data.project);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="t-title text-balance">{t.title}</h1>
      <p className="t-body mt-3 text-[var(--color-label-2)]">{t.body}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {project.scenes.map((s, i) => {
          const left = MAX_REDOS - (project.redoCounts?.[s.id] ?? 0);
          return (
            <div key={s.id} className="space-y-2">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-md)] bg-white/5">
                {s.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt="" className={`h-full w-full object-cover ${busy[s.id] ? "opacity-40" : ""}`} />
                )}
                {busy[s.id] && <span className="t-caption pulse-soft absolute inset-x-0 bottom-3 text-center">{t.redoing}</span>}
              </div>
              {affirmations[i] && <p className="t-caption italic text-[var(--color-label-2)]">“{affirmations[i]}”</p>}
              {open[s.id] ? (
                <div className="space-y-2">
                  <input
                    value={notes[s.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [s.id]: e.target.value }))}
                    maxLength={160}
                    placeholder={t.notePlaceholder}
                    className="t-caption w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 outline-none"
                  />
                  <button type="button" disabled={busy[s.id]} onClick={() => redo(s.id)} className="interactive t-caption w-full rounded-full bg-white px-3 py-2 font-medium text-black disabled:opacity-40">
                    {t.redo}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={left <= 0 || busy[s.id]}
                  onClick={() => setOpen((o) => ({ ...o, [s.id]: true }))}
                  className="interactive t-caption w-full rounded-full border border-[var(--color-hairline-strong)] px-3 py-2 disabled:opacity-40"
                >
                  {left > 0 ? `↻ ${t.redo} · ${t.left.replace("{n}", String(left))}` : t.none}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="t-sub mt-5 text-rose-300">{error}</p>}
      <button type="button" disabled={anyBusy || approving} onClick={approve} className="interactive mt-8 w-full rounded-full bg-white px-6 py-3 text-[15px] font-medium text-black disabled:opacity-40">
        {approving ? t.approving : t.approve}
      </button>
      <p className="t-caption mt-3 text-center text-[var(--color-label-3)]">{t.auto}</p>
    </div>
  );
}
