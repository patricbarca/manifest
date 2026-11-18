import type { User } from "../types";
import { SELFIE_MIN_SCORE } from "../selfie-check";

export interface SelfieSetStatus {
  ok: boolean;
  /** Selfies de cara hechas de frente (huecos 1 y 2) que pasan el pre-análisis. */
  frontal: number;
  /** Selfies de cara (cualquier hueco salvo el de medio cuerpo) que pasan el pre-análisis. */
  face: number;
  /** Qué falta: una de frente, o más selfies de cara. */
  missing: "frontal" | "more" | null;
}

/**
 * ¿Sus selfies bastan para que la cara salga suya? Hace falta al menos una de
 * frente y dos de cara en total. Solo cuentan las que tienen datos guardados
 * (las antiguas, sin hueco ni nota, hay que volver a hacerlas). Si el
 * pre-análisis está apagado no hay nota, y vale solo con el hueco.
 */
export function selfieSetStatus(user: Pick<User, "photoMeta">, livePhotoUrls: string[]): SelfieSetStatus {
  let frontal = 0;
  let face = 0;
  for (const url of livePhotoUrls) {
    const meta = user.photoMeta?.[url];
    if (!meta || meta.kind !== "face") continue;
    if (meta.score !== undefined && meta.score < SELFIE_MIN_SCORE) continue;
    face++;
    if (meta.slot === 0 || meta.slot === 1) frontal++;
  }
  const missing = frontal < 1 ? "frontal" : face < 2 ? "more" : null;
  return { ok: missing === null, frontal, face, missing };
}
