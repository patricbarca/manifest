import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { currentUser } from "@/lib/db/session";
import { db } from "@/lib/db/store";
import { contentTypeFor, resolveMediaPath } from "@/lib/paths";
import { getObjectStream, objectStorageEnabled } from "@/lib/object-storage";
import { social } from "@/lib/social/store";
import { canSee } from "@/lib/social/aura";
import { isHighlightFile } from "@/lib/highlights";
import { manifests } from "@/lib/manifest/store";

export const runtime = "nodejs";

/**
 * Sirve los selfies y las escenas.
 *
 * Existe porque estos ficheros NO pueden estar en `/public`: llevan la cara
 * de una persona, y en `/public` cualquiera con la URL los ve. Aquí cada
 * petición comprueba de quién es el fichero antes de devolverlo.
 *
 * Dos reglas, según el tipo:
 *  - `uploads/<userId>_...` — el id del dueño está en el nombre del fichero.
 *  - `generated/<projectId>/...` — se mira el proyecto y quién lo creó.
 *
 * Ojo al cambiar esto: la comprobación de path traversal vive en
 * `localPathForMediaUrl`, que resuelve la ruta y verifica que no se ha salido
 * de DATA_DIR. Filtrar ".." en el texto no vale.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // Valida y confina de una vez: si devuelve null, no se sigue.
  const resolved = resolveMediaPath(segments);
  if (!resolved) {
    return NextResponse.json({ error: "Ruta no válida" }, { status: 400 });
  }
  const { kind, abs: absolute } = resolved;

  // Se usan los segmentos ya validados, no los crudos de la URL.
  const parts = segments.slice(1).map((s) => decodeURIComponent(s));
  const user = await currentUser();

  if (kind === "uploads") {
    if (!parts[0].startsWith(`${user.id}_`)) {
      return NextResponse.json({ error: "No es tuyo" }, { status: 403 });
    }
  } else if (kind === "avatars") {
    // Foto de perfil: la ve quien pueda ver ese perfil.
    const ownerId = parts[0].slice(0, Math.max(0, parts[0].lastIndexOf("_")));
    const profile = ownerId ? await social.getProfile(ownerId) : undefined;
    if (!profile || profile.avatarUrl !== `/media/avatars/${parts[0]}` || !(await canSee(profile, user.id))) {
      return NextResponse.json({ error: "No es tuyo" }, { status: 403 });
    }
  } else if (parts[0].startsWith("m_")) {
    // Ficheros de una manifestación: solo su dueño.
    const m = await manifests.get(parts[0]);
    if (!m || m.ownerId !== user.id) {
      return NextResponse.json({ error: "No es tuyo" }, { status: 403 });
    }
  } else {
    const project = await db.getProject(parts[0]);
    // Otras personas solo ven los highlights, si el dueño los publicó y su perfil se lo permite.
    const shared =
      !!project &&
      project.ownerId !== user.id &&
      parts.length === 2 &&
      isHighlightFile(parts[1]) &&
      !!project.highlights?.some((h) => !h.hidden && (h.videoUrl.endsWith(`/${parts[1]}`) || h.posterUrl.endsWith(`/${parts[1]}`))) &&
      // Con enlace compartido, cualquiera; si no, solo si lo mostró en su perfil y el perfil se lo permite.
      (project.shared === true ||
        (project.showOnProfile === true &&
          (await social.getProfile(project.ownerId).then((pr) => (pr ? canSee(pr, user.id) : false)))));
    if (!project || (project.ownerId !== user.id && !shared)) {
      return NextResponse.json({ error: "No es tuyo" }, { status: 403 });
    }
  }

  let info;
  try {
    info = await stat(absolute);
  } catch {
    // Ya no está en disco: si es de un vídeo terminado, vive en el bucket.
    // Se sirve a través del servidor (con Range), sin redirigir al bucket:
    // el enlace firmado fallaba en algunos navegadores.
    if (kind === "generated" && objectStorageEnabled()) {
      const obj = await getObjectStream(`generated/${parts.join("/")}`, request.headers.get("range"));
      if (!obj) return NextResponse.json({ error: "No existe" }, { status: 404 });
      return new NextResponse(obj.body, {
        status: obj.status,
        headers: {
          "Content-Type": contentTypeFor(absolute),
          "Cache-Control": "private, max-age=3600",
          "Accept-Ranges": "bytes",
          "X-Content-Type-Options": "nosniff",
          ...(obj.length !== undefined ? { "Content-Length": String(obj.length) } : {}),
          ...(obj.contentRange ? { "Content-Range": obj.contentRange } : {}),
        },
      });
    }
    return NextResponse.json({ error: "No existe" }, { status: 404 });
  }
  if (!info.isFile()) {
    return NextResponse.json({ error: "No existe" }, { status: 404 });
  }

  const contentType = contentTypeFor(absolute);
  // `private`: es contenido de una sola persona, no lo debe cachear un proxy
  // compartido. `immutable` porque el nombre de fichero nunca se reutiliza.
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=31536000, immutable",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "X-Content-Type-Options": "nosniff",
  };

  /*
    Peticiones por rango. Safari no reproduce un <video> si el servidor no
    responde 206 a su primer Range, así que esto no es una optimización:
    sin ello el tier Cine no se ve en iPhone.
  */
  const range = request.headers.get("range");
  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : info.size - 1;

      if (start >= info.size || end >= info.size || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${info.size}` },
        });
      }

      const stream = Readable.toWeb(
        createReadStream(absolute, { start, end }),
      ) as ReadableStream;
      return new NextResponse(stream, {
        status: 206,
        headers: {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${info.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(end - start + 1),
        },
      });
    }
  }

  const stream = Readable.toWeb(createReadStream(absolute)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      ...headers,
      "Accept-Ranges": "bytes",
      "Content-Length": String(info.size),
    },
  });
}
