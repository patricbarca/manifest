import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/inter";
import "./globals.css";
import { LocaleToggle } from "@/components/LocaleToggle";
import { Logo } from "@/components/Logo";
import { getDictionary } from "@/lib/i18n/server";

/** Correo de contacto público: solo se muestra si está configurado. */
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manifest-production-7582.up.railway.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "ManifestLifeAI — see yourself living it",
  description:
    "Upload a photo and get a visualization video with your face, your script and a voice that guides you while you repeat your affirmations out loud.",
};

export const viewport: Viewport = { themeColor: "#0a0a0b" };

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, locale } = await getDictionary();

  const nav = [
    { href: "/crear", label: t.nav.create },
    { href: "/market", label: t.nav.market },
    { href: "/precios", label: t.nav.pricing },
    { href: "/biblioteca", label: t.nav.library },
  ];

  return (
    <html lang={locale}>
      <body className="grain min-h-dvh">
        <header className="material-chrome sticky top-0 z-40 border-b border-[var(--color-hairline)]">
          <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-6">
            <Link href="/" aria-label="ManifestLifeAI">
              <Logo size={26} />
            </Link>

            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="t-sub text-[var(--color-label-2)] transition-colors duration-200 hover:text-[var(--color-label-1)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2.5">
              <LocaleToggle current={locale} />
              <Link
                href="/crear"
                className="interactive rounded-full bg-white px-4 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-black hover:bg-white/90"
              >
                {t.nav.start}
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10">{children}</main>

        <footer className="relative z-10 mt-32 border-t border-[var(--color-hairline)]">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <Logo size={22} />
              <nav className="flex flex-wrap gap-x-5 gap-y-2">
                {[
                  { href: "/privacidad", label: t.footer.privacy },
                  { href: "/terminos", label: t.footer.terms },
                  { href: "/reembolsos", label: t.footer.refunds },
                  ...(CONTACT ? [{ href: `mailto:${CONTACT}`, label: t.footer.contact }] : []),
                ].map((l) => (
                  <a key={l.href} href={l.href} className="t-caption text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">
                    {l.label}
                  </a>
                ))}
              </nav>
              <p className="t-caption text-[var(--color-label-3)]">
                © {new Date().getFullYear()} ManifestLifeAI
              </p>
            </div>
            <p className="t-caption max-w-sm leading-relaxed text-[var(--color-label-3)]">
              {t.footer.disclaimer}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
