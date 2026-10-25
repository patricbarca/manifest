import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en cada visita, para que los Server
 * Components la vean al día. Sin auth configurada no hace nada.
 */
export async function proxy(request: NextRequest) {
  // Un solo dominio para Google y para las cookies de sesión: www y el
  // dominio de Railway redirigen (301) al de SITE_URL. La API y el retorno
  // del login no se tocan (webhooks, healthcheck, cookies de PKCE).
  const canonical = canonicalHost();
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const path = request.nextUrl.pathname;
  if (
    canonical &&
    host !== canonical &&
    (host === `www.${canonical}` || host.endsWith(".up.railway.app")) &&
    !path.startsWith("/api/") &&
    !path.startsWith("/auth/")
  ) {
    const target = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${canonical}`);
    return NextResponse.redirect(target, 301);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
      },
    },
  });
  await sb.auth.getUser();
  return response;
}

function canonicalHost(): string | null {
  try {
    return process.env.SITE_URL ? new URL(process.env.SITE_URL).hostname : null;
  } catch {
    return null;
  }
}

export const config = {
  // Todo menos ficheros estáticos, media y el webhook de Stripe.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|opengraph-image|brand/|videos/|voices/|media/|api/stripe/).*)"],
};
