import { readFile } from "node:fs/promises";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Almacenamiento de vídeos en un bucket S3 (Railway Buckets).
 *
 * El bucket es privado: nunca se enlaza directo. La app sigue usando sus
 * URLs /media/...; la ruta comprueba que el fichero es del usuario y le
 * redirige a un enlace firmado que caduca. Sin variables S3_* todo se queda
 * en el disco, como antes.
 */

export function objectStorageEnabled(): boolean {
  return !!(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

let client: S3Client | undefined;
function s3(): S3Client {
  client ??= new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || "auto",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    // Railway usa URLs virtual-hosted; S3_FORCE_PATH_STYLE=true para buckets antiguos.
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
  return client;
}

const BUCKET = () => process.env.S3_BUCKET!;

export async function putFile(key: string, absPath: string, contentType: string): Promise<void> {
  await s3().send(
    new PutObjectCommand({ Bucket: BUCKET(), Key: key, Body: await readFile(absPath), ContentType: contentType }),
  );
}

/** Enlace temporal para ver un fichero (1 h por defecto). */
export async function signedUrl(key: string, seconds = 3600): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: BUCKET(), Key: key }), { expiresIn: seconds });
}

/** Borra todo lo que cuelga de un prefijo (p. ej. generated/<id>/). */
export async function deletePrefix(prefix: string): Promise<void> {
  let token: string | undefined;
  do {
    const page = await s3().send(new ListObjectsV2Command({ Bucket: BUCKET(), Prefix: prefix, ContinuationToken: token }));
    const keys = (page.Contents ?? []).map((o) => ({ Key: o.Key! }));
    if (keys.length) await s3().send(new DeleteObjectsCommand({ Bucket: BUCKET(), Delete: { Objects: keys } }));
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
}

/** Comprueba que el bucket responde (para /api/health?deep=1). */
export async function pingBucket(): Promise<boolean> {
  try {
    await s3().send(new ListObjectsV2Command({ Bucket: BUCKET(), MaxKeys: 1 }));
    return true;
  } catch (err) {
    console.error("[bucket] ping", err);
    return false;
  }
}

/**
 * Prueba de punta a punta del enlace firmado: sube un fichero mínimo, firma
 * su URL y la descarga como lo haría el navegador. Devuelve el estado HTTP y,
 * si falla, el código de error del bucket (p. ej. SignatureDoesNotMatch).
 */
export async function probeSignedUrl(): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const key = "health/probe.txt";
    await s3().send(new PutObjectCommand({ Bucket: BUCKET(), Key: key, Body: "ok", ContentType: "text/plain" }));
    const url = await signedUrl(key, 120);
    const res = await fetch(url);
    const body = await res.text();
    return { ok: res.ok && body === "ok", status: res.status, error: res.ok ? undefined : body.match(/<Code>([^<]+)<\/Code>/)?.[1] ?? body.slice(0, 80) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 120) : "error" };
  }
}

/**
 * Lee un fichero del bucket y lo devuelve como stream, respetando `Range`
 * (Safari no reproduce vídeo sin respuestas 206). Así el navegador nunca
 * sale de nuestro dominio. Devuelve null si no existe.
 */
export async function getObjectStream(
  key: string,
  range?: string | null,
): Promise<{ body: ReadableStream; status: 200 | 206; length?: number; contentRange?: string; contentType?: string } | null> {
  try {
    const out = await s3().send(new GetObjectCommand({ Bucket: BUCKET(), Key: key, ...(range ? { Range: range } : {}) }));
    if (!out.Body) return null;
    return {
      body: out.Body.transformToWebStream(),
      status: out.ContentRange ? 206 : 200,
      length: out.ContentLength,
      contentRange: out.ContentRange,
      contentType: out.ContentType,
    };
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw err;
  }
}
