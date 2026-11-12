import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { verifyUnsubscribe } from "@/lib/unsubscribe";

export const runtime = "nodejs";

/** Quita el permiso de emails de novedades. Los emails del servicio (vídeo listo, recordatorios) no cambian. */
async function unsubscribe(request: Request): Promise<boolean> {
  const url = new URL(request.url);
  const id = url.searchParams.get("u") ?? "";
  if (!verifyUnsubscribe(id, url.searchParams.get("t") ?? "")) return false;
  const user = await db.getUser(id);
  if (user?.marketing) await db.putUser({ ...user, marketing: undefined });
  return !!user;
}

function page(ok: boolean, es: boolean): NextResponse {
  const msg = ok
    ? es ? "Listo: ya no recibirás emails de novedades ni ofertas." : "Done: you won't receive tips or offers by email anymore."
    : es ? "Este enlace no es válido. Puedes cambiarlo en Ajustes." : "This link isn't valid. You can change it in Settings.";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ManifestLifeAI</title></head>
<body style="margin:0;background:#0e0b14;color:#fff;font-family:-apple-system,Segoe UI,Roboto,sans-serif">
<div style="max-width:420px;margin:0 auto;padding:64px 24px;text-align:center"><p style="font-size:15px;font-weight:600;color:#d8cfe0">ManifestLifeAI</p>
<p style="font-size:17px;line-height:1.5">${msg}</p><p><a href="/settings" style="color:#cfc6d8">${es ? "Ajustes" : "Settings"}</a></p></div></body></html>`;
  return new NextResponse(html, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

/** Clic en el enlace del pie del email. */
export async function GET(request: Request) {
  const es = (request.headers.get("accept-language") ?? "").toLowerCase().startsWith("es");
  return page(await unsubscribe(request), es);
}

/** Baja con un clic desde el gestor de correo (List-Unsubscribe-Post, RFC 8058). */
export async function POST(request: Request) {
  return (await unsubscribe(request)) ? new NextResponse(null, { status: 200 }) : new NextResponse(null, { status: 400 });
}
