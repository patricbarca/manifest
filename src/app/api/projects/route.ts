import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { currentUser, chargeForVideo } from "@/lib/db/session";
import { estimateCostCents, priceUsd } from "@/lib/pricing";
import { checkDetails, checkIntention } from "@/lib/safety";
import { Area, Details, Intention } from "@/lib/api-schemas";
import { initialSteps, runPipeline } from "@/lib/pipeline";
import { templateBySlug } from "@/lib/templates";
import { getDictionary } from "@/lib/i18n/server";
import type { Project } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const CreateProject = z.object({
  area: Area,
  intention: Intention,
  details: Details,
  tier: z.enum(["vision", "cinematic"]),
  style: z.enum(["cinematic", "editorial", "golden", "minimal", "dream"]),
  tone: z.enum(["calma", "firme", "cercana"]),
  durationSec: z.union([z.literal(30), z.literal(60)]),
  selfieUrl: z.string().startsWith("/media/uploads/").optional(),
  templateSlug: z.string().optional(),
  /** Guion aprobado en la revisión. */
  previewId: z.string().startsWith("sp_").optional(),
});

export async function GET() {
  const user = await currentUser();
  const projects = await db.listProjects(user.id);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const user = await currentUser();
  const { t, locale } = await getDictionary();
  const parsed = CreateProject.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: t.errors.incomplete, detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // El filtro devuelve una clave, no un mensaje: el texto sale del
  // diccionario en el idioma en el que está leyendo el usuario.
  const verdict = checkIntention(input.intention);
  const detailsVerdict = checkDetails(input.details);
  const blocked = !verdict.ok ? verdict : !detailsVerdict.ok ? detailsVerdict : undefined;
  if (blocked) {
    return NextResponse.json({ error: t.safety[blocked.key!] }, { status: 422 });
  }

  // El guion aprobado solo vale si es de este usuario y se escribió para
  // exactamente lo que se va a generar. Si el usuario cambió algo después
  // de revisarlo, se descarta y el pipeline escribe uno nuevo.
  const preview = input.previewId ? await db.getPreview(input.previewId) : undefined;
  const approved =
    preview &&
    preview.ownerId === user.id &&
    preview.area === input.area &&
    preview.intention === input.intention &&
    JSON.stringify(preview.details) === JSON.stringify(input.details) &&
    preview.tier === input.tier &&
    preview.tone === input.tone &&
    preview.durationSec === input.durationSec &&
    preview.locale === locale
      ? preview
      : undefined;

  const priceCents = priceUsd(input.tier) * 100;
  const charge = await chargeForVideo(user.id, priceCents);
  if (!charge.ok) {
    return NextResponse.json({ error: t.errors[charge.reason] }, { status: 402 });
  }

  const template = input.templateSlug ? templateBySlug(input.templateSlug) : undefined;

  const project: Project = {
    id: "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    ownerId: user.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: template?.title[locale] ?? input.intention.slice(0, 60),
    area: input.area,
    intention: input.intention,
    details: input.details,
    tier: input.tier,
    style: input.style,
    tone: input.tone,
    durationSec: input.durationSec,
    locale,
    selfieUrl: input.selfieUrl,
    status: "queued",
    steps: initialSteps(input.tier),
    script: approved?.script,
    scriptCostCents: approved?.costCents,
    affirmations: [],
    scenes: [],
    voiceMode: "browser",
    paidCents: charge.paidCents,
    costCents: 0,
    templateSlug: input.templateSlug,
    // Marca de agua solo en el vídeo que invita la casa, no en los que
    // pasan gratis por no haber pasarela de pago todavía.
    watermark: charge.kind === "free",
  };
  await db.putProject(project);

  // La generación corre en segundo plano y la UI la sondea. En producción esto
  // es un encolado (ver comentario de cabecera de lib/pipeline.ts).
  void runPipeline(project.id).catch((err) => {
    console.error("[pipeline]", project.id, err);
  });

  return NextResponse.json({
    project,
    estimatedProviderCostCents: estimateCostCents(input.tier, input.durationSec),
  });
}
