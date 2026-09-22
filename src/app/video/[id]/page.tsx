import { notFound } from "next/navigation";
import { VideoStage } from "@/components/VideoStage";
import { db } from "@/lib/db/store";
import { currentUser } from "@/lib/db/session";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, project] = await Promise.all([currentUser(), db.getProject(id)]);

  // Un vídeo lleva la cara de quien lo hizo. Si no es tuyo, para ti no existe.
  if (!project || project.ownerId !== user.id) notFound();

  return <VideoStage initial={project} />;
}
