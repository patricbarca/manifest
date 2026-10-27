import { isSignedIn } from "@/lib/db/session";
import { NextResponse } from "next/server";
import { hasAccess } from "@/lib/access";
import { z } from "zod";
import { providers } from "@/lib/ai";
import { Area, Desires, intentionFrom } from "@/lib/api-schemas";
import { inferArea } from "@/lib/script-engine";
import { getDictionary } from "@/lib/i18n/server";
import { checkDesires } from "@/lib/safety";
import { moderate } from "@/lib/moderation";
import type { ClarifyQuestion } from "@/lib/types";

export const runtime = "nodejs";

const Body = z.object({ desires: Desires, area: Area.optional() });

/**
 * Preguntas antes de escribir el guion.
 *
 * Sin ellas el LLM rellena los huecos a su manera: si el usuario nombra su
 * empresa, se inventa a qué se dedica. Preguntar cuesta una llamada barata;
 * regenerar escenas equivocadas cuesta imágenes.
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
  const { t, locale } = await getDictionary();
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: t.errors.incomplete }, { status: 400 });
  }
  const { desires } = parsed.data;
  const intention = intentionFrom(desires);
  const area = parsed.data.area ?? inferArea(intention);

  let verdict = checkDesires(desires);
  if (verdict.ok) verdict = await moderate(desires);
  if (!verdict.ok) {
    return NextResponse.json({ error: t.safety[verdict.key!] }, { status: 422 });
  }

  const out = await providers.clarify.ask({ area, intention, locale, desires });
  // Sin LLM (o si falló) van las preguntas genéricas. Si el LLM respondió con
  // una lista vacía es que lo tiene todo claro, y no se pregunta nada.
  const tailored = out.provider !== "mock" && out.provider !== "fallback";
  const questions: ClarifyQuestion[] = tailored
    ? out.result
    : t.create.clarifyFallback.map((question) => ({ question, suggestions: [] }));

  return NextResponse.json({ questions, tailored, area });
}
