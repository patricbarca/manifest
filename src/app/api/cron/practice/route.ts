import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runPracticeJobs } from "@/lib/reminders";

export const runtime = "nodejs";

/**
 * Lanza los avisos a mano o desde un cron externo:
 * POST con la cabecera Authorization: Bearer $CRON_SECRET.
 * Sin CRON_SECRET definido, la ruta no existe.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const ok =
    !!secret && got.length === secret.length && timingSafeEqual(Buffer.from(got), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(await runPracticeJobs());
}
