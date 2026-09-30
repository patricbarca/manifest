import type { ClarifyProvider, ScriptProvider } from "./contracts";
import type { ClarifyAnswer, ClarifyQuestion, ScriptDraft } from "../types";
import { draftScript } from "../script-engine";
import { sceneCount } from "../pricing";
import { PROVIDER_COST } from "../pricing";

/**
 * Guion con LLM.
 *
 * El banco determinista de script-engine ya da un guion decente; el LLM esta
 * para lo que ese banco no puede hacer: recoger la intencion concreta que
 * escribio el usuario ("quiero dirigir mi propio estudio en Lisboa") y
 * convertirla en escenas y frases que hablen de eso y no de "carrera" en
 * general. Si falla, se cae al banco: nunca dejamos al usuario sin video.
 */

const LANGUAGE_NAME = { es: "español de España", en: "English" } as const;
type Lang = keyof typeof LANGUAGE_NAME;

const SYSTEM = (locale: Lang) =>
  `Eres guionista de visualizaciones para manifestación.
Escribes las afirmaciones en ${LANGUAGE_NAME[locale]}, SIEMPRE, aunque el
usuario te escriba su intención en otro idioma.

Método (Neville Goddard, Joe Dispenza y lecturas populares de Jacobo Grinberg):
- Vivir desde el final: todo ocurre AHORA y ya está hecho. Nada de camino,
  esfuerzo ni espera.
- Sentir el deseo cumplido: cada frase y cada escena llevan la emoción de
  haberlo conseguido (gratitud, alegría, calma, orgullo tranquilo).
- La escena implica el cumplimiento: el momento justo después, como que
  alguien te felicite, un apretón de manos o un abrazo, o usar ya lo logrado.
- Primero se agradece lo que ya es, después se pide como quien ya lo tiene
  (agradeciendo al universo), y no se pide el cómo, solo el final.

gratitude: 3 frases cortas de gratitud por lo que la persona YA tiene hoy
(salud, gente, lo que ya construyó). Si el usuario dio detalles, úsalos.
request: una sola frase que pide el resultado dándolo por recibido, empezando
por "Gracias" (por ejemplo "Gracias, universo, porque ya dirijo mi estudio.").

Reglas de las afirmaciones:
- Primera persona, tiempo presente, en positivo, como si ya hubiera ocurrido.
- Nunca uses futuro ni deseo: "voy a", "quiero", "atraigo", "pronto", "algún día",
  "dejaré de", "no".
- Máximo 9 palabras. Tienen que caber en una respiración porque el usuario las repite en voz alta.
- Concretas antes que grandilocuentes. "Firmo el contrato con calma" > "El universo me da todo".
- Nada de promesas médicas, financieras ni garantías de resultados.

hook: una invitación breve a respirar y sentirlo como ya ocurrido.
closing: gratitud, como algo ya hecho ("Gracias. Ya está hecho.").

Reglas de las escenas (sceneBriefs):
- En INGLÉS, porque van a un modelo de imagen.
- La persona ya vive el resultado: el momento de disfrutarlo, no el esfuerzo.
- Muestran la emoción en la cara: gratitud, alegría serena.
- Concretas y visuales: lugar, luz, acción, hora del día. Sin texto ni logos en la imagen.
- Una escena por afirmación, en el mismo orden.
- Una de cada tres escenas, más o menos, es en primera persona: se ve desde
  los ojos de la persona, solo sus manos, sin su cara. Esas empiezan por "POV:"
  ("POV: hands on the steering wheel of a red convertible, coastal road").

Reglas de los detalles del usuario:
- Si el usuario contestó preguntas, sus respuestas mandan: úsalas tal cual.
- Nunca inventes a qué se dedica una empresa, un producto o una persona que
  el usuario nombra. Si no lo dijo, descríbelo de forma genérica.
- Los nombres propios (empresas, apps) pueden ir en las afirmaciones, pero
  NUNCA en los sceneBriefs: el modelo de imagen los escribe mal. En la escena
  describe lo que es ("a shared-expenses app on his phone").

sceneCaptions: una frase corta en ${LANGUAGE_NAME[locale]} por escena que
cuenta qué se ve, para que el usuario la revise antes de generar.

Devuelve SOLO JSON válido con esta forma:
{"title":string,"hook":string,"gratitude":string[],"request":string,"affirmations":string[],"closing":string,"sceneBriefs":string[],"sceneCaptions":string[]}`;

const CLARIFY_SYSTEM = (locale: Lang) =>
  `Preparas una visualización en vídeo de una persona logrando lo que quiere.
Antes de escribir las escenas necesitas los detalles concretos que la
intención no dice y que cambian lo que se ve en pantalla.

Haz entre 2 y 5 preguntas en ${LANGUAGE_NAME[locale]}, cortas y directas.
- Pregunta por lo que se ve: qué es cada empresa, app o proyecto que nombra;
  lugares; personas que están con él o ella; objetos concretos (qué coche, de
  qué color); cómo viste.
- No preguntes lo que la intención ya deja claro.
- Nada de preguntas sobre sentimientos ni sobre plazos.
- Cada pregunta lleva hasta 3 sugerencias de respuesta cortas y plausibles.
  Si preguntas qué es algo que el usuario nombró, no sugieras respuestas: no
  lo sabes.

Devuelve SOLO JSON válido con esta forma:
{"questions":[{"question":string,"suggestions":string[]}]}`;

function extractJson(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("El LLM no devolvió JSON");
  return JSON.parse(match[0]);
}

