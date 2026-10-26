import { db } from "./db/store";
import { emailEnabled, sendStreakReminder } from "./email";
import { localDay, statsFrom } from "./social/aura";
import { social } from "./social/store";

/** Hora local a la que se recuerda (19:00). */
const REMIND_HOUR = 19;

function localHour(tz: string): number {
  try {
    return Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(new Date()));
  } catch {
    return -1;
  }
}

/**
 * Una vez por hora: a quien tiene racha y hoy (en su zona) aún no ha visto
 * su vídeo, se le manda un email a las 19:00 locales. Como mucho uno al día.
 */
export async function runReminders(): Promise<void> {
  if (!emailEnabled()) return;
  const site = process.env.SITE_URL ?? "";
  for (const user of await db.listUsers()) {
    if (user.reminders === false || !user.tz || localHour(user.tz) !== REMIND_HOUR) continue;
    const today = localDay(user.tz);
    if (user.lastReminder === today) continue;
    const stats = statsFrom(await social.listViews(user.id), today);
    if (stats.streak < 1 || stats.viewedToday.length > 0) continue;
    const sent = await sendStreakReminder({
      to: user.email,
      locale: user.locale === "es" ? "es" : "en",
      streak: stats.streak,
      url: `${site}/perfil?tab=today`,
      settingsUrl: `${site}/perfil/editar`,
    });
    if (sent) await db.putUser({ ...user, lastReminder: today });
  }
}
