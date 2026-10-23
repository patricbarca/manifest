"use client";

import { useRef, useState } from "react";

/** Vídeo promo del inicio: arranca en silencio (los navegadores lo exigen) y se activa el sonido con un toque. */
export function HeroVideo({ src, poster, soundLabel }: { src: string; poster: string; soundLabel: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function unmute() {
    const v = ref.current;
    if (!v) return;
    v.muted = false;
    v.currentTime = 0;
    void v.play();
    setMuted(false);
  }

  return (
    <div className="relative aspect-[9/16] w-full">
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        controls={!muted}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {muted && (
        <button
          type="button"
          onClick={unmute}
          className="t-caption absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-4 py-2 text-white backdrop-blur"
        >
          🔊 {soundLabel}
        </button>
      )}
    </div>
  );
}
