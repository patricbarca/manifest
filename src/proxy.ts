import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requestOrigin } from "@/lib/request-origin";
import { APP_ONLY, SITE_ONLY, appBase, appHost, isAppHostHeader, matches } from "@/lib/hosts";

const REF_COOKIE = "ml_ref";

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

  // Web pública y app en direcciones distintas (solo si APP_URL existe).
  const onApp = isAppHostHeader(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const code = request.nextUrl.searchParams.get("code");
  if (appHost() && !path.startsWith("/api/") && !path.startsWith("/auth/")) {
    if (onApp && (path === "/" || matches(path, SITE_ONLY))) {
      // La portada de la app es tu perfil; precios y blog viven en la web.
      const target = path === "/" ? new URL("/profile", appBase()) : new URL(path + request.nextUrl.search, process.env.SITE_URL);
      if (path === "/" && code) return NextResponse.redirect(new URL(`/auth/callback?code=${encodeURIComponent(code)}`, appBase()), 307);
      return NextResponse.redirect(target, 307);
    }
    if (!onApp && (matches(path, APP_ONLY) || code)) {
      // El login empieza en la app (ahí queda su cookie), así que el código también va allí.
      if (code) return NextResponse.redirect(new URL(`/auth/callback?code=${encodeURIComponent(code)}`, appBase()), 307);
      // Crear desde la web lleva directo al login de la app (y de ahí a crear).
      if (path === "/create" || path.startsWith("/create/")) {
        const login = new URL("/login", appBase());
        login.searchParams.set("next", path + request.nextUrl.search);
        return NextResponse.redirect(login, 307);
      }
      return NextResponse.redirect(new URL(path + request.nextUrl.search, appBase()), 307);
    }
  }

  // Si Supabase no acepta la URL de vuelta, devuelve el código a la Site URL
  // (la portada). Lo pasamos al retorno del login para no perder la sesión.
  if (code && !path.startsWith("/auth/") && !path.startsWith("/api/")) {
    const target = new URL("/auth/callback", requestOrigin(request));
    target.searchParams.set("code", code);
    return NextResponse.redirect(target, 307);
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  // Enlace de invitación (?ref=usuario): se recuerda 30 días para atribuir el registro.
  const ref = request.nextUrl.searchParams.get("ref")?.toLowerCase();
  const withRef = (res: NextResponse) => {
    // La app no se indexa en buscadores: solo la web pública.
    if (onApp) res.headers.set("X-Robots-Tag", "noindex, nofollow");
    if (ref && /^[a-z0-9_]{3,24}$/.test(ref) && !request.cookies.get(REF_COOKIE)) {
      res.cookies.set(REF_COOKIE, ref, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
    }
    return res;
  };
  if (!url || !key) return withRef(response);

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
  return withRef(response);
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|opengraph-image|brand/|videos/|voices/|media/|api/stripe/|api/admin/).*)"],
};
