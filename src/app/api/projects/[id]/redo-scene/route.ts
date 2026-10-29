import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { currentUser } from "@/lib/db/session";
import { checkBlocked } from "@/lib/safety";
import { moderate } from "@/lib/moderation";
import { redoSceneImage } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Veces que se puede rehacer cada escena en la revisión (cada una ~0,04 $). */
const MAX_REDOS = 2;

/** Rehacer la imagen de una escena antes de animar, con un ajuste opcional. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const body = z
    .object({ sceneId: z.string().min(1).max(40), note: z.string().trim().max(160).optional() })
    .safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const project = await db.getProject(id);
  if (!project || project.ownerId !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (project.status !== "review") return NextResponse.json({ error: "not_in_review" }, { status: 409 });
  if ((project.redoCounts?.[body.data.sceneId] ?? 0) >= MAX_REDOS) return NextResponse.json({ error: "limit" }, { status: 429 });
  const note = body.data.note || undefined;
  if (note && (!checkBlocked(note).ok || !(await moderate([note])).ok)) return NextResponse.json({ error: "text_blocked" }, { status: 422 });
  try {
    await redoSceneImage(id, body.data.sceneId, note);
  } catch (err) {
    console.error("[redo-scene]", id, err);
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
  return NextResponse.json({ project: await db.getProject(id) });
}
