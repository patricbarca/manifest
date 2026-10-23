import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { currentUser } from "@/lib/db/session";
import { getDictionary } from "@/lib/i18n/server";
import { deleteProject } from "@/lib/cleanup";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [user, project, { t }] = await Promise.all([
    currentUser(),
    db.getProject(id),
    getDictionary(),
  ]);

  if (!project) {
    return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
  }
  // Un vídeo lleva la cara de quien lo creó: no se sirve a nadie más.
  if (project.ownerId !== user.id) {
    return NextResponse.json({ error: t.errors.notYours }, { status: 403 });
  }
  return NextResponse.json({ project });
}

/** Borra el vídeo, sus escenas y las fotos con las que se hizo. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [user, project, { t }] = await Promise.all([currentUser(), db.getProject(id), getDictionary()]);
  if (!project) return NextResponse.json({ error: t.errors.notFound }, { status: 404 });
  if (project.ownerId !== user.id) return NextResponse.json({ error: t.errors.notYours }, { status: 403 });
  if (project.status === "generating" || project.status === "queued") {
    return NextResponse.json({ error: t.errors.stillGenerating }, { status: 409 });
  }
  await deleteProject(project);
  return NextResponse.json({ ok: true });
}
