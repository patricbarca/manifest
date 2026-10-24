import type { Practice } from "./types";

/**
 * LA PRÁCTICA DIARIA
 *
 * El KPI del producto no son vídeos creados sino días mirándolo. La racha
 * cuenta días seguidos (en la hora local del usuario) en que le dio al play.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Día local YYYY-MM-DD para un desfase de zona horaria (getTimezoneOffset). */
export function localDay(now: number, tzOffsetMin = 0): string {
  return new Date(now - tzOffsetMin * 60_000).toISOString().slice(0, 10);
}

/** Hora local 0–23. */
export function localHour(now: number, tzOffsetMin = 0): number {
  return new Date(now - tzOffsetMin * 60_000).getUTCHours();
}

function dayBefore(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
}

/** Apunta una reproducción. Ver dos veces el mismo día no suma. */
export function recordView(prev: Practice | undefined, day: string, tzOffsetMin?: number): Practice {
  const base: Practice = prev ?? { lastDay: "", streak: 0, best: 0, totalDays: 0 };
  const tz = tzOffsetMin ?? base.tzOffsetMin;
  if (base.lastDay === day) return { ...base, tzOffsetMin: tz };
  // Un día anterior al último (reloj cambiado, otra zona) no rompe nada.
  if (base.lastDay && day < base.lastDay) return { ...base, tzOffsetMin: tz };
  const streak = base.lastDay === dayBefore(day) ? base.streak + 1 : 1;
  return {
    ...base,
    lastDay: day,
    streak,
    best: Math.max(base.best, streak),
    totalDays: base.totalDays + 1,
    tzOffsetMin: tz,
  };
}

/** Racha vigente: si ayer no lo vio, ya está rota aunque no se haya guardado. */
export function currentStreak(p: Practice | undefined, now = Date.now()): number {
  if (!p?.lastDay) return 0;
  const today = localDay(now, p.tzOffsetMin);
  return p.lastDay === today || p.lastDay === dayBefore(today) ? p.streak : 0;
}
