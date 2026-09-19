import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Project, User } from "../types";

/**
 * Persistencia del MVP: un JSON por coleccion en .data/.
 *
 * No aguanta concurrencia real ni varios procesos, y es a proposito: el MVP
 * necesita demostrar el producto, no la infraestructura. Todo el acceso pasa
 * por este fichero, asi que migrar a Postgres/Supabase es reimplementar estas
 * seis funciones.
 */

const DATA_DIR = path.join(process.cwd(), ".data");

async function readCollection<T>(name: string): Promise<Record<string, T>> {
  try {
    const raw = await readFile(path.join(DATA_DIR, `${name}.json`), "utf8");
    return JSON.parse(raw) as Record<string, T>;
  } catch {
    return {};
  }
}

/** Escritura atomica: temporal + rename, para no dejar un JSON a medias. */
async function writeCollection<T>(name: string, data: Record<string, T>): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const target = path.join(DATA_DIR, `${name}.json`);
  const tmp = `${target}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, target);
}

/** Cola de escritura: serializa los updates para no perder ninguno. */
let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

export const db = {
  async getProject(id: string): Promise<Project | undefined> {
    return (await readCollection<Project>("projects"))[id];
  },

  async listProjects(ownerId: string): Promise<Project[]> {
    const all = await readCollection<Project>("projects");
    return Object.values(all)
      .filter((p) => p.ownerId === ownerId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async putProject(project: Project): Promise<Project> {
    return serialize(async () => {
      const all = await readCollection<Project>("projects");
      all[project.id] = { ...project, updatedAt: Date.now() };
      await writeCollection("projects", all);
      return all[project.id];
    });
  },

  /** Update con lectura fresca dentro de la cola: evita pisar el progreso. */
  async patchProject(
    id: string,
    patch: (current: Project) => Project,
  ): Promise<Project | undefined> {
    return serialize(async () => {
      const all = await readCollection<Project>("projects");
      const current = all[id];
      if (!current) return undefined;
      all[id] = { ...patch(current), updatedAt: Date.now() };
      await writeCollection("projects", all);
      return all[id];
    });
  },

  async getUser(id: string): Promise<User | undefined> {
    return (await readCollection<User>("users"))[id];
  },

  async putUser(user: User): Promise<User> {
    return serialize(async () => {
      const all = await readCollection<User>("users");
      all[user.id] = user;
      await writeCollection("users", all);
      return user;
    });
  },
};
