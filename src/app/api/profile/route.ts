import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";
import { HANDLE_RE } from "@/lib/social/aura";
import { checkBlocked } from "@/lib/safety";

export const runtime = "nodejs";

const Patch = z.object({
  displayName: z.string().trim().min(1).max(40).optional(),
  handle: z.string().trim().toLowerCase().regex(HANDLE_RE).optional(),
  visibility: z.enum(["private", "circle", "public"]).optional(),
  bio: z.string().trim().max(160).optional(),
  mantra: z.string().trim().max(80).optional(),
  location: z.string().trim().max(40).optional(),
  link: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "link")
    .optional(),
});

export async function GET() {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  return NextResponse.json({ profile: who.profile });
}

export async function PATCH(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = Patch.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const next = { ...who.profile };
  if (body.data.displayName) {
    if (!checkBlocked(body.data.displayName).ok) return NextResponse.json({ error: "name_blocked" }, { status: 422 });
    next.displayName = body.data.displayName;
  }
  if (body.data.handle && body.data.handle !== who.profile.handle) {
    if (!checkBlocked(body.data.handle).ok) return NextResponse.json({ error: "handle_blocked" }, { status: 422 });
    if (await social.getProfileByHandle(body.data.handle)) return NextResponse.json({ error: "handle_taken" }, { status: 409 });
    next.handle = body.data.handle;
  }
  if (body.data.visibility) next.visibility = body.data.visibility;
  // Textos libres: vacío borra el campo.
  for (const k of ["bio", "mantra", "location", "link"] as const) {
    const v = body.data[k];
    if (v === undefined) continue;
    if (v && !checkBlocked(v).ok) return NextResponse.json({ error: "text_blocked" }, { status: 422 });
    next[k] = v || undefined;
  }
  await social.putProfile(next);
  return NextResponse.json({ profile: next });
}
