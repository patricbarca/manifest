import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Almacenamiento del MVP: disco local bajo /public.
 *
 * Es deliberadamente lo mas tonto posible y esta aislado en un solo fichero
 * para que el salto a S3 o Supabase Storage sea cambiar estas dos funciones.
 * En produccion los assets NO deben ser publicos por URL adivinable: llevan la
 * cara del usuario.
 */

export async function persistBuffer(
  data: Buffer | Uint8Array,
  projectId: string,
  filename: string,
): Promise<string> {
  const rel = path.join("generated", projectId, filename);
  const abs = path.join(process.cwd(), "public", rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, data);
  return "/" + rel.split(path.sep).join("/");
}

export async function persistRemoteAsset(
  remoteUrl: string,
  projectId: string,
  filename: string,
): Promise<string> {
  const res = await fetch(remoteUrl);
  if (!res.ok) throw new Error(`No se pudo descargar el asset: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return persistBuffer(buf, projectId, filename);
}
