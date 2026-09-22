import { mkdir, stat, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { DATA_DIR } from "./paths";

/**
 * ¿Sobrevive DATA_DIR a un despliegue?
 *
 * Es la pregunta que más caro sale contestar tarde. Si el contenedor corre sin
 * volumen montado, la app funciona, se ve bien y no da ningún error — y cada
 * despliegue borra todos los vídeos y todas las cuentas. El fallo es
 * silencioso y solo se nota cuando ya has perdido datos de gente real.
 *
 * Así que la app lo comprueba sola y lo dice en el arranque.
 *
 * Cómo se detecta: un volumen montado es otro sistema de ficheros, así que su
 * número de dispositivo (`st_dev`) no coincide con el del directorio de la
 * app. Si coinciden, DATA_DIR está en el disco efímero del contenedor.
 */

export interface StorageStatus {
  dir: string;
  writable: boolean;
  /** true = otro sistema de ficheros, o sea, volumen montado. */
  persistent: boolean;
  /** Motivo por el que no se pudo determinar, si aplica. */
  note?: string;
}

export async function checkStorage(): Promise<StorageStatus> {
  const status: StorageStatus = { dir: DATA_DIR, writable: false, persistent: false };

  try {
    await mkdir(DATA_DIR, { recursive: true });
    const probe = path.join(DATA_DIR, ".write-probe");
    await writeFile(probe, "ok");
    await unlink(probe);
    status.writable = true;
  } catch (err) {
    status.note = `No se puede escribir en DATA_DIR: ${(err as Error).message}`;
    return status;
  }

  try {
    const [data, app] = await Promise.all([stat(DATA_DIR), stat(process.cwd())]);
    status.persistent = data.dev !== app.dev;
  } catch (err) {
    status.note = `No se pudo comprobar el montaje: ${(err as Error).message}`;
  }

  return status;
}

/**
 * Aviso de arranque.
 *
 * Solo grita en producción: en local DATA_DIR es una carpeta del proyecto y
 * que no sea un volumen es lo normal, no un problema.
 */
export async function warnIfEphemeral(): Promise<void> {
  const status = await checkStorage();

  if (!status.writable) {
    console.error(
      `\n[Manifest] ERROR: no se puede escribir en ${status.dir}.\n` +
        `La app no podrá guardar nada. ${status.note ?? ""}\n`,
    );
    return;
  }

  if (process.env.NODE_ENV !== "production") return;

  if (!status.persistent) {
    console.warn(
      "\n" +
        "┌───────────────────────────────────────────────────────────────┐\n" +
        "│  AVISO: ALMACENAMIENTO EFÍMERO                                │\n" +
        "├───────────────────────────────────────────────────────────────┤\n" +
        `│  ${status.dir.padEnd(60)} │\n` +
        "│  está en el disco del contenedor, no en un volumen.           │\n" +
        "│                                                               │\n" +
        "│  EL PRÓXIMO DESPLIEGUE BORRARÁ TODOS LOS VÍDEOS Y CUENTAS.    │\n" +
        "│                                                               │\n" +
        "│  Monta un volumen en esa ruta antes de que entre nadie.       │\n" +
        "│  Ver docs/deploy.md.                                          │\n" +
        "└───────────────────────────────────────────────────────────────┘\n",
    );
  } else {
    console.log(`[Manifest] Almacenamiento persistente en ${status.dir} ✓`);
  }
}
