import Link from "next/link";
import { redirect } from "next/navigation";
import { ComposeVideo } from "@/components/ComposeVideo";
import { me } from "@/lib/social/me";
import { manifests } from "@/lib/manifest/store";
import { VOICES } from "@/lib/voices";
import { getDictionary } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/locale";

export const dynamic = "force-dynamic";

/** Tu vídeo de manifestación: elige tus manifestaciones y se monta con ellas. */
export default async function MiVideoPage() {
  const who = await me();
  if (!who) redirect("/entrar?next=/mi-video");
  const { t, locale } = await getDictionary();
  const m = t.manifest;
  const ready = (await manifests.list(who.user.id)).filter((x) => x.status === "ready" && x.clipUrl);
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="t-title">{m.composeTitle}</h1>
        <p className="t-sub mt-1 text-[var(--color-label-2)]">{m.composeSub}</p>
      </div>
      {ready.length === 0 ? (
        <p className="t-sub text-[var(--color-label-2)]">
          {m.empty} <Link href="/manifestar" className="underline">{m.newButton}</Link>
        </p>
      ) : (
        <ComposeVideo
          items={ready.map((x) => ({ id: x.id, title: x.title, poster: x.highlight?.posterUrl ?? x.imageUrl, manifested: !!x.manifestedAt, locale: x.locale }))}
          voices={VOICES.map((v) => ({ id: v.id, label: v.label[locale as Locale] }))}
          locale={locale as Locale}
          max={8}
          t={{
            palette: t.create.palette, palettes: t.create.palettes,
            pick: m.pick, selected: m.selected, language: m.language, voice: m.voice, titleLabel: m.titleLabel, titleDefault: m.titleDefault,
            create: m.composeCreate, creating: m.creating, max: m.max,
            errors: { invalid: t.aura.errors.invalid, not_ready: m.errNotReady, busy: m.errBusy, mixed_locale: m.errMixed },
          }}
        />
      )}
    </div>
  );
}
