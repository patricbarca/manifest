import { CreateWizard } from "@/components/CreateWizard";
import { currentUser, freeVideosLeft } from "@/lib/db/session";
import { templateBySlug } from "@/lib/templates";
import { LIFE_AREAS } from "@/lib/types";
import type { LifeArea } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function CrearPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; template?: string }>;
}) {
  const { area, template } = await searchParams;
  const [user, { t, locale }] = await Promise.all([currentUser(), getDictionary()]);

  const initialArea = LIFE_AREAS.some((a) => a.id === area)
    ? (area as LifeArea)
    : undefined;

  return (
    <CreateWizard
      initialArea={initialArea}
      template={template ? templateBySlug(template) : undefined}
      freeLeft={freeVideosLeft(user)}
      t={t}
      locale={locale}
    />
  );
}
