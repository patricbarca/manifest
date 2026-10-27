import { falNsfwProbability } from "./ai/fal";

/**
 * Revisa una foto subida (selfie, foto de otra persona o de perfil) con el
 * clasificador de desnudos de fal antes de aceptarla. Umbral configurable con
 * PHOTO_NSFW_THRESHOLD (0–1, por defecto 0,5). Sin FAL_KEY (modo demo) no
 * revisa. Si fal falla, la deja pasar: las imágenes generadas vuelven a pasar
 * el filtro de seguridad de fal.
 */
export async function photoLooksUnsafe(absPath: string): Promise<boolean> {
  if (!process.env.FAL_KEY) return false;
  const threshold = Number(process.env.PHOTO_NSFW_THRESHOLD ?? 0.5);
  try {
    const p = await falNsfwProbability(absPath);
    if (p >= threshold) console.warn("[photo-safety] foto rechazada, p =", p.toFixed(2));
    return p >= threshold;
  } catch (err) {
    console.error("[photo-safety] falló, se acepta:", err instanceof Error ? err.message : err);
    return false;
  }
}
