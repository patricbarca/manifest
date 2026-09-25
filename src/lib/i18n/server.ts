import { cookies } from "next/headers";
import { dictionaryFor, type Dictionary } from "./index";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./locale";

/**
 * Lado servidor de i18n. Separado de `./index` porque importa
 * `next/headers`, que no existe en el cliente.
 */

/** Lee el idioma elegido. Cae al de por defecto si no hay cookie o es basura. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<{ t: Dictionary; locale: Locale }> {
  const locale = await getLocale();
  return { t: dictionaryFor(locale), locale };
}
