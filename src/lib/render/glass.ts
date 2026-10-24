import { spawn } from "node:child_process";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Project } from "../types";
import { DATA_DIR, localPathForMediaUrl, mediaPath, mediaUrl } from "../paths";
import { EXPERIENCE, quoteText } from "../experience";

/**
 * Montaje del vídeo final con render/build_glass.py.
 *
 * El script de Python dibuja el fondo animado, los paneles de vidrio y el
 * logo, y mezcla voz y música con ffmpeg. Tarda varios minutos de CPU, así
 * que corre en un proceso aparte y el pipeline lo espera en segundo plano.
 */

const SCRIPT = path.join(/*turbopackIgnore: true*/ process.cwd(), "render", "build_glass.py");

function pythonBin(): string {
  return process.env.PYTHON_PATH ?? "python3";
}

function ffmpegBin(): string {
  return process.env.FFMPEG_PATH ?? "ffmpeg";
}

function exec(bin: string, args: string[], timeoutMs: number): Promise<{ code: number; out: string; err: string }> {
  return new Promise((resolve) => {
    const child = spawn(/*turbopackIgnore: true*/ bin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, FFMPEG_PATH: ffmpegBin() },
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (d: Buffer) => (out += d.toString()));
    child.stderr.on("data", (d: Buffer) => (err = (err + d.toString()).slice(-4000)));
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("error", (e) => {
      clearTimeout(timer);
      resolve({ code: -1, out, err: String(e) });
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, out, err });
    });
  });
}

/** True si el contenedor tiene Python y el script: si no, se usa el montaje antiguo. */
export async function canRenderGlass(): Promise<boolean> {
  try {
    await access(SCRIPT);
  } catch {
    return false;
  }
  const r = await exec(pythonBin(), ["-c", "import numpy, PIL, scipy"], 20_000);
  return r.code === 0;
}

/** Duración de un fichero de audio o vídeo, leída de la cabecera con ffmpeg. */
export async function mediaDuration(absPath: string): Promise<number> {
  const r = await exec(ffmpegBin(), ["-i", absPath], 20_000);
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.err);
  if (!m) throw new Error(`No se pudo leer la duración de ${path.basename(absPath)}`);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

function local(url: string | undefined, what: string): string {
  const p = url ? localPathForMediaUrl(url) : null;
  if (!p) throw new Error(`Falta ${what} para montar el vídeo`);
  return p;
}

export async function renderGlass(
  project: Project,
  voiceUrls: Record<string, string>,
): Promise<{ exportUrl: string; durationSec: number }> {
  const x = EXPERIENCE[project.locale];
  const affirmations = project.script?.affirmations ?? [];
  if (!affirmations.length || affirmations.length !== project.scenes.length) {
    throw new Error("El guion y las escenas no coinciden");
  }

  const work = path.join(DATA_DIR, "tmp", `render-${project.id}`);
  const outAbs = mediaPath("generated", project.id, "video.mp4");
  await mkdir(work, { recursive: true });
  await mkdir(path.dirname(outAbs), { recursive: true });

  const voices: Record<string, string> = {};
  for (const [k, url] of Object.entries(voiceUrls)) voices[k] = local(url, `la voz "${k}"`);

  const job = {
    brand: "ManifestLifeAI",
    palette: project.palette ?? "dusk",
    texts: {
      tagline: x.tagline,
      breathIn: x.breathIn,
      breathOut: x.breathOut,
      repeatLabel: x.repeatLabel,
      repeatAfterMe: x.repeatAfterMe,
      closeLine: x.closeLine,
      seal: x.seal,
      tomorrow: x.tomorrow,
      quote: quoteText(project.locale, project.quoteId, project.id),
      affirmations,
    },
    scenes: project.scenes.map((s) => ({
      image: local(s.imageUrl, "una imagen"),
      ...(s.videoUrl ? { video: local(s.videoUrl, "un clip") } : {}),
    })),
    voices,
    work_dir: work,
    out: outAbs,
    // Elevado conserva el detalle de los clips 1080p; el resto pesa menos.
    crf: project.tier === "elevated" ? 20 : 27,
  };
  const jobPath = path.join(work, "job.json");
  await writeFile(jobPath, JSON.stringify(job));

  try {
    const r = await exec(pythonBin(), [SCRIPT, jobPath], 40 * 60_000);
    if (r.code !== 0) throw new Error(`El montaje falló (${r.code}): ${r.err.slice(-600)}`);
    const last = r.out.trim().split("\n").pop() ?? "{}";
    const info = JSON.parse(last) as { durationSec?: number };
    return { exportUrl: mediaUrl("generated", project.id, "video.mp4"), durationSec: info.durationSec ?? 0 };
  } finally {
    // Los tramos intermedios pesan mucho y el volumen es pequeño.
    await rm(work, { recursive: true, force: true });
  }
}
