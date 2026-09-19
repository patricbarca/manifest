import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { currentUser, refundCredits, spendCredits } from "@/lib/db/session";
import { creditCost, estimateCostCents } from "@/lib/pricing";
import { checkIntention } from "@/lib/safety";
import { initialSteps, runPipeline } from "@/lib/pipeline";
import { blueprintBySlug } from "@/lib/blueprints";
import { planById } from "@/lib/pricing";
import type { Project } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const CreateProject = z.object({
  area: z.enum(["carrera", "abundancia", "salud", "amor", "confianza", "libertad"]),
  intention: z.string().min(1).max(600),
  tier: z.enum(["vision", "cinematic"]),
  style: z.enum(["cinematic", "editorial", "golden", "minimal", "dream"]),
  tone: z.enum(["calma", "firme", "cercana"]),
  durationSec: z.union([z.literal(30), z.literal(60)]),
  selfieUrl: z.string().startsWith("/uploads/").optional(),
  blueprintSlug: z.string().optional(),
});

export async function GET() {
  const user = await currentUser();
  const projects = await db.listProjects(user.id);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const user = await currentUser();
  const parsed = CreateProject.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos incompletos", detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const verdict = checkIntention(input.intention);
  if (!verdict.ok) {
    return NextResponse.json({ error: verdict.reason }, { status: 422 });
  }

  const cost = creditCost(input.tier, input.durationSec);
  if (!(await spendCredits(user.id, cost))) {
    return NextResponse.json(
      {
        error: "No te quedan créditos suficientes",
        needed: cost,
        available: user.credits,
      },
      { status: 402 },
    );
  }

  const blueprint = input.blueprintSlug ? blueprintBySlug(input.blueprintSlug) : undefined;

  const project: Project = {
    id: "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    ownerId: user.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: blueprint?.title ?? input.intention.slice(0, 60),
    area: input.area,
    intention: input.intention,
    tier: input.tier,
    style: input.style,
    tone: input.tone,
    durationSec: input.durationSec,
    selfieUrl: input.selfieUrl,
    status: "queued",
    steps: initialSteps(input.tier),
    affirmations: [],
    scenes: [],
    voiceMode: "browser",
    creditsSpent: cost,
    costCents: 0,
    blueprintSlug: input.blueprintSlug,
    watermark: planById(user.plan).watermark,
  };
  await db.putProject(project);

  // La generación corre en segundo plano y la UI la sondea. En producción esto
  // es un encolado (ver comentario de cabecera de lib/pipeline.ts).
  void runPipeline(project.id).catch(async (err) => {
    console.error("[pipeline]", project.id, err);
    // Si no llegó a producir nada, se devuelven los créditos.
    const failed = await db.getProject(project.id);
    if (failed && failed.scenes.every((s) => !s.imageUrl)) {
      await refundCredits(user.id, cost);
      await db.patchProject(project.id, (p) => ({ ...p, creditsSpent: 0 }));
    }
  });

  return NextResponse.json({
    project,
    estimatedProviderCostCents: estimateCostCents(input.tier, input.durationSec),
  });
}
