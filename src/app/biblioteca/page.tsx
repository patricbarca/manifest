import Link from "next/link";
import { currentUser, freeVideosLeft } from "@/lib/db/session";
import { db } from "@/lib/db/store";
import { PRODUCTS } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Biblioteca — Manifest" };

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  queued: "En cola",
  generating: "Generando",
  ready: "Listo",
  failed: "Falló",
};

export default async function BibliotecaPage() {
  const user = await currentUser();
  const projects = await db.listProjects(user.id);
  const freeLeft = freeVideosLeft(user);

  return (
    <div className="mx-auto max-w-[1120px] px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="t-title">Biblioteca</h1>
          <p className="t-sub mt-2 text-[var(--color-label-2)]">
            {projects.length} {projects.length === 1 ? "vídeo" : "vídeos"}
            {freeLeft > 0 && (
              <>
                {" · "}
                <span className="text-[var(--color-label-1)]">
                  {freeLeft === 1 ? "tu primer vídeo es gratis" : `${freeLeft} vídeos gratis`}
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          href="/crear"
          className="interactive rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-black hover:bg-white/90"
        >
          Crear vídeo
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card mt-12 rounded-[var(--radius-xl)] px-6 py-20 text-center">
          <p className="t-title">Todavía no has creado nada</p>
          <p className="t-body mx-auto mt-3 max-w-sm text-[var(--color-label-2)]">
            Empieza por el área que más te pese ahora mismo. Se tarda menos de dos minutos.
          </p>
          <Link
            href="/crear"
            className="interactive mt-8 inline-block rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-black hover:bg-white/90"
          >
            Crear mi primer vídeo
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((p) => {
            const cover = p.scenes.find((s) => s.imageUrl)?.imageUrl;
            return (
              <Link
                key={p.id}
                href={`/video/${p.id}`}
                className="interactive group overflow-hidden rounded-[var(--radius-lg)]"
              >
                <div className="relative aspect-[9/16] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)]">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <span className="t-caption text-[var(--color-label-4)]">sin escenas</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25" />
                  <span className="t-eyebrow absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1.5 text-white/85 backdrop-blur-md">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="t-sub truncate font-medium">{p.title}</p>
                    <p className="t-caption mt-0.5 text-white/55">
                      {PRODUCTS[p.tier].name} · {p.durationSec} s ·{" "}
                      {new Date(p.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
