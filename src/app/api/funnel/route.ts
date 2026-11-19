import { CLIENT_STEPS, logStep, visitorId, type FunnelStep } from "@/lib/funnel";
import { allow } from "@/lib/rate-limit";
import { authUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pasos del embudo que solo ve el navegador (clic en el botón, ver el login,
 * empezar a entrar). Responde siempre 204: no hay nada que enseñar y un fallo
 * no debe molestar a la persona.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 });
  const raw = await request.text().catch(() => "");
  if (!raw || raw.length > 1024) return done;
  let body: { step?: unknown; path?: unknown; meta?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return done;
  }
  const step = body.step as FunnelStep;
  if (typeof step !== "string" || !CLIENT_STEPS.includes(step)) return done;
  // La cookie se escribe aquí, antes de responder, para que web y app compartan el id.
  const visitor = await visitorId();
  if (!allow(`funnel:${visitor}`, 60, 3600_000)) return done;
  const meta = body.meta && typeof body.meta === "object" && !Array.isArray(body.meta) ? (body.meta as Record<string, unknown>) : undefined;
  const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path : undefined;
  const user = await authUser().catch(() => null);
  logStep(step, { visitor, userId: user?.id, path, meta });
  return done;
}
