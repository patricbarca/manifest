import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { manifests } from "@/lib/manifest/store";
import { livePhotos } from "@/lib/manifest/photos";
import { checkBlocked } from "@/lib/safety";
import { moderate } from "@/lib/moderation";
import { PAYMENTS_ENABLED } from "@/lib/pricing";
import { enqueueManifestation } from "@/lib/queue";

export const runtime = "nodejs";

/**
 * Rehacer una manifestación (imagen, voz y animación) con un ajuste opcional.
 * Cuesta 1 manifestación del paquete; si falla, se devuelve como al crearla.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = z.object({ note: z.string().trim().max(160).optional() }).safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const m = await manifests.get(id);
  if (!m || m.ownerId !== who.user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (m.status === "queued" || m.status === "generating") return NextResponse.json({ error: "busy" }, { status: 409 });
  const note = body.data.note || undefined;
  if (note && (!checkBlocked(note).ok || !(await moderate([note])).ok)) return NextResponse.json({ error: "text_blocked" }, { status: 422 });

  const user = (await db.getUser(who.user.id)) ?? who.user;
  const photos = await livePhotos(user);
  if (!photos.length) return NextResponse.json({ error: "photos" }, { status: 409 });
  if (PAYMENTS_ENABLED) {
    if ((user.credits ?? 0) < 1) return NextResponse.json({ error: "credits" }, { status: 402 });
    await db.putUser({ ...user, credits: (user.credits ?? 0) - 1 });
  }
  const next = await manifests.patch(id, (cur) => ({
    ...cur,
    status: "queued",
    redoNote: note,
    photoUrls: photos,
    attempts: 0,
    error: undefined,
    paidCredit: PAYMENTS_ENABLED || undefined,
  }));
  enqueueManifestation(id);
  return NextResponse.json({ manifestation: next });
}
