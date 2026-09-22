import { NextResponse } from "next/server";
import { checkStorage } from "@/lib/storage-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sonda de salud para el orquestador (Railway, Docker, Kubernetes).
 *
 * A propósito no toca base de datos ni cookies: solo responde si el proceso
 * está vivo y sirviendo. Una sonda que comprueba dependencias tumba el
 * servicio entero cuando lo que falla es una dependencia, que es justo cuando
 * quieres que siga en pie devolviendo errores claros.
 */
export async function GET() {
  const storage = await checkStorage();

  // El healthcheck no falla por no tener volumen: la app sirve igual, y
  // tumbar el servicio no arregla nada. Se informa para poder verlo de un
  // vistazo con curl.
  return NextResponse.json({
    ok: storage.writable,
    at: new Date().toISOString(),
    storage: {
      dir: storage.dir,
      writable: storage.writable,
      persistent: storage.persistent,
      warning: storage.persistent
        ? undefined
        : "DATA_DIR no está en un volumen: el próximo despliegue borrará los datos",
      note: storage.note,
    },
  });
}
