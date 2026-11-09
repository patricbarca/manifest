import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { manifests } from "@/lib/manifest/store";
import { PAYMENTS_ENABLED } from "@/lib/pricing";
import { enqueueManifestation } from "@/lib/queue";

export const runtime = "nodejs";

/**
 * Editar escena, paso 2: anima la imagen nueva y sustituye a la animación
 * actual. Cuesta 1 manifestación por edición (cobrada al pedir la primera imagen). Si falla, se
 * devuelve y se queda la versión anterior.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const m = await manifests.get(id);
  if (!m || m.ownerId !== who.user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (m.status !== "ready") return NextResponse.json({ error: "busy" }, { status: 409 });
  if (!m.draftImageUrl) return NextResponse.json({ error: "no_image" }, { status: 409 });
  const user = (await db.getUser(who.user.id)) ?? who.user;
  // La edición se paga al pedir la primera imagen; si por lo que sea aún no está pagada, se cobra aquí.
  const charge = PAYMENTS_ENABLED && !m.editPaid;
  if (charge) {
    if ((user.credits ?? 0) < 1) return NextResponse.json({ error: "credits" }, { status: 402 });
    await db.putUser({ ...user, credits: (user.credits ?? 0) - 1 });
  }
  const paid = PAYMENTS_ENABLED && (charge || !!m.editPaid);
  const next = await manifests.patch(id, (cur) => ({
    ...cur,
    status: "queued",
    animateOnly: true,
    attempts: 0,
    error: undefined,
    // Si la animación falla, refundCredit devuelve la manifestación.
    paidCredit: paid || undefined,
    editPaid: paid || undefined,
  }));
  enqueueManifestation(id);
  return NextResponse.json({ manifestation: next });
}
