import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { packsFor, upsellPack } from "@/lib/pricing";
import { db } from "@/lib/db/store";
import { manifests } from "@/lib/manifest/store";
import { upsellEligible } from "@/lib/wallet";
import { createCreditCheckout, siteOrigin, stripeEnabled } from "@/lib/stripe";
import { getDictionary } from "@/lib/i18n/server";
import { attributionMetadata, readAttribution } from "@/lib/tracking";

export const runtime = "nodejs";

/** Comprar un paquete de manifestaciones: abre Stripe Checkout. */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  if (!stripeEnabled()) return NextResponse.json({ error: "payments_off" }, { status: 409 });
  const body = z
    .object({ qty: z.number().int().positive(), kind: z.enum(["wishes", "stills", "elevated"]).default("wishes"), upsell: z.boolean().optional() })
    .safeParse(await request.json().catch(() => ({})));
  const kind = body.success ? body.data.kind : "wishes";
  let pack = body.success ? packsFor(kind).find((p) => p.qty === body.data.qty) : undefined;
  let upsell = false;
  if (body.success && body.data.upsell && kind === "wishes") {
    const user = (await db.getUser(who.user.id)) ?? who.user;
    const offer = upsellPack();
    if (offer && offer.qty === body.data.qty && upsellEligible(user, await manifests.list(user.id))) {
      pack = offer;
      upsell = true;
    } else pack = undefined;
  }
  if (!pack) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { locale } = await getDictionary();
  const session = await createCreditCheckout({
    userId: who.user.id,
    qty: pack.qty,
    kind,
    priceCents: Math.round(pack.priceUsd * 100),
    productName: `ManifestLifeAI · ${pack.qty} ${
      kind === "elevated"
        ? locale === "es" ? (pack.qty === 1 ? "escena Elevada (2 deseos)" : `escenas Elevadas (${pack.qty * 2} deseos)`) : pack.qty === 1 ? "Elevated scene (2 wishes)" : `Elevated scenes (${pack.qty * 2} wishes)`
        : kind === "stills"
        ? locale === "es" ? (pack.qty === 1 ? "foto con movimiento" : "fotos con movimiento") : pack.qty === 1 ? "photo in motion" : "photos in motion"
        : locale === "es" ? (pack.qty === 1 ? "deseo" : "deseos") : pack.qty === 1 ? "wish" : "wishes"
    }`,
    locale,
    origin: siteOrigin(request),
    extraMetadata: { ...attributionMetadata(await readAttribution()), ...(upsell ? { "metadata[upsell]": "1" } : {}) },
  });
  return NextResponse.json({ url: session.url });
}
