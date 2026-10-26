import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { db } from "@/lib/db/store";

export const runtime = "nodejs";

/** Ajustes de la cuenta que no son del perfil público (de momento, recordatorios). */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = z.object({ reminders: z.boolean() }).safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = (await db.getUser(who.user.id)) ?? who.user;
  await db.putUser({ ...user, reminders: body.data.reminders });
  return NextResponse.json({ reminders: body.data.reminders });
}
