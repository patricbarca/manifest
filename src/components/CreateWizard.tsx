"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PALETTES, TIERS, type Palette } from "@/lib/types";
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
import { formatUsd } from "@/lib/pricing";
import { PALETTE_SWATCH } from "@/lib/palettes";
import { fill, type Dictionary, type Locale } from "@/lib/i18n";
import { Icon } from "./Icon";

/** Muestra de cada paleta: mismos colores que el fondo animado del vídeo. */

/**
 * El asistente de creación.
 *
 * Se empieza por lo que la persona quiere manifestar, 3 deseos, una por
 * casilla: cada una se convierte en una imagen y una frase.
 *
 * El orden importa: primero se pregunta qué quiere la persona y solo después
 * se le pide la cara, porque pedir un selfie en la pantalla uno es donde se
 * cae la gente.
 *
 * Dos pasos existen para no inventar: los detalles (el LLM pregunta lo que la
 * intención no dice, como a qué se dedica la empresa que nombras) y la
 * revisión (ves las escenas antes de pagar y puedes corregirlas).
 */


import { DEFAULT_VOICE, VOICES, voiceSample } from "@/lib/voices";
import type { Locale as VideoLocale } from "@/lib/i18n/locale";

const STEP = { desires: 0, details: 1, photo: 2, people: 3, format: 4, review: 5 } as const;
const MAX_PEOPLE = 4;
const MAX_PERSON_PHOTOS = 3;

type PersonDraft = { name: string; relation: string; photoUrls: string[] };

/** Cuántas cosas se pueden manifestar en un vídeo: una imagen y una frase por cada una. */
// Tres deseos: el vídeo de inicio trae 3 manifestaciones; luego se añaden de una en una.
const MAX_DESIRES = 3;

/** Correcciones que se arrastran de una reescritura a la siguiente. */
const MAX_CORRECTIONS = 3;

type Preview = { key: string; previewId: string; script: ScriptDraft };

type Props = {
  initialArea?: LifeArea;
  template?: Template;
  /** Vídeos gratis que le quedan. El primero lo invita la casa. */
  freeLeft: number;
  /** Precio por calidad, calculado en el servidor (TIER_PRICES). */
  prices: Record<Tier, number>;
  /** Producto elegido antes de entrar (desde la ficha de una plantilla). */
  initialTier?: Tier;
  /** El diccionario llega por prop: este componente corre en el cliente. */
  t: Dictionary;
  locale: Locale;
};

