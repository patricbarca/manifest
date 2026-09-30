"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LIFE_AREAS, VISUAL_STYLES } from "@/lib/types";
import type {
  ClarifyAnswer,
  ClarifyQuestion,
  LifeArea,
  ScriptDraft,
  Template,
  Tier,
  VisualStyle,
  VoiceTone,
} from "@/lib/types";
import { PRODUCTS, formatUsd, priceUsd } from "@/lib/pricing";
import { fill, type Dictionary, type Locale } from "@/lib/i18n";
import { Icon } from "./Icon";

/**
 * El asistente de creación.
 *
 * El orden importa: primero se pregunta qué quiere la persona y solo después
 * se le pide la cara, porque pedir un selfie en la pantalla uno es donde se
 * cae la gente.
 *
 * Dos pasos existen para no inventar: los detalles (el LLM pregunta lo que la
 * intención no dice, como a qué se dedica la empresa que nombras) y la
 * revisión (ves las escenas antes de pagar y puedes corregirlas).
 */

const TONES: VoiceTone[] = ["calma", "firme", "cercana"];

const STEP = { area: 0, intention: 1, details: 2, photo: 3, format: 4, review: 5 } as const;

/** Correcciones que se arrastran de una reescritura a la siguiente. */
const MAX_CORRECTIONS = 3;

type Preview = { key: string; previewId: string; script: ScriptDraft };

type Props = {
  initialArea?: LifeArea;
  template?: Template;
  /** Vídeos gratis que le quedan. El primero lo invita la casa. */
  freeLeft: number;
  /** El diccionario llega por prop: este componente corre en el cliente. */
  t: Dictionary;
  locale: Locale;
};

