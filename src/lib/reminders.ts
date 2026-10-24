import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db/store";
import { emailEnabled, sendDailyReminder, sendMonthlyCheckin } from "./email";
import { currentStreak, localDay, localHour } from "./practice";

/**
 * AVISOS A SOCIOS
 *
 * Una vez al día, a las REMINDER_HOUR (9 por defecto) de su hora local:
 *  - si hace 30 días o más de su último vídeo y no se le ha avisado por él:
 *    revisión mensual ("¿qué ha cambiado?" → siguiente capítulo);
 *  - si no, y hoy aún no lo ha visto: recordatorio para no romper la racha.
 *
 * Corre dentro del servidor (instrumentation.ts) cada 20 minutos. Hace falta
 * RESEND_API_KEY, EMAIL_FROM, SITE_URL y EMAIL_LINK_SECRET (firma el enlace de baja).
 */

const CHECKIN_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

export function remindersEnabled(): boolean {
  return emailEnabled() && !!process.env.EMAIL_LINK_SECRET && !!process.env.SITE_URL;
}

function token(userId: string): string {
  return createHmac("sha256", process.env.EMAIL_LINK_SECRET ?? "").update(`off:${userId}`).digest("hex").slice(0, 32);
}

export function unsubscribeUrl(userId: string): string {
  return `${process.env.SITE_URL}/api/reminders/off?u=${encodeURIComponent(userId)}&k=${token(userId)}`;
}

export function validUnsubscribe(userId: string, key: string): boolean {
  if (!process.env.EMAIL_LINK_SECRET) return false;
  const a = Buffer.from(token(userId));
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function runPracticeJobs(now = Date.now()): Promise<{ reminders: number; checkins: number }> {
  const out = { reminders: 0, checkins: 0 };
  if (!remindersEnabled()) return out;
  const hour = Number(process.env.REMINDER_HOUR ?? 9);
  const site = process.env.SITE_URL;

  for (const user of await db.listActiveMembers()) {
    const p = user.practice;
    if (!user.email || p?.remindersOff) continue;
    const tz = p?.tzOffsetMin ?? 0;
    if (localHour(now, tz) !== hour) continue;
    const today = localDay(now, tz);

    const ready = (await db.listProjects(user.id))
      .filter((pr) => pr.status === "ready")
      .sort((a, b) => b.createdAt - a.createdAt);
    const latest = ready[0];
    if (!latest) continue;

    const checkinDue = now - latest.createdAt >= CHECKIN_AFTER_MS && p?.checkinSentFor !== latest.id;
    const reminderDue = p?.lastDay !== today && p?.lastReminderDay !== today;
    if (!checkinDue && !reminderDue) continue;

    // Se apunta antes de enviar: si dos procesos coinciden, solo uno manda.
    let claimed = false;
    await db.patchUser(user.id, (u) => {
      const cur = u.practice ?? { lastDay: "", streak: 0, best: 0, totalDays: 0 };
      if (checkinDue) {
        if (cur.checkinSentFor === latest.id) return u;
        claimed = true;
        return { ...u, practice: { ...cur, checkinSentFor: latest.id, lastReminderDay: today } };
      }
      if (cur.lastReminderDay === today) return u;
      claimed = true;
      return { ...u, practice: { ...cur, lastReminderDay: today } };
    });
    if (!claimed) continue;

    if (checkinDue) {
      const sent = await sendMonthlyCheckin({
        to: user.email,
        locale: latest.locale,
        title: latest.title,
        url: `${site}/crear?continuar=${latest.id}`,
        unsubscribeUrl: unsubscribeUrl(user.id),
      });
      if (sent) out.checkins++;
    } else {
      const sent = await sendDailyReminder({
        to: user.email,
        locale: latest.locale,
        streak: currentStreak(p, now),
        url: `${site}/video/${latest.id}`,
        unsubscribeUrl: unsubscribeUrl(user.id),
      });
      if (sent) out.reminders++;
    }
  }
  return out;
}
