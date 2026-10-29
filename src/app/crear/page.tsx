import { CreateWizard } from "@/components/CreateWizard";
import { canCreateNow, currentUser, freeVideosLeft, isSignedIn } from "@/lib/db/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { templateBySlug } from "@/lib/templates";
import { LIFE_AREAS, TIERS } from "@/lib/types";
import type { LifeArea } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function CrearPage({
  searchParams,
}: {
  searchParams: Promise<{ area?: string; template?: string; tier?: string }>;
}) {
  const { area, template, tier } = await searchParams;
  // Con cuentas activas, crear exige sesión: así el vídeo (y lo pagado) queda en su cuenta.
  if (!(await isSignedIn())) {
    const q = new URLSearchParams();
    if (area) q.set("area", area);
    if (template) q.set("template", template);
    if (tier) q.set("tier", tier);
    const back = `/crear${q.size ? `?${q}` : ""}`;
    redirect(`/entrar?next=${encodeURIComponent(back)}`);
  }
  const [user, { t, locale }] = await Promise.all([currentUser(), getDictionary()]);
  if (!canCreateNow(user)) {
    return (
      <div className="mx-auto max-w-[1120px] px-6 py-24 text-center">
        <p className="t-body mx-auto max-w-sm text-[var(--color-label-2)]">{t.errors.paymentsSoon}</p>
        <Link href="/" className="t-caption mt-6 inline-block underline">
          ManifestLifeAI
        </Link>
      </div>
    );
  }

  const initialArea = LIFE_AREAS.some((a) => a.id === area)
    ? (area as LifeArea)
    : undefined;

  return (
    <CreateWizard
      initialArea={initialArea}
      template={template ? templateBySlug(template) : undefined}
      initialTier={TIERS.find((x) => x === tier)}
      freeLeft={freeVideosLeft(user)}
      t={t}
      locale={locale}
    />
  );
}
