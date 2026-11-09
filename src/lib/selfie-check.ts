import { falVision } from "./ai/fal";

/**
 * Pre-análisis de una selfie: ¿sirve como referencia de la cara?
 * Una IA de visión le pone nota (0–10) y dice qué falla. Una foto de perfil,
 * con los ojos cerrados u oscura hace que la cara salga deformada en las
 * escenas, así que por debajo de SELFIE_MIN_SCORE (5) se pide otra.
 * Si el análisis falla, la foto se acepta: no bloqueamos por un error nuestro.
 */
export const SELFIE_ISSUES = [
  "no_face",
  "multiple_faces",
  "profile",
  "eyes_closed",
  "looking_away",
  "face_small",
  "blurry",
  "dark",
  "harsh_light",
  "covered",
  "filter",
  "not_photo",
] as const;
export type SelfieIssue = (typeof SELFIE_ISSUES)[number];
export interface SelfieQuality {
  score: number;
  issues: SelfieIssue[];
}

const SYSTEM = "You check if a photo is a good face reference for an AI that will put this person's face into new photos. Reply ONLY with JSON.";
const PROMPT = `Rate this photo as a face reference. JSON: {"faces": number of real people whose face is clearly visible (count only actual people; ignore pillows, patterns, shadows, posters, pictures, screens and faces cut off at the edge), "face_pct": height of the main face (chin to top of the head) as a percentage of the image height (0-100), "score": 0-10, "issues": array using only these codes: "no_face", "multiple_faces", "profile" (face turned more than ~45 degrees), "eyes_closed", "looking_away", "face_small" (face under ~15% of image height), "blurry", "dark", "harsh_light", "covered" (sunglasses, mask, hat or hair covering eyes/face), "filter" (heavy beauty filter or edited), "not_photo" (drawing, screenshot, pet)}. Score 9-10: frontal, sharp, well lit, eyes open, face large. 7-8: good with minor issues. 5-6: usable but weak. 0-4: unusable (profile, eyes closed, no face, several faces, very blurry or dark).`;

export const SELFIE_MIN_SCORE = Number(process.env.SELFIE_MIN_SCORE ?? 5);
/** Alto mínimo de la cara (% del alto de la foto). La de medio cuerpo lleva su propio mínimo. */
const MIN_FACE_PCT = Number(process.env.SELFIE_MIN_FACE_PCT ?? 25);
const MIN_FACE_PCT_BODY = Number(process.env.SELFIE_MIN_FACE_PCT_BODY ?? 10);

export async function assessSelfie(
  absPath: string,
  framing: "face" | "body" = "face",
  opts: { oneFace?: boolean } = {},
): Promise<SelfieQuality | null> {
  if (!process.env.FAL_KEY || process.env.SELFIE_CHECK === "off") return null;
  try {
    // El escáner ya contó una sola cara: se le dice al modelo para que no baje la nota por "otras caras".
    const prompt = opts.oneFace ? `${PROMPT} A face detector already verified this photo shows exactly one person: set faces to 1 and do not penalize for other faces.` : PROMPT;
    const raw = await falVision(absPath, SYSTEM, prompt);
    const json = JSON.parse(raw.replace(/```(?:json)?/g, "").trim().match(/\{[\s\S]*\}/)?.[0] ?? "{}") as {
      faces?: number;
      face_pct?: number;
      score?: number;
      issues?: string[];
    };
    let issues = (json.issues ?? []).filter((i): i is SelfieIssue => (SELFIE_ISSUES as readonly string[]).includes(i));
    // Hecha con el escáner: el detector ya vio una sola cara; el modelo a veces ve caras en cojines o sombras.
    if (opts.oneFace) {
      issues = issues.filter((i) => i !== "multiple_faces" && i !== "no_face");
      json.faces = 1;
    }
    if (json.faces === 0 && !issues.includes("no_face")) issues.push("no_face");
    if ((json.faces ?? 1) > 1 && !issues.includes("multiple_faces")) issues.push("multiple_faces");
    let score = Math.max(0, Math.min(10, Number(json.score)));
    if (!Number.isFinite(score)) return null;
    // Tamaño de la cara medido por nosotros, no a ojo del modelo: si es pequeña, se avisa (nota máx. 6).
    const pct = Number(json.face_pct);
    const min = framing === "body" ? MIN_FACE_PCT_BODY : MIN_FACE_PCT;
    if (Number.isFinite(pct) && pct > 0 && pct < min) {
      if (!issues.includes("face_small")) issues.push("face_small");
      score = Math.min(score, 6);
    } else if (Number.isFinite(pct) && pct >= min) {
      const i = issues.indexOf("face_small");
      if (i >= 0) issues.splice(i, 1);
    }
    // Sin cara o con varias no sirve, diga lo que diga la nota.
    return { score: issues.includes("no_face") || issues.includes("multiple_faces") ? Math.min(score, 3) : score, issues };
  } catch (err) {
    console.error("[selfie-check] falló, se acepta:", err instanceof Error ? err.message : err);
    return null;
  }
}
