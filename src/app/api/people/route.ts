import { NextResponse } from "next/server";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";

export const runtime = "nodejs";

/** Buscar personas por usuario o nombre. Solo perfiles visibles (círculo o público), y solo con sesión. */
export async function GET(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const found = await social.searchProfiles(q, 20);
  return NextResponse.json({
    people: found
      .filter((p) => p.userId !== who.user.id)
      .map((p) => ({ handle: p.handle, displayName: p.displayName, avatarUrl: p.visibility === "public" ? p.avatarUrl : undefined, visibility: p.visibility })),
  });
}
