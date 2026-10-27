import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { Manifestation, Project } from "../types";
import { localPathForMediaUrl, mediaPath } from "../paths";
import { offloadProject } from "../cleanup";
import { manifests } from "./store";

export const newManifestId = () => `m_${Date.now().toString(36)}${randomBytes(5).toString("hex")}`;

/** Copia un fichero /media de un proyecto a la carpeta de la manifestación y devuelve su nueva URL. */
async function copyInto(mid: string, url: string | undefined, name: string): Promise<string | undefined> {
  const src = url ? localPathForMediaUrl(url) : null;
  if (!src) return undefined;
  const ext = path.extname(src) || path.extname(url!.split("?")[0]);
  const file = `${name}${ext}`;
  await mkdir(mediaPath("generated", mid), { recursive: true });
  try {
    await copyFile(src, mediaPath("generated", mid, file));
  } catch {
    return undefined;
  }
  return `/media/generated/${mid}/${file}`;
}

/** Título corto a partir del deseo: la primera frase, recortada. */
export function shortTitle(text: string): string {
  const first = text.split(/[.\n!?]/)[0].trim();
  return first.length > 48 ? `${first.slice(0, 47).trimEnd()}…` : first || text.slice(0, 48);
}

/**
 * Al terminar un vídeo completo, cada escena se guarda también como
 * manifestación suelta (copia de imagen, clip, voz y highlight), para poder
 * reutilizarla en otros vídeos aunque el original se borre.
 */
export async function extractManifestations(project: Project, lineUrls: Record<string, string>): Promise<number> {
  const affirmations = project.script?.affirmations ?? [];
  const highlights = project.highlights ?? [];
  let clipIndex = 0;
  let made = 0;
  for (const [i, scene] of project.scenes.entries()) {
    if (!scene.videoUrl) continue;
    const hl = highlights[clipIndex++];
    const mid = newManifestId();
    const clipUrl = await copyInto(mid, scene.videoUrl, "clip");
    if (!clipUrl) continue;
    const desire = project.desires?.[i] ?? affirmations[i] ?? project.title;
    const m: Manifestation = {
      id: mid,
      ownerId: project.ownerId,
      createdAt: project.createdAt + i,
      updatedAt: Date.now(),
      status: "ready",
      desire,
      title: shortTitle(desire),
      locale: project.locale,
      style: project.style,
      voice: project.voice,
      brief: project.script?.sceneBriefs?.[i],
      affirmation: affirmations[i],
      imageUrl: await copyInto(mid, scene.imageUrl, "image"),
      clipUrl,
      voiceUrl: await copyInto(mid, lineUrls[`a${i}`], "voice"),
      highlight: hl
        ? {
            videoUrl: (await copyInto(mid, hl.videoUrl, "hl_0")) ?? hl.videoUrl,
            posterUrl: (await copyInto(mid, hl.posterUrl, "hl_0")) ?? hl.posterUrl,
          }
        : undefined,
      sourceProjectId: project.id,
      costCents: 0,
    };
    await manifests.put(m);
    await offloadProject(mid);
    made++;
  }
  return made;
}
