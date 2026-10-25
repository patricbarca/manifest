import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Project, User } from "../types";
import { dbDir } from "../paths";
import { supabaseConfigured, supabaseDb } from "./supabase-store";

/**
 * Vídeos hechos antes de Supabase: viven en los JSON del volumen (/data/db).
 * Al arrancar se copian a Supabase los que falten. Solo los terminados o
 * fallidos (los borradores viejos los borraría la limpieza). No pisa nada:
 * si el id ya está en Supabase, se deja como está.
 */
export async function importLegacyJson(): Promise<void> {
  if (!supabaseConfigured()) return;
  const read = async <T>(name: string): Promise<Record<string, T>> => {
    try {
      return JSON.parse(await readFile(path.join(dbDir(), `${name}.json`), "utf8")) as Record<string, T>;
    } catch {
      return {};
    }
  };
  const projects = Object.values(await read<Project>("projects")).filter(
    (p) => p.status !== "draft" && p.status !== "queued" && p.status !== "generating",
  );
  if (!projects.length) return;
  const users = await read<User>("users");
  let n = 0;
  for (const p of projects) {
    if (await supabaseDb.getProject(p.id)) continue;
    const u = users[p.ownerId];
    if (u && !(await supabaseDb.getUser(u.id))) await supabaseDb.putUser(u);
    await supabaseDb.putProject(p);
    n++;
  }
  if (n) console.log(`[legacy] ${n} vídeos antiguos copiados a Supabase`);
}
