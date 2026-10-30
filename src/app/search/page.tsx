import { redirect } from "next/navigation";
import { PeopleSearch } from "@/components/PeopleSearch";
import { me } from "@/lib/social/me";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

/** Buscar personas (lupa de la cabecera): por nombre o @usuario, solo perfiles visibles. */
export default async function SearchPage() {
  const who = await me();
  if (!who) redirect("/login?next=/search");
  const { t } = await getDictionary();
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="t-headline">{t.nav.search}</h1>
      <PeopleSearch autoFocus t={{ placeholder: t.feed.searchPlaceholder, none: t.feed.searchNone, circleOnly: t.feed.searchCircleOnly }} />
    </div>
  );
}
