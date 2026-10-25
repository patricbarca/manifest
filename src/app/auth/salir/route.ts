import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sb = await supabaseServer();
  await sb?.auth.signOut();
  const origin = requestOrigin(request);
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
