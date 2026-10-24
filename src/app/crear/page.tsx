import { CreateWizard } from "@/components/CreateWizard";
import { currentUser, freeVideosLeft, isSignedIn } from "@/lib/db/session";
import { redirect } from "next/navigation";
import { templateBySlug } from "@/lib/templates";
import { LIFE_AREAS, TIERS } from "@/lib/types";
import type { LifeArea } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";
import { creditsLeft, isMember, priceForUser } from "@/lib/membership";
import { db } from "@/lib/db/store";

export const dynamic = "force-dynamic";

export default async function CrearPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; template?: string; continuar?: string; tier?: string }>;
}) {
  const { area, template, continuar, tier } = await searchParams;
  // Con cuentas activas, crear exige sesión: así el vídeo (y lo pagado) queda en su cuenta.
  if (!(await isSignedIn())) {
    const q = new URLSearchParams();
    if (area) q.set("area", area);
    if (template) q.set("template", template);
    if (continuar) q.set("continuar", continuar);
    if (tier) q.set("tier", tier);
    const back = `/crear${q.size ? `?${q}` : ""}`;
    redirect(`/entrar?next=${encodeURIComponent(back)}`);
  }
  const [user, { t, locale }] = await Promise.all([currentUser(), getDictionary()]);

  // La plantilla del mes es para socios: al resto se le enseña el plan.
  const tpl = template ? templateBySlug(template) : undefined;
  if (tpl?.membersOnly && !isMember(user)) redirect("/precios#socio");

  // Siguiente capítulo: solo de un vídeo propio.
  const previous = continuar ? await db.getProject(continuar) : undefined;
  const chapter = previous && previous.ownerId === user.id ? previous : undefined;

  const initialArea = LIFE_AREAS.some((a) => a.id === area)
    ? (area as LifeArea)
    : chapter?.area;

  return (
    <CreateWizard
      initialArea={initialArea}
      template={tpl}
      initialTier={TIERS.find((x) => x === tier)}
      freeLeft={freeVideosLeft(user)}
      prices={{
        vision: priceForUser("vision", user),
        cinematic: priceForUser("cinematic", user),
        elevated: priceForUser("elevated", user),
      }}
      member={isMember(user)}
      includedLeft={creditsLeft(user)}
      chapterOf={
        chapter
          ? {
              title: chapter.title,
              desires: chapter.desires?.length ? chapter.desires : [chapter.intention],
              tier: chapter.tier,
              style: chapter.style,
              tone: chapter.tone,
            }
          : undefined
      }
      t={t}
      locale={locale}
    />
  );
}
