import { db } from "./db/store";
import { runPipeline } from "./pipeline";
import { refundCredit, runManifestation } from "./manifest/generate";
import { runCompose } from "./manifest/compose";
import { manifests } from "./manifest/store";

/**
 * Cola de vídeos en proceso.
 *
 * Montar un vídeo usa ~5 min de CPU, así que como mucho van
 * PIPELINE_CONCURRENCY a la vez (2 por defecto) y el resto espera.
 * Si el servidor se reinicia a medias, al arrancar se relanzan los vídeos
 * que quedaron en cola o generándose (máximo MAX_ATTEMPTS intentos).
 */

const MAX = Math.max(1, Number(process.env.PIPELINE_CONCURRENCY ?? 2));
const MAX_ATTEMPTS = 2;
let running = 0;
const waiting: { id: string; run: () => Promise<void> }[] = [];
const known = new Set<string>();

export function enqueue(projectId: string): void {
  push(projectId, () => runPipeline(projectId));
}

/** Vídeo de manifestación a partir de manifestaciones ya hechas. */
export function enqueueCompose(projectId: string): void {
  push(projectId, () => runCompose(projectId));
}

/** Una manifestación suelta (comparte la cola y el límite con los vídeos). */
export function enqueueManifestation(id: string): void {
  push(id, () => runManifestation(id));
}

function push(id: string, run: () => Promise<void>): void {
  if (known.has(id)) return;
  known.add(id);
  waiting.push({ id, run });
  pump();
}

function pump(): void {
  while (running < MAX && waiting.length) {
    const { id, run } = waiting.shift()!;
    running++;
    run()
      .catch((err) => console.error("[queue]", id, err))
      .finally(() => {
        running--;
        known.delete(id);
        pump();
      });
  }
}

/** Al arrancar: relanza lo que quedó a medias por un reinicio. */
export async function resumeInterrupted(): Promise<void> {
  const projects = await db.listAllProjects();
  for (const p of projects) {
    if (p.status !== "queued" && p.status !== "generating") continue;
    // Los que esperan saldo no cuentan como intento: los relanza retryWaitingFunds.
    if (p.waitingFunds && p.status === "queued") continue;
    const attempts = (p.attempts ?? 0) + 1;
    if (attempts > MAX_ATTEMPTS) {
      await db.patchProject(p.id, (cur) => ({
        ...cur,
        status: "failed",
        error: "Se interrumpió varias veces al generarse. Escríbenos y lo solucionamos.",
      }));
      continue;
    }
    await db.patchProject(p.id, (cur) => ({
      ...cur,
      status: "queued",
      attempts,
      steps: cur.steps.map((s) => (s.status === "running" ? { ...s, status: "pending" } : s)),
    }));
    console.log("[queue] relanzando", p.id, "intento", attempts);
    if (p.composedFrom?.length) enqueueCompose(p.id);
    else enqueue(p.id);
  }
}

/** Igual para las manifestaciones sueltas. */
export async function resumeManifestations(): Promise<void> {
  for (const m of await manifests.listPending()) {
    if (m.waitingFunds && m.status === "queued") continue;
    const attempts = (m.attempts ?? 0) + 1;
    if (attempts > MAX_ATTEMPTS) {
      await manifests.patch(m.id, (cur) => ({ ...cur, status: "failed", error: "Se interrumpió varias veces." }));
      await refundCredit(m.id);
      continue;
    }
    await manifests.patch(m.id, (cur) => ({ ...cur, status: "queued", attempts }));
    enqueueManifestation(m.id);
  }
}

/**
 * Revisiones de imágenes sin respuesta: pasado un rato se aprueban solas para
 * que nadie se quede sin vídeo por no volver a la app.
 */
export async function approveStaleReviews(maxMinutes = Number(process.env.REVIEW_AUTO_APPROVE_MIN ?? 60)): Promise<void> {
  const cutoff = Date.now() - maxMinutes * 60_000;
  for (const p of await db.listAllProjects()) {
    if (p.status !== "review" || (p.reviewSince ?? 0) > cutoff) continue;
    await db.patchProject(p.id, (cur) => ({ ...cur, imagesApproved: true, status: "queued" }));
    console.log("[queue] revisión aprobada sola", p.id);
    enqueue(p.id);
  }
}

type Waiting = { id: string; kind: "project" | "compose" | "manifest"; since: number };

async function listWaitingFunds(): Promise<Waiting[]> {
  const projects = (await db.listAllProjects())
    .filter((p) => p.status === "queued" && p.waitingFunds)
    .map((p): Waiting => ({ id: p.id, kind: p.composedFrom?.length ? "compose" : "project", since: p.updatedAt ?? p.createdAt }));
  const ms = (await manifests.listPending())
    .filter((m) => m.status === "queued" && m.waitingFunds)
    .map((m): Waiting => ({ id: m.id, kind: "manifest", since: m.updatedAt ?? m.createdAt }));
  return [...projects, ...ms].sort((a, b) => a.since - b.since);
}

async function clearFlag(w: Waiting): Promise<void> {
  if (w.kind === "manifest") await manifests.patch(w.id, (m) => ({ ...m, waitingFunds: undefined }));
  else await db.patchProject(w.id, (p) => ({ ...p, waitingFunds: undefined }));
}

async function stillWaiting(w: Waiting): Promise<boolean> {
  if (w.kind === "manifest") return !!(await manifests.get(w.id))?.waitingFunds;
  return !!(await db.getProject(w.id))?.waitingFunds;
}

function runOf(w: Waiting): () => Promise<void> {
  if (w.kind === "manifest") return () => runManifestation(w.id);
  if (w.kind === "compose") return () => runCompose(w.id);
  return () => runPipeline(w.id);
}

/**
 * Cada 15 min: si hay trabajos esperando saldo, prueba con el más antiguo.
 * Si ya no se bloquea, suelta todos los demás a la cola.
 */
export async function retryWaitingFunds(): Promise<void> {
  const [first, ...rest] = await listWaitingFunds();
  if (!first || known.has(first.id)) return;
  await clearFlag(first);
  push(first.id, async () => {
    // Aunque falle por otro motivo, lo que importa es si sigue bloqueado por saldo.
    await runOf(first)().catch((err) => console.error("[queue]", first.id, err));
    if (await stillWaiting(first)) return;
    console.log("[fondos] hay saldo otra vez: relanzando", rest.length, "en espera");
    for (const w of rest) {
      await clearFlag(w);
      push(w.id, runOf(w));
    }
  });
}
