"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PhotoGuideLabels } from "./PhotoSlots";

/** Motor de MediaPipe servido por nosotros (lo copia scripts/copy-mediapipe.mjs al construir). */
const WASM = "/mediapipe";
const MODEL = "/models/blaze_face_short_range.tflite";

/** Proporción de la foto (y del visor): vertical 3:4. */
const ASPECT = 3 / 4;
/** Óvalo guía, en fracciones del visor. */
const OVAL = { cx: 0.5, cy: 0.45, w: 0.62, h: 0.62 };
/**
 * Alto del recuadro de la cara que da el detector (cejas–barbilla), en
 * fracción del alto de la foto. 0,28–0,46 ≈ cabeza entera al 40–60 %,
 * el tamaño que mejor conserva el parecido.
 */
const FACE_MIN = 0.28;
const FACE_MAX = 0.46;
/** Giro: desplazamiento de la nariz respecto al centro de los ojos (en distancias entre ojos). */
const FRONT_MAX = 0.12;
const TURN_MIN = 0.2;
const TURN_MAX = 0.6;
/** Tiempo que tiene que estar todo bien antes de disparar. */
const HOLD_MS = 700;

type Detector = { detectForVideo: (v: HTMLVideoElement, t: number) => { detections: Det[] }; close: () => void };
type Det = {
  boundingBox?: { originX: number; originY: number; width: number; height: number };
  keypoints: { x: number; y: number }[];
};
type Shot = { slot: number; file: File; url: string };

async function loadDetector(): Promise<Detector | null> {
  try {
    const { FilesetResolver, FaceDetector } = await import("@mediapipe/tasks-vision");
    const files = await FilesetResolver.forVisionTasks(WASM);
    for (const delegate of ["GPU", "CPU"] as const) {
      try {
        return (await FaceDetector.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL, delegate },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.6,
        })) as unknown as Detector;
      } catch {}
    }
  } catch (err) {
    console.warn("[face-capture] sin detector, modo manual:", err);
  }
  return null;
}

/** Recorte vertical 3:4 centrado del vídeo: lo mismo que se ve en el visor. */
function cropOf(v: HTMLVideoElement) {
  const vw = v.videoWidth;
  const vh = v.videoHeight;
  if (vw / vh > ASPECT) {
    const w = vh * ASPECT;
    return { x: (vw - w) / 2, y: 0, w, h: vh };
  }
  const h = vw / ASPECT;
  return { x: 0, y: (vh - h) / 2, w: vw, h };
}

/**
 * Escáner de cara: cámara frontal con un óvalo. Pide 3 poses (sonriendo,
 * relajada, girando un poco) y hace cada foto sola cuando la cara está
 * centrada, al tamaño justo, con luz y en la pose pedida. Todo se analiza en
 * el móvil: nada sale de aquí hasta que la persona pulsa "Usar".
 */
