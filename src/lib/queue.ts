import { db } from "./db/store";
import { runPipeline } from "./pipeline";

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
const waiting: string[] = [];
const known = new Set<string>();

export function enqueue(projectId: string): void {
  if (known.has(projectId)) return;
  known.add(projectId);
  waiting.push(projectId);
  pump();
}

function pump(): void {
  while (running < MAX && waiting.length) {
    const id = waiting.shift()!;
    running++;
    runPipeline(id)
      .catch((err) => console.error("[pipeline]", id, err))
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
    enqueue(p.id);
  }
}
