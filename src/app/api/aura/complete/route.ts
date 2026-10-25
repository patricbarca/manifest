import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";
import { AURA_PER_VIEW, VIEW_THRESHOLD, levelFor, localDay, statsFrom } from "@/lib/social/aura";

export const runtime = "nodejs";

/**
 * Terminó de ver (llegó al 80 %). Da +10 aura si: el vídeo es suyo, empezó a
 * verlo hace al menos el 80 % de su duración (con margen) y hoy aún no contaba.
 */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = z
    .object({ projectId: z.string().min(1).max(64), tz: z.string().max(64).optional() })
    .safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "bad" }, { status: 400 });
  const project = await db.getProject(body.data.projectId);
  if (!project || project.ownerId !== who.user.id || project.status !== "ready") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const started = await social.sessionStart(who.user.id, project.id);
  const minMs = (project.videoDurationSec ?? 60) * VIEW_THRESHOLD * 0.85 * 1000;
  if (!started || Date.now() - started < minMs) {
    return NextResponse.json({ awarded: false, reason: "too_fast" });
  }

  const day = localDay(body.data.tz);
  const awarded = await social.addView({ userId: who.user.id, projectId: project.id, day, points: AURA_PER_VIEW });
  const stats = statsFrom(await social.listViews(who.user.id), day);
  return NextResponse.json({ awarded, points: awarded ? AURA_PER_VIEW : 0, aura: stats.aura, streak: stats.streak, level: levelFor(stats.aura).index });
}
