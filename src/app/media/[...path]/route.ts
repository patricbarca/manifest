import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { currentUser } from "@/lib/db/session";
import { db } from "@/lib/db/store";
import { contentTypeFor, resolveMediaPath } from "@/lib/paths";

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
  } else {
    const project = await db.getProject(parts[0]);
    if (!project || project.ownerId !== user.id) {
      return NextResponse.json({ error: "No es tuyo" }, { status: 403 });
    }
  }

  let info;
  try {
    info = await stat(absolute);
  } catch {
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
