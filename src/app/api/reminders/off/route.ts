import { db } from "@/lib/db/store";
import { validUnsubscribe } from "@/lib/reminders";

export const runtime = "nodejs";

/** Baja de los avisos con un clic, desde el enlace firmado del email. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("u") ?? "";
  const key = url.searchParams.get("k") ?? "";
  const ok = !!userId && validUnsubscribe(userId, key);
  if (ok) {
    await db.patchUser(userId, (u) => ({
      ...u,
      practice: { ...(u.practice ?? { lastDay: "", streak: 0, best: 0, totalDays: 0 }), remindersOff: true },
    }));
  }
  const msg = ok
    ? "Listo: no te mandaremos más recordatorios. · Done: no more reminders."
    : "Enlace no válido. · Invalid link.";
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;background:#0e0b14;color:#fff;font-family:-apple-system,Segoe UI,Roboto,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center"><p>${msg}</p></body>`,
    { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
