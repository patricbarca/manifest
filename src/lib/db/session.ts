import { cookies } from "next/headers";
import { db } from "./store";
import { PLANS } from "../pricing";
import type { User } from "../types";

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

  const free = PLANS[0];
  const user: User = {
    id,
    email: "",
    name: "Invitado",
    plan: "free",
    credits: free.creditsPerMonth,
    createdAt: Date.now(),
  };
  await db.putUser(user);
  return user;
}

export async function spendCredits(userId: string, amount: number): Promise<boolean> {
  const user = await db.getUser(userId);
  if (!user || user.credits < amount) return false;
  await db.putUser({ ...user, credits: user.credits - amount });
  return true;
}

export async function refundCredits(userId: string, amount: number): Promise<void> {
  const user = await db.getUser(userId);
  if (user) await db.putUser({ ...user, credits: user.credits + amount });
}
