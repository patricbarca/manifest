import { NextResponse } from "next/server";
import { currentUser } from "@/lib/db/session";
import { isDemoMode } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json({ user, demoMode: isDemoMode() });
}
