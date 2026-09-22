import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/db/session";
import { mediaPath, mediaUrl } from "@/lib/paths";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Subida del selfie.
 *
 * La foto se guarda bajo /public/uploads con un nombre aleatorio. Para el MVP
 * vale; para producción esto va a almacenamiento privado con URLs firmadas y
 * borrado automático, porque es un dato biométrico (ver docs/business-model.md).
 */
export async function POST(request: Request) {
  const user = await currentUser();
  const form = await request.formData();
  const file = form.get("selfie");
  const consent = form.get("consent");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }
  if (consent !== "true") {
    return NextResponse.json(
      { error: "Necesitamos tu confirmación de que la foto es tuya" },
      { status: 400 },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Formato no admitido. Usa JPG, PNG o WebP." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La foto pesa más de 8 MB" }, { status: 413 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  // El id del dueño va en el nombre: es lo que luego deja a /media comprobar
  // de quién es la foto sin tener que guardar una tabla aparte.
  const name = `${user.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const abs = mediaPath("uploads", name);

  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: mediaUrl("uploads", name) });
}
