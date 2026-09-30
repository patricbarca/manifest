import { NextResponse } from "next/server";
import { z } from "zod";
import { providers } from "@/lib/ai";
import { Area, Intention } from "@/lib/api-schemas";
import { getDictionary } from "@/lib/i18n/server";
import { checkIntention } from "@/lib/safety";
import type { ClarifyQuestion } from "@/lib/types";

export const runtime = "nodejs";

const Body = z.object({ area: Area, intention: Intention });

/**
 * Preguntas antes de escribir el guion.
 *
 * Sin ellas el LLM rellena los huecos a su manera: si el usuario nombra su
 * empresa, se inventa a qué se dedica. Preguntar cuesta una llamada barata;
 * regenerar escenas equivocadas cuesta imágenes.
 */
export async function POST(request: Request) {
  const { t, locale } = await getDictionary();
  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: t.errors.incomplete }, { status: 400 });
  }
  const { area, intention } = parsed.data;

  const verdict = checkIntention(intention);
  if (!verdict.ok) {
    return NextResponse.json({ error: t.safety[verdict.key!] }, { status: 422 });
  }

  const out = await providers.clarify.ask({ area, intention, locale });
  const questions: ClarifyQuestion[] = out.result.length
    ? out.result
    : t.create.clarifyFallback.map((question) => ({ question, suggestions: [] }));

  return NextResponse.json({ questions, tailored: out.result.length > 0 });
}
