import { db } from "../db/store";
import { getDictionary } from "../i18n/server";
import type { User } from "../types";

/** Guarda la zona horaria y el idioma de la persona (para los recordatorios). */
export async function rememberTz(user: User, tz: string | undefined): Promise<void> {
  if (!tz) return;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    return;
  }
  const { locale } = await getDictionary();
  if (user.tz === tz && user.locale === locale) return;
  const fresh = (await db.getUser(user.id)) ?? user;
  await db.putUser({ ...fresh, tz, locale });
}
