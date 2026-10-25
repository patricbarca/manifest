import type { Locale } from "../i18n/locale";
import type { AuraView, Profile } from "./types";
import { social } from "./store";

/** Aura por ver un vídeo completo, una vez al día por vídeo. */
export const AURA_PER_VIEW = 10;
/** Parte del vídeo que hay que ver para que cuente. */
export const VIEW_THRESHOLD = 0.8;

export const LEVELS: { min: number; name: Record<Locale, string> }[] = [
  { min: 0, name: { es: "Semilla", en: "Seed" } },
  { min: 100, name: { es: "Brote", en: "Sprout" } },
  { min: 300, name: { es: "Raíz", en: "Root" } },
  { min: 700, name: { es: "Luz", en: "Light" } },
  { min: 1500, name: { es: "Resplandor", en: "Radiance" } },
  { min: 3000, name: { es: "Aura plena", en: "Full aura" } },
];

export function levelFor(aura: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && aura >= LEVELS[i + 1].min) i++;
  const next = LEVELS[i + 1];
  const progress = next ? (aura - LEVELS[i].min) / (next.min - LEVELS[i].min) : 1;
  return { index: i, level: LEVELS[i], next, progress };
}

/** Fecha local AAAA-MM-DD en la zona horaria de la persona (UTC si no es válida). */
export function localDay(timeZone: string | undefined, at = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || "UTC" }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(at);
  }
}

function prevDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Días seguidos con al menos un visionado, contando hasta hoy (o ayer si hoy aún no). */
export function streakFrom(views: AuraView[], today: string): { current: number; best: number } {
  const days = [...new Set(views.map((v) => v.day))].sort().reverse();
  const set = new Set(days);
  let start = set.has(today) ? today : prevDay(today);
  let current = 0;
  while (set.has(start)) {
    current++;
    start = prevDay(start);
  }
  let best = 0;
  let run = 0;
  let last: string | undefined;
  for (const d of [...days].reverse()) {
    run = last && prevDay(d) === last ? run + 1 : 1;
    best = Math.max(best, run);
    last = d;
  }
  return { current, best: Math.max(best, current) };
}

export const ACHIEVEMENTS: { id: string; name: Record<Locale, string>; test: (s: AuraStats) => boolean }[] = [
  { id: "first", name: { es: "Primera visualización", en: "First visualization" }, test: (s) => s.totalViews >= 1 },
  { id: "streak3", name: { es: "3 días seguidos", en: "3 days in a row" }, test: (s) => s.bestStreak >= 3 },
  { id: "streak7", name: { es: "Una semana seguida", en: "A full week" }, test: (s) => s.bestStreak >= 7 },
  { id: "streak21", name: { es: "21 días: nuevo hábito", en: "21 days: new habit" }, test: (s) => s.bestStreak >= 21 },
  { id: "streak66", name: { es: "66 días", en: "66 days" }, test: (s) => s.bestStreak >= 66 },
  { id: "views50", name: { es: "50 visualizaciones", en: "50 visualizations" }, test: (s) => s.totalViews >= 50 },
];

export interface AuraStats {
  aura: number;
  totalViews: number;
  streak: number;
  bestStreak: number;
  viewedToday: string[];
  daysByProject: Record<string, number>;
}

export function statsFrom(views: AuraView[], today: string): AuraStats {
  const { current, best } = streakFrom(views, today);
  const daysByProject: Record<string, number> = {};
  for (const v of views) daysByProject[v.projectId] = (daysByProject[v.projectId] ?? 0) + 1;
  return {
    aura: views.reduce((a, v) => a + v.points, 0),
    totalViews: views.length,
    streak: current,
    bestStreak: best,
    viewedToday: views.filter((v) => v.day === today).map((v) => v.projectId),
    daysByProject,
  };
}

function slug(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "alma"
  );
}

export const HANDLE_RE = /^[a-z0-9_]{3,24}$/;

/** El perfil de una cuenta; se crea la primera vez (privado por defecto). */
export async function ensureProfile(user: { id: string; name: string; email: string; avatarUrl?: string }): Promise<Profile> {
  const existing = await social.getProfile(user.id);
  if (existing) {
    if (user.avatarUrl && existing.avatarUrl !== user.avatarUrl && !existing.avatarUrl?.startsWith("/media/")) {
      const updated = { ...existing, avatarUrl: user.avatarUrl };
      await social.putProfile(updated);
      return updated;
    }
    return existing;
  }
  const base = slug(user.name || user.email.split("@")[0]);
  let handle = base;
  for (let i = 0; i < 20 && (await social.getProfileByHandle(handle)); i++) {
    handle = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
  }
  const profile: Profile = {
    userId: user.id,
    handle,
    displayName: user.name || user.email.split("@")[0] || "",
    avatarUrl: user.avatarUrl,
    visibility: "private",
    createdAt: Date.now(),
  };
  await social.putProfile(profile);
  return profile;
}

/** Si quien mira puede ver el aura de este perfil. */
export async function canSee(profile: Profile, viewerId: string | undefined): Promise<boolean> {
  if (viewerId === profile.userId) return true;
  if (profile.visibility === "public") return true;
  if (profile.visibility === "circle" && viewerId) {
    const link = await social.getLink(profile.userId, viewerId);
    return link?.status === "accepted";
  }
  return false;
}
