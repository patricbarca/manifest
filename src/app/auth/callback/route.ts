import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { linkAnonymousData } from "@/lib/db/session";
import { requestOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

/** Vuelta del enlace del email o de Google: abre la sesión y vuelve a donde estaba. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = requestOrigin(request);
  const next = safeNext(url.searchParams.get("next"));
  const sb = await supabaseServer();
  if (!sb) return NextResponse.redirect(`${origin}/`);

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  // Con código del email o de Google se abre la sesión aquí; si ya entró con
  // el código de 6 dígitos, la sesión ya viene en las cookies.
  const { error } = code
    ? await sb.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await sb.auth.verifyOtp({ token_hash: tokenHash, type })
      : (await sb.auth.getUser()).data.user
        ? { error: null }
        : { error: new Error("no session") };

  if (error) return NextResponse.redirect(`${origin}/entrar?error=1&next=${encodeURIComponent(next)}`);
  await linkAnonymousData();
  return NextResponse.redirect(`${origin}${next}`);
}

/** Solo rutas internas: evita redirigir a otra web. */
function safeNext(n: string | null): string {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/biblioteca";
}
