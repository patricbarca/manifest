import { NextResponse } from "next/server";
import { me } from "@/lib/social/me";
import { db } from "@/lib/db/store";
import { appBase } from "@/lib/hosts";
import { emailEnabled, sendStreakReminder } from "@/lib/email";
import { latestReady, videoThumb } from "@/lib/email-thumb";
import { localDay, statsFrom } from "@/lib/social/aura";
import { social } from "@/lib/social/store";

export const runtime = "nodejs";

const EVERY_MS = 10 * 60 * 1000;

/** Envía el recordatorio diario de prueba a la propia persona (como mucho uno cada 10 min). */
export async function POST() {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  if (!emailEnabled()) return NextResponse.json({ error: "email_off" }, { status: 503 });
  const user = (await db.getUser(who.user.id)) ?? who.user;
  if (!user.email) return NextResponse.json({ error: "no_email" }, { status: 400 });
  if (user.lastTestReminder && Date.now() - user.lastTestReminder < EVERY_MS) {
    return NextResponse.json({ error: "too_soon" }, { status: 429 });
  }
  await db.putUser({ ...user, lastTestReminder: Date.now() });
  const site = appBase();
  const last = latestReady(await db.listProjects(user.id));
  const stats = statsFrom(await social.listViews(user.id), localDay(user.tz ?? "UTC"));
  const thumb = last ? await videoThumb(last) : undefined;
  const sent = await sendStreakReminder({
    to: user.email,
    locale: user.locale === "es" ? "es" : "en",
    streak: Math.max(1, stats.streak),
    url: last ? `${site}/video/${last.id}` : `${site}/profile?tab=today`,
    settingsUrl: `${site}/settings`,
    thumb,
  });
  return NextResponse.json({ sent, thumb: !!thumb }, { status: sent ? 200 : 502 });
}
