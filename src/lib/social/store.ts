import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { dbDir } from "../paths";
import { supabaseConfigured } from "../db/supabase-store";
import type { AuraView, CircleLink, Profile, Visibility } from "./types";

/**
 * Datos sociales: perfiles, aura y círculo.
 * Con Supabase van a sus tablas (profiles, aura_views, view_sessions, circle);
 * sin él, a un JSON local para desarrollo.
 */
export interface SocialStore {
  getProfile(userId: string): Promise<Profile | undefined>;
  getProfileByHandle(handle: string): Promise<Profile | undefined>;
  putProfile(p: Profile): Promise<void>;
  /** Registra un visionado; devuelve false si ya contaba hoy. */
  addView(v: AuraView): Promise<boolean>;
  listViews(userId: string): Promise<AuraView[]>;
  startSession(userId: string, projectId: string): Promise<void>;
  sessionStart(userId: string, projectId: string): Promise<number | undefined>;
  getLink(ownerId: string, memberId: string): Promise<CircleLink | undefined>;
  putLink(l: CircleLink): Promise<void>;
  deleteLink(ownerId: string, memberId: string): Promise<void>;
  listCircle(ownerId: string): Promise<CircleLink[]>;
  listMemberships(memberId: string): Promise<CircleLink[]>;
  getProfiles(userIds: string[]): Promise<Profile[]>;
}

// ── Supabase ────────────────────────────────────────────────────────────────

let client: SupabaseClient | undefined;
const sb = () =>
  (client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));

function ok<T>(r: { data: T; error: { message: string; code?: string } | null }, what: string): T {
  if (r.error) throw new Error(`Base de datos (${what}): ${r.error.message}`);
  return r.data;
}

type ProfileRow = { user_id: string; handle: string; display_name: string; avatar_url: string | null; visibility: Visibility; created_at: string; bio?: string | null; mantra?: string | null; link?: string | null; location?: string | null };
const toProfile = (r: ProfileRow): Profile => ({
  userId: r.user_id,
  handle: r.handle,
  displayName: r.display_name,
  avatarUrl: r.avatar_url ?? undefined,
  bio: r.bio ?? undefined,
  mantra: r.mantra ?? undefined,
  link: r.link ?? undefined,
  location: r.location ?? undefined,
  visibility: r.visibility,
  createdAt: Date.parse(r.created_at),
});
type LinkRow = { owner_id: string; member_id: string; status: "pending" | "accepted"; created_at: string };
const toLink = (r: LinkRow): CircleLink => ({ ownerId: r.owner_id, memberId: r.member_id, status: r.status, createdAt: Date.parse(r.created_at) });

const supabaseSocial: SocialStore = {
  async getProfile(userId) {
    const rows = ok(await sb().from("profiles").select("*").eq("user_id", userId).limit(1), "perfil");
    return rows?.[0] ? toProfile(rows[0] as ProfileRow) : undefined;
  },
  async getProfileByHandle(handle) {
    const rows = ok(await sb().from("profiles").select("*").eq("handle", handle.toLowerCase()).limit(1), "perfil");
    return rows?.[0] ? toProfile(rows[0] as ProfileRow) : undefined;
  },
  async putProfile(p) {
    ok(
      await sb().from("profiles").upsert({
        user_id: p.userId,
        handle: p.handle,
        display_name: p.displayName,
        avatar_url: p.avatarUrl ?? null,
        bio: p.bio ?? null,
        mantra: p.mantra ?? null,
        link: p.link ?? null,
        location: p.location ?? null,
        visibility: p.visibility,
        created_at: new Date(p.createdAt).toISOString(),
      }),
      "guardar perfil",
    );
  },
  async addView(v) {
    const r = await sb().from("aura_views").insert({ user_id: v.userId, project_id: v.projectId, day: v.day, points: v.points });
    if (r.error?.code === "23505") return false; // ya contaba hoy
    ok(r, "aura");
    return true;
  },
  async listViews(userId) {
    const rows = ok(await sb().from("aura_views").select("project_id, day, points").eq("user_id", userId).order("day", { ascending: false }), "aura");
    return (rows ?? []).map((r) => ({ userId, projectId: r.project_id as string, day: r.day as string, points: r.points as number }));
  },
  async startSession(userId, projectId) {
    ok(await sb().from("view_sessions").upsert({ user_id: userId, project_id: projectId, started_at: new Date().toISOString() }), "sesión");
  },
  async sessionStart(userId, projectId) {
    const rows = ok(await sb().from("view_sessions").select("started_at").eq("user_id", userId).eq("project_id", projectId).limit(1), "sesión");
    return rows?.[0] ? Date.parse(rows[0].started_at as string) : undefined;
  },
  async getLink(ownerId, memberId) {
    const rows = ok(await sb().from("circle").select("*").eq("owner_id", ownerId).eq("member_id", memberId).limit(1), "círculo");
    return rows?.[0] ? toLink(rows[0] as LinkRow) : undefined;
  },
  async putLink(l) {
    ok(await sb().from("circle").upsert({ owner_id: l.ownerId, member_id: l.memberId, status: l.status, created_at: new Date(l.createdAt).toISOString() }), "círculo");
  },
  async deleteLink(ownerId, memberId) {
    ok(await sb().from("circle").delete().eq("owner_id", ownerId).eq("member_id", memberId), "círculo");
  },
  async listCircle(ownerId) {
    const rows = ok(await sb().from("circle").select("*").eq("owner_id", ownerId).order("created_at"), "círculo");
    return (rows ?? []).map((r) => toLink(r as LinkRow));
  },
  async listMemberships(memberId) {
    const rows = ok(await sb().from("circle").select("*").eq("member_id", memberId), "círculo");
    return (rows ?? []).map((r) => toLink(r as LinkRow));
  },
  async getProfiles(userIds) {
    if (!userIds.length) return [];
    const rows = ok(await sb().from("profiles").select("*").in("user_id", userIds), "perfiles");
    return (rows ?? []).map((r) => toProfile(r as ProfileRow));
  },
};

