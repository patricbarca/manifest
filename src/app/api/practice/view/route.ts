import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/db/session";
import { db } from "@/lib/db/store";
import { localDay, recordView } from "@/lib/practice";

export const runtime = "nodejs";

const Body = z.object({
  projectId: z.string().min(1).max(40),
  /** getTimezoneOffset() del navegador, en minutos. */
  tzOffsetMin: z.number().int().min(-14 * 60).max(14 * 60),
});

/** El reproductor avisa cuando le das al play: suma a la racha. */
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const user = await currentUser();
  const project = await db.getProject(parsed.data.projectId);
  if (!project || project.ownerId !== user.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  // El día lo calcula el servidor con la zona del navegador: no se fía de la fecha del cliente.
  const { tzOffsetMin } = parsed.data;
  const day = localDay(Date.now(), tzOffsetMin);
  const updated = await db.patchUser(user.id, (u) => ({
    ...u,
    practice: recordView(u.practice, day, tzOffsetMin),
  }));
  return NextResponse.json({ streak: updated?.practice?.streak ?? 0 });
}
