import { speakLinesCached } from "../voice-cache";
import { appBase } from "../hosts";
import { access, rm } from "node:fs/promises";
import type { Palette, Manifestation, Project, Scene } from "../types";
import { db } from "../db/store";
import { providers } from "../ai";
import { voiceLines } from "../experience";
import { nextQuoteId } from "../quotes";
import { localPathForMediaUrl, mediaPath } from "../paths";
import { downloadToFile, objectStorageEnabled } from "../object-storage";
import { renderGlass } from "../render/glass";
import { makeHighlights } from "../highlights";
import { offloadProject } from "../cleanup";
import { sendVideoReady } from "../email";
import { manifests } from "./store";

/** Asegura que el fichero /media está en disco (lo baja del bucket si hace falta). */
async function ensureLocal(url: string | undefined): Promise<boolean> {
  const abs = url ? localPathForMediaUrl(url) : null;
  if (!abs) return false;
  try {
    await access(abs);
    return true;
  } catch {
    if (!objectStorageEnabled()) return false;
    const key = url!.split("?")[0].replace(/^\/media\//, "");
    return downloadToFile(key, abs);
  }
}

/** El proyecto «vídeo de manifestación» a partir de manifestaciones ya hechas. */
export function composeProject(opts: {
  id: string;
  ownerId: string;
  items: Manifestation[];
  locale: Project["locale"];
  voice?: string;
  palette?: Palette;
  title: string;
}): Project {
  const now = Date.now();
  const scenes: Scene[] = opts.items.map((m, i) => ({
    id: `sc_${i + 1}`,
    prompt: m.brief ?? m.desire,
    imageUrl: m.imageUrl,
    videoUrl: m.clipUrl,
    startSec: i * 8,
    endSec: (i + 1) * 8,
    affirmationIndex: i,
  }));
  return {
    id: opts.id,
    ownerId: opts.ownerId,
    createdAt: now,
    updatedAt: now,
    title: opts.title,
    area: "abundancia",
    intention: opts.items.map((m) => m.desire).join(" · "),
    desires: opts.items.map((m) => m.desire),
    tier: "cinematic",
    style: opts.items[0]?.style ?? "cinematic",
    tone: "calma",
    durationSec: 60,
    locale: opts.locale,
    voice: opts.voice,
    palette: opts.palette ?? "dusk",
    status: "queued",
    steps: [
      { id: "voice", label: "Grabando la voz", status: "pending" },
      { id: "assemble", label: "Montando el vídeo", status: "pending" },
    ],
    script: {
      title: opts.title,
      hook: "",
      affirmations: opts.items.map((m) => m.affirmation ?? m.desire),
      closing: "",
      sceneBriefs: opts.items.map((m) => m.brief ?? m.desire),
    },
    affirmations: [],
    scenes,
    voiceMode: "file",
    paidCents: 0,
    costCents: 0,
    watermark: false,
    composedFrom: opts.items.map((m) => m.id),
  };
}

/**
 * Monta el vídeo de manifestación: reutiliza clips y voces de cada
 * manifestación (sin coste de IA) y solo graba las partes comunes con la
 * frase de apertura nueva (unos céntimos). Luego, highlights y al bucket.
 */
export async function runCompose(projectId: string): Promise<void> {
  const project = await db.getProject(projectId);
  if (!project) throw new Error("Proyecto no encontrado");
  const setStep = (id: string, status: "running" | "done" | "failed", extra: object = {}) =>
    db.patchProject(projectId, (p) => ({ ...p, steps: p.steps.map((s) => (s.id === id ? { ...s, status, ...extra } : s)) }));
  await db.patchProject(projectId, (p) => ({ ...p, status: "generating", error: undefined }));
  const ids = project.composedFrom ?? [];
  let cents = 0;
  try {
    const items = (await Promise.all(ids.map((id) => manifests.get(id)))).filter((m): m is Manifestation => !!m && m.ownerId === project.ownerId);
    if (items.length !== ids.length) throw new Error("Alguna manifestación ya no existe");
    for (const m of items) {
      if (!(await ensureLocal(m.clipUrl)) || !(await ensureLocal(m.imageUrl))) throw new Error(`Falta la escena de «${m.title}»`);
    }

    // Voz: partes comunes siempre; la afirmación de cada escena se reutiliza si es de la misma voz e idioma.
    await setStep("voice", "running", { startedAt: Date.now() });
    const user = await db.getUser(project.ownerId);
    const quoteId = nextQuoteId(user?.usedQuotes ?? [], project.ownerId);
    if (user) await db.putUser({ ...user, usedQuotes: [...(user.usedQuotes ?? []), quoteId] });
    const all = voiceLines(project.locale, project.id, project.script!.affirmations, quoteId);
    const reuse: Record<string, string> = {};
    for (const [i, m] of items.entries()) {
      if (m.voiceUrl && m.locale === project.locale && (m.voice ?? undefined) === (project.voice ?? undefined) && (await ensureLocal(m.voiceUrl))) {
        reuse[`a${i}`] = m.voiceUrl;
      }
    }
    const toSpeak = Object.fromEntries(Object.entries(all).filter(([k]) => !reuse[k]));
    if (!providers.voice.speakLines) throw new Error("La voz por frases no está disponible");
    const spoken = await speakLinesCached({ lines: toSpeak, projectId, locale: project.locale, voice: project.voice });
    cents += spoken.costCents;
    const lineUrls = { ...spoken.result, ...reuse };
    await db.patchProject(projectId, (p) => ({ ...p, quoteId, voiceLines: lineUrls }));
    await setStep("voice", "done", { endedAt: Date.now(), costCents: cents });

    // Montaje con el render de siempre.
    await setStep("assemble", "running", { startedAt: Date.now() });
    const current = (await db.getProject(projectId))!;
    const out = await renderGlass(current, lineUrls);
    const highlights = await makeHighlights(current).catch(() => undefined);
    await setStep("assemble", "done", { endedAt: Date.now() });
    await db.patchProject(projectId, (p) => ({
      ...p,
      exportUrl: out.exportUrl,
      videoDurationSec: out.durationSec,
      highlights,
      status: "ready",
      error: undefined,
      costCents: +cents.toFixed(2),
      // Las escenas apuntan a ficheros de las manifestaciones: no se borran con este vídeo.
      scenes: p.scenes.map((s) => ({ ...s, videoUrl: undefined })),
    }));
    if (user?.email) {
      void sendVideoReady({ to: user.email, locale: project.locale, title: project.title, url: `${appBase()}/video/${projectId}` });
    }
    await offloadProject(projectId);
    // Las copias locales de las manifestaciones ya están en el bucket: fuera del disco.
    if (objectStorageEnabled()) {
      for (const m of items) await rm(mediaPath("generated", m.id), { recursive: true, force: true }).catch(() => undefined);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.patchProject(projectId, (p) => ({
      ...p,
      status: "failed",
      error: message,
      costCents: +cents.toFixed(2),
      steps: p.steps.map((s) => (s.status === "running" ? { ...s, status: "failed", error: message } : s)),
    }));
    throw err;
  }
}
