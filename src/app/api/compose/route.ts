import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { me } from "@/lib/social/me";
import { db } from "@/lib/db/store";
import { manifests } from "@/lib/manifest/store";
import { composeProject } from "@/lib/manifest/compose";
import { enqueueCompose } from "@/lib/queue";
import { VOICE_IDS } from "@/lib/voices";
import { PALETTES, type Manifestation, type Palette } from "@/lib/types";

export const runtime = "nodejs";

const MAX_SCENES = 8;

const Body = z.object({
  ids: z.array(z.string().startsWith("m_").max(64)).min(1).max(MAX_SCENES),
  locale: z.enum(["es", "en"]).optional(),
  voice: z.enum(VOICE_IDS).optional(),
  title: z.string().trim().min(1).max(80).optional(),
  palette: z.enum(PALETTES as [Palette, ...Palette[]]).optional(),
});

/**
 * Montar tu vídeo de manifestación con las manifestaciones que elijas, en ese
 * orden. No gasta créditos: reutiliza escenas que ya tienes (coste ~céntimos).
 */
export async function POST(request: Request) {
  const who = await me();
  if (!who) return NextResponse.json({ error: "signin" }, { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const ids = [...new Set(body.data.ids)];
  const items = (await Promise.all(ids.map((id) => manifests.get(id)))).filter(
    (m): m is Manifestation => !!m && m.ownerId === who.user.id && m.status === "ready" && !!m.clipUrl,
  );
  if (items.length !== ids.length) return NextResponse.json({ error: "not_ready" }, { status: 409 });
  // Las frases de cada escena están en su idioma: el vídeo entero va en ese idioma.
  const locale = items[0].locale;
  if (items.some((m) => m.locale !== locale)) return NextResponse.json({ error: "mixed_locale" }, { status: 409 });
  // Un vídeo montándose a la vez por persona: evita encolar muchos sin querer.
  const busy = (await db.listProjects(who.user.id)).some((p) => p.composedFrom && (p.status === "queued" || p.status === "generating"));
  if (busy) return NextResponse.json({ error: "busy" }, { status: 429 });

  const project = composeProject({
    id: "p_" + Date.now().toString(36) + randomBytes(5).toString("hex"),
    ownerId: who.user.id,
    items,
    locale,
    voice: body.data.voice ?? items[0].voice,
    palette: body.data.palette,
    title: body.data.title ?? (locale === "es" ? "Mi manifestación" : "My manifestation"),
  });
  await db.putProject(project);
  enqueueCompose(project.id);
  return NextResponse.json({ project: { id: project.id } });
}