export function CreateWizard({ initialArea, template, freeLeft, t, locale }: Props) {
  const router = useRouter();

  const [step, setStep] = useState(template ? 1 : 0);
  const [area, setArea] = useState<LifeArea>(template?.area ?? initialArea ?? "carrera");
  const [intention, setIntention] = useState("");
  const [selfieUrl, setSelfieUrl] = useState<string>();
  const [consent, setConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tier, setTier] = useState<Tier>(template?.tier ?? "vision");
  const [style, setStyle] = useState<VisualStyle>(template?.style ?? "cinematic");
  const [tone, setTone] = useState<VoiceTone>(template?.tone ?? "calma");
  const [durationSec, setDurationSec] = useState<30 | 60>(template?.durationSec ?? 30);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  // Detalles: las preguntas se piden una vez por intención y se rehacen solo
  // si el usuario vuelve atrás y la cambia.
  const [questions, setQuestions] = useState<ClarifyQuestion[]>();
  const [questionsKey, setQuestionsKey] = useState<string>();
  const [tailored, setTailored] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Revisión.
  const [preview, setPreview] = useState<Preview>();
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [fix, setFix] = useState("");
  const [corrections, setCorrections] = useState<string[]>([]);

  const price = priceUsd(tier);
  const isFree = freeLeft > 0;

  const canContinue = useMemo(() => {
    if (step === STEP.area) return true;
    if (step === STEP.intention) return intention.trim().length >= 8;
    if (step === STEP.details) return !loadingQuestions;
    return true; // la foto es opcional, y el formato siempre es válido
  }, [step, intention, loadingQuestions]);

  const details: ClarifyAnswer[] = useMemo(
    () => [
      ...(questions ?? [])
        .map((q, i) => ({ question: q.question, answer: (answers[i] ?? "").trim() }))
        .filter((d) => d.answer),
      ...corrections.map((answer) => ({ question: t.create.reviewFixQuestion, answer })),
    ],
    [questions, answers, corrections, t],
  );

  // Todo lo que cambia el guion. Si difiere del de la revisión, esa revisión
  // ya no vale y se escribe otra.
  const scriptKey = JSON.stringify({
    area,
    intention: intention.trim(),
    details,
    tier,
    tone,
    durationSec,
    locale,
  });

  async function loadQuestions() {
    const key = JSON.stringify({ area, intention: intention.trim() });
    if (key === questionsKey) return;
    setLoadingQuestions(true);
    setError(undefined);
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, intention: intention.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.errors.createFailed);
      setQuestions(data.questions);
      setTailored(data.tailored);
      setAnswers([]);
      setQuestionsKey(key);
    } catch (err) {
      setError((err as Error).message);
      setStep(STEP.intention);
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function loadPreview(extraCorrections = corrections) {
    setLoadingPreview(true);
    setError(undefined);
    const payloadDetails = [
      ...details.filter((d) => d.question !== t.create.reviewFixQuestion),
      ...extraCorrections.map((answer) => ({ question: t.create.reviewFixQuestion, answer })),
    ];
    const key = JSON.stringify({
      area,
      intention: intention.trim(),
      details: payloadDetails,
      tier,
      tone,
      durationSec,
      locale,
    });
    try {
      const res = await fetch("/api/script-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          intention: intention.trim(),
          details: payloadDetails,
          tier,
          tone,
          durationSec,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.errors.previewFailed);
      setPreview({ key, previewId: data.previewId, script: data.script });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingPreview(false);
    }
  }

  function next() {
    const target = step + 1;
    setStep(target);
    if (target === STEP.details) void loadQuestions();
    if (target === STEP.review && preview?.key !== scriptKey) void loadPreview();
  }

  function regenerate() {
    const text = fix.trim();
    const updated = text ? [...corrections, text].slice(-MAX_CORRECTIONS) : corrections;
    setCorrections(updated);
    setFix("");
    void loadPreview(updated);
  }

  async function upload(file: File) {
    setUploading(true);
    setError(undefined);
    const body = new FormData();
    body.append("selfie", file);
    body.append("consent", String(consent));
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.errors.uploadFailed);
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
          templateSlug: template?.slug,
          details,
          // Solo si la revisión sigue siendo de lo que se va a generar.
          previewId: preview?.key === scriptKey ? preview.previewId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.errors.createFailed);
      router.push(`/video/${data.project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Steps current={step} labels={t.create.steps} />

      {template && (
        <div className="card t-sub mt-8 rounded-[var(--radius-md)] p-4 text-[var(--color-label-2)]">
          {fill(t.create.fromTemplate, {
            title: template.title[locale],
            author: template.author,
          })}
        </div>
      )}

      {/* ── Paso 0: área ───────────────────────────────────────────────── */}
      {step === STEP.area && (
        <Section
          title={t.create.areaTitle}
          hint={t.create.areaHint}
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
                <p className="t-headline mt-3.5">{t.areas[a.id].label}</p>
                <p className="t-sub mt-1 text-[var(--color-label-2)]">
                  {t.areas[a.id].blurb}
                </p>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── Paso 1: intención ──────────────────────────────────────────── */}
      {step === STEP.intention && (
        <Section
          title={t.create.intentionTitle}
          hint={t.create.intentionHint}
        >
          <textarea
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            rows={4}
            maxLength={600}
            placeholder={t.create.intentionPlaceholder}
            className="t-body w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] p-4 outline-none transition-colors duration-200 placeholder:text-[var(--color-label-4)] focus:border-[var(--color-hairline-strong)]"
          />
          <p className="t-caption mt-2 text-right tabular-nums text-[var(--color-label-3)]">
            {intention.length}/600
          </p>

          <p className="t-sub mt-8 mb-3 text-[var(--color-label-2)]">{t.create.ideasLabel}</p>
          <div className="space-y-2">
            {t.create.ideas[area].map((idea) => (
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

      {/* ── Paso 2: detalles ───────────────────────────────────────────── */}
      {step === STEP.details && (
        <Section title={t.create.detailsTitle} hint={t.create.detailsHint}>
          {loadingQuestions || !questions ? (
            <p className="t-sub text-[var(--color-label-2)]">{t.create.detailsLoading}</p>
          ) : (
            <div className="space-y-7">
              {!tailored && (
                <p className="t-caption text-[var(--color-label-3)]">{t.create.detailsGeneric}</p>
              )}
              {questions.map((q, i) => (
                <div key={q.question}>
                  <p className="t-sub mb-3 font-medium text-[var(--color-label-1)]">
                    {q.question}
                  </p>
                  <input
                    value={answers[i] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => {
                        const copy = [...prev];
                        copy[i] = e.target.value;
                        return copy;
                      })
                    }
                    maxLength={300}
                    placeholder={t.create.detailsPlaceholder}
                    className="t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none transition-colors duration-200 placeholder:text-[var(--color-label-4)] focus:border-[var(--color-hairline-strong)]"
                  />
                  {q.suggestions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {q.suggestions.map((s) => (
                        <button
                          key={s}
                          onClick={() =>
                            setAnswers((prev) => {
                              const copy = [...prev];
                              copy[i] = s;
                              return copy;
                            })
                          }
                          className="interactive t-caption rounded-full border border-[var(--color-hairline)] px-3.5 py-1.5 text-[var(--color-label-2)] hover:text-[var(--color-label-1)]"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── Paso 3: foto ───────────────────────────────────────────────── */}
      {step === STEP.photo && (
        <Section
          title={t.create.photoTitle}
          hint={t.create.photoHint}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="grid h-40 w-40 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-[var(--color-hairline-strong)] bg-[var(--color-surface-2)]">
              {selfieUrl ? (
                <img src={selfieUrl} alt="Tu selfie" className="h-full w-full object-cover" />
              ) : (
                <span className="t-caption text-[var(--color-label-3)]">{t.create.noPhoto}</span>
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
                <span>{t.consent}</span>
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
              {uploading && (
                <p className="t-sub text-[var(--color-label-2)]">{t.create.uploading}</p>
              )}

              <p className="t-caption leading-relaxed text-[var(--color-label-3)]">
                {t.create.photoPrivacy}
              </p>
            </div>
          </div>
        </Section>
      )}

      {/* ── Paso 4: formato ────────────────────────────────────────────── */}
      {step === STEP.format && (
        <Section title={t.create.formatTitle} hint={t.create.formatHint}>
          <Field label={t.create.videoType}>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["vision", "cinematic"] as const).map((id) => (
                <Choice
                  key={id}
                  selected={tier === id}
                  onClick={() => setTier(id)}
                  title={t.products[id].name}
                  sub={t.products[id].tagline}
                  price={formatUsd(PRODUCTS[id].priceUsd)}
                />
              ))}
            </div>
          </Field>

          <Field label={t.create.duration}>
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
                  {d} {t.common.seconds}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t.create.visualStyle}>
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
                  {t.styles[s.id]}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t.create.voice}>
            <div className="grid gap-3 sm:grid-cols-3">
              {TONES.map((id) => (
                <Choice
                  key={id}
                  selected={tone === id}
                  onClick={() => setTone(id)}
                  title={t.tones[id].label}
                  sub={t.tones[id].blurb}
                />
              ))}
            </div>
          </Field>

          <div className="card mt-9 flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-5">
            <div>
              <p className="t-caption text-[var(--color-label-2)]">
                {isFree ? t.create.firstVideo : t.create.price}
              </p>
              <p className="mt-1 text-[1.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                {isFree ? (
                  <>
                    {t.common.free}{" "}
                    <span className="t-sub font-normal text-[var(--color-label-3)] line-through">
                      {formatUsd(price)}
                    </span>
                  </>
                ) : (
                  formatUsd(price)
                )}
              </p>
            </div>
            <p className="t-caption max-w-[45%] text-right text-[var(--color-label-2)]">
              {t.products[tier].waitLabel}
              {isFree && t.create.watermarkNote}
            </p>
          </div>

        </Section>
      )}

      {/* ── Paso 5: revisión ───────────────────────────────────────────── */}
      {step === STEP.review && (
        <Section title={t.create.reviewTitle} hint={t.create.reviewHint}>
          {loadingPreview || !preview ? (
            <p className="t-sub text-[var(--color-label-2)]">
              {loadingPreview ? t.create.reviewLoading : ""}
            </p>
          ) : (
            <>
              <p className="t-headline">{preview.script.title}</p>
              <ol className="mt-5 space-y-3">
                {preview.script.affirmations.map((line, i) => (
                  <li key={i} className="card rounded-[var(--radius-md)] p-4">
                    <p className="t-caption text-[var(--color-label-3)]">
                      {fill(t.create.reviewScene, { n: i + 1 })}
                    </p>
                    {/* Sin LLM no hay descripción en el idioma del usuario, y el
                        brief en inglés no le sirve para revisar: queda la frase. */}
                    {preview.script.sceneCaptions?.[i] && (
                      <p className="t-body mt-1.5 text-[var(--color-label-1)]">
                        {preview.script.sceneCaptions[i]}
                      </p>
                    )}
                    <p className="t-sub mt-2 italic text-[var(--color-label-2)]">«{line}»</p>
                  </li>
                ))}
              </ol>
            </>
          )}

          <div className="mt-8">
            <p className="t-sub mb-3 font-medium text-[var(--color-label-2)]">
              {t.create.reviewFixLabel}
            </p>
            <textarea
              value={fix}
              onChange={(e) => setFix(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder={t.create.reviewFixPlaceholder}
              className="t-body w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] p-4 outline-none transition-colors duration-200 placeholder:text-[var(--color-label-4)] focus:border-[var(--color-hairline-strong)]"
            />
            <button
              onClick={regenerate}
              disabled={loadingPreview}
              className="interactive t-sub mt-3 rounded-full border border-[var(--color-hairline-strong)] px-5 py-2 text-[var(--color-label-1)] disabled:opacity-30"
            >
              {t.create.reviewRegenerate}
            </button>
          </div>
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
          {t.common.back}
        </button>

        {step < STEP.review ? (
          <button
            onClick={next}
            disabled={!canContinue}
            className="interactive inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-2.5 text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {t.common.continue}
            <Icon name="arrow-right" size={15} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting || loadingPreview}
            className="interactive rounded-full bg-white px-6 py-2.5 text-[15px] font-medium tracking-[-0.011em] text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {submitting ? t.create.submitting : t.create.submit}
          </button>
        )}
      </div>
    </div>
  );
}

function Steps({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="t-caption flex items-center gap-2">
      {labels.map((label, i) => (
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
          <span
            className={`hidden sm:inline ${i <= current ? "text-[var(--color-label-1)]" : "text-[var(--color-label-3)]"}`}
          >
            {label}
          </span>
          {i < labels.length - 1 && (
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
