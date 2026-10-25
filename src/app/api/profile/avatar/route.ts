import { mkdir, rm } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { me } from "@/lib/social/me";
import { social } from "@/lib/social/store";
import { localPathForMediaUrl, mediaDir, mediaPath } from "@/lib/paths";

export const runtime = "nodejs";
const MAX_BYTES = 8 * 1024 * 1024;

/** Sube una foto de perfil: se recorta a 400×400 y se guarda como JPG. */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_big" }, { status: 413 });

  let jpg: Buffer;
  try {
    jpg = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(400, 400, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "not_image" }, { status: 415 });
  }

  const name = `${who.user.id}_${randomBytes(6).toString("hex")}.jpg`;
  await mkdir(mediaDir("avatars"), { recursive: true });
  await sharp(jpg).toFile(mediaPath("avatars", name));
  const old = who.profile.avatarUrl;
  const next = { ...who.profile, avatarUrl: `/media/avatars/${name}` };
  await social.putProfile(next);
  if (old?.startsWith("/media/avatars/")) {
    const abs = localPathForMediaUrl(old);
    if (abs) await rm(abs, { force: true });
  }
  return NextResponse.json({ profile: next });
}
