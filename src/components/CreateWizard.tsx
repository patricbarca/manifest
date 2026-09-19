"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LIFE_AREAS, VISUAL_STYLES } from "@/lib/types";
import type { Blueprint, LifeArea, Tier, VisualStyle, VoiceTone } from "@/lib/types";
import { creditCost } from "@/lib/pricing";
import { SELFIE_CONSENT } from "@/lib/safety";

/**
 * El asistente de creación.
 *
 * Cuatro pasos y ninguno opcional salvo la foto. El orden importa: primero se
 * pregunta qué quiere la persona y solo después se le pide la cara, porque
 * pedir un selfie en la pantalla uno es donde se cae la gente.
 */

const PROMPT_IDEAS: Record<LifeArea, string[]> = {
  carrera: [
    "Dirijo mi propio estudio de diseño y elijo con qué clientes trabajo",
    "Me ascienden a responsable de equipo y lo llevo con calma",
    "Doy la charla de apertura en una conferencia de mi sector",
  ],
  abundancia: [
    "Cierro el año con seis meses de gastos ahorrados y sin agobio",
    "Mi negocio factura lo suficiente para vivir tranquilo",
    "Compro mi casa y firmo sin miedo",
  ],
  salud: [
    "Corro 10 km sin pararme y me levanto con energía",
    "Duermo bien, entreno tres veces por semana y me sostengo",
    "Me veo fuerte y me gusta lo que veo",
  ],
  amor: [
    "Tengo una relación tranquila con alguien que me trata bien",
    "Digo lo que siento sin miedo a que se rompa",
    "Me rodeo de gente que me suma",
  ],
  confianza: [
    "Hablo en reuniones sin que me tiemble la voz",
    "Me presento a lo que quiero aunque no me sienta listo",
    "Dejo de compararme y sigo mi propio ritmo",
  ],
  libertad: [
    "Trabajo desde donde quiero y organizo mis días yo",
    "Paso un año viviendo en otro país",
    "Tengo tiempo para lo mío sin sentirme culpable",
  ],
};

const TONES: { id: VoiceTone; label: string; blurb: string }[] = [
  { id: "calma", label: "Calma", blurb: "Lenta y grave. Para la noche." },
  { id: "firme", label: "Firme", blurb: "Directa y con empuje. Para la mañana." },
  { id: "cercana", label: "Cercana", blurb: "Como alguien que te conoce." },
];

type Props = {
  initialArea?: LifeArea;
  blueprint?: Blueprint;
  credits: number;
};

