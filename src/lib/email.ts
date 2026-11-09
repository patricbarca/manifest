import type { Locale } from "./i18n/locale";
import { appBase } from "./hosts";

/**
 * Emails con Resend (API REST). Se activa con RESEND_API_KEY y EMAIL_FROM
 * (p. ej. "ManifestLifeAI <hola@tudominio.com>", con el dominio verificado en Resend).
 */
export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

/** Imagen incrustada en el email (se cita en el HTML como `cid:<contentId>`). */
type Inline = { content: Buffer; filename: string; contentId: string };

async function send(to: string, subject: string, html: string, inline: Inline[] = []): Promise<void> {
  const attachments = inline.map((a) => ({ content: a.content.toString("base64"), filename: a.filename, content_id: a.contentId }));
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html, ...(attachments.length ? { attachments } : {}) }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

/** Cabecera con el logo (PNG público: Gmail no muestra SVG). Sin dirección de la web, solo el nombre. */
function brandHeader(): string {
  const base = appBase();
  const logo = base
    ? `<img src="${base}/brand/icon-192.png" width="44" height="44" alt="" style="display:block;margin:0 auto 10px;border-radius:12px">`
    : "";
  return `${logo}<p style="font-size:15px;font-weight:600;letter-spacing:.2px;color:#d8cfe0;margin:0 0 8px">ManifestLifeAI</p>`;
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
    ${brandHeader()}
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

/**
 * Confirmación del pedido en soporte duradero (UE): qué compró, cuánto pagó y
 * que pidió generar ya aceptando perder el desistimiento de 14 días.
 */
export async function sendOrderConfirmation(opts: {
  to: string;
  locale: Locale;
  title: string;
  amountCents: number;
  currency: string;
  waiverAt?: number;
  url: string;
}): Promise<void> {
  if (!emailEnabled() || !opts.to) return;
  const es = opts.locale === "es";
  const amount = new Intl.NumberFormat(es ? "es-ES" : "en-US", { style: "currency", currency: opts.currency.toUpperCase() }).format(opts.amountCents / 100);
  const when = opts.waiverAt ? new Date(opts.waiverAt).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "";
  const subject = es ? "Confirmación de tu pedido" : "Your order confirmation";
  const html = `<!doctype html><html><body style="margin:0;background:#0e0b14;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fff">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px">
    ${brandHeader()}
    <h1 style="font-size:24px;font-weight:600;margin:0 0 16px">${es ? "Gracias por tu pedido" : "Thank you for your order"}</h1>
    <p style="font-size:15px;line-height:1.6;color:#cfc6d8;margin:0 0 16px">
      ${es ? "Vídeo personalizado" : "Personalised video"}: «${escape(opts.title)}»<br>
      ${es ? "Importe" : "Amount"}: ${amount}
    </p>
    <p style="font-size:14px;line-height:1.6;color:#b9b0c4;margin:0 0 24px">${
      es
        ? `Pediste expresamente que el vídeo empezara a generarse de inmediato${when ? ` (${when})` : ""} y aceptaste que, al empezar, pierdes el derecho de desistimiento de 14 días. Si el vídeo falla, te lo rehacemos o te devolvemos el dinero.`
        : `You expressly asked for the video to start generating immediately${when ? ` (${when})` : ""} and acknowledged that, once it starts, you lose the 14-day right of withdrawal. If the video fails, we remake it or refund you.`
    }</p>
    <a href="${opts.url}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">${
      es ? "Ver el estado de mi vídeo" : "See my video's progress"
    }</a>
  </div></body></html>`;
  try {
    await send(opts.to, subject, html);
  } catch (err) {
    console.error("[email]", err);
  }
}

/** Recordatorio de racha: aún no ha visto su vídeo hoy. */
export async function sendStreakReminder(opts: {
  to: string;
  locale: Locale;
  streak: number;
  url: string;
  settingsUrl: string;
  /** Portada de su último vídeo (JPEG) con el botón de play: al tocarla, abre el vídeo. */
  thumb?: Buffer;
}): Promise<boolean> {
  if (!emailEnabled() || !opts.to) return false;
  const es = opts.locale === "es";
  const subject = es ? `Tu racha de ${opts.streak} ${opts.streak === 1 ? "día" : "días"} te espera ✨` : `Your ${opts.streak}-day streak is waiting ✨`;
  // La portada va incrustada en el email (no por URL): lleva su cara y no debe quedar pública.
  const html = (withThumb: boolean) => `<!doctype html><html><body style="margin:0;background:#0e0b14;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#fff">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;text-align:center">
    ${brandHeader()}
    <h1 style="font-size:24px;font-weight:600;margin:0 0 16px">${es ? "Cinco minutos para ti" : "Five minutes for you"}</h1>
    <p style="font-size:16px;line-height:1.5;color:#cfc6d8;margin:0 0 28px">${
      es ? "Hoy aún no has visto tu visualización. Respira, mírate y siente que ya es tuyo." : "You haven't watched your visualization today. Breathe, watch yourself and feel it's already yours."
    }</p>
    ${
      withThumb
        ? `<a href="${opts.url}" style="display:block;margin:0 auto 24px;width:240px"><img src="cid:video-thumb" width="240" alt="${
            es ? "Ver mi vídeo" : "Watch my video"
          }" style="display:block;width:240px;border-radius:16px;border:0"></a>`
        : ""
    }
    <a href="${opts.url}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600">${
      es ? "Ver mi vídeo" : "Watch my video"
    }</a>
    <p style="font-size:12px;color:#8a8194;margin:32px 0 0"><a href="${opts.settingsUrl}" style="color:#8a8194">${
      es ? "Dejar de recibir recordatorios" : "Stop receiving reminders"
    }</a></p>
  </div></body></html>`;
  try {
    if (opts.thumb) {
      try {
        await send(opts.to, subject, html(true), [{ content: opts.thumb, filename: "video.jpg", contentId: "video-thumb" }]);
        return true;
      } catch (err) {
        // Si Resend no acepta la imagen incrustada, el recordatorio sale igual sin ella.
        console.error("[email] portada rechazada, se envía sin ella:", err);
      }
    }
    await send(opts.to, subject, html(false));
    return true;
  } catch (err) {
    console.error("[email]", err);
    return false;
  }
}

/** Aviso interno al administrador (texto plano). */
export async function sendAdminAlert(opts: { to: string; subject: string; text: string }): Promise<void> {
  if (!emailEnabled()) return;
  await send(opts.to, opts.subject, `<p>${escape(opts.text)}</p>`);
}
