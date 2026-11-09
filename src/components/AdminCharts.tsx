import type { Row } from "@/lib/admin-stats";

export const n = (x: number) => new Intl.NumberFormat("es-ES").format(x);

export function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-hairline)] p-4">
      <p className="t-caption text-[var(--color-label-2)]">{label}</p>
      <p className="mt-1 text-[1.75rem] font-semibold leading-none tracking-[-0.02em] tabular-nums">{value}</p>
      {hint && <p className="t-caption mt-1.5 text-[var(--color-label-3)]">{hint}</p>}
    </div>
  );
}

export function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 rounded-[var(--radius-lg)] p-5 sm:p-6">
      <div>
        <h2 className="t-headline">{title}</h2>
        {note && <p className="t-caption mt-1 text-[var(--color-label-3)]">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/** Visitas por día: una sola serie, barras finas con su valor al pasar por encima. */
export function DayChart({ days }: { days: { date: string; visits: number; views: number }[] }) {
  if (!days.length) return <p className="t-caption text-[var(--color-label-3)]">Aún no hay visitas registradas.</p>;
  const max = Math.max(1, ...days.map((d) => d.visits));
  const fmt = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const ticks = [days[0], days[Math.floor(days.length / 2)], days[days.length - 1]];
  return (
    <figure className="viz-root">
      <figcaption className="t-caption mb-3 text-[var(--color-label-2)]">Visitas por día · máximo {n(max)}</figcaption>
      <div className="flex h-36 items-end gap-[2px] border-b border-[var(--color-hairline-strong)]" role="img" aria-label="Visitas por día">
        {days.map((d) => (
          // La columna entera es la zona de hover (más grande que la barra).
          <div key={d.date} className="group relative flex h-full flex-1 items-end" tabIndex={0}>
            <div className="w-full rounded-t-[4px] bg-[var(--viz-1)]" style={{ height: `${Math.max(2, (d.visits / max) * 100)}%` }} />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-ctl)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface-2)] px-2.5 py-1.5 text-[12px] shadow-lg group-hover:block group-focus:block">
              <span className="text-[var(--color-label-2)]">{fmt(d.date)}</span>
              <span className="ml-2 font-semibold tabular-nums text-[var(--color-label-1)]">{n(d.visits)}</span>
              <span className="ml-1 text-[var(--color-label-3)]">visitas · {n(d.views)} páginas</span>
            </div>
          </div>
        ))}
      </div>
      <div className="t-caption mt-1.5 flex justify-between text-[var(--color-label-3)]">
        {ticks.map((d, i) => (
          <span key={`${d.date}-${i}`}>{fmt(d.date)}</span>
        ))}
      </div>
      <details className="mt-3">
        <summary className="t-caption cursor-pointer text-[var(--color-label-2)] underline">Ver como tabla</summary>
        <table className="t-caption mt-2 w-full tabular-nums">
          <thead className="text-[var(--color-label-3)]">
            <tr><th className="text-left font-normal">Día</th><th className="text-right font-normal">Visitas</th><th className="text-right font-normal">Páginas vistas</th></tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date} className="border-t border-[var(--color-hairline)]"><td className="py-1">{fmt(d.date)}</td><td className="text-right">{n(d.visits)}</td><td className="text-right">{n(d.views)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

export function TopList({ title, rows }: { title: string; rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.visits));
  return (
    <div>
      <p className="t-caption mb-2 font-medium text-[var(--color-label-2)]">{title}</p>
      {rows.length ? (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="relative">
              <div className="absolute inset-y-0 left-0 rounded-[4px] bg-[var(--viz-1)] opacity-15" style={{ width: `${(r.visits / max) * 100}%` }} />
              <div className="t-caption relative flex justify-between gap-3 px-2 py-1">
                <span className="min-w-0 truncate">{r.label}</span>
                <span className="shrink-0 tabular-nums text-[var(--color-label-2)]">{n(r.visits)}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="t-caption text-[var(--color-label-3)]">Sin datos todavía.</p>
      )}
    </div>
  );
}

