import { readdir, rm, stat } from "node:fs/promises";
import { deletePrefix, objectStorageEnabled, putFile } from "./object-storage";
import path from "node:path";
import { db } from "./db/store";
import { DATA_DIR, contentTypeFor, localPathForMediaUrl, mediaDir, mediaPath } from "./paths";
import type { Project } from "./types";

/**
 * Borrado y limpieza de ficheros.
 *
 * El volumen es pequeño y las fotos son datos sensibles, así que:
 *  - al borrar un proyecto se van su vídeo, sus escenas y sus fotos;
 *  - las fotos subidas caducan a los UPLOAD_TTL_DAYS días (30 por defecto);
 *  - los proyectos con vídeo caducan a los VIDEO_TTL_DAYS días, si se fija;
 *  - los temporales de montaje de más de un día se borran.
 */

const DAY = 24 * 60 * 60 * 1000;
const UPLOAD_TTL_DAYS = Number(process.env.UPLOAD_TTL_DAYS ?? 30);
const VIDEO_TTL_DAYS = process.env.VIDEO_TTL_DAYS ? Number(process.env.VIDEO_TTL_DAYS) : undefined;

/** Todas las fotos que usa un proyecto: las del usuario y las de sus personas. */
function photoUrls(p: Project): string[] {
  return [
    ...(p.photoUrls ?? []),
    ...(p.selfieUrl ? [p.selfieUrl] : []),
    ...(p.people ?? []).flatMap((x) => x.photoUrls),
  ];
}

async function removeUrl(url: string) {
  const abs = localPathForMediaUrl(url);
  if (abs) await rm(abs, { force: true }).catch(() => undefined);
}

/** Borra un proyecto entero. Las fotos que use otro proyecto del mismo dueño se quedan. */
export async function deleteProject(project: Project): Promise<void> {
  const others = (await db.listProjects(project.ownerId)).filter((p) => p.id !== project.id);
  const inUse = new Set(others.flatMap(photoUrls));
  for (const url of new Set(photoUrls(project))) {
    if (!inUse.has(url)) await removeUrl(url);
  }
  await rm(mediaPath("generated", project.id), { recursive: true, force: true });
  await rm(path.join(DATA_DIR, "tmp", `render-${project.id}`), { recursive: true, force: true });
  if (objectStorageEnabled()) {
    await deletePrefix(`generated/${project.id}/`).catch((err) => console.error("[bucket] borrar", project.id, err));
  }
  await db.deleteProject(project.id);
}

/** Después de montar el vídeo los clips ya no hacen falta: pesan más que el vídeo final. */
export async function dropIntermediates(project: Project): Promise<void> {
  for (const s of project.scenes) if (s.videoUrl) await removeUrl(s.videoUrl);
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(abs)));
    else out.push(abs);
  }
  return out;
}

/**
 * Con el vídeo terminado, sube su carpeta (vídeo, escenas, voz) al bucket y
 * la borra del disco. Las URLs /media/... siguen valiendo: la ruta de media
 * redirige al bucket. Si algo falla, se deja en disco y no pasa nada.
 */
export async function offloadProject(projectId: string): Promise<void> {
  if (!objectStorageEnabled()) return;
  const dir = mediaPath("generated", projectId);
  try {
    for (const abs of await walk(dir)) {
      const rel = path.relative(dir, abs).split(path.sep).join("/");
      await putFile(`generated/${projectId}/${rel}`, abs, contentTypeFor(abs));
    }
    await rm(dir, { recursive: true, force: true });
  } catch (err) {
    console.error("[bucket] subir", projectId, err);
  }
}

async function oldEntries(dir: string, maxAgeMs: number): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const now = Date.now();
  const out: string[] = [];
  for (const n of names) {
    const abs = path.join(dir, n);
    const st = await stat(abs).catch(() => undefined);
    if (st && now - st.mtimeMs > maxAgeMs) out.push(abs);
  }
  return out;
}

let lastSweep = 0;

/** Limpieza periódica. Se llama al arrancar cada vídeo; como mucho una vez por hora. */
export async function sweepStorage(): Promise<void> {
  if (Date.now() - lastSweep < 60 * 60 * 1000) return;
  lastSweep = Date.now();
  try {
    const projects = await db.listAllProjects();
    const busy = new Set(
      projects.filter((p) => p.status === "queued" || p.status === "generating" || p.status === "review").flatMap(photoUrls),
    );
    for (const abs of await oldEntries(mediaDir("uploads"), UPLOAD_TTL_DAYS * DAY)) {
      const url = `/media/uploads/${path.basename(abs)}`;
      if (!busy.has(url)) await rm(abs, { recursive: true, force: true });
    }
    for (const abs of await oldEntries(path.join(DATA_DIR, "tmp"), DAY)) {
      await rm(abs, { recursive: true, force: true });
    }
    // Borradores que nunca se pagaron.
    for (const p of projects) {
      if (p.status === "draft" && p.createdAt < Date.now() - DAY) await deleteProject(p);
    }
    if (VIDEO_TTL_DAYS) {
      const cutoff = Date.now() - VIDEO_TTL_DAYS * DAY;
      for (const p of projects) {
        if (p.status !== "generating" && p.status !== "queued" && p.createdAt < cutoff) await deleteProject(p);
      }
    }
  } catch (err) {
    console.error("Limpieza de almacenamiento:", err);
  }
}
