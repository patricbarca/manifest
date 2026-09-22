import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { mediaPath, mediaUrl } from "../paths";

/**
 * Almacenamiento de los ficheros que genera la app.
 *
 * Escribe bajo DATA_DIR (ver lib/paths.ts) y devuelve una URL `/media/...`,
 * que es la que sirve la ruta con control de propiedad. Todo el acceso a
 * disco para media pasa por aquí, así que migrar a Supabase Storage o R2 es
 * reimplementar estas dos funciones.
 */

export async function persistBuffer(
  data: Buffer | Uint8Array | string,
  projectId: string,
  filename: string,
): Promise<string> {
  const abs = mediaPath("generated", projectId, filename);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, data);
  return mediaUrl("generated", projectId, filename);
}

export async function persistRemoteAsset(
  remoteUrl: string,
  projectId: string,
  filename: string,
): Promise<string> {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`No se pudo descargar el asset: ${res.status}`);
  return persistBuffer(Buffer.from(await res.arrayBuffer()), projectId, filename);
}

/**
 * Lee un fichero local y lo devuelve como data URI.
 *
 * Es así y no pasando la URL por dos razones. La obvia: los ficheros de
 * `/media` exigen la cookie del dueño, y fal no la tiene. La importante: si
 * el proveedor tuviera que descargarse la imagen de nuestra URL, la app
 * tendría que ser alcanzable desde internet para poder generar nada — lo que
 * rompe en local, detrás de un firewall, y en cualquier despliegue antes de
 * que el dominio apunte. Leyendo de disco, generar no depende de la red
 * entrante.
 */
export async function fileToDataUri(absPath: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const buf = await readFile(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const mime =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".svg"
          ? "image/svg+xml"
          : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
}
