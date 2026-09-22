import { providers } from "./ai";
import { db } from "./db/store";
import { buildScenes, layoutTimeline, narrationText } from "./script-engine";
import { assembleMp4 } from "./render/assemble";
import { localPathForMediaUrl } from "./paths";
import type { PipelineStep, Project, StepId } from "./types";

/**
 * El pipeline de generación.
 *
 * Corre en segundo plano y va escribiendo su progreso en el proyecto, que es
 * lo que la UI sondea. Cada etapa es independiente y anota su coste real, de
 * forma que si una falla sabemos exactamente donde y cuanto llevabamos gastado.
 *
 * En produccion esto es un worker con cola (Inngest, QStash, Trigger.dev): un
 * video cine son varios minutos de espera y no cabe en el timeout de una
 * funcion serverless. Aqui corre en proceso porque el MVP tiene que arrancar
 * con `npm run dev` y nada mas.
 */

export function initialSteps(tier: Project["tier"]): PipelineStep[] {
  const steps: { id: StepId; label: string }[] = [
    { id: "script", label: "Escribiendo tu guion" },
    { id: "images", label: "Creando las escenas contigo dentro" },
    { id: "motion", label: "Dando movimiento a cada escena" },
    { id: "voice", label: "Grabando la voz" },
    { id: "assemble", label: "Montando el vídeo" },
  ];
  return steps.map((s) => ({
    ...s,
    status: s.id === "motion" && tier === "vision" ? "skipped" : "pending",
  }));
}

/** Limita cuantas llamadas al proveedor van a la vez: proteje rate limits y cartera. */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

async function setStep(
  projectId: string,
  id: StepId,
  patch: Partial<PipelineStep>,
): Promise<void> {
  await db.patchProject(projectId, (p) => ({
    ...p,
    steps: p.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  }));
}

function selfieAbsolutePath(project: Project): string | undefined {
  if (!project.selfieUrl) return undefined;
  return localPathForMediaUrl(project.selfieUrl) ?? undefined;
}

export async function runPipeline(projectId: string): Promise<void> {
  const start = await db.getProject(projectId);
  if (!start) throw new Error("Proyecto no encontrado");

  await db.patchProject(projectId, (p) => ({ ...p, status: "generating", error: undefined }));

  let spentCents = 0;
  const charge = (cents: number) => {
    spentCents += cents;
    return spentCents;
  };

  try {
    // ── 1. Guion ────────────────────────────────────────────────────────────
    await setStep(projectId, "script", { status: "running", startedAt: Date.now() });
    const scriptOut = await providers.script.write({
      area: start.area,
      intention: start.intention,
      durationSec: start.durationSec,
      tier: start.tier,
      tone: start.tone,
      seed: start.id,
    });
    const script = scriptOut.result;
    const timeline = layoutTimeline(script.affirmations, start.durationSec);
    const scenes = buildScenes(
      script.sceneBriefs,
      start.style,
      !!start.selfieUrl,
      start.durationSec,
    );

    await db.patchProject(projectId, (p) => ({
      ...p,
      script,
      title: script.title || p.title,
      affirmations: timeline,
      scenes,
    }));
    await setStep(projectId, "script", {
      status: "done",
      endedAt: Date.now(),
      costCents: charge(scriptOut.costCents),
    });

    // ── 2. Imágenes ─────────────────────────────────────────────────────────
    await setStep(projectId, "images", { status: "running", startedAt: Date.now() });
    const referencePath = selfieAbsolutePath(start);
    let imageCents = 0;

    await mapWithLimit(scenes, 3, async (scene) => {
      const out = await providers.image.generate({
        prompt: scene.prompt,
        referencePath,
        projectId,
        sceneId: scene.id,
      });
      imageCents += out.costCents;
      // Se guarda escena a escena para que la UI las vea aparecer.
      await db.patchProject(projectId, (p) => ({
        ...p,
        scenes: p.scenes.map((s) =>
          s.id === scene.id ? { ...s, imageUrl: out.result.url } : s,
        ),
      }));
    });
    await setStep(projectId, "images", {
      status: "done",
      endedAt: Date.now(),
      costCents: charge(imageCents),
    });

    // ── 3. Movimiento (solo tier cine) ──────────────────────────────────────
    if (start.tier === "cinematic") {
      await setStep(projectId, "motion", { status: "running", startedAt: Date.now() });
      const withImages = (await db.getProject(projectId))!.scenes;
      let motionCents = 0;

      await mapWithLimit(withImages, 2, async (scene) => {
        if (!scene.imageUrl) return;
        const out = await providers.video.animate({
          imageUrl: scene.imageUrl,
          prompt: scene.prompt,
          durationSec: scene.endSec - scene.startSec,
          projectId,
          sceneId: scene.id,
        });
        motionCents += out.costCents;
        await db.patchProject(projectId, (p) => ({
          ...p,
          scenes: p.scenes.map((s) =>
            s.id === scene.id ? { ...s, videoUrl: out.result.url } : s,
          ),
        }));
      });
      await setStep(projectId, "motion", {
        status: "done",
        endedAt: Date.now(),
        costCents: charge(motionCents),
      });
    }

    // ── 4. Voz ──────────────────────────────────────────────────────────────
    await setStep(projectId, "voice", { status: "running", startedAt: Date.now() });
    const voiceOut = await providers.voice.speak({
      text: narrationText(script),
      tone: start.tone,
      projectId,
    });
    await db.patchProject(projectId, (p) => ({
      ...p,
      voiceUrl: voiceOut.result.url,
      voiceMode: voiceOut.result.mode,
    }));
    await setStep(projectId, "voice", {
      status: "done",
      endedAt: Date.now(),
      costCents: charge(voiceOut.costCents),
    });

    // ── 5. Montaje ──────────────────────────────────────────────────────────
    await setStep(projectId, "assemble", { status: "running", startedAt: Date.now() });
    const current = (await db.getProject(projectId))!;
    const assembled = await assembleMp4(current);
    await setStep(projectId, "assemble", {
      status: assembled.skipped ? "skipped" : "done",
      endedAt: Date.now(),
      error: assembled.reason,
    });

    await db.patchProject(projectId, (p) => ({
      ...p,
      exportUrl: assembled.exportUrl,
      status: "ready",
      costCents: +spentCents.toFixed(2),
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.patchProject(projectId, (p) => ({
      ...p,
      status: "failed",
      error: message,
      costCents: +spentCents.toFixed(2),
      steps: p.steps.map((s) =>
        s.status === "running" ? { ...s, status: "failed", error: message, endedAt: Date.now() } : s,
      ),
    }));
    throw err;
  }
}
