import { PRODUCTS } from "./pricing";
import type { Membership, Tier, User } from "./types";

/**
 * EL PLAN DE SOCIO
 *
 * Una sola cuota, dos formas de pagarla: $7/mes o $70/año (dos meses gratis,
 * cobrados por adelantado). Incluye:
 *  - un vídeo de Imágenes cada 30 días, acumulables hasta 3;
 *  - precio de socio en Animado ($19) y Elevado ($39);
 *  - recordatorio diario, racha y revisión mensual;
 *  - la plantilla nueva de cada mes.
 *
 * Los vídeos incluidos se calculan al vuelo (1 por cada 30 días activos desde
 * `lastAccrualAt`), así el plan anual y el mensual funcionan igual y no hace
 * falta ninguna tarea programada.
 */

export const MEMBERSHIP = {
  monthlyUsd: 7,
  yearlyUsd: 70,
  /** Cuántos vídeos incluidos se pueden acumular. */
  maxCredits: 3,
  accrualMs: 30 * 24 * 60 * 60 * 1000,
} as const;

/** Precio para socios. Imágenes cuesta lo normal cuando no quedan incluidos. */
export const MEMBER_PRICES: Record<Tier, number> = {
  vision: PRODUCTS.vision.priceUsd,
  cinematic: 19,
  elevated: 39,
};

export function isMember(user: User | undefined): boolean {
  return user?.membership?.status === "active";
}

/** Suma los vídeos incluidos que tocan desde la última vez. Función pura. */
export function accrue(m: Membership, now = Date.now()): Membership {
  if (m.status !== "active") return m;
  const periods = Math.floor((now - m.lastAccrualAt) / MEMBERSHIP.accrualMs);
  if (periods <= 0) return m;
  return {
    ...m,
    credits: Math.min(MEMBERSHIP.maxCredits, m.credits + periods),
    lastAccrualAt: m.lastAccrualAt + periods * MEMBERSHIP.accrualMs,
  };
}

/** Vídeos incluidos disponibles ahora mismo. */
export function creditsLeft(user: User | undefined): number {
  if (!user?.membership || !isMember(user)) return 0;
  return accrue(user.membership).credits;
}

/** Precio de catálogo o de socio, en USD. */
export function priceForUser(tier: Tier, user: User | undefined): number {
  return isMember(user) ? MEMBER_PRICES[tier] : PRODUCTS[tier].priceUsd;
}

/** Estado de Stripe → nuestro estado. */
export function membershipStatus(stripeStatus: string): Membership["status"] {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "active";
  if (stripeStatus === "past_due" || stripeStatus === "unpaid") return "past_due";
  return "canceled";
}
