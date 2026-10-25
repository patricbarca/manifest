import { NextResponse } from "next/server";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { db } from "@/lib/db/store";
import { checkBlocked } from "@/lib/safety";

export const runtime = "nodejs";

const Body = z.object({
  projectId: z.string().min(1).max(64),
  /** Mostrar el vídeo en el perfil. */
  show: z.boolean().optional(),
  /** Cambios por escena: ocultar/mostrar y nombre. */
  items: z
    .array(z.object({ index: z.number().int().min(0).max(30), hidden: z.boolean().optional(), label: z.string().trim().max(24).optional() }))
    .max(30)
    .optional(),
});

/** Qué se muestra en el perfil de uno de tus vídeos: el vídeo entero y cada escena. */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const project = await db.getProject(body.data.projectId);
  if (!project || project.ownerId !== who.user.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!project.highlights?.length) return NextResponse.json({ error: "no_highlights" }, { status: 409 });
  for (const it of body.data.items ?? []) {
    if (it.label && !checkBlocked(it.label).ok) return NextResponse.json({ error: "text_blocked" }, { status: 422 });
  }
  const saved = await db.patchProject(project.id, (p) => {
    const highlights = (p.highlights ?? []).map((h, i) => {
      const change = body.data.items?.find((it) => it.index === i);
      if (!change) return h;
      return {
        ...h,
        ...(change.hidden !== undefined ? { hidden: change.hidden || undefined } : {}),
        ...(change.label !== undefined ? { label: change.label || undefined } : {}),
      };
    });
    return { ...p, highlights, ...(body.data.show !== undefined ? { showOnProfile: body.data.show } : {}) };
  });
  return NextResponse.json({ show: !!saved?.showOnProfile, highlights: saved?.highlights ?? [] });
}
