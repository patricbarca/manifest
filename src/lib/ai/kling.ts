import crypto from "node:crypto";
import type { VideoProvider } from "./contracts";
import { PROVIDER_COST } from "../pricing";
import { persistRemoteAsset } from "./storage";

/**
 * Kling directo, sin pasar por fal.
 *
 * Merece la pena cuando el volumen sube: los paquetes de recursos de Kling
 * salen mas baratos por segundo que el markup de un agregador. La autenticacion
 * es un JWT HS256 de vida corta firmado con el par access/secret.
 */

const BASE = "https://api.klingai.com";

function token(): string {
  const ak = process.env.KLING_ACCESS_KEY;
  const sk = process.env.KLING_SECRET_KEY;
  if (!ak || !sk) throw new Error("Faltan KLING_ACCESS_KEY / KLING_SECRET_KEY");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = { iss: ak, exp: now + 1800, nbf: now - 5 };
  const b64 = (o: unknown) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const body = `${b64(header)}.${b64(payload)}`;
  const sig = crypto.createHmac("sha256", sk).update(body).digest("base64url");
  return `${body}.${sig}`;
}

async function fetchImageBase64(url: string): Promise<string> {
  const absolute = url.startsWith("http")
    ? url
    : `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${url}`;
  const res = await fetch(absolute);
  if (!res.ok) throw new Error(`No se pudo leer la imagen base: ${res.status}`);
  return Buffer.from(await res.arrayBuffer()).toString("base64");
}

export const klingVideo: VideoProvider = {
  name: "kling",
  async animate({ imageUrl, prompt, durationSec, projectId, sceneId }) {
    const jwt = token();
    const duration = durationSec <= 5 ? "5" : "10";

    const create = await fetch(`${BASE}/v1/videos/image2video`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model_name: process.env.KLING_MODEL ?? "kling-v2-master",
        image: await fetchImageBase64(imageUrl),
        prompt,
        duration,
        mode: process.env.KLING_MODE ?? "std",
        aspect_ratio: "9:16",
      }),
    });
    if (!create.ok) throw new Error(`Kling respondió ${create.status}: ${await create.text()}`);

    const created = (await create.json()) as { data?: { task_id?: string } };
    const taskId = created.data?.task_id;
    if (!taskId) throw new Error("Kling no devolvió task_id");

    // Sondeo hasta 8 minutos: un clip de 5 s suele tardar 1–3.
    const deadline = Date.now() + 480_000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 5000));
      const st = await fetch(`${BASE}/v1/videos/image2video/${taskId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const body = (await st.json()) as {
        data?: {
          task_status?: string;
          task_status_msg?: string;
          task_result?: { videos?: { url?: string }[] };
        };
      };
      const status = body.data?.task_status;
      if (status === "succeed") {
        const remote = body.data?.task_result?.videos?.[0]?.url;
        if (!remote) throw new Error("Kling terminó sin URL de video");
        const url = await persistRemoteAsset(remote, projectId, `${sceneId}.mp4`);
        const perSec =
          (process.env.KLING_MODE ?? "std") === "pro"
            ? PROVIDER_COST.videoPremiumCentsPerSec
            : PROVIDER_COST.videoCentsPerSec;
        return {
          result: { url },
          costCents: +(Number(duration) * perSec).toFixed(2),
          provider: "kling",
        };
      }
      if (status === "failed") {
        throw new Error(`Kling falló: ${body.data?.task_status_msg ?? "sin detalle"}`);
      }
    }
    throw new Error("Kling agotó el tiempo de espera");
  },
};
