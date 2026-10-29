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
