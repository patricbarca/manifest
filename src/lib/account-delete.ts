import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { db } from "./db/store";
import { supabaseConfigured } from "./db/supabase-store";
import { manifests } from "./manifest/store";
import { deleteManifestFiles, deleteProject } from "./cleanup";
import { mediaDir } from "./paths";

const BUSY = new Set(["queued", "generating"]);

/** ¿Tiene algo generándose ahora? Mejor esperar: si no, el pipeline volvería a escribir ficheros. */
export async function hasWorkInProgress(userId: string): Promise<boolean> {
  const [projects, list] = await Promise.all([db.listProjects(userId), manifests.list(userId)]);
  return projects.some((p) => BUSY.has(p.status)) || list.some((m) => BUSY.has(m.status));
}

/**
 * Borra la cuenta entera y para siempre: vídeos, manifestaciones, fotos,
 * foto de perfil, perfil público, aura, círculo, datos de la cuenta y su
 * acceso (Supabase Auth). Lo que guarda Stripe de los pagos queda en Stripe
 * (obligación contable). Lo que tenga fal caduca solo en 1 día.
 */
export async function deleteAccount(userId: string): Promise<void> {
  // 1. Vídeos (con sus escenas, voces y fotos) y manifestaciones sueltas.
  for (const p of await db.listProjects(userId)) await deleteProject(p);
  for (const m of await manifests.list(userId)) {
    await deleteManifestFiles(m.id);
    await manifests.delete(m.id);
  }

  // 2. Selfies y foto de perfil: llevan el id de la persona delante del nombre.
  for (const kind of ["uploads", "avatars"] as const) {
    const dir = mediaDir(kind);
    const names = await readdir(dir).catch(() => [] as string[]);
    for (const n of names) if (n.startsWith(`${userId}_`)) await rm(path.join(dir, n), { force: true });
  }

  // 3. Tablas sociales y la cuenta. Sin Supabase (desarrollo) no hay nada más que borrar.
  if (!supabaseConfigured()) return;
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const must = (r: { error: { message: string } | null }, what: string) => {
    if (r.error) throw new Error(`Borrar cuenta (${what}): ${r.error.message}`);
  };
  must(await sb.from("aura_views").delete().eq("user_id", userId), "aura");
  must(await sb.from("view_sessions").delete().eq("user_id", userId), "sesiones");
  must(await sb.from("circle").delete().or(`owner_id.eq.${userId},member_id.eq.${userId}`), "círculo");
  must(await sb.from("previews").delete().eq("owner_id", userId), "vistas previas");
  must(await sb.from("profiles").delete().eq("user_id", userId), "perfil");
  must(await sb.from("app_users").delete().eq("id", userId), "cuenta");
  // 4. El acceso (email de inicio de sesión). El id de la app es el de Supabase Auth.
  const auth = await sb.auth.admin.deleteUser(userId);
  if (auth.error && !/not.?found/i.test(auth.error.message)) throw new Error(`Borrar acceso: ${auth.error.message}`);
}
