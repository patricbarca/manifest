import { providers } from "./ai";
import { db } from "./db/store";
import { applyCast, buildScenes, layoutTimeline, narrationText, sceneCast } from "./script-engine";
import { assembleMp4 } from "./render/assemble";
import { canRenderGlass, mediaDuration, renderGlass } from "./render/glass";
import { sceneLength, voiceLines } from "./experience";
import { localPathForMediaUrl } from "./paths";
import { rm } from "node:fs/promises";
import { dropIntermediates, offloadProject, sweepStorage } from "./cleanup";
import { nextQuoteId } from "./quotes";
import { sendVideoReady } from "./email";
import { isAnimated, type Person, type PipelineStep, type Project, type Scene, type StepId } from "./types";

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
    { id: "voice", label: "Grabando la voz" },
    { id: "motion", label: "Dando movimiento a cada escena" },
    { id: "assemble", label: "Montando el vídeo" },
  ];
  return steps.map((s) => ({
    ...s,
    status: s.id === "motion" && !isAnimated(tier) ? "skipped" : "pending",
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

/** Las fotos del usuario en disco: varias si las subió, si no el selfie antiguo. */
function photoAbsolutePaths(project: Project): string[] {
  const urls = project.photoUrls?.length ? project.photoUrls : project.selfieUrl ? [project.selfieUrl] : [];
  return urls.map((u) => localPathForMediaUrl(u)).filter((p): p is string => !!p);
}

/** Seedream acepta como mucho 10 imágenes de referencia por escena. */
const MAX_REFS = 10;

/**
 * Fotos de referencia de una escena y en qué "Figuras" cae cada persona.
 *
 * Primero van las fotos del usuario (Figuras 1..k), luego las de cada persona
 * del reparto. Si no caben todas, cada persona lleva menos fotos.
 */
function castPlan(scene: Scene, photos: string[], people: Person[]) {
  const own = scene.pov ? [] : photos;
  const cast = (scene.cast ?? [])
    .map((id) => people.find((p) => p.id === id))
    .filter((p): p is Person => !!p);
  const refs = [...own];
  const ranges: { name: string; first: number; last: number }[] = [];
  const per = cast.length ? Math.min(3, Math.floor((MAX_REFS - own.length) / cast.length)) : 0;
  for (const person of cast) {
    const paths = person.photoUrls
      .map((u) => localPathForMediaUrl(u))
      .filter((x): x is string => !!x)
      .slice(0, per);
    if (!paths.length) continue;
    ranges.push({ name: person.name, first: refs.length + 1, last: refs.length + paths.length });
    refs.push(...paths);
  }
  return { refs, ranges };
}

/** Las marcas [[Nombre]] del guion, legibles para el modelo de vídeo. */
function plainBrief(brief: string): string {
  return brief.replace(/^pov:\s*/i, "").replace(/\[\[\s*([^\]]+?)\s*\]\]/g, "a loved one");
}

/** Borra las fotos de las personas invitadas: no se guardan más de lo necesario. */
async function deletePeoplePhotos(people: Person[]) {
  for (const url of people.flatMap((p) => p.photoUrls)) {
    const abs = localPathForMediaUrl(url);
    if (abs) await rm(abs, { force: true }).catch(() => undefined);
  }
}

/** Elige la siguiente frase sin repetir y la apunta en el usuario. */
async function assignQuote(ownerId: string): Promise<string> {
  const user = await db.getUser(ownerId);
  const id = nextQuoteId(user?.usedQuotes ?? [], ownerId);
  if (user) await db.patchUser(ownerId, (u) => ({ ...u, usedQuotes: [...(u.usedQuotes ?? []), id] }));
  return id;
}

export async function runPipeline(projectId: string): Promise<void> {
  const start = await db.getProject(projectId);
  if (!start) throw new Error("Proyecto no encontrado");

  await db.patchProject(projectId, (p) => ({ ...p, status: "generating", error: undefined }));
  void sweepStorage();

  // Frase de apertura que esta persona aún no ha visto.
  const quoteId = start.quoteId ?? (await assignQuote(start.ownerId));
  await db.patchProject(projectId, (p) => ({ ...p, quoteId }));

  let spentCents = 0;
  const charge = (cents: number) => {
    spentCents += cents;
    return spentCents;
  };

  try {
    // ── 1. Guion ────────────────────────────────────────────────────────────
    await setStep(projectId, "script", { status: "running", startedAt: Date.now() });
    // Si el usuario aprobó un guion en la revisión, ése es el guion: no se
    // vuelve a pedir otro al LLM, que podría salir distinto.
    const scriptOut = start.script
      ? { result: start.script, costCents: start.scriptCostCents ?? 0 }
      : await providers.script.write({
          area: start.area,
          intention: start.intention,
          durationSec: start.durationSec,
          tier: start.tier,
          tone: start.tone,
          seed: start.id,
          locale: start.locale,
          details: start.details,
          desires: start.desires,
          people: start.people?.map((p) => ({ name: p.name, relation: p.relation })),
        });
    const script = scriptOut.result;
    const timeline = layoutTimeline(script.affirmations, start.durationSec);
    const photos = photoAbsolutePaths(start);
    const people = start.people ?? [];
    const scenes = buildScenes(
      script.sceneBriefs,
      start.style,
      photos.length > 0,
      start.durationSec,
      photos.length,
    ).map((scene, i) => {
      const ids = people.length ? sceneCast(script.sceneBriefs[i] ?? "", start.desires?.[i], people) : [];
      const withCast: Scene = { ...scene, cast: ids.length ? ids : undefined };
      return { ...withCast, prompt: applyCast(scene.prompt, castPlan(withCast, photos, people).ranges) };
    });

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
    let imageCents = 0;

    await mapWithLimit(scenes, 3, async (scene) => {
      const { refs } = castPlan(scene, photos, people);
      const out = await providers.image.generate({
        prompt: scene.prompt,
        referencePaths: refs.length ? refs : undefined,
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

    // ── 3. Voz ──────────────────────────────────────────────────────────────
    // Con el montaje nuevo cada frase es una pista: así cada escena dura lo
    // que su frase más la pausa para repetirla. Sin él, una sola narración.
    await setStep(projectId, "voice", { status: "running", startedAt: Date.now() });
    const glass = !!providers.voice.speakLines && (await canRenderGlass());
    let lineUrls: Record<string, string> | undefined;
    if (glass) {
      const out = await providers.voice.speakLines!({
        lines: voiceLines(start.locale, start.id, script.affirmations, quoteId),
        projectId,
        locale: start.locale,
        voice: start.voice,
      });
      lineUrls = out.result;
      await db.patchProject(projectId, (p) => ({ ...p, voiceLines: lineUrls, voiceMode: "file" }));
      await setStep(projectId, "voice", {
        status: "done",
        endedAt: Date.now(),
        costCents: charge(out.costCents),
      });
    } else {
      const voiceOut = await providers.voice.speak({
        text: narrationText(script),
        tone: start.tone,
        projectId,
        locale: start.locale,
        voice: start.voice,
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
    }

    // Duración real de cada escena (para pedir clips del largo justo).
    const sceneSecs: number[] = [];
    if (lineUrls) {
      for (let i = 0; i < scenes.length; i++) {
        const abs = localPathForMediaUrl(lineUrls[`a${i}`]);
        sceneSecs.push(abs ? sceneLength(await mediaDuration(abs)) : 8);
      }
    }

    // ── 4. Movimiento (Animado y Elevado) ───────────────────────────────────
    if (isAnimated(start.tier)) {
      await setStep(projectId, "motion", { status: "running", startedAt: Date.now() });
      const withImages = (await db.getProject(projectId))!.scenes;
      let motionCents = 0;

      // Kling tarda minutos por clip: en Elevado se piden más a la vez.
      const parallel = start.tier === "elevated" ? 5 : 2;
      await mapWithLimit(withImages, parallel, async (scene) => {
        if (!scene.imageUrl) return;
        const brief = plainBrief(script.sceneBriefs[withImages.indexOf(scene)] ?? "");
        const out = await providers.video.animate({
          imageUrl: scene.imageUrl,
          // Al vídeo no le sirve el prompt de la imagen: necesita movimiento.
          // "Facing the camera": en las pruebas, MiniMax giraba a la persona de
          // espaldas al final del clip y la cara desaparecía.
          prompt: `Gentle, realistic natural motion in this scene: ${brief}. Subtle movement of hair, clothes and light, people move naturally, the person keeps their face visible and turned toward the camera the whole time, steady camera, every face stays the same.`,
          durationSec: sceneSecs[withImages.indexOf(scene)] ?? scene.endSec - scene.startSec,
          projectId,
          sceneId: scene.id,
          quality: start.tier === "elevated" ? "elevated" : "standard",
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

    // ── 5. Montaje ──────────────────────────────────────────────────────────
    await setStep(projectId, "assemble", { status: "running", startedAt: Date.now() });
    const current = (await db.getProject(projectId))!;
    const assembled = lineUrls
      ? { ...(await renderGlass(current, lineUrls)), skipped: false, reason: undefined }
      : await assembleMp4(current);
    await setStep(projectId, "assemble", {
      status: assembled.skipped ? "skipped" : "done",
      endedAt: Date.now(),
      error: assembled.reason,
    });

    await db.patchProject(projectId, (p) => ({
      ...p,
      exportUrl: assembled.exportUrl,
      videoDurationSec: (assembled as { durationSec?: number }).durationSec || p.videoDurationSec,
      status: "ready",
      costCents: +spentCents.toFixed(2),
    }));
    // Aviso por email (si hay cuenta con email y Resend configurado).
    const owner = await db.getUser(start.ownerId);
    if (owner?.email) {
      void sendVideoReady({
        to: owner.email,
        locale: start.locale,
        title: script.title || start.title,
        url: `${process.env.SITE_URL ?? ""}/video/${projectId}`,
      });
    }
    // Las fotos de otras personas solo hacían falta para las escenas.
    await deletePeoplePhotos(people);
    // Con el vídeo montado, los clips sueltos sobran y ocupan mucho.
    if (lineUrls) {
      const done = await db.getProject(projectId);
      if (done) {
        await dropIntermediates(done);
        await db.patchProject(projectId, (p) => ({
          ...p,
          scenes: p.scenes.map((sc) => ({ ...sc, videoUrl: undefined })),
        }));
      }
    }
    // El vídeo y sus escenas pasan al bucket (si está configurado).
    await offloadProject(projectId);
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
