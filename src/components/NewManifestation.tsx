"use client";

import { useRouter } from "next/navigation";
import { PhotoSlots, type PhotoGuideLabels } from "./PhotoSlots";
import { trackEvent } from "@/lib/track-client";
import { useState } from "react";
import { AccessCodeForm } from "./AccessCodeForm";
import type { Locale } from "@/lib/i18n/locale";

type Voice = { id: string; label: string };
type Pack = { qty: number; priceUsd: number };
type Labels = {
  desire: string; desirePlaceholder: string; language: string; voice: string; photosTitle: string; photosHint: string;
  consent: string; biometric: string; upload: string; uploading: string; photosOk: string; waiver: string; create: string; creating: string;
  credits: string; noCredits: string; buy: string; each: string; errors: Record<string, string>; accessForm: { placeholder: string; submit: string; bad: string };
};

/** Crear una manifestación nueva: un deseo → una escena animada tuya. */
export function NewManifestation({
  initialPhotos,
  credits,
  paymentsOn,
  packs,
  voices,
  locale,
  t,
  guide,
}: {
  initialPhotos: number;
  credits: number;
  paymentsOn: boolean;
  packs: Pack[];
  voices: Voice[];
  locale: Locale;
  t: Labels;
  guide: PhotoGuideLabels;
}) {
  const router = useRouter();
  const [desire, setDesire] = useState("");
  const [lang, setLang] = useState<Locale>(locale);
  const [voice, setVoice] = useState(voices[0]?.id ?? "Sarah");
  const [photos, setPhotos] = useState(initialPhotos);
  const [consent, setConsent] = useState(false);
  const [bio, setBio] = useState(false);
  const [waiver, setWaiver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slotUrls, setSlotUrls] = useState<(string | undefined)[]>([]);
  const [busySlot, setBusySlot] = useState<number>();
  const [error, setError] = useState<string>();
  const [note, setNote] = useState<string>();
  const canCreate = desire.trim().length >= 3 && photos > 0 && waiver && (!paymentsOn || credits > 0) && !busy;
  const input = "t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none focus:border-[var(--color-hairline-strong)]";

  async function upload(files: File[], slot = 0) {
    setUploading(true);
    setBusySlot(slot);
    setError(undefined);
    setNote(undefined);
    for (const file of files.slice(0, 4)) {
      const body = new FormData();
      body.append("selfie", file);
      body.append("consent", String(consent));
      body.append("biometric", String(bio));
      body.append("kind", "self");
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error ?? t.errors.invalid);
      else {
        setPhotos((n) => n + 1);
        setSlotUrls((prev) => {
          const next = [...prev];
          next[slot] = data.url;
          return next;
        });
        if (data.warning) setNote(data.warning);
      }
    }
    setUploading(false);
  }

  async function buy(qty: number) {
    const res = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qty }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      trackEvent({ name: "begin_checkout" });
      window.location.href = data.url;
    }
    else setError(t.errors[data.error] ?? t.errors.invalid);
  }

  async function create() {
    setBusy(true);
    setError(undefined);
    const res = await fetch("/api/manifestations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desire: desire.trim(), locale: lang, voice, waiver: true }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(t.errors[data.key ?? data.error] ?? t.errors.invalid);
    router.push("/profile");
  }

  return (
    <div className="space-y-6">
      <label className="block">
        <span className="t-sub mb-2 block font-medium">{t.desire}</span>
        <textarea value={desire} maxLength={200} rows={3} onChange={(e) => setDesire(e.target.value)} placeholder={t.desirePlaceholder} className={`${input} resize-none`} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.language}</span>
          <select value={lang} onChange={(e) => setLang(e.target.value as Locale)} className={input}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="block">
          <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.voice}</span>
          <select value={voice} onChange={(e) => setVoice(e.target.value)} className={input}>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </label>
      </div>

      {photos > 0 && !slotUrls.some(Boolean) ? (
        <p className="t-caption text-emerald-300">✓ {t.photosOk}</p>
      ) : (
        <div className="card space-y-3 rounded-[var(--radius-lg)] p-5">
          <p className="t-sub font-medium">{t.photosTitle}</p>
          <p className="t-caption text-[var(--color-label-3)]">{t.photosHint}</p>
          <label className="t-caption flex items-start gap-2 text-[var(--color-label-2)]">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-[2px] h-4 w-4 accent-white" />
            <span>{t.consent}</span>
          </label>
          <label className="t-caption flex items-start gap-2 text-[var(--color-label-2)]">
            <input type="checkbox" checked={bio} onChange={(e) => setBio(e.target.checked)} className="mt-[2px] h-4 w-4 accent-white" />
            <span>{t.biometric}</span>
          </label>
          <PhotoSlots
            urls={slotUrls}
            onPick={(file, slot) => void upload([file], slot)}
            disabled={!consent || !bio || uploading}
            busySlot={uploading ? busySlot : undefined}
            t={guide}
          />
        </div>
      )}

      {paymentsOn && (
        <div className="space-y-3">
          <p className="t-sub">{credits > 0 ? t.credits.replace("{n}", String(credits)) : t.noCredits}</p>
          <div className="flex flex-wrap gap-2">
            {packs.map((p) => (
              <button key={p.qty} type="button" onClick={() => buy(p.qty)} className="interactive t-sub rounded-full border border-[var(--color-hairline-strong)] px-4 py-2 hover:bg-white/5">
                {t.buy.replace("{n}", String(p.qty))} · ${p.priceUsd}
                {p.qty > 1 && <span className="t-caption ml-1 text-[var(--color-label-3)]">({t.each.replace("{p}", (p.priceUsd / p.qty).toFixed(2))})</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="t-caption flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
        <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-[2px] h-4 w-4 shrink-0 accent-white" />
        <span>{t.waiver}</span>
      </label>

      {note && <p className="t-caption text-amber-200">{note}</p>}
      {error && (
        <div className="t-sub text-rose-300">
          {error}
          {error === t.errors.access && <AccessCodeForm t={t.accessForm} onDone={() => setError(undefined)} />}
        </div>
      )}

      <button type="button" disabled={!canCreate} onClick={create} className="interactive w-full rounded-full bg-white px-6 py-3 text-[15px] font-medium text-black disabled:opacity-30">
        {busy ? t.creating : t.create}
      </button>
    </div>
  );
}
