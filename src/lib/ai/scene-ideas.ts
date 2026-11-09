import { falText } from "./fal";
import type { Locale } from "../i18n/locale";
import type { ClarifyAnswer } from "../types";

/** Una escena propuesta para un deseo: la persona la edita antes de generar. */
export interface SceneIdea {
  place: string;
  action: string;
  outfit: string;
  mood: string;
}

const LANG: Record<string, string> = { es: "español", en: "English" };

const SYSTEM = `Eres director de fotografía de vídeos de visualización. Para cada deseo propones UNA escena donde la persona ya lo está viviendo, que luego un modelo de imagen generará con su cara.

Reglas:
- Un solo momento, una sola foto, un solo lugar. Concreta y visual.
- La persona es la protagonista y la única cara visible, de cintura o pecho para arriba, mirando a cámara o de tres cuartos, con una sonrisa natural.
- Otras personas solo si hacen falta, y de espaldas o desenfocadas al fondo. Sin contacto físico.
- Nada de espejos, reflejos, pantallas con texto, carteles, números ni logos.
- Ropa concreta, bien ajustada, completa y de colores sobrios, adecuada al lugar.
- Apto para todo público.
- Respeta lo que el usuario contó en sus respuestas (a qué se dedica, dónde, con quién).
- Cada campo, frase corta (máx. 12 palabras), en el idioma pedido.

Devuelve SOLO JSON: {"scenes":[{"place":string,"action":string,"outfit":string,"mood":string}]} — una por deseo, en el mismo orden.`;

function extractJson(raw: string): { scenes?: Partial<SceneIdea>[] } {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("El LLM no devolvió JSON");
  return JSON.parse(m[0]);
}

const clip = (s: unknown) => (typeof s === "string" ? s.trim().slice(0, 90) : "");

export async function suggestSceneIdeas(opts: {
  desires: string[];
  details?: ClarifyAnswer[];
  locale: Locale;
  /** Para "otra idea": solo esa escena, distinta de la anterior. */
  avoid?: SceneIdea;
}): Promise<SceneIdea[]> {
  const empty = opts.desires.map(() => ({ place: "", action: "", outfit: "", mood: "" }));
  if (!process.env.FAL_KEY) return empty;
  const answered = (opts.details ?? []).filter((d) => d.answer.trim());
  const user = [
    `Idioma de los campos: ${LANG[opts.locale] ?? "English"}.`,
    "Deseos:",
    ...opts.desires.map((d, i) => `${i + 1}. ${d}`),
    answered.length ? `\nLo que contó el usuario:\n${answered.map((d) => `- ${d.question}: ${d.answer}`).join("\n")}` : "",
    opts.avoid
      ? `\nYa le propusiste esto y quiere otra idea claramente distinta (otro lugar y otra acción): ${JSON.stringify(opts.avoid)}`
      : "",
  ].join("\n");
  const raw = await falText(SYSTEM, user, 900, { temperature: opts.avoid ? 1 : 0.8 });
  const scenes = extractJson(raw).scenes ?? [];
  return opts.desires.map((_, i) => ({
    place: clip(scenes[i]?.place),
    action: clip(scenes[i]?.action),
    outfit: clip(scenes[i]?.outfit),
    mood: clip(scenes[i]?.mood),
  }));
}
