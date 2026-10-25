import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";

export const runtime = "nodejs";

/**
 * Círculo: pedir entrar en el de alguien, aceptar/rechazar solicitudes,
 * quitar a alguien de tu círculo o salir del de otra persona.
 */
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), handle: z.string().min(1).max(40) }),
  z.object({ action: z.literal("accept"), userId: z.string().min(1).max(64) }),
  z.object({ action: z.literal("reject"), userId: z.string().min(1).max(64) }),
  z.object({ action: z.literal("remove"), userId: z.string().min(1).max(64) }),
  z.object({ action: z.literal("leave"), userId: z.string().min(1).max(64) }),
]);

export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "bad" }, { status: 400 });
  const myId = who.user.id;
  const b = body.data;

  if (b.action === "request") {
    const target = await social.getProfileByHandle(b.handle);
    if (!target || target.userId === myId) return NextResponse.json({ error: "not found" }, { status: 404 });
    // Los perfiles privados no aceptan solicitudes: no hay nada que ver.
    if (target.visibility === "private") return NextResponse.json({ error: "private" }, { status: 403 });
    const existing = await social.getLink(target.userId, myId);
    if (!existing) await social.putLink({ ownerId: target.userId, memberId: myId, status: "pending", createdAt: Date.now() });
    return NextResponse.json({ status: existing?.status ?? "pending" });
  }
  if (b.action === "accept") {
    const link = await social.getLink(myId, b.userId);
    if (!link) return NextResponse.json({ error: "not found" }, { status: 404 });
    await social.putLink({ ...link, status: "accepted" });
    return NextResponse.json({ status: "accepted" });
  }
  if (b.action === "reject" || b.action === "remove") {
    await social.deleteLink(myId, b.userId);
    return NextResponse.json({ status: "removed" });
  }
  // leave: salir del círculo de otra persona
  await social.deleteLink(b.userId, myId);
  return NextResponse.json({ status: "left" });
}
