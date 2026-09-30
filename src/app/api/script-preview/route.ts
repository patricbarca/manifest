import { NextResponse } from "next/server";
import { z } from "zod";
import { providers } from "@/lib/ai";
import { Area, Details, Intention } from "@/lib/api-schemas";
import { currentUser } from "@/lib/db/session";
import { db } from "@/lib/db/store";
import { getDictionary } from "@/lib/i18n/server";
import { checkDetails, checkIntention } from "@/lib/safety";
import type { ScriptPreview } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Tope de guiones propuestos por hora. Cada uno es una llamada al LLM que
 * aún nadie ha pagado; sin tope, rehacer escenas en bucle sale gratis.
 */
const PREVIEWS_PER_HOUR = 12;

const Body = z.object({
  area: Area,
  intention: Intention,
  details: Details,
  tier: z.enum(["vision", "cinematic"]),
  tone: z.enum(["calma", "firme", "cercana"]),
  durationSec: z.union([z.literal(30), z.literal(60)]),
});

/**
 * Escribe el guion ANTES de cobrar, para que el usuario vea qué escenas va
 * a pagar y pueda corregirlas. El guion queda guardado aquí; el proyecto se
 * crea después con su id, nunca con un guion que mande el cliente.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  const { t, locale } = await getDictionary();
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: t.errors.incomplete }, { status: 400 });
  }
  const input = parsed.data;

  const verdict = checkIntention(input.intention);
  const detailsVerdict = checkDetails(input.details);
  const blocked = !verdict.ok ? verdict : !detailsVerdict.ok ? detailsVerdict : undefined;
  if (blocked) {
    return NextResponse.json({ error: t.safety[blocked.key!] }, { status: 422 });
  }

  const recent = await db.countPreviews(user.id, Date.now() - 60 * 60 * 1000);
  if (recent >= PREVIEWS_PER_HOUR) {
    return NextResponse.json({ error: t.errors.tooManyPreviews }, { status: 429 });
  }

  const id = "sp_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const out = await providers.script.write({ ...input, seed: id, locale });

  const preview: ScriptPreview = {
    id,
    ownerId: user.id,
    createdAt: Date.now(),
    ...input,
    locale,
    script: out.result,
    costCents: out.costCents,
  };
  await db.putPreview(preview);

  return NextResponse.json({ previewId: id, script: out.result });
}
