import { en, type Dictionary } from "./en";
import { es } from "./es";
import type { Locale } from "./locale";

/**
 * Parte pura de i18n: la pueden importar componentes de cliente y de
 * servidor. Todo lo que toca cookies vive en `./server`, porque
 * `next/headers` solo existe en el servidor y arrastrarlo aquí rompe el
 * build en cuanto un componente cliente importa un tipo de este módulo.
 */
const DICTIONARIES: Record<Locale, Dictionary> = { en, es };

export function dictionaryFor(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/**
 * Sustituye {marcadores} en una cadena.
 *
 * Hace falta porque muchas frases llevan un número o un precio en medio, y
 * partirlas en trozos para concatenar rompe el orden en cuanto el idioma
 * coloca las palabras de otra forma.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

export type { Dictionary };
export * from "./locale";
