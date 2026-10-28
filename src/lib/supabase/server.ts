import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authConfig } from "./config";

/** Cliente de Supabase con la sesión del visitante (cookies). Null si no hay auth configurada. */
export async function supabaseServer() {
  const cfg = authConfig();
  if (!cfg) return null;
  const jar = await cookies();
  return createServerClient(cfg.url, cfg.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) jar.set(name, value, options);
        } catch {
          // En un Server Component las cookies son de solo lectura; el proxy ya refresca la sesión.
        }
      },
    },
  });
}

/**
 * El usuario con sesión iniciada, o null.
 *
 * Rapidez: getClaims() verifica el token firmado aquí mismo (con las claves
 * públicas de Supabase, que se guardan en memoria) en vez de preguntar al
 * servidor de Supabase en cada visita; y cache() hace que la cabecera, la
 * página y sus ayudantes compartan una sola comprobación por petición.
 */
export const authUser = cache(async (): Promise<{ id: string; email: string; name?: string; avatarUrl?: string } | null> => {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) return null;
  const meta = (c.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string; picture?: string };
  return { id: c.sub, email: (c.email as string | undefined) ?? "", name: meta.full_name ?? meta.name, avatarUrl: meta.avatar_url ?? meta.picture };
});
