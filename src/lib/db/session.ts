import { cookies } from "next/headers";
import { db } from "./store";
import type { Tier, User } from "../types";
import { accrue, isMember, priceForUser } from "../membership";
import { authUser } from "../supabase/server";
import { authEnabled } from "../supabase/config";
import { FREE_VIDEOS, PAYMENTS_ENABLED } from "../pricing";

/**
 * Identidad.
 *
 * Con Supabase Auth configurado, el usuario es la cuenta con la que inició
 * sesión (código por email o Google) y crear vídeos exige sesión. Sin sesión
 * se navega con un id anónimo en cookie; al entrar, lo que hiciera como
 * anónimo pasa a su cuenta. Sin Supabase (desarrollo), todo es anónimo.
 */

const COOKIE = "manifest_uid";

function newId(): string {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function anonymousId(): Promise<string> {
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  if (!id) {
    id = newId();
    // En un Server Component la cookie puede no ser escribible; se reintenta en la API.
    try {
      jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    } catch {
      /* solo lectura en este contexto */
    }
  }
  return id;
}

async function ensureUser(id: string, email = "", name = "Invitado"): Promise<User> {
  const existing = await db.getUser(id);
  if (existing) {
    if (email && existing.email !== email) {
      const updated = await db.patchUser(id, (u) => ({ ...u, email, name: name || u.name }));
      return updated ?? existing;
    }
    return existing;
  }
  const user: User = { id, email, name, createdAt: Date.now(), freeVideosUsed: 0 };
  await db.putUser(user);
  return user;
}

export async function currentUser(): Promise<User> {
  const auth = await authUser();
  if (auth) return ensureUser(auth.id, auth.email, auth.name ?? auth.email.split("@")[0]);
  return ensureUser(await anonymousId());
}

/** True si se puede crear: con auth configurada hace falta sesión. */
export async function isSignedIn(): Promise<boolean> {
  if (!authEnabled()) return true;
  return (await authUser()) !== null;
}

/**
 * Al iniciar sesión, los vídeos y el contador del id anónimo pasan a la cuenta.
 * El contador de vídeos gratis se suma: entrar no regala otro vídeo gratis.
 */
export async function linkAnonymousData(): Promise<void> {
  const auth = await authUser();
  const jar = await cookies();
  const anonId = jar.get(COOKIE)?.value;
  if (!auth || !anonId || anonId === auth.id) return;
  const anon = await db.getUser(anonId);
  const account = await ensureUser(auth.id, auth.email, auth.name ?? auth.email.split("@")[0]);
  for (const p of await db.listProjects(anonId)) {
    await db.patchProject(p.id, (cur) => ({ ...cur, ownerId: auth.id }));
  }
  if (anon) {
    await db.patchUser(account.id, (u) => ({
      ...u,
      freeVideosUsed: Math.max(u.freeVideosUsed, anon.freeVideosUsed),
      usedQuotes: [...new Set([...(u.usedQuotes ?? []), ...(anon.usedQuotes ?? [])])],
    }));
  }
  try {
    jar.delete(COOKIE);
  } catch {
    /* solo lectura */
  }
}

/**
 * Cobra un vídeo, o lo deja pasar.
 *
 * Distingue tres casos, y la distinción importa porque solo uno de ellos lleva
 * marca de agua:
 *
 *  - `free`      — el vídeo que invita la casa. Lleva marca de agua: es el
 *                  anuncio, y quien lo comparte anuncia por nosotros.
 *  - `prelaunch` — todavía no hay pasarela de pago. Se enseña el precio y se
 *                  genera igual, pero SIN marca de agua: no es un vídeo de
 *                  regalo, es que aún no sabemos cobrar.
 *  - `paid`      — pagado de verdad. Sin marca de agua.
 *  - `included`  — vídeo de Imágenes incluido en el plan de socio.
 */
export type ChargeKind = "free" | "prelaunch" | "paid" | "included";

/** Clave del diccionario con el motivo, no el mensaje ya escrito. */
type ChargeError = "noFreeLeft" | "paymentRequired";

/**
 * Decide cómo se paga un vídeo. Orden:
 *  1. Socio con un vídeo de Imágenes incluido → se gasta (`included`).
 *  2. Socio sin incluido → paga precio de socio en Stripe.
 *  3. No socio con vídeo gratis → `free` (con marca de agua).
 *  4. Sin pasarela de pago → `prelaunch`.
 *  5. Si no, paga precio de catálogo en Stripe.
 * `priceCents` es lo que se cobraría en Stripe (ya con precio de socio).
 */
export async function chargeForVideo(
  userId: string,
  tier: Tier,
): Promise<
  | { ok: true; kind: ChargeKind; paidCents: number; priceCents: number }
  | { ok: false; reason: ChargeError; priceCents: number }
> {
  const user = await db.getUser(userId);
  const priceCents = priceForUser(tier, user) * 100;
  if (!user) return { ok: false, reason: "noFreeLeft", priceCents };

  if (isMember(user) && tier === "vision") {
    // Se gasta dentro de la cola: dos peticiones a la vez no gastan el mismo.
    let used = false;
    await db.patchUser(userId, (u) => {
      if (!u.membership || u.membership.status !== "active") return u;
      const m = accrue(u.membership);
      if (m.credits < 1) return { ...u, membership: m };
      used = true;
      return { ...u, membership: { ...m, credits: m.credits - 1 } };
    });
    if (used) return { ok: true, kind: "included", paidCents: 0, priceCents };
  }

  if (!isMember(user) && user.freeVideosUsed < FREE_VIDEOS) {
    await db.patchUser(userId, (u) => ({ ...u, freeVideosUsed: u.freeVideosUsed + 1 }));
    return { ok: true, kind: "free", paidCents: 0, priceCents };
  }

  if (!PAYMENTS_ENABLED) {
    return { ok: true, kind: "prelaunch", paidCents: 0, priceCents };
  }

  // El cobro lo hace Stripe Checkout (ver api/projects y lib/stripe).
  return { ok: false, reason: "paymentRequired", priceCents };
}

/** Cuántos vídeos gratis le quedan a este usuario. */
export function freeVideosLeft(user: User): number {
  // Los socios no gastan el gratis (lleva marca de agua): usan los incluidos.
  if (isMember(user)) return 0;
  return Math.max(0, FREE_VIDEOS - user.freeVideosUsed);
}