export function CreateWizard({ initialArea, template, freeLeft, prices, initialTier, t, locale }: Props) {
  const router = useRouter();

  const [step, setStep] = useState<number>(STEP.desires);
  // El área ya no se pregunta: llega de la plantilla o de la portada, o la
  // deduce el servidor a partir de los deseos.
  const area: LifeArea | undefined = template?.area ?? initialArea;
  // Con plantilla, sus frases son el punto de partida: se pueden editar.
  const [desires, setDesires] = useState<string[]>(
    // Siempre 3 casillas: el primer vídeo trae 3 escenas, una por deseo.
    template ? template.affirmations[locale].slice(0, MAX_DESIRES) : Array(MAX_DESIRES).fill(""),
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [palette, setPalette] = useState<Palette>("dusk");
  const [videoLocale, setVideoLocale] = useState<VideoLocale>(locale as VideoLocale);
  const [voice, setVoice] = useState<string>(DEFAULT_VOICE);
  const [consent, setConsent] = useState(false);
  // Consentimiento aparte para tratar las fotos de cara (dato biométrico): proveedores, plazo y uso.
  const [bioConsent, setBioConsent] = useState(false);
  // UE: para generar ya hay que pedirlo expresamente y aceptar perder el desistimiento de 14 días.
  const [waiver, setWaiver] = useState(false);
  const [people, setPeople] = useState<PersonDraft[]>([]);
  const [peopleConsent, setPeopleConsent] = useState(false);
  const [uploadingPerson, setUploadingPerson] = useState<number>();
  const [uploading, setUploading] = useState(false);
  const [tier, setTier] = useState<Tier>(initialTier ?? template?.tier ?? "vision");
  // Estilo, tono y duración ya no se preguntan: el vídeo nuevo tiene una
  // sola voz y dura lo que piden las frases. Se mandan con su valor fijo.
  const style: VisualStyle = template?.style ?? "cinematic";
  const tone: VoiceTone = template?.tone ?? "calma";
  const durationSec: 30 | 60 = 60;
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

  const price = prices[tier];
  const isFree = freeLeft > 0;

  const canContinue = useMemo(() => {
    if (step === STEP.desires) {
      const filled = desires.map((d) => d.trim()).filter(Boolean);
      return (
        filled.length === MAX_DESIRES &&
        filled.every((d) => d.length >= 3) &&
        filled.join(" ").length >= 8
      );
    }
    if (step === STEP.details) return !loadingQuestions;
    if (step === STEP.people) {
      // Las personas son opcionales, pero las que se añaden van completas.
      return (
        uploadingPerson === undefined &&
        people.every((p) => p.name.trim() && p.photoUrls.length > 0) &&
        (people.length === 0 || peopleConsent)
      );
    }
    return true; // la foto es opcional, y el formato siempre es válido
  }, [step, desires, loadingQuestions, people, peopleConsent, uploadingPerson]);

  const cleanPeople = useMemo(
    () =>
      people
        .filter((p) => p.name.trim() && p.photoUrls.length > 0)
        .map((p) => ({
          name: p.name.trim(),
          relation: p.relation.trim() || undefined,
          photoUrls: p.photoUrls,
        })),
    [people],
  );
  const peopleNames = useMemo(
    () => cleanPeople.map((p) => ({ name: p.name, relation: p.relation })),
    [cleanPeople],
  );

  function setPerson(i: number, patch: Partial<PersonDraft>) {
    setPeople((prev) => prev.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  }

  const cleanDesires = useMemo(() => desires.map((d) => d.trim()).filter(Boolean), [desires]);

  function setDesire(i: number, value: string) {
    setDesires((prev) => prev.map((d, k) => (k === i ? value : d)));
  }

  /** Un ejemplo va a la primera casilla vacía, o abre una nueva si caben. */
  function addExample(text: string) {
    setDesires((prev) => {
      const empty = prev.findIndex((d) => !d.trim());
      if (empty >= 0) return prev.map((d, k) => (k === empty ? text : d));
      return prev.length < MAX_DESIRES ? [...prev, text] : prev;
    });
  }

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
    desires: cleanDesires,
    details,
    tier,
    tone,
    durationSec,
    locale,
    videoLocale,
    people: peopleNames,
  });

  async function loadQuestions() {
    const key = JSON.stringify({ area, desires: cleanDesires });
    if (key === questionsKey) return;
    setLoadingQuestions(true);
    setError(undefined);
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, desires: cleanDesires }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.errors.createFailed);
      setQuestions(data.questions);
      setTailored(data.tailored);
      setAnswers([]);
      setQuestionsKey(key);
      // Si no hay nada que aclarar, no se hace pasar a la persona por un paso vacío.
      if (data.questions.length === 0) setStep(STEP.photo);
    } catch (err) {
      setError((err as Error).message);
      setStep(STEP.desires);
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
      desires: cleanDesires,
      details: payloadDetails,
      tier,
      tone,
      durationSec,
      locale,
      videoLocale,
      people: peopleNames,
    });
    try {
      const res = await fetch("/api/script-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area,
          desires: cleanDesires,
          details: payloadDetails,
          tier,
          tone,
          durationSec,
          people: peopleNames,
          language: videoLocale,
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

  /** Sube una foto y devuelve su URL, o undefined si falló (el error ya se muestra). */
  async function sendPhoto(file: File, agreed: boolean, self = false): Promise<string | undefined> {
    setError(undefined);
    const body = new FormData();
    body.append("selfie", file);
    body.append("consent", String(agreed));
    body.append("biometric", String(bioConsent));
    if (self) body.append("kind", "self");
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.errors.uploadFailed);
      return data.url as string;
    } catch (err) {
      setError((err as Error).message);
      return undefined;
    }
  }

  async function upload(file: File) {
    setUploading(true);
    const url = await sendPhoto(file, consent, true);
    if (url) setPhotoUrls((prev) => [...prev, url].slice(0, 4));
    setUploading(false);
  }

  async function uploadPersonPhotos(i: number, files: File[]) {
    setUploadingPerson(i);
    for (const file of files) {
      const url = await sendPhoto(file, peopleConsent);
      if (url) {
        setPeople((prev) =>
          prev.map((p, k) =>
            k === i ? { ...p, photoUrls: [...p.photoUrls, url].slice(0, MAX_PERSON_PHOTOS) } : p,
          ),
        );
      }
    }
    setUploadingPerson(undefined);
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
          desires: cleanDesires,
          tier,
          style,
          tone,
          durationSec,
          photoUrls,
          palette,
          people: cleanPeople,
          language: videoLocale,
          voice,
          templateSlug: template?.slug,
          details,
          waiver,
          // Solo si la revisión sigue siendo de lo que se va a generar.
          previewId: preview?.key === scriptKey ? preview.previewId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.errors.createFailed);
      // Con pagos activos, la API devuelve la página de pago de Stripe.
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
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

      {/* ── Paso 0: deseos ────────────────────────────────────────────── */}
      {step === STEP.desires && (
        <Section title={t.create.desiresTitle} hint={t.create.desiresHint}>
          <div className="space-y-3">
            {desires.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="t-caption w-5 shrink-0 text-right tabular-nums text-[var(--color-label-3)]">
                  {i + 1}
                </span>
                <input
                  value={d}
                  onChange={(e) => setDesire(i, e.target.value)}
                  maxLength={200}
                  autoFocus={i === 0}
                  placeholder={t.create.desirePlaceholders[i % t.create.desirePlaceholders.length]}
                  className="t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none transition-colors duration-200 placeholder:text-[var(--color-label-4)] focus:border-[var(--color-hairline-strong)]"
                />
              </div>
            ))}
          </div>

          <p className="t-caption mt-3 ml-7 text-[var(--color-label-3)]">
            {fill(t.create.desiresCount, { n: cleanDesires.length, max: MAX_DESIRES })}
          </p>

          <p className="t-sub mt-8 mb-3 text-[var(--color-label-2)]">{t.create.ideasLabel}</p>
          <div className="flex flex-wrap gap-2">
            {t.create.desireExamples.map((idea) => (
              <button
                key={idea}
                onClick={() => addExample(idea)}
                className="interactive t-caption rounded-full border border-[var(--color-hairline)] px-3.5 py-1.5 text-[var(--color-label-2)] hover:text-[var(--color-label-1)]"
              >
                {idea}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── Paso 1: detalles ───────────────────────────────────────────── */}
      {step === STEP.details && (
        <Section title={t.create.detailsTitle} hint={t.create.detailsHint}>
          {loadingQuestions || !questions ? (
            <p className="t-sub text-[var(--color-label-2)]">{t.create.detailsLoading}</p>
          ) : (
            <div className="space-y-7">
              {!tailored && (
                <p className="t-caption text-[var(--color-label-3)]">{t.create.detailsGeneric}</p>
              )}
              {questions.length === 0 && (
                <p className="t-sub text-[var(--color-label-2)]">{t.create.detailsNone}</p>
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

      {/* ── Paso 2: foto ───────────────────────────────────────────────── */}
      {step === STEP.photo && (
        <Section
          title={t.create.photoTitle}
          hint={t.create.photoHint}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }, (_, i) => photoUrls[i]).map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[var(--color-hairline-strong)] bg-[var(--color-surface-2)]"
                >
                  {url ? (
                    <>
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrls((prev) => prev.filter((u) => u !== url))}
                        className="t-caption absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-white backdrop-blur"
                      >
                        {t.create.removePhoto}
                      </button>
                    </>
                  ) : (
                    <span className="t-caption grid h-full place-items-center text-[var(--color-label-3)]">
                      {i + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <label className="t-sub flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-[3px] h-4 w-4 accent-white"
              />
              <span>{t.consent}</span>
            </label>
            <label className="t-sub flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
              <input
                type="checkbox"
                checked={bioConsent}
                onChange={(e) => setBioConsent(e.target.checked)}
                className="mt-[3px] h-4 w-4 accent-white"
              />
              <span>
                {t.biometricConsent}{" "}
                <a href="/privacidad" target="_blank" className="underline">{t.biometricMore}</a>
              </span>
            </label>

            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={!consent || !bioConsent || uploading || photoUrls.length >= 4}
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []).slice(0, 4 - photoUrls.length);
                e.target.value = "";
                for (const file of files) await upload(file);
              }}
              className="t-sub block w-full text-[var(--color-label-2)] file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-5 file:py-2 file:text-[13px] file:font-medium file:text-black hover:file:bg-white/90 disabled:opacity-35"
            />
            <p className="t-caption text-[var(--color-label-3)]">
              {uploading ? t.create.uploading : fill(t.create.photoCount, { n: photoUrls.length })}
            </p>

            <p className="t-caption leading-relaxed text-[var(--color-label-3)]">
              {t.create.photoPrivacy}
            </p>
          </div>
        </Section>
      )}

      {/* ── Paso 3: personas ───────────────────────────────────────────── */}
      {step === STEP.people && (
        <Section title={t.create.peopleTitle} hint={t.create.peopleHint}>
          <div className="space-y-5">
            {people.length > 0 && (
              <label className="t-sub flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
                <input
                  type="checkbox"
                  checked={peopleConsent}
                  onChange={(e) => setPeopleConsent(e.target.checked)}
                  className="mt-[3px] h-4 w-4 accent-white"
                />
                <span>{t.create.peopleConsent}</span>
              </label>
            )}

            {people.map((person, i) => (
              <div
                key={i}
                className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface-2)] p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.create.personName}</span>
                    <input
                      value={person.name}
                      maxLength={40}
                      onChange={(e) => setPerson(i, { name: e.target.value.replace(/[[\]]/g, "") })}
                      placeholder={t.create.personNamePlaceholder}
                      className="t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none transition-colors duration-200 placeholder:text-[var(--color-label-4)] focus:border-[var(--color-hairline-strong)]"
                    />
                  </label>
                  <label className="block">
                    <span className="t-caption mb-1.5 block text-[var(--color-label-2)]">{t.create.personRelation}</span>
                    <input
                      value={person.relation}
                      maxLength={40}
                      onChange={(e) => setPerson(i, { relation: e.target.value })}
                      placeholder={t.create.personRelationPlaceholder}
                      className="t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none transition-colors duration-200 placeholder:text-[var(--color-label-4)] focus:border-[var(--color-hairline-strong)]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: MAX_PERSON_PHOTOS }, (_, k) => person.photoUrls[k]).map((url, k) => (
                    <div
                      key={k}
                      className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-md)] border border-dashed border-[var(--color-hairline-strong)]"
                    >
                      {url ? (
                        <>
                          <img src={url} alt="" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPerson(i, { photoUrls: person.photoUrls.filter((u) => u !== url) })}
                            className="t-caption absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-white backdrop-blur"
                          >
                            {t.create.removePhoto}
                          </button>
                        </>
                      ) : (
                        <span className="t-caption grid h-full place-items-center text-[var(--color-label-3)]">
                          {k + 1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!peopleConsent || uploadingPerson !== undefined || person.photoUrls.length >= MAX_PERSON_PHOTOS}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []).slice(0, MAX_PERSON_PHOTOS - person.photoUrls.length);
                    e.target.value = "";
                    void uploadPersonPhotos(i, files);
                  }}
                  className="t-sub block w-full text-[var(--color-label-2)] file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-white file:px-5 file:py-2 file:text-[13px] file:font-medium file:text-black hover:file:bg-white/90 disabled:opacity-35"
                />
                <div className="flex items-center justify-between">
                  <p className="t-caption text-[var(--color-label-3)]">
                    {uploadingPerson === i
                      ? t.create.uploading
                      : fill(t.create.personPhotos, { n: person.photoUrls.length })}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPeople((prev) => prev.filter((_, k) => k !== i))}
                    className="t-caption text-[var(--color-label-2)] underline"
                  >
                    {t.create.removePerson}
                  </button>
                </div>
              </div>
            ))}

            {people.length < MAX_PEOPLE && (
              <button
                type="button"
                onClick={() => setPeople((prev) => [...prev, { name: "", relation: "", photoUrls: [] }])}
                className="t-sub rounded-full border border-[var(--color-hairline-strong)] px-5 py-2"
              >
                {t.create.addPerson}
              </button>
            )}

            {people.some((p) => !p.name.trim() || p.photoUrls.length === 0) && (
              <p className="t-caption text-[var(--color-label-3)]">{t.create.peopleIncomplete}</p>
            )}
            {people.length > 0 && (
              <p className="t-caption leading-relaxed text-[var(--color-label-3)]">{t.create.peoplePrivacy}</p>
            )}
          </div>
        </Section>
      )}

      {/* ── Paso 3: formato ────────────────────────────────────────────── */}
      {step === STEP.format && (
        <Section title={t.create.formatTitle} hint={t.create.formatHint}>
          <Field label={t.create.videoType}>
            <div className="grid gap-3 sm:grid-cols-3">
              {TIERS.map((id) => (
                <Choice
                  key={id}
                  selected={tier === id}
                  onClick={() => setTier(id)}
                  title={t.products[id].name}
                  sub={t.products[id].tagline}
                  price={formatUsd(prices[id])}
                />
              ))}
            </div>
          </Field>

          <Field label={t.create.videoLanguage}>
            <div className="grid grid-cols-2 gap-3">
              {(["es", "en"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setVideoLocale(id)}
                  className={`interactive t-sub rounded-[var(--radius-md)] border px-4 py-3 ${
                    videoLocale === id ? "border-white ring-1 ring-white" : "border-[var(--color-hairline)]"
                  }`}
                >
                  {t.create.languages[id]}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t.create.voiceLabel}>
            <div className="grid gap-2">
              {VOICES.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between gap-3 rounded-[var(--radius-md)] border px-4 py-2.5 ${
                    voice === v.id ? "border-white ring-1 ring-white" : "border-[var(--color-hairline)]"
                  }`}
                >
                  <button type="button" onClick={() => setVoice(v.id)} className="t-sub flex-1 text-left">
                    {v.label[locale as VideoLocale]}
                  </button>
                  <button
                    type="button"
                    aria-label={t.create.voiceListen}
                    onClick={() => {
                      setVoice(v.id);
                      void new Audio(voiceSample(v.id, videoLocale)).play();
                    }}
                    className="t-caption rounded-full border border-[var(--color-hairline)] px-3 py-1 text-[var(--color-label-2)]"
                  >
                    ▶ {t.create.voiceListen}
                  </button>
                </div>
              ))}
            </div>
          </Field>

          <Field label={t.create.palette}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {PALETTES.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPalette(id)}
                  className={`interactive overflow-hidden rounded-[var(--radius-md)] border text-left ${
                    palette === id ? "border-white ring-1 ring-white" : "border-[var(--color-hairline)]"
                  }`}
                >
                  <span className="block h-16" style={{ background: PALETTE_SWATCH[id] }} />
                  <span className="t-caption block px-2 py-1.5 text-[var(--color-label-2)]">
                    {t.create.palettes[id]}
                  </span>
                </button>
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

      {/* ── Paso 4: revisión ───────────────────────────────────────────── */}
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

      {step === STEP.review && (
        <label className="t-caption mt-8 flex cursor-pointer items-start gap-3 text-[var(--color-label-2)]">
          <input type="checkbox" checked={waiver} onChange={(e) => setWaiver(e.target.checked)} className="mt-[2px] h-4 w-4 shrink-0 accent-white" />
          <span>
            {t.create.waiver}{" "}
            <a href="/reembolsos" target="_blank" className="underline">{t.create.waiverMore}</a>
          </span>
        </label>
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
            disabled={submitting || loadingPreview || !waiver}
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
