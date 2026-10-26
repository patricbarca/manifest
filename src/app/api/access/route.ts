import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessCodeMatches } from "@/lib/access";

export const runtime = "nodejs";

/** Enlace de invitación: guarda el código en una cookie y lleva a crear. */
// Intentos fallidos por IP: frena que alguien pruebe códigos a fuerza bruta.
const FAILS = new Map<string, { n: number; since: number }>();
const MAX_FAILS = 10;
const WINDOW_MS = 60 * 60 * 1000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "?";
  const now = Date.now();
  const f = FAILS.get(ip);
  if (f && now - f.since < WINDOW_MS && f.n >= MAX_FAILS) {
    return new NextResponse("Too many attempts", { status: 429 });
  }
  const code = url.searchParams.get("code");
  if (!accessCodeMatches(code)) {
    const cur = f && now - f.since < WINDOW_MS ? f : { n: 0, since: now };
    FAILS.set(ip, { ...cur, n: cur.n + 1 });
    if (FAILS.size > 10_000) FAILS.clear();
  }
  // Detrás del proxy de Railway, request.url puede traer el host interno.
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const dest = new URL(accessCodeMatches(code) ? "/crear" : "/", `${proto}://${host}`);
  const res = NextResponse.redirect(dest);
  if (accessCodeMatches(code)) {
    res.cookies.set(ACCESS_COOKIE, code!, {
      httpOnly: true,
      sameSite: "lax",
      secure: proto === "https",
      maxAge: 60 * 60 * 24 * 180,
    });
  }
  return res;
}
