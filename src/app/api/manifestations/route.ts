import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { manifests } from "@/lib/manifest/store";
import { checkBlocked, checkDesires } from "@/lib/safety";
import { moderate } from "@/lib/moderation";
import { hasAccess } from "@/lib/access";
import { db } from "@/lib/db/store";
import { PAYMENTS_ENABLED } from "@/lib/pricing";
import { livePhotos } from "@/lib/manifest/photos";
import { newManifestId, shortTitle } from "@/lib/manifest/extract";
import { enqueueManifestation } from "@/lib/queue";
import { VOICE_IDS } from "@/lib/voices";
import type { Manifestation } from "@/lib/types";

export const runtime = "nodejs";

/** Tus manifestaciones (solo las tuyas). */
export async function GET() {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  return NextResponse.json({ manifestations: await manifests.list(who.user.id) });
}

const Patch = z.object({
  id: z.string().startsWith("m_").max(64),
  manifested: z.boolean().optional(),
  onProfile: z.boolean().optional(),
  title: z.string().trim().min(1).max(60).optional(),
});

/** Marcar como cumplida, mostrar en el perfil o renombrar. */
export async function PATCH(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = Patch.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const cur = await manifests.get(body.data.id);
  if (!cur || cur.ownerId !== who.user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (body.data.title && (!checkBlocked(body.data.title).ok || !(await moderate([body.data.title])).ok)) {
    return NextResponse.json({ error: "text_blocked" }, { status: 422 });
  }
  const next = await manifests.patch(cur.id, (m) => ({
    ...m,
    ...(body.data.title ? { title: body.data.title } : {}),
    ...(body.data.onProfile !== undefined ? { onProfile: body.data.onProfile || undefined } : {}),
    ...(body.data.manifested !== undefined ? { manifestedAt: body.data.manifested ? Date.now() : undefined } : {}),
  }));
  return NextResponse.json({ manifestation: next });
}

const Create = z.object({
  desire: z.string().trim().min(3).max(200),
  locale: z.enum(["es", "en"]),
  voice: z.enum(VOICE_IDS).optional(),
  style: z.enum(["cinematic", "editorial", "golden", "minimal", "dream"]).optional(),
  /** Pidió generarla ya y aceptó perder el desistimiento (UE). */
  waiver: z.literal(true),
});

/**
 * Crear UNA manifestación nueva. Gasta un crédito (si los pagos están activos)
 * y usa sus fotos guardadas; si caducaron, hay que volver a subirlas.
 */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  if (!(await hasAccess())) return NextResponse.json({ error: "access" }, { status: 403 });
  const body = Create.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  let verdict = checkDesires([body.data.desire]);
  if (verdict.ok) verdict = await moderate([body.data.desire]);
  if (!verdict.ok) return NextResponse.json({ error: "unsafe", key: verdict.key }, { status: 422 });

  const user = (await db.getUser(who.user.id)) ?? who.user;
  const photos = await livePhotos(user);
  if (!photos.length) return NextResponse.json({ error: "photos" }, { status: 409 });
  if (PAYMENTS_ENABLED) {
    if ((user.credits ?? 0) < 1) return NextResponse.json({ error: "credits" }, { status: 402 });
    await db.putUser({ ...user, credits: (user.credits ?? 0) - 1 });
  }

  const now = Date.now();
  const m: Manifestation = {
    id: newManifestId(),
    ownerId: who.user.id,
    createdAt: now,
    updatedAt: now,
    status: "queued",
    desire: body.data.desire,
    title: shortTitle(body.data.desire),
    locale: body.data.locale,
    voice: body.data.voice,
    style: body.data.style,
    photoUrls: photos,
    paidCredit: PAYMENTS_ENABLED || undefined,
    costCents: 0,
  };
  await manifests.put(m);
  enqueueManifestation(m.id);
  return NextResponse.json({ manifestation: m });
}
