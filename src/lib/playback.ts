import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
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

/**
 * Marca de agua de la escena gratis: el símbolo y "manifestlife.ai" abajo a la
 * derecha, quemados en la imagen (no se quita al descargar). Si falta el
 * símbolo o la fuente, se pone solo lo que haya.
 */
function watermarkFilter(): { inputs: string[]; filter: string } | null {
  const mark = path.join(process.cwd(), "public", "brand", "mark-512.png");
  const font = path.join(process.cwd(), "render", "fonts", "Inter.ttf");
  const hasMark = existsSync(mark);
  const hasFont = existsSync(font);
  if (!hasMark && !hasFont) return null;
  let f = "[0:v]scale='min(720,iw)':-2[v0]";
  let last = "v0";
  if (hasMark) {
    f += ";[1:v]scale=52:52,format=rgba,colorchannelmixer=aa=0.85[mk];[v0][mk]overlay=W-w-22:H*0.80[v1]";
    last = "v1";
  }
  if (hasFont) {
    const ff = font.replace(/\\/g, "/").replace(/:/g, "\\:");
    f += `;[${last}]drawtext=fontfile='${ff}':text='manifestlife.ai':fontsize=24:fontcolor=white@0.9:shadowcolor=black@0.6:shadowx=1:shadowy=1:x=w-tw-22:y=h*0.80+60[v2]`;
    last = "v2";
  }
  return { inputs: hasMark ? ["-i", mark] : [], filter: `${f};[${last}]null[out]` };
}

/** Crea la copia y devuelve su URL (en la misma carpeta que el clip). Undefined si no se pudo. */
export async function makePlayCopy(clipUrl: string, opts: { watermark?: boolean } = {}): Promise<string | undefined> {
  const p = parts(clipUrl);
  if (!p || !(await ensureLocal(clipUrl))) return undefined;
  const src = localPathForMediaUrl(clipUrl);
  if (!src) return undefined;
  const name = `play_${p.base}.mp4`;
  const wm = opts.watermark ? watermarkFilter() : null;
  if (opts.watermark && !wm) console.error("[playback] sin símbolo ni fuente para la marca de agua:", clipUrl);
  try {
    await ffmpeg([
      "-y", "-loglevel", "error", "-i", src, ...(wm ? wm.inputs : []), "-an",
      ...(wm ? ["-filter_complex", wm.filter, "-map", "[out]"] : ["-vf", "scale='min(720,iw)':-2"]),
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
      const url = await makePlayCopy(m.clipUrl, { watermark: !!m.free });
      if (!url) continue;
      await manifests.patch(m.id, (cur) => (cur.clipUrl === m.clipUrl ? { ...cur, playUrl: url } : cur));
      const dir = parts(m.clipUrl)?.dir;
      if (dir) await offloadProject(dir);
      n++;
    }
  }
  if (n) console.log(`[playback] ${n} copias ligeras creadas`);
}

/**
 * "Foto con movimiento": clip sin IA de vídeo a partir de la imagen, con un
 * acercamiento lento de cámara (Ken Burns). Mismo formato que los clips
 * animados (1080×1920, 30 fps), así el visor, los highlights y el montaje
 * funcionan igual. Coste 0.
 */
export async function makeStillClip(imageUrl: string, secs: number, sceneId: string): Promise<string> {
  const m = imageUrl.split("?")[0].match(/^\/media\/generated\/([^/]+)\/[^/]+$/);
  if (!m || !(await ensureLocal(imageUrl))) throw new Error("Imagen no disponible para el still");
  const src = localPathForMediaUrl(imageUrl);
  if (!src) throw new Error("Imagen no disponible para el still");
  const frames = Math.max(30, Math.round(secs * 30));
  const name = `still_${sceneId}.mp4`;
  await ffmpeg([
    "-y", "-loglevel", "error", "-i", src,
    "-vf",
    // Se agranda antes del zoom para que el movimiento no tiemble.
    `scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='1+0.1*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=30`,
    "-frames:v", String(frames),
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
    "-threads", "2", "-movflags", "+faststart", mediaPath("generated", m[1], name),
  ]);
  return `/media/generated/${m[1]}/${name}`;
}
