import Link from "next/link";
import { currentUser } from "@/lib/db/session";
import { db } from "@/lib/db/store";
import { planById } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi biblioteca — Manifest" };

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
  const plan = planById(user.plan);

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Mi biblioteca</h1>
          <p className="mt-2 text-white/50">
            Plan {plan.name} · <span className="text-gold">{user.credits} créditos</span>
          </p>
        </div>
        <Link
          href="/crear"
          className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink-950 transition hover:bg-gold-deep"
        >
          Crear vídeo
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="card mt-10 rounded-xl2 p-12 text-center">
          <p className="font-display text-2xl">Todavía no has creado nada</p>
          <p className="mx-auto mt-2 max-w-sm text-white/50">
            Empieza por el área que más te pese ahora mismo. Se tarda menos de dos minutos.
          </p>
          <Link
            href="/crear"
            className="mt-7 inline-block rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink-950"
          >
            Crear mi primer vídeo
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const cover = p.scenes.find((s) => s.imageUrl)?.imageUrl;
            return (
              <Link
                key={p.id}
                href={`/video/${p.id}`}
                className="card card-hover overflow-hidden rounded-xl2"
              >
                <div className="relative aspect-[9/16] bg-ink-800">
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-sm text-white/25">
                      sin escenas
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px]">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
                <div className="p-4">
                  <p className="truncate font-medium">{p.title}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {p.tier === "vision" ? "Visión" : "Cine"} · {p.durationSec} s ·{" "}
                    {new Date(p.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
