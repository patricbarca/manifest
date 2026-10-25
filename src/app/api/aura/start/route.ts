import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";

export const runtime = "nodejs";

/** Empieza a ver un vídeo: se apunta la hora para exigir un mínimo antes de dar aura. */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = z.object({ projectId: z.string().min(1).max(64) }).safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "bad" }, { status: 400 });
  const project = await db.getProject(body.data.projectId);
  if (!project || project.ownerId !== who.user.id || project.status !== "ready") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  await social.startSession(who.user.id, project.id);
  return NextResponse.json({ ok: true });
}
