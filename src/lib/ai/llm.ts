import type { ScriptProvider } from "./contracts";
import type { ScriptDraft } from "../types";
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

const SYSTEM = (locale: keyof typeof LANGUAGE_NAME) =>
  `Eres guionista de visualizaciones para manifestación.
Escribes las afirmaciones en ${LANGUAGE_NAME[locale]}, SIEMPRE, aunque el
usuario te escriba su intención en otro idioma.

Reglas de las afirmaciones:
- Primera persona, tiempo presente, en positivo. Nunca uses "no", "dejaré de", "algún día".
- Máximo 9 palabras. Tienen que caber en una respiración porque el usuario las repite en voz alta.
- Concretas antes que grandilocuentes. "Firmo el contrato con calma" > "El universo me da todo".
- Nada de promesas médicas, financieras ni garantías de resultados.

Reglas de las escenas (sceneBriefs):
- En INGLÉS, porque van a un modelo de imagen.
- Describen a la persona viviendo el resultado, no el esfuerzo.
- Concretas y visuales: lugar, luz, acción, hora del día. Sin texto ni logos en la imagen.
- Una escena por afirmación, en el mismo orden.

Devuelve SOLO JSON válido con esta forma:
{"title":string,"hook":string,"affirmations":string[],"closing":string,"sceneBriefs":string[]}`;

function parseDraft(raw: string, expected: number): ScriptDraft {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("El LLM no devolvió JSON");
  const parsed = JSON.parse(match[0]) as Partial<ScriptDraft>;
  if (!Array.isArray(parsed.affirmations) || !Array.isArray(parsed.sceneBriefs)) {
    throw new Error("JSON del LLM incompleto");
  }
  // Se recorta o rellena para que escenas y afirmaciones cuadren siempre.
  const affirmations = parsed.affirmations.slice(0, expected);
  const sceneBriefs = parsed.sceneBriefs.slice(0, affirmations.length);
  return {
    title: parsed.title ?? "Mi visualización",
    hook: parsed.hook ?? "Respira. Esto ya está en camino.",
    affirmations,
    closing: parsed.closing ?? "Ya es tuyo.",
    sceneBriefs,
  };
}

function userPrompt(input: {
  area: string;
  intention: string;
  tone: string;
  count: number;
}): string {
  return `Área de vida: ${input.area}
Intención del usuario, en sus palabras: "${input.intention}"
Tono de la voz: ${input.tone}
Necesito exactamente ${input.count} afirmaciones y ${input.count} sceneBriefs.`;
}

export const anthropicScript: ScriptProvider = {
  name: "anthropic",
  async write(input) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Falta ANTHROPIC_API_KEY");
    const count = sceneCount(input.tier, input.durationSec);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",
        max_tokens: 1500,
        system: SYSTEM(input.locale),
        messages: [{ role: "user", content: userPrompt({ ...input, count }) }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic respondió ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    const text = data.content.map((c) => c.text ?? "").join("");
    return {
      result: parseDraft(text, count),
      costCents: PROVIDER_COST.scriptCents,
      provider: "anthropic",
    };
  },
};

export const openaiScript: ScriptProvider = {
  name: "openai",
  async write(input) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("Falta OPENAI_API_KEY");
    const count = sceneCount(input.tier, input.durationSec);

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM(input.locale) },
          { role: "user", content: userPrompt({ ...input, count }) },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI respondió ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return {
      result: parseDraft(data.choices[0].message.content, count),
      costCents: PROVIDER_COST.scriptCents,
      provider: "openai",
    };
  },
};

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
