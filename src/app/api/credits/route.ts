import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { creditPacks } from "@/lib/pricing";
import { createCreditCheckout, siteOrigin, stripeEnabled } from "@/lib/stripe";
import { getDictionary } from "@/lib/i18n/server";
import { attributionMetadata, readAttribution } from "@/lib/tracking";

export const runtime = "nodejs";

/** Comprar un paquete de manifestaciones: abre Stripe Checkout. */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  if (!stripeEnabled()) return NextResponse.json({ error: "payments_off" }, { status: 409 });
  const body = z.object({ qty: z.number().int().positive() }).safeParse(await request.json().catch(() => ({})));
  const pack = body.success ? creditPacks().find((p) => p.qty === body.data.qty) : undefined;
  if (!pack) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { locale } = await getDictionary();
  const session = await createCreditCheckout({
    userId: who.user.id,
    qty: pack.qty,
    priceCents: Math.round(pack.priceUsd * 100),
    productName: `ManifestLifeAI · ${pack.qty} ${locale === "es" ? (pack.qty === 1 ? "manifestación" : "manifestaciones") : pack.qty === 1 ? "manifestation" : "manifestations"}`,
    locale,
    origin: siteOrigin(request),
    extraMetadata: attributionMetadata(await readAttribution()),
  });
  return NextResponse.json({ url: session.url });
}
