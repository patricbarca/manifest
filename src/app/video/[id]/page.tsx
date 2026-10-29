import { notFound } from "next/navigation";
import { VideoStage } from "@/components/VideoStage";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { db } from "@/lib/db/store";
import { currentUser } from "@/lib/db/session";
import { getDictionary } from "@/lib/i18n/server";
import { TrackPurchase } from "@/components/Tracking";
import { priceUsd } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; sid?: string }> }) {
  const { id } = await params;
  const { paid, sid } = await searchParams;
  const [user, project, { t }] = await Promise.all([
    currentUser(),
    db.getProject(id),
    getDictionary(),
  ]);

  // Un vídeo lleva la cara de quien lo hizo. Si no es tuyo, para ti no existe.
  if (!project || project.ownerId !== user.id) notFound();

  const busy = project.status === "generating" || project.status === "queued";
  return (
    <>
      {/* Vuelve de Stripe: compra para Google Ads / TikTok (una vez por pedido). */}
      {paid === "1" && sid?.startsWith("cs_") && (
        <TrackPurchase id={sid.slice(0, 80)} value={(project.paidCents ?? 0) / 100 || priceUsd(project.tier)} />
      )}
      <VideoStage initial={project} t={t} />
      {!busy && <DeleteProjectButton id={project.id} labels={t.deleteVideo} />}
    </>
  );
}
