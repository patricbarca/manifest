#!/bin/sh
set -e

# ──────────────────────────────────────────────────────────────────────────
# El chown del volumen tiene que pasar en arranque, no en build.
#
# El Dockerfile hace `chown` de /data al construir, pero eso no sirve de nada:
# el volumen se monta EN ARRANQUE y tapa ese directorio con su propio sistema
# de ficheros, que llega perteneciendo a root. El proceso corre como `nextjs`
# (uid 1001), así que se encuentra un /data que no puede tocar:
#
#     EACCES: permission denied, open '/data/.write-probe'
#
# Así que el contenedor arranca como root, ajusta el dueño del punto de
# montaje ya montado, y acto seguido baja privilegios con su-exec. La app
# nunca llega a ejecutarse como root.
# ──────────────────────────────────────────────────────────────────────────

DATA_PATH="${DATA_DIR:-/data}"

if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_PATH"
  # `|| true`: si el volumen es de solo lectura, que lo reporte la app con su
  # mensaje claro en vez de morir aquí con un error de chown.
  chown -R nextjs:nodejs "$DATA_PATH" 2>/dev/null || true
  exec su-exec nextjs "$@"
fi

exec "$@"
