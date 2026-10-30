import { spawn } from "node:child_process";
import { localPathForMediaUrl, mediaPath } from "./paths";
import { ensureLocal } from "./manifest/compose";
import { offloadProject } from "./cleanup";
import { manifests } from "./manifest/store";
import { db } from "./db/store";

/**
 * Copia ligera de cada clip para verlo en la app. Los clips de fal pesan
 * 8–16 MB por 5 s (12–25 Mbps) y algunos (Kling) llevan el índice al final,
 * así que el móvil tarda en empezar. Esta copia: 720 px de ancho, sin sonido
 * (el visor va en silencio) e índice al principio. El original se queda para
 * montar el vídeo final.
 */
function ffmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ process.env.FFMPEG_PATH ?? "ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d: Buffer) => (err += d.toString()));
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${err.slice(-300)}`))));
  });
}

/** Carpeta y nombre del clip a partir de su URL (/media/generated/<dir>/<nombre>.mp4). */
function parts(clipUrl: string): { dir: string; base: string } | null {
  const m = clipUrl.split("?")[0].match(/^\/media\/generated\/([^/]+)\/([^/]+)\.mp4$/);
  return m ? { dir: m[1], base: m[2] } : null;
}

/** Crea la copia y devuelve su URL (en la misma carpeta que el clip). Undefined si no se pudo. */
export async function makePlayCopy(clipUrl: string): Promise<string | undefined> {
  const p = parts(clipUrl);
  if (!p || !(await ensureLocal(clipUrl))) return undefined;
  const src = localPathForMediaUrl(clipUrl);
  if (!src) return undefined;
  const name = `play_${p.base}.mp4`;
  try {
    await ffmpeg([
      "-y", "-loglevel", "error", "-i", src, "-an",
      "-vf", "scale='min(720,iw)':-2",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "24", "-pix_fmt", "yuv420p",
      "-threads", "2", "-movflags", "+faststart", mediaPath("generated", p.dir, name),
    ]);
    return `/media/generated/${p.dir}/${name}`;
  } catch (err) {
    console.error("[playback]", clipUrl, err instanceof Error ? err.message : err);
    return undefined;
  }
}

/**
 * Al arrancar: hace la copia de las manifestaciones que aún no la tienen, de
 * una en una para no quitarle CPU a lo que se esté generando.
 */
export async function backfillPlayCopies(): Promise<void> {
  let n = 0;
  for (const user of await db.listUsers()) {
    for (const m of await manifests.list(user.id)) {
      if (m.status !== "ready" || !m.clipUrl || m.playUrl) continue;
      const url = await makePlayCopy(m.clipUrl);
      if (!url) continue;
      await manifests.patch(m.id, (cur) => (cur.clipUrl === m.clipUrl ? { ...cur, playUrl: url } : cur));
      const dir = parts(m.clipUrl)?.dir;
      if (dir) await offloadProject(dir);
      n++;
    }
  }
  if (n) console.log(`[playback] ${n} copias ligeras creadas`);
}
