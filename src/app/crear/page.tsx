import { CreateWizard } from "@/components/CreateWizard";
import { currentUser } from "@/lib/db/session";
import { blueprintBySlug } from "@/lib/blueprints";
import { LIFE_AREAS } from "@/lib/types";
import type { LifeArea } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CrearPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; blueprint?: string }>;
}) {
  const { area, blueprint } = await searchParams;
  const user = await currentUser();

  const initialArea = LIFE_AREAS.some((a) => a.id === area)
    ? (area as LifeArea)
    : undefined;

  return (
    <CreateWizard
      initialArea={initialArea}
      blueprint={blueprint ? blueprintBySlug(blueprint) : undefined}
      credits={user.credits}
    />
  );
}
