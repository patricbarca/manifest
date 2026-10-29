"use client";

import { useState } from "react";

type Labels = { title: string; hint: string; empty: string; remove: string; upload: string; uploading: string; consent: string; biometric: string; error: string };

/**
 * Tus selfies guardadas: se usan para crear manifestaciones sin volver a
 * subirlas. Puedes añadir (hasta 4) y borrar; caducan solas a los 30 días.
 */
export function MyPhotos({ initial, t }: { initial: string[]; t: Labels }) {
  const [photos, setPhotos] = useState(initial);
  const [consent, setConsent] = useState(false);
  const [bio, setBio] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

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

  async function upload(files: File[]) {
    setBusy(true);
    setError(undefined);
    for (const file of files.slice(0, 4)) {
      const body = new FormData();
      body.append("selfie", file);
      body.append("consent", String(consent));
      body.append("biometric", String(bio));
      body.append("kind", "self");
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) setError((await res.json().catch(() => ({}))).error ?? t.error);
    }
    await refresh();
    setBusy(false);
  }

  return (
    <section className="card rounded-[var(--radius-lg)] p-7">
      <h2 className="t-headline">{t.title}</h2>
      <p className="t-caption mb-4 mt-1 text-[var(--color-label-3)]">{t.hint}</p>
      {photos.length === 0 ? (
        <p className="t-sub text-[var(--color-label-2)]">{t.empty}</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((url) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-[var(--radius-md)] bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => remove(url)} aria-label={t.remove} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-[13px]">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 space-y-2">
        <label className="t-caption flex items-start gap-2 text-[var(--color-label-2)]">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-[2px] h-4 w-4 accent-white" />
          <span>{t.consent}</span>
        </label>
        <label className="t-caption flex items-start gap-2 text-[var(--color-label-2)]">
          <input type="checkbox" checked={bio} onChange={(e) => setBio(e.target.checked)} className="mt-[2px] h-4 w-4 accent-white" />
          <span>{t.biometric}</span>
        </label>
        <label className={`interactive t-sub inline-block cursor-pointer rounded-full border border-[var(--color-hairline-strong)] px-4 py-2 ${!consent || !bio || busy ? "pointer-events-none opacity-40" : ""}`}>
          {busy ? t.uploading : t.upload}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={!consent || !bio || busy} onChange={(e) => e.target.files && upload([...e.target.files])} />
        </label>
      </div>
      {error && <p className="t-caption mt-2 text-rose-300">{error}</p>}
    </section>
  );
}
