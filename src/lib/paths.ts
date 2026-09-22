import path from "node:path";

/**
 * Dónde vive todo lo que la app escribe.
 *
 * Antes estaba repartido en tres sitios: `.data/` para el JSON,
 * `public/uploads/` para los selfies y `public/generated/` para las escenas.
 * Eso tenía dos problemas, y los dos se ven al desplegar:
 *
 *  1. Un contenedor monta UN volumen. Con tres rutas mutables repartidas por
 *     el árbol del proyecto no hay dónde montarlo sin pisar el build.
 *  2. Servir desde `public/` significa que cualquiera con la URL ve la cara
 *     de cualquiera. Son datos biométricos; no pueden estar detrás de una
 *     URL adivinable.
 *
 * Ahora todo cuelga de un único directorio, y los ficheros se sirven por
 * `/media/...`, que comprueba de quién son (ver `app/media/[...path]`).
 */

/** En el contenedor esto es el punto de montaje del volumen (`/data`). */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), ".data");

export type MediaKind = "uploads" | "generated";

/** Los JSON del store. Se va cuando entre Postgres. */
export function dbDir(): string {
  return path.join(DATA_DIR, "db");
}

export function mediaDir(kind: MediaKind): string {
  return path.join(DATA_DIR, kind);
}

/** Ruta en disco de un fichero de media. */
export function mediaPath(kind: MediaKind, ...segments: string[]): string {
  return path.join(mediaDir(kind), ...segments);
}

/** URL con la que el navegador pide ese fichero. */
export function mediaUrl(kind: MediaKind, ...segments: string[]): string {
  return `/media/${kind}/${segments.join("/")}`;
}

/**
 * Traduce segmentos de URL a una ruta en disco, o null si no es legítima.
 *
 * ── Por qué esto es más estricto de lo que parece necesario ──
 *
 * La primera versión solo comprobaba que la ruta resuelta cayera dentro de
 * DATA_DIR. No basta, y se demostró con esto:
 *
 *     /media/generated/<projectId>/..%2f..%2fdb%2fusers.json
 *
 * `%2f` es una barra codificada. Next no la normaliza, así que llega como UN
 * solo segmento; al decodificarlo se convierte en `../../db/users.json`, que
 * resuelve a DATA_DIR/db/users.json — dentro de DATA_DIR. La comprobación
 * pasaba y el servidor entregaba la base de datos de usuarios entera.
 *
 * De ahí las dos capas de ahora:
 *
 *  1. Cada segmento tiene que ser un nombre de fichero pelado. Nada de `..`,
 *     ni barras, ni bytes nulos — ni antes ni después de decodificar.
 *  2. El confinamiento es al subdirectorio del tipo (`uploads/`,
 *     `generated/`), no a DATA_DIR. Así `db/` queda fuera de alcance aunque
 *     algo se escape de la primera capa.
 *
 * Regla general: validar el resultado de resolver, no el texto de entrada.
 */
function isPlainSegment(raw: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null; // codificación rota: fuera
  }
  if (!decoded || decoded === "." || decoded === "..") return null;
  if (decoded.includes("/") || decoded.includes("\\") || decoded.includes("\0")) {
    return null;
  }
  return decoded;
}

export function resolveMediaPath(
  segments: string[],
): { kind: MediaKind; abs: string } | null {
  const [rawKind, ...rest] = segments;
  if (rawKind !== "uploads" && rawKind !== "generated") return null;
  if (rest.length === 0 || rest.length > 3) return null;

  const parts: string[] = [];
  for (const segment of rest) {
    const clean = isPlainSegment(segment);
    if (clean === null) return null;
    parts.push(clean);
  }

  const base = mediaDir(rawKind);
  const abs = path.resolve(base, ...parts);

  // Cinturón y tirantes: aunque los segmentos estén limpios, se comprueba
  // dónde ha caído la ruta resuelta.
  const inside = path.relative(base, abs);
  if (inside.startsWith("..") || path.isAbsolute(inside)) return null;

  return { kind: rawKind, abs };
}

/** Igual, pero partiendo de una URL `/media/...` que generamos nosotros. */
export function localPathForMediaUrl(url: string): string | null {
  const withoutQuery = url.split("?")[0];
  if (!withoutQuery.startsWith("/media/")) return null;
  const segments = withoutQuery.slice("/media/".length).split("/");
  return resolveMediaPath(segments)?.abs ?? null;
}

/** Tipo MIME por extensión, para la cabecera de la respuesta. */
export function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
  };
  return types[ext] ?? "application/octet-stream";
}
