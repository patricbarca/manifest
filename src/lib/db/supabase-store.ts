import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Project, ScriptPreview, User } from "../types";

/**
 * Persistencia en Supabase (Postgres). Mismas funciones que el store JSON.
 *
 * Cada fila guarda el objeto entero en `data` (jsonb) y repite en columnas
 * lo que se filtra (dueño, estado, fecha). Solo el servidor accede, con la
 * clave secreta; las tablas tienen RLS activado y ninguna política, así que
 * con la clave pública no se lee nada.
 */

export function supabaseConfigured(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SECRET_KEY;
}

let client: SupabaseClient | undefined;
function sb(): SupabaseClient {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Base de datos (${what}): ${res.error.message}`);
  return res.data;
}

/** Las escrituras de un mismo proceso van en fila, como en el store JSON. */
let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

const iso = (ms: number) => new Date(ms).toISOString();

async function upsertProject(p: Project): Promise<Project> {
  check(
    await sb().from("projects").upsert({
      id: p.id,
      owner_id: p.ownerId,
      status: p.status,
      created_at: iso(p.createdAt),
      updated_at: iso(p.updatedAt),
      data: p,
    }),
    "guardar proyecto",
  );
  return p;
}

export const supabaseDb = {
  async getProject(id: string): Promise<Project | undefined> {
    const rows = check(await sb().from("projects").select("data").eq("id", id).limit(1), "leer proyecto");
    return (rows?.[0]?.data as Project) ?? undefined;
  },

  async listProjects(ownerId: string): Promise<Project[]> {
    const rows = check(
      await sb().from("projects").select("data").eq("owner_id", ownerId).order("created_at", { ascending: false }),
      "listar proyectos",
    );
    return (rows ?? []).map((r) => r.data as Project);
  },

  async putProject(project: Project): Promise<Project> {
    return serialize(() => upsertProject({ ...project, updatedAt: Date.now() }));
  },

  async deleteProject(id: string): Promise<void> {
    await serialize(async () => check(await sb().from("projects").delete().eq("id", id), "borrar proyecto"));
  },

  /** Cuentas con email (para recordatorios). */
  async listUsers(): Promise<User[]> {
    const rows = check(await sb().from("app_users").select("data").not("email", "is", null), "listar usuarios");
    return (rows ?? []).map((r) => r.data as User);
  },

  async listAllProjects(): Promise<Project[]> {
    const rows = check(await sb().from("projects").select("data"), "listar todos");
    return (rows ?? []).map((r) => r.data as Project);
  },

  async patchProject(id: string, patch: (current: Project) => Project): Promise<Project | undefined> {
    return serialize(async () => {
      const current = await supabaseDb.getProject(id);
      if (!current) return undefined;
      return upsertProject({ ...patch(current), updatedAt: Date.now() });
    });
  },

  async getPreview(id: string): Promise<ScriptPreview | undefined> {
    const rows = check(await sb().from("previews").select("data").eq("id", id).limit(1), "leer guion");
    return (rows?.[0]?.data as ScriptPreview) ?? undefined;
  },

  async countPreviews(ownerId: string, since: number): Promise<number> {
    const res = await sb()
      .from("previews")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId)
      .gte("created_at", iso(since));
    if (res.error) throw new Error(`Base de datos (contar guiones): ${res.error.message}`);
    return res.count ?? 0;
  },

  async putPreview(preview: ScriptPreview): Promise<ScriptPreview> {
    return serialize(async () => {
      // De paso se tiran los guiones de más de un día.
      await sb().from("previews").delete().lt("created_at", iso(Date.now() - 24 * 60 * 60 * 1000));
      check(
        await sb().from("previews").upsert({
          id: preview.id,
          owner_id: preview.ownerId,
          created_at: iso(preview.createdAt),
          data: preview,
        }),
        "guardar guion",
      );
      return preview;
    });
  },

  async getUser(id: string): Promise<User | undefined> {
    const rows = check(await sb().from("app_users").select("data").eq("id", id).limit(1), "leer usuario");
    return (rows?.[0]?.data as User) ?? undefined;
  },

  async putUser(user: User): Promise<User> {
    return serialize(async () => {
      check(
        await sb().from("app_users").upsert({ id: user.id, email: user.email || null, created_at: iso(user.createdAt), data: user }),
        "guardar usuario",
      );
      return user;
    });
  },
};
