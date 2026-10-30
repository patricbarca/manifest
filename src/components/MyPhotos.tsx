"use client";

import { useState } from "react";
import { PhotoSlots, type SlotResult, type PhotoGuideLabels } from "./PhotoSlots";

type Labels = { title: string; hint: string; empty: string; remove: string; upload: string; uploading: string; consent: string; biometric: string; error: string };

/**
 * Tus selfies guardadas: se usan para crear manifestaciones sin volver a
 * subirlas. Puedes añadir (hasta 4) y borrar; caducan solas a los 30 días.
 */
export function MyPhotos({ initial, t, guide }: { initial: string[]; t: Labels; guide: PhotoGuideLabels }) {
  const [photos, setPhotos] = useState(initial);
  const [consent, setConsent] = useState(false);
  const [bio, setBio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [note, setNote] = useState<string>();

  async function refresh() {
    const res = await fetch("/api/photos").catch(() => null);
    if (res?.ok) setPhotos((await res.json()).photos);
  }

  async function remove(url: string) {
    setError(undefined);
    const res = await fetch("/api/photos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    if (res.ok) setPhotos((await res.json()).photos);
    else setError(t.error);
  }

  async function upload(files: File[], slot?: number, scanned = false): Promise<SlotResult | undefined> {
    setBusy(true);
    setError(undefined);
    setNote(undefined);
    let result: SlotResult | undefined;
    for (const file of files.slice(0, 4)) {
      const body = new FormData();
      body.append("selfie", file);
      body.append("consent", String(consent));
      body.append("biometric", String(bio));
      body.append("kind", "self");
      if (slot !== undefined) body.append("slot", String(slot));
      if (scanned) body.append("scan", "1");
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      result = { ok: res.ok, warn: !!data.warning, message: res.ok ? data.warning : (data.error ?? t.error) };
    }
    await refresh();
    setBusy(false);
    return result;
  }

  return (
    <section className="card rounded-[var(--radius-lg)] p-7">
      <h2 className="t-headline">{t.title}</h2>
      <p className="t-caption mb-4 mt-1 text-[var(--color-label-3)]">{t.hint}</p>
      <PhotoSlots
        urls={[0, 1, 2, 3].map((i) => photos[i])}
        onPick={(file, slot, scanned) => upload([file], slot, scanned)}
        onRemove={(i) => photos[i] && void remove(photos[i])}
        disabled={!consent || !bio || busy}
        t={guide}
      />
      <div className="mt-5 space-y-2">
        <label className="t-caption flex items-start gap-2 text-[var(--color-label-2)]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-[2px] h-4 w-4 accent-white" />
          <span>{t.consent}</span>
        </label>
        <label className="t-caption flex items-start gap-2 text-[var(--color-label-2)]">
          <input type="checkbox" checked={bio} onChange={(e) => setBio(e.target.checked)} className="mt-[2px] h-4 w-4 accent-white" />
          <span>{t.biometric}</span>
        </label>
      </div>
      {error && <p className="t-caption mt-2 text-rose-300">{error}</p>}
      {note && <p className="t-caption mt-2 text-amber-200">{note}</p>}
    </section>
  );
}
