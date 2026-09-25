import { cookies } from "next/headers";
import { db } from "./store";
import type { User } from "../types";
import { FREE_VIDEOS, PAYMENTS_ENABLED } from "../pricing";

/**
 * "Auth" del MVP: una cookie con un id anonimo.
 *
 * Suficiente para probar el producto de punta a punta y para que cada visitante
 * tenga su biblioteca. NO es auth: antes de cobrar o de guardar selfies de
 * verdad hay que cambiarlo por Supabase Auth o similar (ver docs/roadmap.md).
 */

const COOKIE = "manifest_uid";

function newId(): string {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function currentUser(): Promise<User> {
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;

  if (!id) {
    id = newId();
    // En un Server Component la cookie puede no ser escribible; se ignora y se
    // vuelve a intentar desde la ruta de API, que si puede.
    try {
      jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    } catch {
      /* solo lectura en este contexto */
    }
  }

  const existing = await db.getUser(id);
  if (existing) return existing;

  const user: User = {
    id,
    email: "",
    name: "Invitado",
    createdAt: Date.now(),
    freeVideosUsed: 0,
  };
  await db.putUser(user);
  return user;
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
 */
export type ChargeKind = "free" | "prelaunch" | "paid";

export async function chargeForVideo(
  userId: string,
  priceCents: number,
): Promise<
  { ok: true; kind: ChargeKind; paidCents: number } | { ok: false; reason: string }
> {
  const user = await db.getUser(userId);
  if (!user) return { ok: false, reason: "Usuario no encontrado" };

  if (user.freeVideosUsed < FREE_VIDEOS) {
    await db.putUser({ ...user, freeVideosUsed: user.freeVideosUsed + 1 });
    return { ok: true, kind: "free", paidCents: 0 };
  }

  if (!PAYMENTS_ENABLED) {
    return { ok: true, kind: "prelaunch", paidCents: 0 };
  }

  // Aquí irá el cobro real cuando entre Stripe.
  void priceCents;
  return {
    ok: false,
    reason: "Ya has usado tu vídeo gratis. Los pagos todavía no están activos.",
  };
}

/** Cuántos vídeos gratis le quedan a este usuario. */
export function freeVideosLeft(user: User): number {
  return Math.max(0, FREE_VIDEOS - user.freeVideosUsed);
}
