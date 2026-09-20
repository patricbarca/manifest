"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { AmbientPad } from "@/lib/audio/ambient";

/**
 * El reproductor.
 *
 * Es el producto de verdad, más que el MP4: aquí es donde la frase aparece
 * grande, la voz la dice, y luego se queda un silencio para que el usuario la
 * repita en voz alta. Ese hueco es deliberado — es la mitad del ejercicio.
 *
 * Reloj: si hay pista de voz, manda el <audio> (su duración real no coincide
 * con la teórica, así que las escenas se escalan a ella). Si no hay pista, un
 * rAF lleva el tiempo y la voz del navegador lee cada frase al entrar.
 */

type Props = { project: Project };

export function VisualizationPlayer({ project }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef<{ t: number; last: number }>({ t: 0, last: 0 });
  const spokenRef = useRef<number>(-1);
  const padRef = useRef<AmbientPad | null>(null);

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [loop, setLoop] = useState(true);
  const [music, setMusic] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);

  const hasVoiceFile = project.voiceMode === "file" && !!project.voiceUrl;
  const useBrowserVoice = project.voiceMode === "browser";

  /** La voz real dura lo que dura: las escenas se estiran para encajar. */
  const scale = useMemo(() => {
    if (!hasVoiceFile || !audioDuration) return 1;
    return audioDuration / project.durationSec;
  }, [hasVoiceFile, audioDuration, project.durationSec]);

  const duration = project.durationSec * scale;

  const scenes = useMemo(
    () =>
      project.scenes.map((s) => ({
        ...s,
        startSec: s.startSec * scale,
        endSec: s.endSec * scale,
      })),
    [project.scenes, scale],
  );

  const lines = useMemo(
    () =>
      project.affirmations.map((a) => ({
        ...a,
        startSec: a.startSec * scale,
        endSec: a.endSec * scale,
      })),
    [project.affirmations, scale],
  );

  /**
   * "El ultimo que ya ha empezado", no "aquel en cuyo rango caigo".
   *
   * Las afirmaciones dejan un hueco de silencio al final de cada franja para
   * que el usuario repita; con una busqueda por rango, ese hueco no casa con
   * nada y la frase (y la escena) saltarian a la primera en cada pausa.
   */
  const lastStarted = (items: { startSec: number }[]) => {
    let index = 0;
    for (let i = 0; i < items.length; i++) {
      if (time >= items[i].startSec) index = i;
      else break;
    }
    return index;
  };

  const sceneIndex = lastStarted(scenes);
  const lineIndex = lastStarted(lines);
  const activeLine = lines[lineIndex];
  /** Entre el final de una frase y el inicio de la siguiente: turno del usuario. */
  const inEcho = !!activeLine && time > activeLine.endSec;

  // ── Reloj ────────────────────────────────────────────────────────────────
  const tick = useCallback(
    (now: number) => {
      const clock = clockRef.current;
      const delta = clock.last ? (now - clock.last) / 1000 : 0;
      clock.last = now;
      clock.t += delta;

      if (clock.t >= duration) {
        if (loop) {
          clock.t = 0;
          spokenRef.current = -1;
        } else {
          clock.t = duration;
          setTime(duration);
          setPlaying(false);
          return;
        }
      }
      setTime(clock.t);
      rafRef.current = requestAnimationFrame(tick);
    },
    [duration, loop],
  );

  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      clockRef.current.last = 0;
      return;
    }
    if (hasVoiceFile) return; // el <audio> lleva el tiempo
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, tick, hasVoiceFile]);

  // ── Voz del navegador (modo demo y fallback) ─────────────────────────────
  useEffect(() => {
    if (!playing || !useBrowserVoice || !voiceOn) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (spokenRef.current === lineIndex) return;

    spokenRef.current = lineIndex;
    const text = lines[lineIndex]?.text;
    if (!text) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = project.tone === "calma" ? 0.82 : project.tone === "firme" ? 0.95 : 0.9;
    utter.pitch = project.tone === "firme" ? 0.95 : 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [playing, lineIndex, lines, useBrowserVoice, voiceOn, project.tone]);

  useEffect(() => {
    if (playing) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [playing]);

  // ── Música ambiente generada, sin fichero ni licencias ───────────────────
  useEffect(() => {
    if (playing && music) {
      padRef.current ??= new AmbientPad();
      void padRef.current.start();
    } else {
      padRef.current?.stop();
    }
  }, [playing, music]);

  useEffect(() => {
    return () => {
      padRef.current?.dispose();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ── Controles ────────────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    setPlaying((was) => {
      const next = !was;
      const audio = audioRef.current;
      if (hasVoiceFile && audio) {
        if (next) void audio.play();
        else audio.pause();
      }
      return next;
    });
  }, [hasVoiceFile]);

  const restart = useCallback(() => {
    clockRef.current.t = 0;
    clockRef.current.last = 0;
    spokenRef.current = -1;
    setTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  }, []);

  const goFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "f") goFullscreen();
      if (e.key === "r") restart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, goFullscreen, restart]);

  const scene = scenes[sceneIndex];
  const progress = duration ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        ref={shellRef}
        className="relative aspect-[9/16] w-full overflow-hidden rounded-xl2 bg-ink-900 shadow-2xl ring-1 ring-white/10"
      >
        {/* Escena */}
        {scene?.videoUrl ? (
          <video
            key={scene.id}
            src={scene.videoUrl}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : scene?.imageUrl ? (
          <img
            key={scene.id}
            src={scene.imageUrl}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover kb-${sceneIndex % 3}`}
            style={
              {
                "--kb-duration": `${Math.max(2, (scene.endSec - scene.startSec) * 1.3)}s`,
                animationPlayState: playing ? "running" : "paused",
              } as React.CSSProperties
            }
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-white/40">
            Sin escenas todavía
          </div>
        )}

        {/* Legibilidad del texto sobre cualquier imagen */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />

        {/* Afirmación */}
        <div className="absolute inset-x-0 bottom-0 p-6 pb-24">
          <p
            key={lineIndex}
            className="fade-up font-display text-3xl leading-tight text-white drop-shadow-lg"
          >
            {activeLine?.text ?? project.script?.hook ?? ""}
          </p>

          <div className="mt-4 h-6">
            {inEcho && playing ? (
              <p className="breathe text-sm font-medium tracking-wide text-gold">
                ahora tú — dilo en voz alta
              </p>
            ) : lines[lineIndex + 1] ? (
              <p className="truncate text-sm text-white/35">{lines[lineIndex + 1].text}</p>
            ) : null}
          </div>
        </div>

        {project.watermark && (
          <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] tracking-wider text-white/60">
            MANIFEST
          </span>
        )}

        {/* Estado inicial / pausa */}
        {!playing && (
          <button
            onClick={toggle}
            aria-label="Reproducir"
            className="absolute inset-0 grid place-items-center bg-black/35 transition hover:bg-black/25"
          >
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/95 text-ink-950 shadow-xl">
              <svg width="26" height="30" viewBox="0 0 26 30" fill="currentColor" aria-hidden>
                <path d="M2 2.6c0-1.2 1.3-2 2.4-1.4l19 12.4c1 .7 1 2.2 0 2.9l-19 12.4c-1.1.7-2.4-.1-2.4-1.4V2.6Z" />
              </svg>
            </span>
          </button>
        )}

        {/* Progreso con marcas por escena */}
        <div className="absolute inset-x-0 bottom-14 px-6">
          <div className="relative h-0.5 w-full rounded bg-white/20">
            <div
              className="absolute inset-y-0 left-0 rounded bg-gold transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            {scenes.map((s) => (
              <span
                key={s.id}
                className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-white/35"
                style={{ left: `${(s.startSec / duration) * 100}%` }}
              />
            ))}
          </div>
        </div>

        {/* Controles */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-5 pb-4 text-white/75">
          <IconButton label={playing ? "Pausa" : "Reproducir"} onClick={toggle}>
            {playing ? "❚❚" : "▶"}
          </IconButton>
          <IconButton label="Empezar de nuevo" onClick={restart}>
            ↺
          </IconButton>
          <IconButton
            label={loop ? "Repetición activada" : "Repetición desactivada"}
            active={loop}
            onClick={() => setLoop((v) => !v)}
          >
            ∞
          </IconButton>
          <IconButton
            label={music ? "Silenciar música" : "Activar música"}
            active={music}
            onClick={() => setMusic((v) => !v)}
          >
            ♪
          </IconButton>
          {useBrowserVoice && (
            <IconButton
              label={voiceOn ? "Silenciar voz" : "Activar voz"}
              active={voiceOn}
              onClick={() => setVoiceOn((v) => !v)}
            >
              ☊
            </IconButton>
          )}
          <span className="ml-auto text-xs tabular-nums text-white/55">
            {fmt(time)} / {fmt(duration)}
          </span>
          <IconButton label="Pantalla completa" onClick={goFullscreen}>
            ⛶
          </IconButton>
        </div>

        {hasVoiceFile && (
          <audio
            ref={audioRef}
            src={project.voiceUrl}
            preload="auto"
            loop={loop}
            onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onEnded={() => !loop && setPlaying(false)}
          />
        )}
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-white/40">
        Ponte los auriculares, míralo entero y repite cada frase en voz alta cuando
        aparezca <span className="text-gold/80">ahora tú</span>. Dos veces al día, mañana y
        antes de dormir.
      </p>
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-full text-sm transition ${
        active ? "bg-white/20 text-white" : "bg-black/35 hover:bg-white/15"
      }`}
    >
      {children}
    </button>
  );
}

function fmt(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
