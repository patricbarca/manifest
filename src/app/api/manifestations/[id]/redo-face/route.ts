import { NextResponse } from "next/server";
import { costOf, spend } from "@/lib/wallet";
import { allowFor } from "@/lib/rate-limit";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { manifests } from "@/lib/manifest/store";
import { livePhotos } from "@/lib/manifest/photos";
import { selfieSetStatus } from "@/lib/manifest/selfie-set";
import { PAYMENTS_ENABLED } from "@/lib/pricing";
import { enqueueManifestation } from "@/lib/queue";

export const runtime = "nodejs";

/**
 * Rehacer con sus selfies nuevas: misma escena y frase (y su voz), imagen y
 * animación nuevas con las selfies que tiene guardadas ahora. La primera vez
 * por manifestación es gratis; después cuesta lo mismo que crearla. Si falla,
 * se queda la versión anterior y se devuelve lo pagado (o la vez gratis).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const m = await manifests.get(id);
  if (!m || m.ownerId !== who.user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (m.status !== "ready" || !m.brief) return NextResponse.json({ error: "busy" }, { status: 409 });
  // Con una edición de escena a medias (imagen nueva sin animar), primero hay que terminarla o descartarla.
  if (m.draftImageUrl) return NextResponse.json({ error: "draft" }, { status: 409 });
  if (!allowFor("redoFace", who.user.id)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const user = (await db.getUser(who.user.id)) ?? who.user;
  const photos = await livePhotos(user);
  if (!photos.length) return NextResponse.json({ error: "photos" }, { status: 409 });
  const selfies = selfieSetStatus(user, photos);
  if (!selfies.ok) return NextResponse.json({ error: "photos_incomplete", missing: selfies.missing }, { status: 409 });

  // La primera vez es gratis; las siguientes, lo mismo que crearla.
  const charge = PAYMENTS_ENABLED && (m.faceRedos ?? 0) >= 1;
  const cost = costOf(m.quality);
  if (charge && !(await spend(user.id, cost))) return NextResponse.json({ error: "credits", kind: cost.field === "stillCredits" ? "stills" : "wishes", need: cost.n }, { status: 402 });

  const next = await manifests.patch(id, (cur) => ({
    ...cur,
    status: "queued",
    faceRedo: true,
    photoUrls: photos,
    // Si falla, se vuelven a poner las selfies con las que se hizo la versión que se queda.
    prevPhotoUrls: cur.photoUrls,
    attempts: 0,
    error: undefined,
    faceRedos: (cur.faceRedos ?? 0) + 1,
    // Si falla, refundCredit devuelve lo pagado.
    paidCredit: charge || undefined,
  }));
  enqueueManifestation(id);
  return NextResponse.json({ manifestation: next });
}
