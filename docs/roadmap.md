# Qué falta para lanzar y cobrar

Actualizado el 2026-10-31. Ordenado por lo que bloquea.

## Bloqueante para cobrar (depende de Patric)

| # | Qué | Estado |
|---|---|---|
| 1 | **Empresa o ABN y nombre legal** | Pendiente. Poner `LEGAL_NAME` en Railway: es el titular que sale en términos y privacidad. |
| 2 | **Stripe en modo real** | Pendiente. Activar la cuenta, claves reales (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), webhook a `https://app.manifestlife.ai/api/stripe/webhook`, `PAYMENTS_ENABLED=true`. |
| 3 | **Compra real de principio a fin** | Pendiente. Pagar, recibir el email, generar el vídeo, probar un reembolso. |
| 4 | **Revisión legal** | Pendiente. Términos, privacidad, consentimiento de fotos y reembolsos. |
| 5 | **GST / impuestos** | Pendiente. Confirmar con el contador; Stripe Tax puede calcularlo. |

## Bloqueante para abrir a todos (quitar `ACCESS_CODE`)

| # | Qué | Estado |
|---|---|---|
| 6 | Límites de uso en las rutas que gastan | ✅ `src/lib/rate-limit.ts` (en memoria, 1 réplica). Con más réplicas, pasarlo a la base de datos. |
| 7 | Borrar la cuenta de verdad | ✅ Ajustes → Borrar mi cuenta (`/api/account`). |
| 8 | `IMPORT_TOKEN` vacío en Railway | Pendiente de comprobar (Patric). |
| 9 | Precios definitivos (¿suscripción?) | Pendiente de decidir. |

## Muy recomendable

- Pedir a fal por escrito dónde procesan MiniMax y Kling, y su DPA.
- Caducidad de archivos en el panel de fal (Settings → Storage).
- `IMAGE_COST_CENTS` con el coste real de GPT Image (panel de fal → Usage).
- IDs de Google Ads y TikTok si hay anuncios.
- Detectar menores y famosos en las selfies (hoy solo desnudos).
- Tests del recorrido completo con Playwright.

## Hecho (antes en esta lista)

Login real (Supabase Auth), base de datos (Supabase), pagos Stripe (modo prueba),
almacenamiento privado y bucket, cola y reanudación, montaje con ffmpeg,
moderación de texto e imagen (desnudos), pre-análisis de selfies, escáner de cara,
recordatorios por email, tema claro, Ajustes.

## Aprendido por el camino

- **`/media` filtraba la base de datos entera.** La primera versión comprobaba
  que la ruta resuelta cayera dentro de `DATA_DIR`. Con
  `..%2f..%2fdb%2fusers.json` (barra codificada, que Next no normaliza) el
  destino era `DATA_DIR/db/users.json` — *dentro* de `DATA_DIR`, así que la
  comprobación pasaba y el servidor entregaba todos los usuarios. Arreglado
  confinando al subdirectorio del tipo y exigiendo que cada segmento sea un
  nombre de fichero pelado. La lección: validar dónde cae la ruta resuelta, no
  el texto de entrada, y confinar al directorio más estrecho posible.
- **Generar dependía de ser alcanzable desde internet.** Los proveedores
  recibían una URL de nuestra app y tenían que descargarla. Ahora se les manda
  el fichero incrustado, leído de disco.

## Deuda técnica conocida

- El límite de uso y la cola viven en memoria: válidos con una sola réplica en Railway.
- `src/lib/ai/fal.ts` — las imágenes viajan como data URI; con ficheros grandes va justo.
- `src/lib/render/assemble.ts` — escrito pero **no ejecutado nunca** en el entorno de desarrollo. La imagen de Docker sí trae ffmpeg, así que el primer uso real será en Railway.
- El `Dockerfile` **no se ha construido nunca**: no hay demonio de Docker aquí. Sí está probado el output `standalone` que corre dentro.
- Sin tests. El primero que hay que escribir es del pipeline en modo mock, que es determinista y por tanto fácil de afirmar.
