import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sb = await supabaseServer();
  await sb?.auth.signOut();
  const origin = process.env.SITE_URL ?? new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
