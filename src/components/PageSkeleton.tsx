/**
 * Esqueleto que se ve al instante mientras llega la página (loading.tsx).
 * Así al tocar un botón la app responde enseguida, aunque los datos tarden.
 */
export function PageSkeleton({ variant = "list" }: { variant?: "profile" | "list" | "grid" }) {
  const block = "animate-pulse rounded-[var(--radius-md)] bg-white/[0.06]";
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6" aria-busy="true">
      {variant === "profile" && (
        <div className="flex items-center gap-4">
          <span className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <span className={`${block} block h-5 w-40`} />
            <span className={`${block} block h-4 w-24`} />
          </div>
        </div>
      )}
      <span className={`${block} block h-9 w-full`} />
      {variant === "list" ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`${block} block aspect-[4/5] w-full`} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className={`${block} block aspect-[9/16]`} />
          ))}
        </div>
      )}
    </div>
  );
}
