import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser, isSignedIn } from "@/lib/db/session";
import { getDictionary } from "@/lib/i18n/server";
import { MEMBERSHIP, isMember } from "@/lib/membership";
import { createMembershipCheckout, siteOrigin, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

const Body = z.object({ plan: z.enum(["monthly", "yearly"]) });

/** Abre Stripe Checkout para hacerse socio. Devuelve la URL a la que ir. */
export async function POST(request: Request) {
  const { t, locale } = await getDictionary();
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: t.errors.signInRequired }, { status: 401 });
  }
  if (!stripeEnabled()) {
    return NextResponse.json({ error: t.errors.paymentsOff }, { status: 503 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: t.errors.incomplete }, { status: 400 });
  }
  const user = await currentUser();
  if (isMember(user)) {
    return NextResponse.json({ error: t.errors.alreadyMember }, { status: 409 });
  }
  const { plan } = parsed.data;
  try {
    const session = await createMembershipCheckout({
      userId: user.id,
      email: user.email,
      plan,
      amountCents: (plan === "yearly" ? MEMBERSHIP.yearlyUsd : MEMBERSHIP.monthlyUsd) * 100,
      productName: `ManifestLifeAI · ${t.membership.name}`,
      locale,
      origin: siteOrigin(request),
      customerId: user.membership?.stripeCustomerId,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe membership]", err);
    return NextResponse.json({ error: t.errors.paymentFailed }, { status: 502 });
  }
}
