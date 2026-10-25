import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { db } from "@/lib/db/store";

export const runtime = "nodejs";

const Body = z.object({ projectId: z.string().min(1).max(64), show: z.boolean() });

/** Muestra u oculta en el perfil los highlights de uno de tus vídeos. */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const project = await db.getProject(body.data.projectId);
  if (!project || project.ownerId !== who.user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (body.data.show && !project.highlights?.length) return NextResponse.json({ error: "no_highlights" }, { status: 409 });
  await db.patchProject(project.id, (p) => ({ ...p, showOnProfile: body.data.show }));
  return NextResponse.json({ show: body.data.show });
}
