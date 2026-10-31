import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { deleteAccount, hasWorkInProgress } from "@/lib/account-delete";

export const runtime = "nodejs";

/** Borrar mi cuenta para siempre. Pide escribir la palabra de confirmación. */
export async function DELETE(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = z.object({ confirm: z.literal(true) }).safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "confirm" }, { status: 400 });
  if (await hasWorkInProgress(who.user.id)) return NextResponse.json({ error: "busy" }, { status: 409 });
  try {
    await deleteAccount(who.user.id);
  } catch (err) {
    console.error("[cuenta] borrar", who.user.id, err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  console.log("[cuenta] borrada", who.user.id);
  return NextResponse.json({ ok: true });
}
