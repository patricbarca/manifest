import { isSignedIn } from "@/lib/db/session";
import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { z } from "zod";
import { providers } from "@/lib/ai";
import { Area, Desires, Details, PeopleNames, intentionFrom } from "@/lib/api-schemas";
import { inferArea } from "@/lib/script-engine";
import { currentUser } from "@/lib/db/session";
import { db } from "@/lib/db/store";
import { getDictionary } from "@/lib/i18n/server";
import { checkBlocked, checkDesires, checkDetails } from "@/lib/safety";
import type { ScriptPreview } from "@/lib/types";
import { LOCALES } from "@/lib/i18n/locale";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Tope de guiones propuestos por hora. Cada uno es una llamada al LLM que
 * aún nadie ha pagado; sin tope, rehacer escenas en bucle sale gratis.
 */
const PREVIEWS_PER_HOUR = 12;

const Body = z.object({
  area: Area.optional(),
  desires: Desires,
  details: Details,
  tier: z.enum(["vision", "cinematic"]),
  tone: z.enum(["calma", "firme", "cercana"]),
  durationSec: z.union([z.literal(30), z.literal(60)]),
  people: PeopleNames,
  language: z.enum(LOCALES).optional(),
});

/**
 * Escribe el guion ANTES de cobrar, para que el usuario vea qué escenas va
 * a pagar y pueda corregirlas. El guion queda guardado aquí; el proyecto se
 * crea después con su id, nunca con un guion que mande el cliente.
 */
export async function POST(request: Request) {
  if (!(await isSignedIn())) {
    const { t } = await getDictionary();
    return NextResponse.json({ error: t.errors.signInRequired }, { status: 401 });
  }
  if (!(await hasAccess())) {
    const { t } = await getDictionary();
    return NextResponse.json({ error: t.errors.betaOnly }, { status: 403 });
  }
  const user = await currentUser();
  const { t, locale: uiLocale } = await getDictionary();
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: t.errors.incomplete }, { status: 400 });
  }
  const { desires, details, tier, tone, durationSec } = parsed.data;
  // El guion se escribe en el idioma del vídeo, que puede no ser el de la web.
  const locale = parsed.data.language ?? uiLocale;
  const people = parsed.data.people.map((p) => ({ name: p.name, relation: p.relation }));
  const intention = intentionFrom(desires);
  const input = {
    area: parsed.data.area ?? inferArea(intention),
    intention,
    desires,
    details,
    tier,
    tone,
    durationSec,
    people,
  };

  const verdict = checkDesires(input.desires);
  const detailsVerdict = checkDetails(input.details);
  const peopleVerdict = people.map((p) => checkBlocked(`${p.name} ${p.relation ?? ""}`)).find((v) => !v.ok);
  const blocked = !verdict.ok ? verdict : !detailsVerdict.ok ? detailsVerdict : peopleVerdict;
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
