import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manifest — visualiza lo que estás construyendo",
  description:
    "Sube una foto y recibe un vídeo de visualización con tu cara, tu guion y una voz que te acompaña mientras repites tus afirmaciones en voz alta.",
};

export const viewport: Viewport = { themeColor: "#0a0a0b" };

const NAV = [
  { href: "/crear", label: "Crear" },
  { href: "/market", label: "Market" },
  { href: "/precios", label: "Precios" },
  { href: "/biblioteca", label: "Biblioteca" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="grain min-h-dvh">
        {/* La barra flota sobre el contenido y lo deja translucir. */}
        <header className="material-chrome sticky top-0 z-40 border-b border-[var(--color-hairline)]">
          <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-6">
            <Link
              href="/"
              className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--color-label-1)]"
            >
              Manifest
            </Link>

            <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="t-sub text-[var(--color-label-2)] transition-colors duration-200 hover:text-[var(--color-label-1)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/crear"
              className="interactive rounded-full bg-white px-4 py-1.5 text-[13px] font-medium tracking-[-0.01em] text-black hover:bg-white/90"
            >
              Empezar
            </Link>
          </div>
        </header>

        <main className="relative z-10">{children}</main>

        <footer className="relative z-10 mt-32 border-t border-[var(--color-hairline)]">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
            <p className="t-caption text-[var(--color-label-3)]">
              © {new Date().getFullYear()} Manifest
            </p>
            <p className="t-caption max-w-sm leading-relaxed text-[var(--color-label-3)]">
              Manifest es una herramienta de visualización y enfoque. No sustituye
              tratamiento médico ni asesoramiento financiero, y no garantiza resultados.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
