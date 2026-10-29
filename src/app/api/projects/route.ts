import { randomBytes } from "node:crypto";
import { isSignedIn } from "@/lib/db/session";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { currentUser, chargeForVideo } from "@/lib/db/session";
import { estimateCostCents, priceUsd } from "@/lib/pricing";
import { checkBlocked, checkDesires, checkDetails } from "@/lib/safety";
import { moderate } from "@/lib/moderation";
import { Area, Desires, Details, People, intentionFrom } from "@/lib/api-schemas";
import { inferArea } from "@/lib/script-engine";
import { initialSteps } from "@/lib/pipeline";
import { enqueue } from "@/lib/queue";
import { templateBySlug } from "@/lib/templates";
import { getDictionary } from "@/lib/i18n/server";
import { PALETTES, type Palette, type Project } from "@/lib/types";
import { hasAccess } from "@/lib/access";
import { LOCALES } from "@/lib/i18n/locale";
import { VOICE_IDS } from "@/lib/voices";
import { createCheckout, siteOrigin, stripeEnabled } from "@/lib/stripe";
import { attributionMetadata, readAttribution } from "@/lib/tracking";

export const runtime = "nodejs";
export const maxDuration = 300;

const CreateProject = z.object({
  area: Area.optional(),
  desires: Desires,
  details: Details,
  tier: z.enum(["vision", "cinematic", "elevated"]),
  style: z.enum(["cinematic", "editorial", "golden", "minimal", "dream"]),
  tone: z.enum(["calma", "firme", "cercana"]),
  durationSec: z.union([z.literal(30), z.literal(60)]),
  selfieUrl: z.string().startsWith("/media/uploads/").optional(),
  /** Hasta 4 fotos del usuario. */
  photoUrls: z.array(z.string().startsWith("/media/uploads/")).max(4).optional(),
  palette: z.enum(PALETTES as [Palette, ...Palette[]]).optional(),
  /** Otras personas que salen en las escenas, con sus fotos. */
  people: People,
  /** Idioma del vídeo (puede no ser el de la web) y voz que lo narra. */
  language: z.enum(LOCALES).optional(),
  voice: z.enum(VOICE_IDS).optional(),
  templateSlug: z.string().optional(),
  /** Guion aprobado en la revisión. */
  previewId: z.string().startsWith("sp_").optional(),
  /** Pidió generar ya y aceptó perder el desistimiento (UE). */
  waiver: z.literal(true),
});

export async function GET() {
  const user = await currentUser();
  const projects = await db.listProjects(user.id);
  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  if (!(await isSignedIn())) {
    const { t } = await getDictionary();
    return NextResponse.json({ error: t.errors.signInRequired }, { status: 401 });
  }
  const user = await currentUser();
  const { t, locale } = await getDictionary();
  if (!(await hasAccess())) {
    return NextResponse.json({ error: t.errors.betaOnly }, { status: 403 });
  }
  const parsed = CreateProject.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: t.errors.incomplete, detail: parsed.error.issues },
      { status: 400 },
    );
  }
  const intention = intentionFrom(parsed.data.desires);
  const input = { ...parsed.data, intention, area: parsed.data.area ?? inferArea(intention) };
  const videoLocale = input.language ?? locale;

  // El filtro devuelve una clave, no un mensaje: el texto sale del
  // diccionario en el idioma en el que está leyendo el usuario.
  // Las fotos se nombran con el id del dueño al subirlas (ver api/upload).
  const photos = input.photoUrls ?? (input.selfieUrl ? [input.selfieUrl] : []);
  const peoplePhotos = input.people.flatMap((p) => p.photoUrls);
  if ([...photos, ...peoplePhotos].some((u) => !u.split("/").pop()?.startsWith(`${user.id}_`))) {
    return NextResponse.json({ error: t.errors.notYours }, { status: 403 });
  }

  const verdict = checkDesires(input.desires);
  const detailsVerdict = checkDetails(input.details);
  const peopleVerdict = input.people
    .map((p) => checkBlocked(`${p.name} ${p.relation ?? ""}`))
    .find((v) => !v.ok);
  const blocked =
    (!verdict.ok ? verdict : !detailsVerdict.ok ? detailsVerdict : peopleVerdict) ??
    (await moderate([...input.desires, ...input.details.map((d) => d.answer), ...input.people.map((p) => `${p.name} ${p.relation ?? ""}`)]).then((v) => (v.ok ? undefined : v)));
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
    JSON.stringify(preview.people ?? []) ===
      JSON.stringify(input.people.map((p) => ({ name: p.name, relation: p.relation }))) &&
    preview.locale === videoLocale
      ? preview
      : undefined;

  const priceCents = priceUsd(input.tier) * 100;
  const charge = await chargeForVideo(user.id, priceCents);
  // Sin vídeo gratis y con pagos activos: se crea el proyecto en borrador y se cobra en Stripe.
  const needsCheckout = !charge.ok && charge.reason === "paymentRequired" && stripeEnabled();
  if (!charge.ok && !needsCheckout) {
    return NextResponse.json({ error: t.errors[charge.reason] }, { status: 402 });
  }

  const template = input.templateSlug ? templateBySlug(input.templateSlug) : undefined;

  const attribution = await readAttribution();
  const project: Project = {
    id: "p_" + Date.now().toString(36) + randomBytes(5).toString("hex"),
    ownerId: user.id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    title: template?.title[videoLocale] ?? input.intention.slice(0, 60),
    area: input.area,
    intention: input.intention,
    desires: input.desires,
    details: input.details,
    tier: input.tier,
    style: input.style,
    tone: input.tone,
    durationSec: input.durationSec,
    locale: videoLocale,
    voice: input.voice,
    selfieUrl: photos[0],
    photoUrls: photos,
    palette: input.palette ?? "dusk",
    people: input.people.map((p, i) => ({ id: `pe_${i + 1}`, ...p })),
    status: "queued",
    steps: initialSteps(input.tier),
    script: approved?.script,
    scriptCostCents: approved?.costCents,
    affirmations: [],
    scenes: [],
    voiceMode: "browser",
    paidCents: charge.ok ? charge.paidCents : 0,
    costCents: 0,
    templateSlug: input.templateSlug,
    // Marca de agua solo en el vídeo que invita la casa, no en los que
    // pasan gratis por no haber pasarela de pago todavía.
    watermark: charge.ok && charge.kind === "free",
    waiverAt: Date.now(),
    attribution,
  };
  if (needsCheckout) project.status = "draft";
  await db.putProject(project);

  if (needsCheckout) {
    try {
      const session = await createCheckout({
        projectId: project.id,
        priceCents,
        productName: `ManifestLifeAI · ${t.products[input.tier].name}`,
        locale,
        origin: siteOrigin(request),
        extraMetadata: attributionMetadata(attribution),
      });
      await db.patchProject(project.id, (p) => ({ ...p, stripeSessionId: session.id }));
      return NextResponse.json({ project, checkoutUrl: session.url });
    } catch (err) {
      console.error("[stripe]", err);
      await db.deleteProject(project.id);
      return NextResponse.json({ error: t.errors.paymentFailed }, { status: 502 });
    }
  }

  // La generación corre en segundo plano y la UI la sondea. En producción esto
  // es un encolado (ver comentario de cabecera de lib/pipeline.ts).
  enqueue(project.id);

  return NextResponse.json({
    project,
    estimatedProviderCostCents: estimateCostCents(input.tier, input.durationSec),
  });
}
