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

/** El usuario con sesión iniciada, o null. */
export async function authUser(): Promise<{ id: string; email: string; name?: string } | null> {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  const u = data.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string };
  return { id: u.id, email: u.email ?? "", name: meta.full_name ?? meta.name };
}
