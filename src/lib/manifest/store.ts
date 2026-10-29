import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Manifestation } from "../types";
import { dbDir } from "../paths";
import { supabaseConfigured } from "../db/supabase-store";

/**
 * Las manifestaciones de cada persona. Con Supabase van a la tabla
 * `manifestations` (dato entero en jsonb); sin él, a un JSON local.
 */
export interface ManifestStore {
  get(id: string): Promise<Manifestation | undefined>;
  list(ownerId: string): Promise<Manifestation[]>;
  put(m: Manifestation): Promise<void>;
  patch(id: string, fn: (m: Manifestation) => Manifestation): Promise<Manifestation | undefined>;
  delete(id: string): Promise<void>;
  /** En cola o generándose (para relanzarlas tras un reinicio). */
  listPending(): Promise<Manifestation[]>;
}

// ── Supabase ────────────────────────────────────────────────────────────────

let client: SupabaseClient | undefined;
const sb = () =>
  (client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));

function ok<T>(r: { data: T; error: { message: string } | null }, what: string): T {
  if (r.error) throw new Error(`Base de datos (${what}): ${r.error.message}`);
  return r.data;
}

const row = (m: Manifestation) => ({
  id: m.id,
  owner_id: m.ownerId,
  status: m.status,
  created_at: new Date(m.createdAt).toISOString(),
  data: m,
});

/** Las escrituras van en fila (como el resto de stores) para no pisar cambios. */
let chain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => undefined);
  return next;
}

const supabaseManifests: ManifestStore = {
  async get(id) {
    const rows = ok(await sb().from("manifestations").select("data").eq("id", id).limit(1), "manifestación");
    return (rows?.[0]?.data as Manifestation) ?? undefined;
  },
  async list(ownerId) {
    const rows = ok(
      await sb().from("manifestations").select("data").eq("owner_id", ownerId).order("created_at", { ascending: false }),
      "manifestaciones",
    );
    return (rows ?? []).map((r) => r.data as Manifestation);
  },
  put: (m) => serialize(async () => void ok(await sb().from("manifestations").upsert(row({ ...m, updatedAt: Date.now() })), "guardar manifestación")),
  patch: (id, fn) =>
    serialize(async () => {
      const cur = await supabaseManifests.get(id);
      if (!cur) return undefined;
      const next = { ...fn(cur), updatedAt: Date.now() };
      ok(await sb().from("manifestations").upsert(row(next)), "guardar manifestación");
      return next;
    }),
  delete: (id) => serialize(async () => void ok(await sb().from("manifestations").delete().eq("id", id), "borrar manifestación")),
  async listPending() {
    const rows = ok(await sb().from("manifestations").select("data").in("status", ["queued", "generating"]), "pendientes");
    return (rows ?? []).map((r) => r.data as Manifestation);
  },
};

// ── JSON local (desarrollo) ─────────────────────────────────────────────────

const FILE = () => path.join(dbDir(), "manifestations.json");
async function load(): Promise<Record<string, Manifestation>> {
  try {
    return JSON.parse(await readFile(FILE(), "utf8"));
  } catch {
    return {};
  }
}
async function save(all: Record<string, Manifestation>) {
  await mkdir(dbDir(), { recursive: true });
  const tmp = `${FILE()}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(all, null, 2));
  await rename(tmp, FILE());
}

const jsonManifests: ManifestStore = {
  get: async (id) => (await load())[id],
  list: async (ownerId) =>
    Object.values(await load())
      .filter((m) => m.ownerId === ownerId)
      .sort((a, b) => b.createdAt - a.createdAt),
  put: (m) =>
    serialize(async () => {
      const all = await load();
      all[m.id] = { ...m, updatedAt: Date.now() };
      await save(all);
    }),
  patch: (id, fn) =>
    serialize(async () => {
      const all = await load();
      if (!all[id]) return undefined;
      all[id] = { ...fn(all[id]), updatedAt: Date.now() };
      await save(all);
      return all[id];
    }),
  delete: (id) =>
    serialize(async () => {
      const all = await load();
      delete all[id];
      await save(all);
    }),
  listPending: async () => Object.values(await load()).filter((m) => m.status === "queued" || m.status === "generating"),
};

export const manifests: ManifestStore = supabaseConfigured() ? supabaseManifests : jsonManifests;
