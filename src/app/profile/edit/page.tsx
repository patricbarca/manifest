import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileSettings } from "@/components/ProfileSettings";
import { me } from "@/lib/social/me";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Ajustes del perfil: foto, datos, visibilidad y qué vídeos se muestran. */
export default async function EditarPerfilPage() {
  const who = await me();
  if (!who) redirect("/login?next=/profile/edit");
  const { t } = await getDictionary();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/profile" className="t-sub text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">← {t.aura.nav}</Link>
        <h1 className="t-headline">{t.aura.editProfile}</h1>
        <span className="w-14" />
      </div>

      <ProfileSettings initial={who.profile} origin={origin} t={t.aura} />

      <Link href="/settings" className="t-sub block text-center text-[var(--color-label-2)] underline-offset-4 hover:underline">
        {t.settings.title}: {t.settings.appearance.toLowerCase()}, {t.settings.language.toLowerCase()}, {t.settings.notifications.toLowerCase()}, {t.settings.photos.toLowerCase()} →
      </Link>
    </div>
  );
}
