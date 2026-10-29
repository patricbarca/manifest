/** Marca de ManifestLifeAI: orbe de vidrio con el sol saliendo en el horizonte. */
export function LogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <radialGradient id="ml-orb" cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor="#FFEBDD" />
          <stop offset="0.45" stopColor="#F2B8A6" />
          <stop offset="1" stopColor="#8B78C4" />
        </radialGradient>
        <linearGradient id="ml-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF1D2" />
          <stop offset="1" stopColor="#FFB27A" />
        </linearGradient>
        <linearGradient id="ml-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.04" />
        </linearGradient>
        <clipPath id="ml-clip">
          <circle cx="32" cy="32" r="29" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="29" fill="url(#ml-orb)" />
      <g clipPath="url(#ml-clip)">
        <path d="M20 38 A12 12 0 0 1 44 38 Z" fill="url(#ml-sun)" />
        <rect x="0" y="38" width="64" height="26" fill="url(#ml-sea)" />
      </g>
      <line x1="7" y1="38" x2="57" y2="38" stroke="#fff" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="23" cy="17" rx="10" ry="5.5" fill="#fff" fillOpacity="0.55" transform="rotate(-18 23 17)" />
      <circle cx="32" cy="32" r="29" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.2" />
    </svg>
  );
}

/** El nombre se ve siempre; `compact` lo hace algo más pequeño en el móvil para dejar sitio a la navegación. */
export function Logo({ size = 24, compact = false }: { size?: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className={`font-semibold tracking-[-0.02em] text-[var(--color-label-1)] ${compact ? "text-[13px] sm:text-[15px]" : "text-[15px]"}`}>ManifestLifeAI</span>
    </span>
  );
}
