"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";

type Labels = {
  title: string; body: string; redo: string; redoing: string; notePlaceholder: string;
  left: string; none: string; approve: string; approving: string; auto: string;
  errors: Record<string, string>;
};

const MAX_REDOS = 2;

/**
 * Revisión antes de animar: cada escena con su frase, un botón para rehacerla
 * (con un ajuste opcional) y otro para aprobar y seguir.
 */
export function SceneReview({ project, onChange, t }: { project: Project; onChange: (p: Project) => void; t: Labels }) {
  const [open, setOpen] = useState<string>();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const affirmations = project.script?.affirmations ?? [];

  async function redo(sceneId: string) {
    setBusy(sceneId);
    setError(undefined);
    const res = await fetch(`/api/projects/${project.id}/redo-scene`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneId, note: note.trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(undefined);
    if (!res.ok) return setError(t.errors[data.error] ?? t.errors.failed);
    setOpen(undefined);
    setNote("");
    onChange(data.project);
  }

  async function approve() {
    setBusy("approve");
    setError(undefined);
    const res = await fetch(`/api/projects/${project.id}/approve`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(undefined);
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
                  <img src={s.imageUrl} alt="" className={`h-full w-full object-cover ${busy === s.id ? "opacity-40" : ""}`} />
                )}
                {busy === s.id && <span className="t-caption pulse-soft absolute inset-x-0 bottom-3 text-center">{t.redoing}</span>}
              </div>
              {affirmations[i] && <p className="t-caption italic text-[var(--color-label-2)]">“{affirmations[i]}”</p>}
              {open === s.id ? (
                <div className="space-y-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={160}
                    placeholder={t.notePlaceholder}
                    className="t-caption w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-3 py-2 outline-none"
                  />
                  <button type="button" disabled={!!busy} onClick={() => redo(s.id)} className="interactive t-caption w-full rounded-full bg-white px-3 py-2 font-medium text-black disabled:opacity-40">
                    {t.redo}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={left <= 0 || !!busy}
                  onClick={() => { setOpen(s.id); setNote(""); }}
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
      <button type="button" disabled={!!busy} onClick={approve} className="interactive mt-8 w-full rounded-full bg-white px-6 py-3 text-[15px] font-medium text-black disabled:opacity-40">
        {busy === "approve" ? t.approving : t.approve}
      </button>
      <p className="t-caption mt-3 text-center text-[var(--color-label-3)]">{t.auto}</p>
    </div>
  );
}
