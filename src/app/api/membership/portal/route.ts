import { NextResponse } from "next/server";
import { currentUser, isSignedIn } from "@/lib/db/session";
import { getDictionary } from "@/lib/i18n/server";
import { createPortalSession, siteOrigin, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/** Portal de Stripe: cambiar tarjeta, pasar a anual o cancelar. */
export async function POST(request: Request) {
  const { t } = await getDictionary();
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: t.errors.signInRequired }, { status: 401 });
  }
  if (!stripeEnabled()) {
    return NextResponse.json({ error: t.errors.paymentsOff }, { status: 503 });
  }
  const user = await currentUser();
  const customer = user.membership?.stripeCustomerId;
  if (!customer) {
    return NextResponse.json({ error: t.errors.notMember }, { status: 404 });
  }
  try {
    const url = await createPortalSession(customer, `${siteOrigin(request)}/biblioteca`);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[stripe portal]", err);
    return NextResponse.json({ error: t.errors.paymentFailed }, { status: 502 });
  }
}
