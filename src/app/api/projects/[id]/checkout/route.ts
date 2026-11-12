import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { currentUser } from "@/lib/db/session";
import { getDictionary } from "@/lib/i18n/server";
import { createCheckout, siteOrigin, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Volver a pagar un vídeo que se quedó en borrador (cerró el pago o caducó).
 * Abre una sesión nueva de Stripe por el mismo importe que al crearlo.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const project = await db.getProject(id);
  if (!project || project.ownerId !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (project.status !== "draft" || !project.checkoutCents || !stripeEnabled()) {
    return NextResponse.json({ error: "not_payable" }, { status: 409 });
  }
  const { t, locale } = await getDictionary();
  try {
    const session = await createCheckout({
      projectId: project.id,
      priceCents: project.checkoutCents,
      productName: `ManifestLifeAI · ${t.products[project.tier].name}`,
      locale,
      origin: siteOrigin(request),
    });
    await db.patchProject(id, (p) => ({ ...p, stripeSessionId: session.id }));
    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("[stripe]", err);
    return NextResponse.json({ error: t.errors.paymentFailed }, { status: 502 });
  }
}
