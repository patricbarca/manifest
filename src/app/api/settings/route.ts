import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { db } from "@/lib/db/store";
import { BODY_BUILDS, BODY_HEIGHTS } from "@/lib/body";

export const runtime = "nodejs";

/** Ajustes de la cuenta que no son del perfil público: recordatorios y complexión. */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = z
    .object({
      reminders: z.boolean().optional(),
      // null = "prefiero no decirlo" (se borra).
      body: z.object({ build: z.enum(BODY_BUILDS).nullable().optional(), height: z.enum(BODY_HEIGHTS).nullable().optional() }).optional(),
    })
    .safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = (await db.getUser(who.user.id)) ?? who.user;
  const next = { ...user };
  if (body.data.reminders !== undefined) next.reminders = body.data.reminders;
  if (body.data.body) {
    const merged = { ...user.body, ...body.data.body };
    next.body = { build: merged.build ?? undefined, height: merged.height ?? undefined };
  }
  await db.putUser(next);
  return NextResponse.json({ reminders: next.reminders, body: next.body });
}
