"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LIFE_AREAS, VISUAL_STYLES } from "@/lib/types";
import type { Blueprint, LifeArea, Tier, VisualStyle, VoiceTone } from "@/lib/types";
import { creditCost } from "@/lib/pricing";
import { SELFIE_CONSENT } from "@/lib/safety";
import { Icon } from "./Icon";

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
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Steps current={step} />

      {blueprint && (
        <div className="card t-sub mt-8 rounded-[var(--radius-md)] p-4 text-[var(--color-label-2)]">
          Partiendo de{" "}
          <span className="font-medium text-[var(--color-label-1)]">{blueprint.title}</span> de{" "}
          {blueprint.author}.
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
                className={`card interactive rounded-[var(--radius-md)] p-5 text-left ${
                  area === a.id ? "is-selected" : ""
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07]">
                  <Icon name={a.icon} size={17} />
                </span>
                <p className="t-headline mt-3.5">{a.label}</p>
                <p className="t-sub mt-1 text-[var(--color-label-2)]">{a.blurb}</p>
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
            className="t-body w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] p-4 outline-none transition-colors duration-200 placeholder:text-[var(--color-label-4)] focus:border-[var(--color-hairline-strong)]"
          />
          <p className="t-caption mt-2 text-right tabular-nums text-[var(--color-label-3)]">
            {intention.length}/600
          </p>

          <p className="t-sub mt-8 mb-3 text-[var(--color-label-2)]">O empieza por una de estas:</p>
          <div className="space-y-2">
            {PROMPT_IDEAS[area].map((idea) => (
              <button
                key={idea}
                onClick={() => setIntention(idea)}
                className="interactive t-sub w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 text-left text-[var(--color-label-2)] hover:text-[var(--color-label-1)]"
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
            <div className="grid h-40 w-40 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-[var(--color-hairline-strong)] bg-[var(--color-surface-2)]">
              {selfieUrl ? (
                <img src={selfieUrl} alt="Tu selfie" className="h-full w-full object-cover" />
              ) : (
                <span className="t-caption text-[var(--color-label-3)]">Sin foto</span>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <label className="t-sub flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-[3px] h-4 w-4 accent-white"
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
                className="t-sub block w-full text-[var(--color-label-2)] file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-5 file:py-2 file:text-[13px] file:font-medium file:text-black hover:file:bg-white/90 disabled:opacity-35"
              />
              {uploading && <p className="t-sub text-[var(--color-label-2)]">Subiendo…</p>}

              <p className="t-caption leading-relaxed text-[var(--color-label-3)]">
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
                  className={`interactive t-sub rounded-full border px-5 py-2 ${
                    durationSec === d
                      ? "border-white bg-white text-black"
                      : "border-[var(--color-hairline)] text-[var(--color-label-2)]"
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
                  className={`interactive t-sub rounded-full border px-4 py-2 ${
                    style === s.id
                      ? "border-white bg-white text-black"
                      : "border-[var(--color-hairline)] text-[var(--color-label-2)]"
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

          <div className="card mt-9 flex items-center justify-between rounded-[var(--radius-md)] p-5">
            <div>
              <p className="t-caption text-[var(--color-label-2)]">Coste de este vídeo</p>
              <p className="mt-1 text-[1.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                {cost} <span className="t-sub font-normal text-[var(--color-label-2)]">créditos</span>
              </p>
            </div>
            <div className="text-right">
              <p className="t-caption text-[var(--color-label-2)]">Te quedan</p>
              <p
                className={`t-sub mt-1 tabular-nums ${
                  affordable ? "text-[var(--color-label-1)]" : "text-red-400"
                }`}
              >
                {credits} créditos
              </p>
            </div>
          </div>
          {!affordable && (
            <p className="t-sub mt-3 text-red-400">
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
        <p className="t-sub mt-6 rounded-[var(--radius-ctl)] border border-red-500/25 bg-red-500/[0.08] p-4 text-red-300">
          {error}
        </p>
      )}

      {/* ── Navegación ─────────────────────────────────────────────────── */}
      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="t-sub inline-flex items-center gap-1.5 text-[var(--color-label-2)] transition-opacity duration-200 hover:text-[var(--color-label-1)] disabled:invisible"
        >
          <Icon name="arrow-left" size={15} />
          Atrás
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue}
            className="interactive inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-2.5 text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continuar
            <Icon name="arrow-right" size={15} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!affordable || submitting}
            className="interactive rounded-full bg-white px-6 py-2.5 text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
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
    <ol className="t-caption flex items-center gap-2">
      {STEP_LABELS.map((label, i) => (
        <li key={label} className="flex flex-1 items-center gap-2">
          <span
            className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[11px] font-medium transition-colors duration-300 ${
              i < current
                ? "bg-white text-black"
                : i === current
                  ? "border border-white/70 text-white"
                  : "border border-[var(--color-hairline)] text-[var(--color-label-3)]"
            }`}
          >
            {i < current ? <Icon name="check" size={12} /> : i + 1}
          </span>
          <span className={i <= current ? "text-[var(--color-label-1)]" : "text-[var(--color-label-3)]"}>
            {label}
          </span>
          {i < STEP_LABELS.length - 1 && (
            <span
              className={`h-px flex-1 transition-colors duration-300 ${
                i < current ? "bg-white/45" : "bg-[var(--color-hairline)]"
              }`}
            />
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
      <h1 className="t-title text-balance">{title}</h1>
      <p className="t-body mt-3 mb-8 max-w-xl text-pretty text-[var(--color-label-2)]">{hint}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-7 first:mt-0">
      <p className="t-sub mb-3 font-medium text-[var(--color-label-2)]">{label}</p>
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
      className={`card interactive rounded-[var(--radius-md)] p-4 text-left ${
        selected ? "is-selected" : ""
      }`}
    >
      <p className="t-headline">{title}</p>
      <p className="t-sub mt-1 text-[var(--color-label-2)]">{sub}</p>
      {price && <p className="t-sub mt-2.5 tabular-nums text-[var(--color-label-1)]">{price}</p>}
    </button>
  );
}
