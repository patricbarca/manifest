import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sonda de salud para el orquestador (Railway, Docker, Kubernetes).
 *
 * A propósito no toca base de datos ni cookies: solo responde si el proceso
 * está vivo y sirviendo. Una sonda que comprueba dependencias tumba el
 * servicio entero cuando lo que falla es una dependencia, que es justo cuando
 * quieres que siga en pie devolviendo errores claros.
 */
export async function GET() {
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
