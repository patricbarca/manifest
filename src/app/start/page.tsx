import type { Metadata } from "next";
import Link from "next/link";
import { HeroVideo } from "@/components/HeroVideo";
import { formatUsd, priceUsd } from "@/lib/pricing";
import { getDictionary } from "@/lib/i18n/server";
import { fill } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "See yourself living it — ManifestLifeAI",
  // Página solo para anuncios: no compite con la portada en buscadores.
  robots: { index: false, follow: false },
};

/** Las UTM del anuncio siguen hasta crear el vídeo, para medir qué anuncio vende. */
function withUtm(href: string, sp: Record<string, string | string[] | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (/^(utm_[a-z]+|fbclid|gclid|ttclid)$/.test(k) && typeof v === "string") q.set(k, v.slice(0, 200));
  }
  const s = q.toString();
  return s ? `${href}?${s}` : href;
}

/** Landing para tráfico de anuncios: un vídeo, tres pasos, el precio y un solo botón. */
export default async function StartPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t } = await getDictionary();
  const L = t.start;
  const sp = await searchParams;
  const create = withUtm("/create", sp);
  // Versión por ángulo del anuncio: /start?a=money|body|love|travel. El titular repite la promesa del anuncio.
  const angle = typeof sp.a === "string" && sp.a in L.angles ? L.angles[sp.a as keyof typeof L.angles] : null;
  const title = angle?.title ?? L.title;
  const lede = angle?.lede ?? L.lede;
  const price = formatUsd(priceUsd("cinematic"));
  const cta = (
    <Link href={create} className="interactive inline-block rounded-full bg-white px-7 py-3.5 text-[16px] font-semibold tracking-[-0.011em] text-black hover:bg-white/90">
      {L.cta}
    </Link>
  );

  return (
    <div className="mx-auto max-w-xl px-5 pb-24">
      <section className="pt-12 text-center sm:pt-16">
        <h1 className="t-display text-balance">{title}</h1>
        <p className="t-body mx-auto mt-4 max-w-md text-pretty text-[var(--color-label-2)]">{lede}</p>
        <div className="relative mx-auto mt-8 w-full max-w-[280px]">
          <div className="absolute -inset-12 -z-10 rounded-full bg-white/[0.045] blur-3xl" />
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-hairline)] bg-black">
            <HeroVideo src="/videos/promo-en.mp4" poster="/videos/promo-en.jpg" soundLabel={t.home.soundOn} />
          </div>
        </div>
        <div className="mt-8">{cta}</div>
        <p className="t-caption mt-3 text-[var(--color-label-3)]">{fill(L.priceNote, { price })}</p>
        <p className="t-caption mt-1 text-emerald-300/90">✓ {L.guarantee}</p>
      </section>

      <section className="mt-16">
        <h2 className="t-title text-center">{L.howTitle}</h2>
        <ol className="mt-8 space-y-4">
          {L.steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-[var(--radius-md)] border border-[var(--color-hairline)] p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[14px] font-semibold text-black">{i + 1}</span>
              <span>
                <span className="t-headline block">{s.title}</span>
                <span className="t-sub mt-1 block text-[var(--color-label-2)]">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 grid grid-cols-2 gap-3">
        {[
          { src: "/videos/demo-woman-en.mp4", poster: "/videos/demo-woman-en.jpg" },
          { src: "/videos/demo-man-en.mp4", poster: "/videos/demo-man-en.jpg" },
        ].map((v) => (
          <video key={v.src} src={v.src} poster={v.poster} muted loop playsInline autoPlay preload="none" className="aspect-[9/16] w-full rounded-[var(--radius-md)] object-cover" />
        ))}
        <p className="t-caption col-span-2 text-center text-[var(--color-label-3)]">{L.examplesNote}</p>
      </section>

      <section className="mt-16 space-y-3">
        {L.points.map((p) => (
          <p key={p} className="t-sub flex gap-3 text-[var(--color-label-1)]">
            <span className="text-emerald-300">✓</span>
            {p}
          </p>
        ))}
      </section>

      <section className="mt-16 divide-y divide-[var(--color-hairline)] border-y border-[var(--color-hairline)]">
        {L.faq.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="t-headline flex cursor-pointer list-none items-center justify-between gap-4">
              {item.q}
              <span className="text-[var(--color-label-3)] transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="t-sub mt-2 text-pretty text-[var(--color-label-2)]">{fill(item.a, { price })}</p>
          </details>
        ))}
      </section>

      <section className="mt-16 text-center">
        <h2 className="t-title text-balance">{L.closing}</h2>
        <div className="mt-7">{cta}</div>
        <p className="t-caption mt-3 text-emerald-300/90">✓ {L.guarantee}</p>
        <p className="t-caption mx-auto mt-6 max-w-sm text-[var(--color-label-3)]">{L.disclaimer}</p>
      </section>
    </div>
  );
}
