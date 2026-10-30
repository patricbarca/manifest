import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { manifests } from "@/lib/manifest/store";
import { livePhotos } from "@/lib/manifest/photos";
import { ensureLocal } from "@/lib/manifest/compose";
import { checkBlocked } from "@/lib/safety";
import { moderate } from "@/lib/moderation";
import { providers } from "@/lib/ai";
import { localPathForMediaUrl } from "@/lib/paths";
import { deleteMediaUrl } from "@/lib/cleanup";
import { PAYMENTS_ENABLED } from "@/lib/pricing";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Cambios de imagen gratis entre una animación y la siguiente (~0,04 $ cada uno). */
const MAX_TRIES = 3;
const working = new Set<string>();

/**
 * Editar escena, paso 1: cambia la imagen guardada según lo que pida
 * ("camisa blanca") manteniendo la escena y su cara. La animación actual no se
 * toca hasta que anime la nueva (paso 2, /animate).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = z.object({ note: z.string().trim().min(2).max(160) }).safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const m = await manifests.get(id);
  if (!m || m.ownerId !== who.user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (m.status !== "ready" || working.has(id)) return NextResponse.json({ error: "busy" }, { status: 409 });
  if ((m.draftTries ?? 0) >= MAX_TRIES) return NextResponse.json({ error: "limit" }, { status: 429 });
  const note = body.data.note;
  if (!checkBlocked(note).ok || !(await moderate([note])).ok) return NextResponse.json({ error: "text_blocked" }, { status: 422 });

  const base = m.draftImageUrl ?? m.imageUrl;
  if (!base || !(await ensureLocal(base))) return NextResponse.json({ error: "no_image" }, { status: 409 });
  const user = (await db.getUser(who.user.id)) ?? who.user;
  const photos = (await livePhotos(user)).map((u) => localPathForMediaUrl(u)).filter((p): p is string => !!p);
  const refs = [localPathForMediaUrl(base)!, ...photos.slice(0, 4)];
  const faces = photos.length ? ` The person keeps exactly the face and likeness of ${photos.length > 1 ? `Figures 2 to ${photos.length + 1}` : "Figure 2"}.` : "";

  // Desde el perfil, editar una escena se paga: 1 manifestación al empezar cubre
  // hasta 3 imágenes y la animación. Las regeneraciones gratis son solo al crear el vídeo.
  const charge = PAYMENTS_ENABLED && !m.editPaid;
  if (charge) {
    if ((user.credits ?? 0) < 1) return NextResponse.json({ error: "credits" }, { status: 402 });
    await db.putUser({ ...user, credits: (user.credits ?? 0) - 1 });
    await manifests.patch(id, (cur) => ({ ...cur, editPaid: true }));
  }

  working.add(id);
  try {
    const image = await providers.image.generate({
      prompt: `Photorealistic high-definition photo. Recreate Figure 1 exactly: same place, composition, framing, pose, expression, lighting and style. Apply only this change requested by the person: ${note}.${faces} Vertical framing, sharp focus on the face`,
      referencePaths: refs,
      projectId: id,
      sceneId: `ed_${Date.now().toString(36)}`,
    });
    // El borrador anterior (si lo había) ya no sirve.
    if (m.draftImageUrl && m.draftImageUrl !== image.result.url) await deleteMediaUrl(m.draftImageUrl);
    const next = await manifests.patch(id, (cur) => ({
      ...cur,
      draftImageUrl: image.result.url,
      draftNote: note,
      draftTries: (cur.draftTries ?? 0) + 1,
      costCents: +((cur.costCents ?? 0) + image.costCents).toFixed(2),
    }));
    return NextResponse.json({ manifestation: next, triesLeft: MAX_TRIES - (next?.draftTries ?? MAX_TRIES) });
  } catch (err) {
    console.error("[edit-image]", id, err);
    // Si falló la primera imagen de una edición recién pagada, se devuelve la manifestación.
    if (charge && !m.draftImageUrl) {
      const fresh = (await db.getUser(who.user.id)) ?? user;
      await db.putUser({ ...fresh, credits: (fresh.credits ?? 0) + 1 });
      await manifests.patch(id, (cur) => ({ ...cur, editPaid: undefined }));
    }
    const blocked = /no permitido|content_policy/i.test(String(err));
    return NextResponse.json({ error: blocked ? "text_blocked" : "failed" }, { status: blocked ? 422 : 502 });
  } finally {
    working.delete(id);
  }
}

/** Descartar la imagen nueva y quedarse con la escena actual. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const m = await manifests.get(id);
  if (!m || m.ownerId !== who.user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (m.status !== "ready") return NextResponse.json({ error: "busy" }, { status: 409 });
  if (m.draftImageUrl) await deleteMediaUrl(m.draftImageUrl);
  // Descartar cierra la edición: la próxima vuelve a empezar (y a pagarse).
  const next = await manifests.patch(id, (cur) => ({ ...cur, draftImageUrl: undefined, draftNote: undefined, draftTries: undefined, editPaid: undefined }));
  return NextResponse.json({ manifestation: next });
}
