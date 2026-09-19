import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { currentUser } from "@/lib/db/session";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await currentUser();
  const project = await db.getProject(id);

  if (!project) {
    return NextResponse.json({ error: "No existe ese vídeo" }, { status: 404 });
  }
  // Un vídeo lleva la cara de quien lo creó: no se sirve a nadie más.
  if (project.ownerId !== user.id) {
    return NextResponse.json({ error: "No es tuyo" }, { status: 403 });
  }
  return NextResponse.json({ project });
}
