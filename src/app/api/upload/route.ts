import { isSignedIn } from "@/lib/db/session";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { photoLooksUnsafe } from "@/lib/photo-safety";
import { assessSelfie, SELFIE_MIN_SCORE } from "@/lib/selfie-check";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/db/session";
import { mediaPath, mediaUrl } from "@/lib/paths";
import { getDictionary } from "@/lib/i18n/server";
import { sweepStorage } from "@/lib/cleanup";
import { db } from "@/lib/db/store";

/** Cambia si cambia el texto del consentimiento de fotos (para volver a pedirlo y saber cuál aceptó). */
const PHOTO_CONSENT_VERSION = "2026-10-26";

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
  if (!(await isSignedIn())) {
    const { t } = await getDictionary();
    return NextResponse.json({ error: t.errors.signInRequired }, { status: 401 });
  }
  // Cualquier subida es buen momento para borrar fotos caducadas (como mucho una vez por hora).
  void sweepStorage();
  const user = await currentUser();
  const { t } = await getDictionary();
  const form = await request.formData();
  const file = form.get("selfie");
  const consent = form.get("consent");
  const biometric = form.get("biometric");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: t.errors.noFile }, { status: 400 });
  }
  if (consent !== "true" || biometric !== "true") {
    return NextResponse.json(
      { error: t.errors.noConsent },
      { status: 400 },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: t.errors.badFormat },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: t.errors.tooBig }, { status: 413 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  // El id del dueño va en el nombre: es lo que luego deja a /media comprobar
  // de quién es la foto sin tener que guardar una tabla aparte.
  const name = `${user.id}_${Date.now().toString(36)}_${randomBytes(8).toString("hex")}.${ext}`;
  const abs = mediaPath("uploads", name);

  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));
  if (await photoLooksUnsafe(abs)) {
    await rm(abs, { force: true });
    return NextResponse.json({ error: t.errors.photoUnsafe }, { status: 422 });
  }
  // Sus selfies pasan el pre-análisis: una mala referencia deforma la cara en todas las escenas.
  const self = form.get("kind") === "self";
  // El hueco 4 (índice 3) es de medio cuerpo: ahí la cara puede salir más pequeña.
  // Si la hizo el escáner, el detector del móvil ya comprobó que hay una sola cara.
  const quality = self
    ? await assessSelfie(abs, form.get("slot") === "3" ? "body" : "face", { oneFace: form.get("scan") === "1" })
    : null;
  if (quality && quality.score < SELFIE_MIN_SCORE) {
    await rm(abs, { force: true });
    const tips = quality.issues.map((i) => t.selfieIssues[i]).filter(Boolean);
    return NextResponse.json(
      { error: [t.selfieRejected, ...tips].join(" "), code: "selfie_quality", quality },
      { status: 422 },
    );
  }
  // Registro del consentimiento expreso (fecha y versión del texto), la primera vez.
  // Sus propias fotos se recuerdan (las 4 últimas) para crear más manifestaciones
  // sin volver a subirlas, mientras existan (se borran a los 30 días).
  const url = mediaUrl("uploads", name);
  if (self || !user.photoConsent || user.photoConsent.version !== PHOTO_CONSENT_VERSION) {
    await db.putUser({
      ...user,
      photoConsent: { at: Date.now(), version: PHOTO_CONSENT_VERSION },
      ...(self ? { photoUrls: [...(user.photoUrls ?? []), url].slice(-4) } : {}),
    });
  }

  // Aceptada pero mejorable: se avisa con los motivos.
  const warning =
    quality && quality.score < 7 && quality.issues.length
      ? [t.selfieWeak, ...quality.issues.map((i) => t.selfieIssues[i]).filter(Boolean)].join(" ")
      : undefined;
  return NextResponse.json({ url: mediaUrl("uploads", name), quality, warning });
}
