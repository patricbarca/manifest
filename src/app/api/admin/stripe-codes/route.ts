import { NextResponse } from "next/server";
import { me } from "@/lib/social/me";
import { isAdmin } from "@/lib/admin";
import { createTestCodes } from "@/lib/stripe-admin";

export const runtime = "nodejs";

/** Solo administradores: crea 2 códigos de descuento de un uso para probar compras. */
export async function POST() {
  const who = await me();
  if (!who || !isAdmin(who.user.email)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const out = await createTestCodes();
  if (!out.ok) return NextResponse.json({ error: out.error }, { status: 502 });
  return NextResponse.json({ codes: out.codes });
}
