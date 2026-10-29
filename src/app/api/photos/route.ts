import { rm } from "node:fs/promises";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { me } from "@/lib/social/me";
import { livePhotos } from "@/lib/manifest/photos";
import { localPathForMediaUrl } from "@/lib/paths";

export const runtime = "nodejs";

/** Tus selfies guardadas (las 4 últimas que siguen existiendo; caducan a los 30 días). */
export async function GET() {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const user = (await db.getUser(who.user.id)) ?? who.user;
  return NextResponse.json({ photos: await livePhotos(user) });
}

/** Borrar una selfie guardada: deja de usarse y se elimina el fichero. */
export async function DELETE(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = z.object({ url: z.string().startsWith("/media/uploads/").max(200) }).safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = (await db.getUser(who.user.id)) ?? who.user;
  const url = body.data.url;
  // Solo las suyas: el id del dueño va en el nombre del fichero.
  if (!(user.photoUrls ?? []).includes(url) || !url.split("/").pop()?.startsWith(`${user.id}_`)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const abs = localPathForMediaUrl(url);
  if (abs) await rm(abs, { force: true });
  const next = { ...user, photoUrls: (user.photoUrls ?? []).filter((u) => u !== url) };
  await db.putUser(next);
  return NextResponse.json({ photos: await livePhotos(next) });
}
