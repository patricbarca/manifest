import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manifest — visualiza lo que estás construyendo",
  description:
    "Sube una foto y recibe un vídeo de visualización con tu cara, tu guion y una voz que te acompaña mientras repites tus afirmaciones en voz alta.",
};

export const viewport: Viewport = {
  themeColor: "#07060d",
};

const NAV = [
  { href: "/crear", label: "Crear" },
  { href: "/market", label: "Market" },
  { href: "/precios", label: "Precios" },
  { href: "/biblioteca", label: "Mi biblioteca" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh antialiased">
        <div className="aurora" />
        <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link href="/" className="font-display text-xl tracking-tight">
              Manifest<span className="text-gold">.</span>
            </Link>
            <nav className="hidden items-center gap-7 text-sm text-white/65 sm:flex">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/crear"
              className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-gold-deep"
            >
              Crear mi vídeo
            </Link>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-24 border-t border-white/5 py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Manifest</p>
            <p className="max-w-md text-xs leading-relaxed">
              Manifest es una herramienta de visualización y enfoque. No sustituye
              tratamiento médico ni asesoramiento financiero, y no garantiza resultados.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
