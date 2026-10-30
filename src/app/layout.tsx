import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { appBase, isAppHostHeader, siteBase } from "@/lib/hosts";
import { NavPills } from "@/components/NavPills";
import "@fontsource-variable/inter";
import "./globals.css";
import { LocaleToggle } from "@/components/LocaleToggle";
import { Logo } from "@/components/Logo";
import { authUser } from "@/lib/supabase/server";
import { authEnabled } from "@/lib/supabase/config";
import { getDictionary } from "@/lib/i18n/server";
import { trackingConfig } from "@/lib/tracking";
import { CookieSettingsLink, Tracking } from "@/components/Tracking";
import { Icon } from "@/components/Icon";
import { ThemeSync } from "@/components/ThemeSync";
import { THEME_COLOR, THEME_COOKIE, THEME_SCRIPT, parseTheme } from "@/lib/theme";

/** Correo de contacto público: solo se muestra si está configurado. */
const CONTACT = process.env.CONTACT_EMAIL;
const SITE_URL = process.env.SITE_URL ?? "https://manifestlife.ai";

export const metadata: Metadata = {
  appleWebApp: { capable: true, title: "ManifestLifeAI", statusBarStyle: "black-translucent" },
  metadataBase: new URL(SITE_URL),
  title: "ManifestLifeAI — see yourself living it",
  description:
    "Upload a photo and get a visualization video with your face, your script and a voice that guides you while you repeat your affirmations out loud.",
};

/** Color de la barra del navegador según el tema elegido en Ajustes. */
export async function generateViewport(): Promise<Viewport> {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  if (theme === "system") {
    return {
      themeColor: [
        { media: "(prefers-color-scheme: light)", color: THEME_COLOR.light },
        { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.dark },
      ],
    };
  }
  return { themeColor: THEME_COLOR[theme] };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, locale } = await getDictionary();
  const auth = authEnabled() ? await authUser() : null;
  const signedIn = !!auth;
  // ¿Dentro de la app (app.manifestlife.ai) o en la web pública?
  const h = await headers();
  const inApp = isAppHostHeader(h.get("x-forwarded-host") ?? h.get("host"));
  const splitHosts = !!process.env.APP_URL;
  const app = splitHosts && !inApp ? appBase() : ""; // enlaces de la web a la app
  const site = inApp ? siteBase() : ""; // enlaces de la app a la web
  const tracking = trackingConfig();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  // Menú de la web pública (sin "Crear": ese es el botón de la derecha, que lleva a la app).
  const nav = [
    ...(splitHosts ? [] : [{ href: "/create", label: t.nav.create }]),
    { href: "/market", label: t.nav.market },
    { href: "/pricing", label: t.nav.pricing },
    { href: "/blog", label: t.nav.blog },
  ];

  return (
    // "system" se resuelve en el navegador antes de pintar (THEME_SCRIPT).
    <html lang={locale} data-theme={theme === "system" ? undefined : theme} data-theme-pref={theme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="grain min-h-dvh">
        <ThemeSync pref={theme} />
        <header className="material-chrome sticky top-0 z-40 border-b border-[var(--color-hairline)]">
          <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between gap-4 px-6">
            <Link href={inApp ? "/profile" : "/"} aria-label="ManifestLifeAI">
              <Logo size={26} compact={signedIn} />
            </Link>

            <nav className={`absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 ${inApp ? "" : "md:flex"}`}>
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
              {splitHosts && !inApp ? (
                // Web pública con la app aparte: "Entrar" para quien ya tiene cuenta y
                // "Crear", que lleva directo al login de la app.
                <>
                  <span className="hidden sm:inline-flex"><LocaleToggle current={locale} /></span>
                  <a href={`${app}/login`} className="t-sub px-1 text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">
                    {t.nav.login}
                  </a>
                  <a
                    href={`${app}/login?next=/create`}
                    className="interactive rounded-full bg-white px-4 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-black hover:bg-white/90"
                  >
                    {t.nav.create}
                  </a>
                </>
              ) : signedIn ? (
                // Con sesión: feed, perfil, ajustes y crear otra visualización.
                <>
                  <NavPills feed={t.nav.feed} profile={t.aura.nav} />
                  <Link
                    href="/settings"
                    aria-label={t.settings.title}
                    title={t.settings.title}
                    className="interactive grid h-8 w-8 place-items-center rounded-full text-[var(--color-label-2)] hover:text-[var(--color-label-1)]"
                  >
                    <Icon name="settings" size={19} />
                  </Link>
                  <Link
                    href="/create"
                    className="interactive rounded-full bg-white px-4 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-black hover:bg-white/90"
                  >
                    + <span className="sm:hidden">{t.nav.newShort}</span>
                    <span className="hidden sm:inline">{t.nav.newVisualization}</span>
                  </Link>
                </>
              ) : (
                // Sin sesión no hay "Entrar" aparte: "Empezar" ya pide entrar
                // (/create redirige a /entrar y vuelve), y dos botones al mismo sitio confunden.
                <>
                  <LocaleToggle current={locale} />
                  <Link
                    href={inApp ? "/login" : "/create"}
                    className="interactive rounded-full bg-white px-4 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-black hover:bg-white/90"
                  >
                    {inApp ? t.nav.login : t.nav.start}
                  </Link>
                </>
              )}
            </div>
          </div>
          {/* En el móvil, el menú de la web va en una segunda fila (en la app no hay). */}
          {!inApp && (
            <nav className="flex gap-5 overflow-x-auto border-t border-[var(--color-hairline)] px-6 py-2 md:hidden">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="t-sub shrink-0 text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">
                  {item.label}
                </Link>
              ))}
              {splitHosts && <span className="ml-auto shrink-0"><LocaleToggle current={locale} /></span>}
            </nav>
          )}
        </header>

        <main className="relative z-10">{children}</main>
        {tracking && <Tracking cfg={tracking} t={t.cookies} privacyHref={`${site}/privacy`} />}

        <footer className={`relative z-10 ${inApp ? "mt-16" : "mt-32"} border-t border-[var(--color-hairline)]`}>
          <div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <Logo size={22} />
              <nav className="flex flex-wrap gap-x-5 gap-y-2">
                {[
                  ...(inApp ? [] : [{ href: "/blog", label: t.nav.blog }]),
                  { href: "/privacy", label: t.footer.privacy },
                  { href: "/terms", label: t.footer.terms },
                  { href: "/refunds", label: t.footer.refunds },
                  ...(CONTACT ? [{ href: `mailto:${CONTACT}`, label: t.footer.contact }] : []),
                ].map((l) => (
                  <a key={l.href} href={l.href.startsWith("/") ? `${site}${l.href}` : l.href} className="t-caption text-[var(--color-label-2)] hover:text-[var(--color-label-1)]">
                    {l.label}
                  </a>
                ))}
                {tracking && <CookieSettingsLink label={t.cookies.settings} domain={tracking.cookieDomain} />}
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
