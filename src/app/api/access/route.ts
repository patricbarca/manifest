import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessCodeMatches } from "@/lib/access";

export const runtime = "nodejs";

/** Enlace de invitación: guarda el código en una cookie y lleva a crear. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
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
