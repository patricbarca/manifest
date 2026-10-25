import { spawn } from "node:child_process";
import path from "node:path";
import type { Project } from "./types";
import { localPathForMediaUrl, mediaPath } from "./paths";

/**
 * Highlights del perfil: cada escena animada en pequeño (480×854, sin sonido,
 * máx. 6 s) y su miniatura. Es lo único del vídeo que pueden ver otras
 * personas: ni la respiración, ni las frases, ni la voz.
 */
const MAX_SEC = 6;

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ process.env.FFMPEG_PATH ?? "ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    child.stderr.on("data", (d: Buffer) => (err += d.toString()));
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}: ${err.slice(-400)}`))));
  });
}

/** Argumentos de ffmpeg para un highlight; los usa también el script de importación. */
export function highlightArgs(src: string, outMp4: string): string[] {
  return [
    "-y", "-loglevel", "error", "-i", src, "-t", String(MAX_SEC), "-an",
    "-vf", "scale=480:854:force_original_aspect_ratio=increase,crop=480:854,fps=30",
    "-c:v", "libx264", "-crf", "28", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outMp4,
  ];
}

export function posterArgs(src: string, outJpg: string): string[] {
  return ["-y", "-loglevel", "error", "-ss", "1", "-i", src, "-frames:v", "1", "-vf", "scale=240:427:force_original_aspect_ratio=increase,crop=240:427", "-q:v", "4", outJpg];
}

/** Crea los highlights a partir de los clips de escena. Si algo falla, el vídeo sigue sin ellos. */
export async function makeHighlights(project: Project): Promise<Project["highlights"]> {
  const out: NonNullable<Project["highlights"]> = [];
  const clips = project.scenes.map((s) => s.videoUrl).filter((u): u is string => !!u);
  for (const [i, url] of clips.entries()) {
    const src = localPathForMediaUrl(url);
    if (!src) continue;
    const mp4 = mediaPath("generated", project.id, `hl_${i}.mp4`);
    const jpg = mediaPath("generated", project.id, `hl_${i}.jpg`);
    try {
      await run(highlightArgs(src, mp4));
      await run(posterArgs(mp4, jpg));
      out.push({
        videoUrl: `/media/generated/${project.id}/${path.basename(mp4)}`,
        posterUrl: `/media/generated/${project.id}/${path.basename(jpg)}`,
      });
    } catch (err) {
      console.error("[highlights]", project.id, i, err);
    }
  }
  return out.length ? out : undefined;
}

/** ¿Este fichero es un highlight (lo único que pueden ver otros)? */
export const isHighlightFile = (name: string) => /^hl_\d{1,2}\.(mp4|jpg)$/.test(name);
