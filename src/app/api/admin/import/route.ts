import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { mediaPath } from "@/lib/paths";
import { offloadProject } from "@/lib/cleanup";
import type { Manifestation, Project } from "@/lib/types";
import { manifests } from "@/lib/manifest/store";
import { newManifestId, shortTitle } from "@/lib/manifest/extract";
import { isHighlightFile } from "@/lib/highlights";

export const runtime = "nodejs";

/**
 * Importa un vídeo ya montado (hecho fuera de la app) a la cuenta de alguien.
 * Solo existe mientras IMPORT_TOKEN esté definido: sin él responde 404.
 */
export async function POST(request: Request) {
  const token = process.env.IMPORT_TOKEN;
  if (!token || token.length < 32) return new NextResponse(null, { status: 404 });
  const got = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  const want = Buffer.from(token);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return new NextResponse(null, { status: 404 });

  const form = await request.formData();

  // Importar una manifestación suelta (escena ya hecha fuera de la app).
  if (form.get("mode") === "manifestation") {
    const ownerId = String(form.get("ownerId") ?? "");
    const desire = String(form.get("desire") ?? "").slice(0, 300);
    const clip = form.get("clip");
    if (!ownerId || !desire || !(clip instanceof File)) return NextResponse.json({ error: "ownerId, desire y clip" }, { status: 400 });
    if (!(await db.getUser(ownerId))) return NextResponse.json({ error: "usuario no existe" }, { status: 400 });
    const mid = newManifestId();
    await mkdir(mediaPath("generated", mid), { recursive: true });
    const save = async (field: string, name: string): Promise<string | undefined> => {
      const f = form.get(field);
      if (!(f instanceof File) || !/^[a-z0-9_]+\.(mp4|jpg|jpeg|png|mp3)$/i.test(name)) return undefined;
      await writeFile(mediaPath("generated", mid, name), Buffer.from(await f.arrayBuffer()));
      return `/media/generated/${mid}/${name}`;
    };
    const ext = (field: string, fallback: string) => {
      const f = form.get(field);
      const e = f instanceof File ? f.name.split(".").pop()?.toLowerCase() : undefined;
      return e && /^(mp4|jpg|jpeg|png|mp3)$/.test(e) ? e : fallback;
    };
    const hlVideo = await save("hlVideo", "hl_0.mp4");
    const hlPoster = await save("hlPoster", "hl_0.jpg");
    const now = Date.now();
    const m: Manifestation = {
      id: mid,
      ownerId,
      createdAt: Number(form.get("createdAt")) || now,
      updatedAt: now,
      status: "ready",
      desire,
      title: String(form.get("title") ?? "") || shortTitle(desire),
      locale: form.get("locale") === "es" ? "es" : "en",
      voice: String(form.get("voice") ?? "") || undefined,
      affirmation: String(form.get("affirmation") ?? "") || desire,
      imageUrl: await save("image", `image.${ext("image", "jpg")}`),
      clipUrl: await save("clip", "clip.mp4"),
      voiceUrl: await save("voiceFile", "voice.mp3"),
      highlight: hlVideo && hlPoster ? { videoUrl: hlVideo, posterUrl: hlPoster } : undefined,
      sourceProjectId: String(form.get("sourceProjectId") ?? "") || undefined,
      costCents: 0,
    };
    await manifests.put(m);
    await offloadProject(mid);
    return NextResponse.json({ id: mid });
  }

  // Añadir highlights a un vídeo ya importado.
  const existingId = String(form.get("projectId") ?? "");
  if (existingId) {
    const project = await db.getProject(existingId);
    if (!project) return NextResponse.json({ error: "no existe" }, { status: 404 });
    await mkdir(mediaPath("generated", existingId), { recursive: true });
    const names: string[] = [];
    for (const [, v] of form.entries()) {
      if (v instanceof File && isHighlightFile(v.name)) {
        await writeFile(mediaPath("generated", existingId, v.name), Buffer.from(await v.arrayBuffer()));
        names.push(v.name);
      }
    }
    const idx = [...new Set(names.map((n) => Number(n.match(/\d+/)![0])))].sort((a, b) => a - b);
    const highlights = idx
      .filter((i) => names.includes(`hl_${i}.mp4`) && names.includes(`hl_${i}.jpg`))
      .map((i) => ({ videoUrl: `/media/generated/${existingId}/hl_${i}.mp4`, posterUrl: `/media/generated/${existingId}/hl_${i}.jpg` }));
    await db.patchProject(existingId, (p) => ({ ...p, highlights }));
    await offloadProject(existingId);
    return NextResponse.json({ id: existingId, highlights: highlights.length });
  }
  const file = form.get("file");
  const ownerId = String(form.get("ownerId") ?? "");
  if (!(file instanceof File) || !ownerId) return NextResponse.json({ error: "file y ownerId" }, { status: 400 });
  if (!(await db.getUser(ownerId))) return NextResponse.json({ error: "usuario no existe" }, { status: 400 });

  const id = `p_${randomBytes(8).toString("hex")}`;
  const abs = mediaPath("generated", id, "final.mp4");
  await mkdir(mediaPath("generated", id), { recursive: true });
  await writeFile(abs, Buffer.from(await file.arrayBuffer()));

  const now = Date.now();
  const title = String(form.get("title") ?? "Mi visualización");
  const project: Project = {
    id,
    ownerId,
    createdAt: Number(form.get("createdAt")) || now,
    updatedAt: now,
    title,
    area: "abundancia",
    intention: String(form.get("intention") ?? title),
    tier: "cinematic",
    style: "cinematic",
    tone: "calma",
    durationSec: 60,
    locale: form.get("locale") === "es" ? "es" : "en",
    videoDurationSec: Number(form.get("durationSec")) || undefined,
    status: "ready",
    steps: [],
    affirmations: [],
    scenes: [],
    voiceLines: {},
    voiceMode: "file",
    exportUrl: `/media/generated/${id}/final.mp4`,
    paidCents: 0,
    costCents: 0,
    watermark: false,
  };
  await db.putProject(project);
  await offloadProject(id);
  return NextResponse.json({ id });
}
