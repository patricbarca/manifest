import { createHash } from "node:crypto";
import { falText } from "./ai/fal";
import type { SafetyKey, SafetyVerdict } from "./safety";

/**
 * Moderación del lenguaje con IA, después del filtro de palabras (safety.ts).
 *
 * Entiende el sentido, no solo las palabras: pilla lo que el filtro no ve
 * ("quiero que a mi vecino le pase algo malo") y deja pasar lo que el filtro
 * bloquearía por error. Proveedor:
 * - OPENAI_API_KEY → OpenAI Moderation (omni-moderation-latest, gratis).
 * - si no, con FAL_KEY → el LLM de fal como clasificador (céntimos por llamada).
 * - sin ninguno (modo demo) → no se modera; queda el filtro de palabras.
 *
 * Si el proveedor falla, se deja pasar (el filtro de palabras sigue activo y
 * el prompt final se vuelve a comprobar antes de generar). Se registra en logs.
 */

const cache = new Map<string, SafetyVerdict>();
const CACHE_MAX = 2000;

export async function moderate(texts: (string | undefined)[]): Promise<SafetyVerdict> {
  const clean = texts.map((t) => (t ?? "").trim()).filter(Boolean);
  if (!clean.length) return { ok: true };
  const joined = clean.join("\n");
  const key = createHash("sha256").update(joined).digest("hex");
  const hit = cache.get(key);
  if (hit) return hit;

  let verdict: SafetyVerdict = { ok: true };
  try {
    if (process.env.OPENAI_API_KEY) verdict = await openai(clean);
    else if (process.env.FAL_KEY) verdict = await llm(clean);
    else return { ok: true };
  } catch (err) {
    console.error("[moderation] falló, se deja pasar:", err instanceof Error ? err.message : err);
    return { ok: true };
  }
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, verdict);
  if (!verdict.ok) console.warn("[moderation] bloqueado:", verdict.key);
  return verdict;
}

/** Categorías de OpenAI → nuestras claves (el orden marca la prioridad). */
const OPENAI_MAP: [string, SafetyKey][] = [
  ["sexual/minors", "minors"],
  ["self-harm", "selfHarm"],
  ["self-harm/intent", "selfHarm"],
  ["self-harm/instructions", "selfHarm"],
  ["hate", "hate"],
  ["hate/threatening", "hate"],
  ["harassment/threatening", "violence"],
  ["violence", "violence"],
  ["violence/graphic", "violence"],
  ["illicit/violent", "violence"],
  ["sexual", "sexual"],
  ["harassment", "hate"],
  ["illicit", "drugs"],
];

async function openai(texts: string[]): Promise<SafetyVerdict> {
  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "omni-moderation-latest", input: texts }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`OpenAI moderation ${res.status}`);
  const data = (await res.json()) as { results?: { flagged: boolean; categories: Record<string, boolean> }[] };
  for (const r of data.results ?? []) {
    if (!r.flagged) continue;
    const hit = OPENAI_MAP.find(([cat]) => r.categories[cat]);
    return { ok: false, key: hit?.[1] ?? "violence" };
  }
  return { ok: true };
}

const LLM_KEYS: SafetyKey[] = ["sexual", "minors", "hate", "violence", "selfHarm", "drugs", "health", "finance"];

const SYSTEM = `You are a strict content moderator for an app that turns a person's written wishes into wholesome visualization videos of themselves (photos of their face are used).
Classify the user's texts (any language). Flag them if ANY text asks for or expresses:
- sexual: sexual, erotic, suggestive or nude content, sexualized clothing or poses.
- minors: any sexualization of minors, or the protagonist being a minor.
- hate: hate, slurs, discrimination or demeaning content about any group or person (race, religion, gender, sexuality, disability, nationality...), harassment.
- violence: harming, threatening, humiliating or taking revenge on someone, weapons, terrorism, gore.
- selfHarm: suicide, self-harm, wanting to die.
- drugs: illegal drugs or other clearly illegal activity.
- health: promising to cure a disease.
- finance: guaranteed financial returns.
Do NOT flag normal life goals: money, success, love, family with children, travel, fitness, beauty, confidence, career, faith, competition in sport or business, idioms like "killing it".
Reply with ONLY one line of JSON: {"ok":true} or {"ok":false,"category":"<one of: ${LLM_KEYS.join(", ")}>"}`;

async function llm(texts: string[]): Promise<SafetyVerdict> {
  const user = texts.map((t, i) => `${i + 1}. ${t.slice(0, 600)}`).join("\n");
  const out = await falText(SYSTEM, `Texts:\n${user}`, 40, {
    temperature: 0,
    model: process.env.FAL_MODERATION_MODEL,
  });
  const m = /\{[^}]*\}/.exec(out);
  if (!m) throw new Error(`respuesta sin JSON: ${out.slice(0, 80)}`);
  const v = JSON.parse(m[0]) as { ok?: boolean; category?: string };
  if (v.ok !== false) return { ok: true };
  const key = LLM_KEYS.find((k) => k === v.category) ?? "violence";
  return { ok: false, key };
}
