import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Project } from "../types";
import { DATA_DIR, localPathForMediaUrl } from "../paths";

/**
 * Ensamblado a MP4.
 *
 * El producto se consume en el reproductor web (es donde funciona el repetir
 * en voz alta, con el texto sincronizado). El MP4 es para descargar y
 * compartir, asi que es opcional: si no hay binario de ffmpeg, el proyecto
 * queda listo igualmente y la descarga se marca como no disponible.
 *
 * En produccion esto no deberia correr en la request: va a un worker con
 * ffmpeg o a un render de Remotion en un contenedor aparte.
 */

export interface AssembleResult {
  exportUrl?: string;
  skipped: boolean;
  reason?: string;
}

function ffmpegBin(): string {
  return process.env.FFMPEG_PATH ?? "ffmpeg";
}

async function hasFfmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(/*turbopackIgnore: true*/ ffmpegBin(), ["-version"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("exit", (code) => resolve(code === 0));
  });
}

async function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(/*turbopackIgnore: true*/ ffmpegBin(), args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg salió ${code}: ${stderr.slice(-800)}`)),
    );
  });
}

function mediaFile(url: string): string {
  const local = localPathForMediaUrl(url);
  if (!local) throw new Error(`Ruta de media no válida: ${url}`);
  return local;
}

export async function assembleMp4(project: Project): Promise<AssembleResult> {
  if (!(await hasFfmpeg())) {
    return {
      skipped: true,
      reason:
        "ffmpeg no está disponible en este entorno. El vídeo se reproduce en la web; la descarga MP4 se genera en el worker de render.",
    };
  }

  const usable = project.scenes.filter((s) => s.videoUrl ?? s.imageUrl);
  if (!usable.length) return { skipped: true, reason: "No hay escenas generadas" };

  const outDir = path.join(DATA_DIR, "generated", project.id);
  await mkdir(outDir, { recursive: true });
  const outRel = `/media/generated/${project.id}/manifest.mp4`;
  const outAbs = path.join(outDir, "manifest.mp4");

  // Las escenas de tier vision son imagenes: se concatenan con duracion fija
  // via demuxer concat, que es lo mas barato y no recodifica de mas.
  const listFile = path.join(outDir, "escenas.txt");
  const lines: string[] = [];
  for (const scene of usable) {
    const src = scene.videoUrl ?? scene.imageUrl!;
    if (src.endsWith(".svg")) {
      return {
        skipped: true,
        reason: "Las escenas de demo son SVG y no se pueden codificar. Configura un proveedor de imagen real.",
      };
    }
    const dur = Math.max(1, scene.endSec - scene.startSec);
    lines.push(`file '${mediaFile(src)}'`, `duration ${dur.toFixed(2)}`);
  }
  // concat exige repetir el ultimo fichero para que respete su duracion.
  lines.push(
    `file '${mediaFile(usable[usable.length - 1].videoUrl ?? usable[usable.length - 1].imageUrl!)}'`,
  );
  await writeFile(listFile, lines.join("\n"), "utf8");

  const args = ["-y", "-f", "concat", "-safe", "0", "-i", listFile];

  const voiceAbs = project.voiceUrl ? mediaFile(project.voiceUrl) : undefined;
  const hasVoice = voiceAbs ? await access(voiceAbs).then(() => true, () => false) : false;
  if (hasVoice) args.push("-i", voiceAbs!);

  args.push(
    "-vf",
    "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,format=yuv420p",
    "-r", "30",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "22",
  );
  if (hasVoice) args.push("-c:a", "aac", "-b:a", "128k", "-shortest");
  args.push(outAbs);

  await run(args);
  return { exportUrl: outRel, skipped: false };
}
