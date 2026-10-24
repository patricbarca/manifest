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

/** Plantilla común de los avisos: titular, texto, botón y pie con la baja. */
function layout(o: { title: string; body: string; cta: string; url: string; footer: string; unsubscribeUrl?: string; unsubscribe?: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#0e0b14;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fff">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;text-align:center">
    <p style="font-size:15px;color:#d8cfe0;margin:0 0 8px">ManifestLifeAI</p>
    <h1 style="font-size:24px;font-weight:600;margin:0 0 16px">${escape(o.title)}</h1>
    <p style="font-size:16px;line-height:1.5;color:#cfc6d8;margin:0 0 28px">${escape(o.body)}</p>
    <a href="${o.url}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600">${escape(o.cta)}</a>
    <p style="font-size:12px;color:#8a8194;margin:36px 0 0">${escape(o.footer)}${
      o.unsubscribeUrl ? ` · <a href="${o.unsubscribeUrl}" style="color:#8a8194">${escape(o.unsubscribe ?? "")}</a>` : ""
    }</p>
  </div></body></html>`;
}

/** Recordatorio diario de socio: aún no ha visto su vídeo hoy. */
export async function sendDailyReminder(opts: {
  to: string;
  locale: Locale;
  streak: number;
  url: string;
  unsubscribeUrl: string;
}): Promise<boolean> {
  if (!emailEnabled() || !opts.to) return false;
  const es = opts.locale === "es";
  const keep = opts.streak > 1;
  const subject = keep
    ? es ? `No rompas tu racha de ${opts.streak} días` : `Don't break your ${opts.streak}-day streak`
    : es ? "Tu momento de hoy" : "Your moment for today";
  const html = layout({
    title: keep
      ? es ? `${opts.streak} días seguidos` : `${opts.streak} days in a row`
      : es ? "Dos minutos para ti" : "Two minutes for you",
    body: es
      ? "Ponte los auriculares, mira tu vídeo y repite cada frase en voz alta."
      : "Put your headphones on, watch your video and repeat each line out loud.",
    cta: es ? "Ver mi vídeo" : "Watch my video",
    url: opts.url,
    footer: es ? "Te escribimos porque eres socio." : "You're getting this because you're a member.",
    unsubscribeUrl: opts.unsubscribeUrl,
    unsubscribe: es ? "No quiero recordatorios" : "Stop reminders",
  });
  try {
    await send(opts.to, subject, html);
    return true;
  } catch (err) {
    console.error("[email]", err);
    return false;
  }
}

/** Revisión mensual: 30 días desde su último vídeo, toca el siguiente capítulo. */
export async function sendMonthlyCheckin(opts: {
  to: string;
  locale: Locale;
  title: string;
  url: string;
  unsubscribeUrl: string;
}): Promise<boolean> {
  if (!emailEnabled() || !opts.to) return false;
  const es = opts.locale === "es";
  const html = layout({
    title: es ? "¿Qué ha cambiado este mes?" : "What has changed this month?",
    body: es
      ? `Hace 30 días creaste «${opts.title}». Cuéntanos qué ha cambiado y tu siguiente capítulo sigue desde ahí.`
      : `30 days ago you created «${opts.title}». Tell us what has changed and your next chapter picks up from there.`,
    cta: es ? "Crear mi siguiente capítulo" : "Create my next chapter",
    url: opts.url,
    footer: es ? "Te escribimos porque eres socio." : "You're getting this because you're a member.",
    unsubscribeUrl: opts.unsubscribeUrl,
    unsubscribe: es ? "No quiero estos emails" : "Stop these emails",
  });
  try {
    await send(opts.to, es ? "Tu siguiente capítulo" : "Your next chapter", html);
    return true;
  } catch (err) {
    console.error("[email]", err);
    return false;
  }
}
