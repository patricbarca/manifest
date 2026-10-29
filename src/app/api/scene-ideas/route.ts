import { NextResponse } from "next/server";
import { z } from "zod";
import { isSignedIn } from "@/lib/db/session";
import { hasAccess } from "@/lib/access";
import { Desires, Details } from "@/lib/api-schemas";
import { getDictionary } from "@/lib/i18n/server";
import { checkDesires } from "@/lib/safety";
import { moderate } from "@/lib/moderation";
import { suggestSceneIdeas } from "@/lib/ai/scene-ideas";

export const runtime = "nodejs";

const Idea = z.object({ place: z.string().max(200), action: z.string().max(200), outfit: z.string().max(200), mood: z.string().max(200) });
const Body = z.object({
  desires: Desires,
  details: Details.optional(),
  /** "Otra idea" para un solo deseo: su índice y la idea que ya tenía. */
  index: z.number().int().min(0).max(9).optional(),
  avoid: Idea.optional(),
});

/** Propuesta de escena por deseo (lugar, qué hace, ropa, ambiente) para que la persona la edite. */
export async function POST(request: Request) {
  const { t, locale } = await getDictionary();
  if (!(await isSignedIn())) return NextResponse.json({ error: t.errors.signInRequired }, { status: 401 });
  if (!(await hasAccess())) return NextResponse.json({ error: t.errors.betaOnly }, { status: 403 });
  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t.errors.incomplete }, { status: 400 });
  const { desires, details, index, avoid } = parsed.data;

  let verdict = checkDesires(desires);
  if (verdict.ok) verdict = await moderate(desires);
  if (!verdict.ok) return NextResponse.json({ error: t.safety[verdict.key!] }, { status: 422 });

  try {
    const only = index !== undefined ? [desires[index]] : desires;
    const ideas = await suggestSceneIdeas({ desires: only, details, locale, avoid });
    return NextResponse.json({ ideas, index });
  } catch (err) {
    console.error("[scene-ideas]", err);
    return NextResponse.json({ ideas: desires.map(() => ({ place: "", action: "", outfit: "", mood: "" })), index });
  }
}
