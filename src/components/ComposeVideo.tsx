"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { PALETTES, type Palette } from "@/lib/types";
import { PALETTE_SWATCH } from "@/lib/palettes";

type Item = { id: string; title: string; poster?: string; manifested: boolean; locale: Locale };
type Labels = { palette: string; palettes: Record<Palette, string>; pick: string; selected: string; language: string; voice: string; titleLabel: string; titleDefault: string; create: string; creating: string; max: string; errors: Record<string, string> };

/**
 * Elige qué manifestaciones van en tu vídeo y en qué orden (el orden en que
 * las tocas). Se monta con la respiración, tus escenas y el cierre.
 */
export function ComposeVideo({ items, voices, locale, max, t }: { items: Item[]; voices: { id: string; label: string }[]; locale: Locale; max: number; t: Labels }) {
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  // El vídeo va en el idioma de sus frases: solo se mezclan manifestaciones del mismo idioma.
  const lang: Locale = items.find((m) => m.id === picked[0])?.locale ?? locale;
  const [voice, setVoice] = useState(voices[0]?.id ?? "Sarah");
  const [title, setTitle] = useState(t.titleDefault);
  const [palette, setPalette] = useState<Palette>("dusk");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const input = "t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none";

  function toggle(id: string) {
    const m = items.find((x) => x.id === id);
    if (picked.length && !picked.includes(id) && m?.locale !== lang) return;
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < max ? [...p, id] : p));
  }

  async function create() {
    setBusy(true);
    setError(undefined);
    const res = await fetch("/api/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: picked, locale: lang, voice, palette, title: title.trim() || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(t.errors[data.error] ?? t.errors.invalid);
    router.push(`/video/${data.project.id}`);
  }

  return (
    <div className="space-y-6">
      <p className="t-sub text-[var(--color-label-2)]">{t.pick} <span className="text-[var(--color-label-3)]">({t.max})</span></p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((m) => {
          const n = picked.indexOf(m.id);
          const other = picked.length > 0 && m.locale !== lang;
          return (
            <button key={m.id} type="button" onClick={() => toggle(m.id)} disabled={other} className="text-left disabled:opacity-30">
              <span className={`relative block aspect-[9/16] overflow-hidden rounded-[var(--radius-md)] bg-white/5 ${n >= 0 ? "ring-2 ring-white" : "opacity-80"}`}>
                {m.poster && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.poster} alt="" className="h-full w-full object-cover" />
                )}
                {n >= 0 && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white text-[12px] font-semibold text-black">{n + 1}</span>}
                {m.manifested && <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-400 px-1.5 text-[10px] text-black">✓</span>}
              </span>
              <span className="t-caption mt-1 block truncate">{m.title}</span>
            </button>
          );
        })}
      </div>
      <p className="t-caption text-[var(--color-label-3)]">{t.selected.replace("{n}", String(picked.length))}</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block sm:col-span-3">
          <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.titleLabel}</span>
          <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className={input} />
        </label>
        <p className="t-caption block self-end pb-3 text-[var(--color-label-2)]">
          {t.language}: {lang === "es" ? "Español" : "English"}
        </p>
        <label className="block sm:col-span-2">
          <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.voice}</span>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className={input}>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.palette}</span>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PALETTES.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPalette(id)}
              className={`interactive overflow-hidden rounded-[var(--radius-md)] border text-left ${palette === id ? "border-white ring-1 ring-white" : "border-[var(--color-hairline)]"}`}
            >
              <span className="block h-12" style={{ background: PALETTE_SWATCH[id] }} />
              <span className="t-caption block px-2 py-1 text-[var(--color-label-2)]">{t.palettes[id]}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="t-sub text-rose-300">{error}</p>}
      <button type="button" disabled={!picked.length || busy} onClick={create} className="interactive w-full rounded-full bg-white px-6 py-3 text-[15px] font-medium text-black disabled:opacity-30">
        {busy ? t.creating : t.create}
      </button>
    </div>
  );
}
