import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfigured } from "./db/supabase-store";
import { appHost, siteHost } from "./hosts";
import { readAttribution } from "./tracking";

/**
 * Medición del embudo (tabla public.funnel_events, solo servidor con la clave
 * secreta). Cada paso guarda un id anónimo de visitante (cookie ml_vid), el id
 * de la cuenta si lo hay, el origen (utm_source o "direct") y la ruta. Ni
 * emails ni IPs. Sin Supabase (desarrollo) no hace nada.
 */

export const FUNNEL_STEPS = ["cta_click", "login_view", "auth_start", "sign_up", "selfies_ok", "wish_submitted", "free_scene"] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

/** Pasos que puede mandar el navegador (POST /api/funnel). Los demás solo los registra el servidor. */
export const CLIENT_STEPS: readonly FunnelStep[] = ["cta_click", "login_view", "auth_start"];

const VID = "ml_vid";

let client: SupabaseClient | undefined;
function sb(): SupabaseClient {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** ".manifestlife.ai" en producción, para que web y app compartan la cookie; nada en local. */
function cookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  const site = siteHost()?.replace(/^www\./, "");
  if (!site || !site.includes(".") || /^\d+\.\d+/.test(site)) return undefined;
  const app = appHost();
  // Solo si la app cuelga del mismo dominio (app.manifestlife.ai): si no, la cookie no valdría allí.
  if (app && app !== site && !app.endsWith(`.${site}`)) return undefined;
  return `.${site}`;
}

/** Id anónimo del visitante; si no hay, lo crea (la cookie solo se escribe en rutas de API). */
export async function visitorId(): Promise<string> {
  const jar = await cookies();
  const cur = jar.get(VID)?.value;
  if (cur && /^v_[a-f0-9]{24}$/.test(cur)) return cur;
  const id = "v_" + randomBytes(12).toString("hex");
  try {
    jar.set(VID, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/", domain: cookieDomain() });
  } catch {
    /* en un Server Component no se puede escribir: el paso queda con un id suelto */
  }
  return id;
}

export interface StepOpts {
  visitor?: string;
  userId?: string;
  source?: string;
  path?: string;
  meta?: Record<string, unknown>;
}

/** Registra un paso. No espera ni lanza nunca: si falla, solo se avisa en el log. */
export function logStep(step: FunnelStep, opts: StepOpts = {}): void {
  if (!supabaseConfigured()) return;
  void (async () => {
    try {
      const visitor = opts.visitor ?? (await visitorId());
      const source = opts.source ?? (await readAttribution())?.utm_source ?? "direct";
      const { error } = await sb()
        .from("funnel_events")
        .insert({
          visitor: visitor.slice(0, 64),
          user_id: opts.userId ?? null,
          step,
          source: source.slice(0, 100),
          path: opts.path?.slice(0, 200) ?? null,
          meta: opts.meta ?? null,
        });
      if (error) console.warn("[embudo]", step, error.message);
    } catch (e) {
      console.warn("[embudo]", step, e instanceof Error ? e.message : e);
    }
  })();
}