// ── JSON local (desarrollo) ─────────────────────────────────────────────────

type JsonData = { profiles: Profile[]; views: AuraView[]; sessions: Record<string, number>; circle: CircleLink[] };
const FILE = () => path.join(dbDir(), "social.json");
async function load(): Promise<JsonData> {
  try {
    return JSON.parse(await readFile(FILE(), "utf8")) as JsonData;
  } catch {
    return { profiles: [], views: [], sessions: {}, circle: [] };
  }
}
let chain: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (d: JsonData) => T): Promise<T> {
  const next = chain.then(async () => {
    const d = await load();
    const out = fn(d);
    await mkdir(dbDir(), { recursive: true });
    const tmp = `${FILE()}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(d, null, 2));
    await rename(tmp, FILE());
    return out;
  });
  chain = next.catch(() => undefined);
  return next;
}

const jsonSocial: SocialStore = {
  async getProfile(userId) {
    return (await load()).profiles.find((p) => p.userId === userId);
  },
  async getProfileByHandle(handle) {
    return (await load()).profiles.find((p) => p.handle === handle.toLowerCase());
  },
  putProfile: (p) =>
    mutate((d) => {
      d.profiles = [...d.profiles.filter((x) => x.userId !== p.userId), p];
    }),
  addView: (v) =>
    mutate((d) => {
      if (d.views.some((x) => x.userId === v.userId && x.projectId === v.projectId && x.day === v.day)) return false;
      d.views.push(v);
      return true;
    }),
  async listViews(userId) {
    return (await load()).views.filter((v) => v.userId === userId).sort((a, b) => b.day.localeCompare(a.day));
  },
  startSession: (u, p) =>
    mutate((d) => {
      d.sessions[`${u}|${p}`] = Date.now();
    }),
  async sessionStart(u, p) {
    return (await load()).sessions[`${u}|${p}`];
  },
  async getLink(o, m) {
    return (await load()).circle.find((l) => l.ownerId === o && l.memberId === m);
  },
  putLink: (l) =>
    mutate((d) => {
      d.circle = [...d.circle.filter((x) => !(x.ownerId === l.ownerId && x.memberId === l.memberId)), l];
    }),
  deleteLink: (o, m) =>
    mutate((d) => {
      d.circle = d.circle.filter((x) => !(x.ownerId === o && x.memberId === m));
    }),
  async listCircle(o) {
    return (await load()).circle.filter((l) => l.ownerId === o);
  },
  async listMemberships(m) {
    return (await load()).circle.filter((l) => l.memberId === m);
  },
  async getProfiles(ids) {
    return (await load()).profiles.filter((p) => ids.includes(p.userId));
  },
};

export const social: SocialStore = supabaseConfigured() ? supabaseSocial : jsonSocial;