function parseDraft(raw: string, expected: number): ScriptDraft {
  const parsed = extractJson(raw) as Partial<ScriptDraft>;
  if (!Array.isArray(parsed.affirmations) || !Array.isArray(parsed.sceneBriefs)) {
    throw new Error("JSON del LLM incompleto");
  }
  // Se recorta o rellena para que escenas y afirmaciones cuadren siempre.
  const affirmations = parsed.affirmations.slice(0, expected);
  const sceneBriefs = parsed.sceneBriefs.slice(0, affirmations.length);
  const sceneCaptions = Array.isArray(parsed.sceneCaptions)
    ? parsed.sceneCaptions.slice(0, sceneBriefs.length)
    : undefined;
  return {
    title: parsed.title ?? "Mi visualización",
    hook: parsed.hook ?? "Respira. Siéntelo como algo que ya ha ocurrido.",
    gratitude: Array.isArray(parsed.gratitude)
      ? parsed.gratitude.filter((g): g is string => typeof g === "string").slice(0, 5)
      : undefined,
    request: typeof parsed.request === "string" ? parsed.request : undefined,
    affirmations,
    closing: parsed.closing ?? "Gracias. Ya está hecho.",
    sceneBriefs,
    // Solo sirven si hay una por escena; si no, la revisión enseña las afirmaciones.
    sceneCaptions: sceneCaptions?.length === sceneBriefs.length ? sceneCaptions : undefined,
  };
}

function parseQuestions(raw: string): ClarifyQuestion[] {
  const parsed = extractJson(raw) as { questions?: unknown };
  if (!Array.isArray(parsed.questions)) throw new Error("JSON del LLM incompleto");
  return parsed.questions
    .filter(
      (q): q is ClarifyQuestion =>
        typeof q === "object" && q !== null && typeof (q as ClarifyQuestion).question === "string",
    )
    .slice(0, 5)
    .map((q) => ({
      question: q.question.slice(0, 200),
      suggestions: (Array.isArray(q.suggestions) ? q.suggestions : [])
        .filter((s): s is string => typeof s === "string")
        .slice(0, 3)
        .map((s) => s.slice(0, 80)),
    }));
}

function detailsBlock(details: ClarifyAnswer[] | undefined): string {
  const answered = (details ?? []).filter((d) => d.answer.trim());
  if (!answered.length) return "";
  return (
    "\nDetalles que dio el usuario (mandan sobre cualquier suposición):\n" +
    answered.map((d) => `- ${d.question} → "${d.answer.trim()}"`).join("\n")
  );
}

function userPrompt(input: {
  area: string;
  intention: string;
  tone: string;
  count: number;
  details?: ClarifyAnswer[];
}): string {
  return `Área de vida: ${input.area}
Intención del usuario, en sus palabras: "${input.intention}"${detailsBlock(input.details)}
Tono de la voz: ${input.tone}
Necesito exactamente ${input.count} afirmaciones, ${input.count} sceneBriefs y ${input.count} sceneCaptions.`;
}

// ── Transporte ────────────────────────────────────────────────────────────
// Guion y preguntas hablan con el mismo modelo; solo cambia lo que se le pide.

async function anthropicText(system: string, user: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Falta ANTHROPIC_API_KEY");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic respondió ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return data.content.map((c) => c.text ?? "").join("");
}

async function openaiText(system: string, user: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Falta OPENAI_API_KEY");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI respondió ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

type Transport = (system: string, user: string, maxTokens: number) => Promise<string>;

const TRANSPORTS: Record<"anthropic" | "openai", Transport> = {
  anthropic: anthropicText,
  openai: (system, user) => openaiText(system, user),
};

function scriptProvider(name: keyof typeof TRANSPORTS): ScriptProvider {
  return {
    name,
    async write(input) {
      const count = sceneCount(input.tier, input.durationSec);
      const text = await TRANSPORTS[name](
        SYSTEM(input.locale),
        userPrompt({ ...input, count }),
        2000,
      );
      return {
        result: parseDraft(text, count),
        costCents: PROVIDER_COST.scriptCents,
        provider: name,
      };
    },
  };
}

function clarifyProvider(name: keyof typeof TRANSPORTS): ClarifyProvider {
  return {
    name,
    async ask(input) {
      const text = await TRANSPORTS[name](
        CLARIFY_SYSTEM(input.locale),
        `Área de vida: ${input.area}\nIntención del usuario, en sus palabras: "${input.intention}"`,
        800,
      );
      return {
        result: parseQuestions(text),
        costCents: PROVIDER_COST.scriptCents,
        provider: name,
      };
    },
  };
}

export const anthropicScript = scriptProvider("anthropic");
export const openaiScript = scriptProvider("openai");
export const anthropicClarify = clarifyProvider("anthropic");
export const openaiClarify = clarifyProvider("openai");

/**
 * Sin LLM no hay preguntas a medida. La lista vacía hace que la UI use las
 * preguntas genéricas del diccionario.
 */
export const noClarify: ClarifyProvider = {
  name: "mock",
  async ask() {
    return { result: [], costCents: 0, provider: "mock" };
  },
};

/** Si el LLM falla al preguntar, se sigue con las preguntas genéricas. */
export function clarifyWithFallback(primary: ClarifyProvider): ClarifyProvider {
  return {
    name: `${primary.name}+fallback`,
    async ask(input) {
      try {
        return await primary.ask(input);
      } catch (err) {
        console.warn("[clarify] sin preguntas a medida:", (err as Error).message);
        return { result: [], costCents: 0, provider: "fallback" };
      }
    },
  };
}

/** Envuelve un proveedor de guion para que un fallo nunca rompa la generación. */
export function withFallback(primary: ScriptProvider): ScriptProvider {
  return {
    name: `${primary.name}+fallback`,
    async write(input) {
      try {
        return await primary.write(input);
      } catch (err) {
        console.warn("[script] fallback al banco determinista:", (err as Error).message);
        return { result: draftScript(input), costCents: 0, provider: "fallback" };
      }
    },
  };
}
