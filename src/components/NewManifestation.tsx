"use client";

import { useRouter } from "next/navigation";
import type { CreditPack } from "@/lib/pricing";
import type { Dictionary } from "@/lib/i18n";
import { PricingPacks } from "./PricingPacks";
import { PhotoSlots, type SlotResult, type PhotoGuideLabels } from "./PhotoSlots";
import { useState } from "react";
import { AccessCodeForm } from "./AccessCodeForm";
import { trackEvent } from "@/lib/track-client";
import type { Locale } from "@/lib/i18n/locale";

type Voice = { id: string; label: string };
type Packs = { wishes: CreditPack[]; stills: CreditPack[]; elevated: CreditPack[]; products: Dictionary["products"]; upsell?: CreditPack; t: Dictionary["packs"] };
type Quality = "standard" | "elevated" | "still";
type Labels = {
  desire: string; desirePlaceholder: string; language: string; voice: string; photosTitle: string; photosHint: string;
  consent: string; biometric: string; upload: string; uploading: string; photosOk: string; waiver: string; create: string; creating: string;
  credits: string; noCredits: string; buy: string; each: string; freeScene: string; marketingOptIn: string; errors: Record<string, string>; accessForm: { placeholder: string; submit: string; bad: string };
};

/** Crear una manifestación nueva: un deseo → una escena animada tuya. */
export function NewManifestation({
  initialPhotos,
  credits,
  stillCredits,
  freeScene = false,
  paymentsOn,
  packs,
  voices,
  locale,
  t,
  guide,
  consented = false,
}: {
  initialPhotos: number;
  credits: number;
  stillCredits: number;
  /** Le queda su primera escena gratis (FREE_MANIFESTATIONS): solo para una escena animada estándar. */
  freeScene?: boolean;
  paymentsOn: boolean;
  packs: Packs;
  voices: Voice[];
  locale: Locale;
  t: Labels;
  guide: PhotoGuideLabels;
  consented?: boolean;
}) {
  const router = useRouter();
  const [desire, setDesire] = useState("");
  const [lang, setLang] = useState<Locale>(locale);
  const [voice, setVoice] = useState(voices[0]?.id ?? "Sarah");
  const [photos, setPhotos] = useState(initialPhotos);
  const [consent, setConsent] = useState(consented);
  const [bio, setBio] = useState(consented);
  const [waiver, setWaiver] = useState(false);
  // Permiso de emails de novedades: sin marcar por defecto.
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slotUrls, setSlotUrls] = useState<(string | undefined)[]>([]);
  const [busySlot, setBusySlot] = useState<number>();
  const [error, setError] = useState<string>();
  const [note, setNote] = useState<string>();
  const [quality, setQuality] = useState<Quality>(credits === 0 && stillCredits > 0 && !freeScene ? "still" : "standard");
  const need = quality === "elevated" ? 2 : 1;
  const have = quality === "still" ? stillCredits : credits;
  // La escena gratis cubre una animada estándar.
  const freeNow = freeScene && quality === "standard";
  const canCreate = desire.trim().length >= 3 && photos > 0 && waiver && (!paymentsOn || freeNow || have >= need) && !busy;
  const input = "t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none focus:border-[var(--color-hairline-strong)]";

  async function upload(files: File[], slot = 0, scanned = false): Promise<SlotResult | undefined> {
    setUploading(true);
    setBusySlot(slot);
    setError(undefined);
    setNote(undefined);
    let result: SlotResult | undefined;
    for (const file of files.slice(0, 4)) {
      const body = new FormData();
      body.append("selfie", file);
      body.append("consent", String(consent));
      body.append("biometric", String(bio));
      body.append("kind", "self");
      body.append("slot", String(slot));
      if (scanned) body.append("scan", "1");
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      // El veredicto de cada foto se enseña debajo de las fotos (PhotoSlots).
      result = { ok: res.ok, warn: !!data.warning, message: res.ok ? data.warning : (data.error ?? t.errors.invalid) };
      if (res.ok) {
        setPhotos((n) => n + 1);
        setSlotUrls((prev) => {
          const next = [...prev];
          next[slot] = data.url;
          return next;
        });
      }
    }
    setUploading(false);
    return result;
  }

  async function create() {
    setBusy(true);
    setError(undefined);
    const res = await fetch("/api/manifestations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ desire: desire.trim(), locale: lang, voice, quality, waiver: true, marketing }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(t.errors[data.key ?? data.error] ?? t.errors.invalid);
    // Escena gratis creada: conversión para los anuncios (solo si aceptó sus cookies).
    if (data.manifestation?.free) trackEvent({ name: "free_scene", id: data.manifestation.id });
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
          <PhotoSlots
            urls={slotUrls}
            onPick={(file, slot, scanned) => upload([file], slot, scanned)}
            disabled={uploading}
            busySlot={uploading ? busySlot : undefined}
            consent={{ given: consent && bio, text: t.consent, biometric: t.biometric, onGive: () => { setConsent(true); setBio(true); } }}
            t={guide}
          />
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="t-caption mb-1.5 text-[var(--color-label-2)]">{packs.t.quality}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {([
            ["standard", packs.t.qualityStandard],
            ["elevated", packs.t.qualityElevated],
            ["still", packs.t.qualityStill],
          ] as [Quality, string][]).map(([q, text]) => (
            <button
              key={q}
              type="button"
              aria-pressed={quality === q}
              onClick={() => setQuality(q)}
              className={`interactive t-sub rounded-[var(--radius-ctl)] border px-3 py-2.5 text-left ${
                quality === q ? "border-[var(--color-label-1)] bg-[var(--color-surface-2)] font-medium" : "border-[var(--color-hairline)] text-[var(--color-label-2)]"
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </fieldset>

      {paymentsOn && freeNow && <p className="t-sub text-emerald-300/90">✓ {t.freeScene}</p>}
      {paymentsOn && !freeNow && (have < need || packs.upsell) && (
        <div className="card rounded-[var(--radius-lg)] p-4 sm:p-5">
          <PricingPacks
            mode="buy"
            wishes={packs.wishes}
            stills={packs.stills}
            elevated={packs.elevated}
            products={packs.products}
            balance={{ wishes: credits, stills: stillCredits }}
            upsell={packs.upsell}
            initial={quality === "still" ? "stills" : quality === "elevated" ? "elevated" : "wishes"}
            t={packs.t}
          />
        </div>
      )}
      {paymentsOn && !freeNow && have >= need && !packs.upsell && (
        <p className="t-caption text-[var(--color-label-2)]">
          {packs.t.balance
            .replace("{w}", credits === 1 ? packs.t.one.wishes : packs.t.many.wishes.replace("{n}", String(credits)))
            .replace("{s}", stillCredits === 1 ? packs.t.one.stills : packs.t.many.stills.replace("{n}", String(stillCredits)))}
        </p>
      )}

      <label className="t-caption flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
        <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-[2px] h-4 w-4 shrink-0 accent-white" />
        <span>{t.waiver}</span>
      </label>
      <label className="t-caption flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
        <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-[2px] h-4 w-4 shrink-0 accent-white" />
        <span>{t.marketingOptIn}</span>
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