export function FaceCapture({
  slots,
  t,
  onDone,
  onClose,
}: {
  /** Huecos a rellenar (0 = sonriendo, 1 = relajada, 2 = girando). */
  slots: number[];
  t: PhotoGuideLabels;
  onDone: (shots: { slot: number; file: File }[]) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const detector = useRef<Detector | null>(null);
  const okSince = useRef<number>(0);
  const lastDark = useRef<{ at: number; dark: boolean }>({ at: 0, dark: false });
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [step, setStep] = useState(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [msg, setMsg] = useState<string>(t.scanLoading);
  const [good, setGood] = useState(false);
  const [flash, setFlash] = useState(false);
  const busy = useRef(false);

  const done = step >= slots.length;
  const slot = slots[Math.min(step, slots.length - 1)];

  // Cámara + detector.
  useEffect(() => {
    let stream: MediaStream | undefined;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1440 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((tr) => tr.stop());
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => {});
        }
        detector.current = await loadDetector();
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setDenied(true);
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tr) => tr.stop());
      detector.current?.close();
      detector.current = null;
    };
  }, []);

  const capture = useCallback(async () => {
    const v = video.current;
    if (!v || busy.current || !v.videoWidth) return;
    busy.current = true;
    const c = cropOf(v);
    const scale = Math.min(1, 1600 / c.h);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(c.w * scale);
    canvas.height = Math.round(c.h * scale);
    canvas.getContext("2d")!.drawImage(v, c.x, c.y, c.w, c.h, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
    if (blob) {
      setFlash(true);
      setTimeout(() => setFlash(false), 180);
      const file = new File([blob], `selfie-${slot + 1}.jpg`, { type: "image/jpeg" });
      setShots((prev) => [...prev, { slot, file, url: URL.createObjectURL(blob) }]);
      // Pausa corta para cambiar de pose antes de la siguiente.
      setTimeout(() => {
        okSince.current = 0;
        setStep((s) => s + 1);
        busy.current = false;
      }, 900);
    } else busy.current = false;
  }, [slot]);

  // Bucle de detección.
  useEffect(() => {
    if (!ready || done) return;
    const det = detector.current;
    if (!det) {
      setMsg(t.scanManual);
      return;
    }
    let raf = 0;
    const check = () => {
      const v = video.current;
      if (v && v.readyState >= 2 && !busy.current) {
        const res = det.detectForVideo(v, performance.now());
        const c = cropOf(v);
        const faces = res.detections.filter((d) => d.boundingBox);
        let problem: string | undefined;
        if (!faces.length) problem = t.scanNoFace;
        else if (faces.length > 1) problem = t.scanOneFace;
        else {
          const b = faces[0].boundingBox!;
          const size = b.height / c.h;
          const cx = (b.originX + b.width / 2 - c.x) / c.w;
          const cy = (b.originY + b.height / 2 - c.y) / c.h;
          const [eyeR, eyeL, nose] = faces[0].keypoints;
          const eyes = Math.abs(eyeL.x - eyeR.x) || 1e-3;
          const yaw = Math.abs((nose.x - (eyeL.x + eyeR.x) / 2) / eyes);
          const turn = slot === 2;
          if (size < FACE_MIN) problem = t.scanCloser;
          else if (size > FACE_MAX) problem = t.scanFarther;
          else if (Math.abs(cx - OVAL.cx) > 0.12 || Math.abs(cy - OVAL.cy) > 0.12) problem = t.scanCenter;
          else if (!turn && yaw > FRONT_MAX) problem = t.scanFront;
          else if (turn && yaw < TURN_MIN) problem = t.scanTurn;
          else if (turn && yaw > TURN_MAX) problem = t.scanTurnLess;
          else {
            // Luz: brillo medio de la cara, medido 2 veces por segundo como mucho.
            const now = performance.now();
            if (now - lastDark.current.at > 500) {
              const s = document.createElement("canvas");
              s.width = 24;
              s.height = 24;
              const ctx = s.getContext("2d", { willReadFrequently: true })!;
              ctx.drawImage(v, b.originX, b.originY, b.width, b.height, 0, 0, 24, 24);
              const px = ctx.getImageData(0, 0, 24, 24).data;
              let sum = 0;
              for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
              // Escena entera: la luz del sitio, no el tono de piel (una piel oscura bien iluminada no es "oscura").
              ctx.drawImage(v, c.x, c.y, c.w, c.h, 0, 0, 24, 24);
              const all = ctx.getImageData(0, 0, 24, 24).data;
              let sumAll = 0;
              for (let i = 0; i < all.length; i += 4) sumAll += 0.299 * all[i] + 0.587 * all[i + 1] + 0.114 * all[i + 2];
              lastDark.current = { at: now, dark: sum / (px.length / 4) < 55 || sumAll / (all.length / 4) < 85 };
            }
            if (lastDark.current.dark) problem = t.scanDark;
          }
        }
        if (problem) {
          okSince.current = 0;
          setGood(false);
          setMsg(problem);
        } else {
          setGood(true);
          setMsg(t.scanHold);
          if (!okSince.current) okSince.current = performance.now();
          else if (performance.now() - okSince.current > HOLD_MS) void capture();
        }
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, [ready, done, slot, capture, t]);

  // Libera las vistas previas al cerrar.
  const shotsRef = useRef<Shot[]>([]);
  shotsRef.current = shots;
  useEffect(() => () => shotsRef.current.forEach((s) => URL.revokeObjectURL(s.url)), []);

  // Encima de toda la web (cabecera y pie incluidos), no dentro de la sección.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-black text-white">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(12px,env(safe-area-inset-top))]">
        <span className="t-caption text-white/70">{done ? "" : `${step + 1}/${slots.length}`}</span>
        <button type="button" onClick={onClose} className="t-sub rounded-full bg-white/10 px-3 py-1">
          {t.scanClose}
        </button>
      </div>

      {denied ? (
        <p className="t-sub m-auto max-w-xs px-6 text-center text-white/80">{t.scanDenied}</p>
      ) : done ? (
        <div className="flex flex-1 flex-col justify-center gap-5 px-4">
          <div className="grid grid-cols-3 gap-2">
            {shots.map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s.slot} src={s.url} alt="" className="aspect-[3/4] w-full rounded-[var(--radius-md)] object-cover" />
            ))}
          </div>
          <button
            type="button"
            onClick={() => onDone(shots.map(({ slot, file }) => ({ slot, file })))}
            className="interactive t-sub w-full rounded-full bg-white px-4 py-3 font-medium text-black"
          >
            {t.scanUse}
          </button>
          <button
            type="button"
            onClick={() => {
              shots.forEach((s) => URL.revokeObjectURL(s.url));
              setShots([]);
              setStep(0);
            }}
            className="t-sub w-full text-center text-white/70 underline"
          >
            {t.scanRetake}
          </button>
        </div>
      ) : (
        <>
          <p className="t-body px-6 pb-3 text-center font-medium">{t.scanSteps[slot] ?? ""}</p>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden">
            <video ref={video} playsInline muted className="h-full w-full -scale-x-100 object-cover" />
            {/* Óvalo: todo lo de fuera se oscurece. */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 300 400" preserveAspectRatio="none">
              <defs>
                <mask id="oval-hole">
                  <rect width="300" height="400" fill="white" />
                  <ellipse cx={OVAL.cx * 300} cy={OVAL.cy * 400} rx={(OVAL.w * 300) / 2} ry={(OVAL.h * 400) / 2} fill="black" />
                </mask>
              </defs>
              <rect width="300" height="400" fill="rgba(0,0,0,0.55)" mask="url(#oval-hole)" />
              <ellipse
                cx={OVAL.cx * 300}
                cy={OVAL.cy * 400}
                rx={(OVAL.w * 300) / 2}
                ry={(OVAL.h * 400) / 2}
                fill="none"
                stroke={good ? "#34d399" : "rgba(255,255,255,0.85)"}
                strokeWidth="3"
                strokeDasharray={good ? undefined : "8 6"}
              />
            </svg>
            {flash && <div className="absolute inset-0 bg-white/80" />}
          </div>
          <p className={`t-sub px-6 pt-3 text-center ${good ? "text-emerald-300" : "text-white/85"}`} aria-live="polite">
            {msg}
          </p>
          <div className="mt-auto flex justify-center pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
            <button
              type="button"
              aria-label={t.scanShutter}
              onClick={() => void capture()}
              disabled={!ready}
              className="h-16 w-16 rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
            />
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
