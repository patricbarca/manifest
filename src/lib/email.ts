import type { Locale } from "./i18n/locale";

/**
 * Emails con Resend (API REST). Se activa con RESEND_API_KEY y EMAIL_FROM
 * (p. ej. "ManifestLifeAI <hola@tudominio.com>", con el dominio verificado en Resend).
 */
export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

function escape(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Avisa de que el vídeo está listo. Nunca rompe el pipeline si falla. */
export async function sendVideoReady(opts: { to: string; locale: Locale; title: string; url: string }): Promise<void> {
  if (!emailEnabled() || !opts.to) return;
  const es = opts.locale === "es";
  const subject = es ? "Tu vídeo está listo ✨" : "Your video is ready ✨";
  const html = `<!doctype html><html><body style="margin:0;background:#0e0b14;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fff">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;text-align:center">
    <p style="font-size:15px;color:#d8cfe0;margin:0 0 8px">ManifestLifeAI</p>
    <h1 style="font-size:26px;font-weight:600;margin:0 0 16px">${es ? "Tu vídeo está listo" : "Your video is ready"}</h1>
    <p style="font-size:16px;line-height:1.5;color:#cfc6d8;margin:0 0 28px">«${escape(opts.title)}»<br>${
      es ? "Míralo cada día, mejor a la misma hora." : "Watch it every day, ideally at the same time."
    }</p>
    <a href="${opts.url}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600">${
      es ? "Ver mi vídeo" : "Watch my video"
    }</a>
  </div></body></html>`;
  try {
    await send(opts.to, subject, html);
  } catch (err) {
    console.error("[email]", err);
  }
}
