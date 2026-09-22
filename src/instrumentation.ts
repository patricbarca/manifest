/**
 * Corre una vez al arrancar el servidor, antes de aceptar peticiones.
 *
 * Se usa para lo único que hay que saber nada más levantar: si el
 * almacenamiento sobrevive a un despliegue o no.
 */
export async function register() {
  // Solo en el runtime de Node: en edge no hay sistema de ficheros.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { warnIfEphemeral } = await import("./lib/storage-check");
  await warnIfEphemeral();
}
