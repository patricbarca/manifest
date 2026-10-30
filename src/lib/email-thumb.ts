import sharp from "sharp";
import type { Project } from "./types";
import { localPathForMediaUrl } from "./paths";
import { ensureLocal } from "./manifest/compose";

const PLAY = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="854">
    <circle cx="240" cy="730" r="50" fill="rgba(0,0,0,0.45)" stroke="white" stroke-width="4"/>
    <path d="M224 705 L268 730 L224 755 Z" fill="white"/>
  </svg>`,
);

/** Su último vídeo terminado (el más reciente). */
export function latestReady(projects: Project[]): Project | undefined {
  return projects.filter((p) => p.status === "ready").sort((a, b) => b.createdAt - a.createdAt)[0];
}

/**
 * Portada para el email: la primera escena del vídeo (vertical), pequeña y
 * con un botón de play encima. Undefined si no hay imagen a mano.
 */
export async function videoThumb(project: Project): Promise<Buffer | undefined> {
  try {
    const url = project.scenes.find((s) => s.imageUrl && !s.pov)?.imageUrl ?? project.scenes.find((s) => s.imageUrl)?.imageUrl;
    if (!url || !(await ensureLocal(url))) return undefined;
    const abs = localPathForMediaUrl(url);
    if (!abs) return undefined;
    return await sharp(abs)
      .resize(480, 854, { fit: "cover", position: "attention" })
      .composite([{ input: PLAY }])
      .jpeg({ quality: 78, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    console.error("[email] sin portada:", err instanceof Error ? err.message : err);
    return undefined;
  }
}
