import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { currentUser } from "@/lib/db/session";
import { enqueue } from "@/lib/queue";

export const runtime = "nodejs";

/** Aprobar las imágenes: el vídeo sigue con la voz, la animación y el montaje. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const project = await db.getProject(id);
  if (!project || project.ownerId !== user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (project.status !== "review") return NextResponse.json({ error: "not_in_review" }, { status: 409 });
  const next = await db.patchProject(id, (p) => ({ ...p, imagesApproved: true, status: "queued" }));
  enqueue(id);
  return NextResponse.json({ project: next });
}