export function CreateWizard({ initialArea, blueprint, credits }: Props) {
  const router = useRouter();

  const [step, setStep] = useState(blueprint ? 1 : 0);
  const [area, setArea] = useState<LifeArea>(blueprint?.area ?? initialArea ?? "carrera");
  const [intention, setIntention] = useState("");
  const [selfieUrl, setSelfieUrl] = useState<string>();
  const [consent, setConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tier, setTier] = useState<Tier>(blueprint?.tier ?? "vision");
  const [style, setStyle] = useState<VisualStyle>(blueprint?.style ?? "cinematic");
  const [tone, setTone] = useState<VoiceTone>(blueprint?.tone ?? "calma");
  const [durationSec, setDurationSec] = useState<30 | 60>(30);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const cost = creditCost(tier, durationSec);
  const affordable = credits >= cost;

  const canContinue = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return intention.trim().length >= 8;
    if (step === 2) return true; // la foto es opcional
    return affordable;
  }, [step, intention, affordable]);

  async function upload(file: File) {
    setUploading(true);
    setError(undefined);
    const body = new FormData();
    body.append("selfie", file);
    body.append("consent", String(consent));
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo subir la foto");
      setSelfieUrl(data.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(undefined);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          intention: intention.trim(),
          tier,
          style,
          tone,
          durationSec,
          selfieUrl,
          blueprintSlug: blueprint?.slug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear el vídeo");
      router.push(`/video/${data.project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <Steps current={step} />

      {blueprint && (
        <div className="mt-8 card rounded-xl2 p-4 text-sm">
          Partiendo de{" "}
          <span className="font-medium text-gold">{blueprint.title}</span> de {blueprint.author}.
          El guion y las escenas vienen dados; tú pones tu cara y tu intención.
        </div>
      )}

      {/* ── Paso 0: área ───────────────────────────────────────────────── */}
      {step === 0 && (
        <Section
          title="¿Qué parte de tu vida quieres ver distinta?"
          hint="Elige una. Se trabaja mejor de una en una."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {LIFE_AREAS.map((a) => (
              <button
                key={a.id}
                onClick={() => setArea(a.id)}
                className={`card card-hover rounded-xl2 p-5 text-left ${
                  area === a.id ? "!border-gold/60" : ""
                }`}
              >
                <span className="text-gold">{a.emoji}</span>
                <p className="mt-2 font-medium">{a.label}</p>
                <p className="mt-1 text-sm text-white/50">{a.blurb}</p>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── Paso 1: intención ──────────────────────────────────────────── */}
      {step === 1 && (
        <Section
          title="Cuéntalo como si ya hubiera pasado"
          hint="Cuanto más concreto, mejores escenas. Un lugar, una acción, una persona."
        >
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder="Dirijo mi propio estudio en Lisboa, con tres personas en el equipo y clientes que me buscan a mí."
            className="w-full resize-none rounded-xl2 border border-white/10 bg-white/5 p-4 text-base leading-relaxed outline-none transition placeholder:text-white/25 focus:border-gold/50"
          />
          <p className="mt-2 text-right text-xs text-white/30">{intention.length}/600</p>

          <p className="mt-6 mb-3 text-sm text-white/45">O empieza por una de estas:</p>
          <div className="space-y-2">
            {PROMPT_IDEAS[area].map((idea) => (
              <button
                key={idea}
                onClick={() => setIntention(idea)}
                className="w-full rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-left text-sm text-white/70 transition hover:border-gold/40 hover:text-white"
              >
                {idea}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── Paso 2: foto ───────────────────────────────────────────────── */}
      {step === 2 && (
        <Section
          title="Tu cara en las escenas"
          hint="Un selfie de frente, con luz natural y sin gafas de sol. Sin foto también funciona: se generan escenas sin rostro visible."
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="grid h-40 w-40 shrink-0 place-items-center overflow-hidden rounded-xl2 border border-dashed border-white/15 bg-white/3">
              {selfieUrl ? (
                <img src={selfieUrl} alt="Tu selfie" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm text-white/30">Sin foto</span>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#e9c46a]"
                />
                <span>{SELFIE_CONSENT}</span>
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!consent || uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                }}
                className="block w-full text-sm text-white/60 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-white/10 file:px-5 file:py-2.5 file:text-sm file:text-white hover:file:bg-white/20 disabled:opacity-40"
              />
              {uploading && <p className="text-sm text-white/50">Subiendo…</p>}

              <p className="text-xs leading-relaxed text-white/35">
                Tu foto es tuya. No se publica, no se usa para entrenar modelos y la
                puedes borrar desde tu biblioteca junto con el vídeo.
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* ── Paso 3: formato ────────────────────────────────────────────── */}
      {step === 3 && (
        <Section title="Cómo quieres que se vea" hint="Esto es lo que determina el precio.">
          <Field label="Tipo de vídeo">
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice
                selected={tier === "vision"}
                onClick={() => setTier("vision")}
                title="Visión"
                sub="Imágenes tuyas con movimiento de cámara"
                price={`${creditCost("vision", durationSec)} créditos`}
              />
              <Choice
                selected={tier === "cinematic"}
                onClick={() => setTier("cinematic")}
                title="Cine"
                sub="Escenas animadas de verdad"
                price={`${creditCost("cinematic", durationSec)} créditos`}
              />
            </div>
          </Field>

          <Field label="Duración">
            <div className="flex gap-3">
              {([30, 60] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDurationSec(d)}
                  className={`rounded-full border px-6 py-2.5 text-sm transition ${
                    durationSec === d
                      ? "border-gold/60 bg-gold/10 text-gold"
                      : "border-white/12 text-white/60 hover:border-white/30"
                  }`}
                >
                  {d} segundos
                </button>
              ))}
            </div>
          </Field>

          <Field label="Estilo visual">
            <div className="flex flex-wrap gap-2">
              {VISUAL_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    style === s.id
                      ? "border-gold/60 bg-gold/10 text-gold"
                      : "border-white/12 text-white/60 hover:border-white/30"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Voz">
            <div className="grid gap-3 sm:grid-cols-3">
              {TONES.map((t) => (
                <Choice
                  key={t.id}
                  selected={tone === t.id}
                  onClick={() => setTone(t.id)}
                  title={t.label}
                  sub={t.blurb}
                />
              ))}
            </div>
          </Field>

          <div className="card mt-8 flex items-center justify-between rounded-xl2 p-5">
            <div>
              <p className="text-sm text-white/55">Coste de este vídeo</p>
              <p className="font-display text-2xl text-gold">{cost} créditos</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-white/55">Te quedan</p>
              <p className={affordable ? "text-white" : "text-red-400"}>{credits} créditos</p>
            </div>
          </div>
          {!affordable && (
            <p className="mt-3 text-sm text-red-400">
              No te llegan los créditos. Baja a 30 segundos, cambia a Visión o{" "}
              <a href="/precios" className="underline">
                consigue más
              </a>
              .
            </p>
          )}
        </Section>
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* ── Navegación ─────────────────────────────────────────────────── */}
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="text-sm text-white/50 transition hover:text-white disabled:invisible"
        >
          ← Atrás
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue}
            className="rounded-full bg-gold px-7 py-3 font-medium text-ink-950 transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-35"
          >
            Continuar
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!affordable || submitting}
            className="rounded-full bg-gold px-7 py-3 font-medium text-ink-950 transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-35"
          >
            {submitting ? "Creando…" : "Crear mi vídeo"}
          </button>
        )}
      </div>
    </div>
  );
}

const STEP_LABELS = ["Área", "Intención", "Foto", "Formato"];

function Steps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEP_LABELS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
              i <= current ? "bg-gold text-ink-950" : "bg-white/10 text-white/40"
            }`}
          >
            {i + 1}
          </span>
          <span className={i <= current ? "text-white/80" : "text-white/30"}>{label}</span>
          {i < STEP_LABELS.length - 1 && (
            <span className={`h-px flex-1 ${i < current ? "bg-gold/50" : "bg-white/10"}`} />
          )}
        </li>
      ))}
    </ol>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10">
      <h1 className="font-display text-3xl leading-tight">{title}</h1>
      <p className="mt-2 mb-7 text-white/50">{hint}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-7 first:mt-0">
      <p className="mb-3 text-sm font-medium text-white/70">{label}</p>
      {children}
    </div>
  );
}

function Choice({
  selected,
  onClick,
  title,
  sub,
  price,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  sub: string;
  price?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`card card-hover rounded-xl2 p-4 text-left ${selected ? "!border-gold/60" : ""}`}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-white/50">{sub}</p>
      {price && <p className="mt-2 text-sm text-gold">{price}</p>}
    </button>
  );
}
