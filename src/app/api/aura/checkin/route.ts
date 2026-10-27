import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { rememberTz } from "@/lib/social/remember-tz";
import { social } from "@/lib/social/store";
import { AURA_PER_CHECKIN, levelFor, localDay, statsFrom } from "@/lib/social/aura";

export const runtime = "nodejs";

/**
 * "Ya lo vi hoy": para quien ve su vídeo descargado, fuera de la app.
 * No se puede comprobar, así que da menos aura (+5) y cuenta una vez al día.
 * El aura es solo motivación: si alguien hace trampa, solo se engaña a sí mismo.
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
  await rememberTz(who.user, body.data.tz);
  const day = localDay(body.data.tz);
  const today = (await social.listViews(who.user.id)).some((v) => v.day === day && v.points === AURA_PER_CHECKIN);
  const awarded = !today && (await social.addView({ userId: who.user.id, projectId: project.id, day, points: AURA_PER_CHECKIN }));
  const stats = statsFrom(await social.listViews(who.user.id), day);
  return NextResponse.json({ awarded, points: awarded ? AURA_PER_CHECKIN : 0, aura: stats.aura, streak: stats.streak, level: levelFor(stats.aura).index });
}
