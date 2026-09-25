# Qué falta antes de que esto vea un usuario real

Ordenado por lo que bloquea. Lo de arriba no es opcional.

## Bloqueante para cobrar

| # | Qué | Por qué |
|---|---|---|
| 1 | **Auth real** (Supabase Auth / Clerk / NextAuth) | Ahora la identidad es una cookie anónima. Sustituye `src/lib/db/session.ts`. |
| 2 | **Base de datos real** (Postgres) | El store JSON no aguanta dos procesos. Sustituye `src/lib/db/store.ts`. |
| 3 | **Pagos** (Stripe) | Cobro por vídeo (9 $ / 39 $), webhooks y reparto del 30 % del market vía Stripe Connect. Hasta entonces `PAYMENTS_ENABLED=false` deja generar sin cobrar. |
| 4 | ~~**Almacenamiento privado**~~ | ✅ Hecho. Los ficheros salieron de `/public` a `DATA_DIR`, y `/media/[...path]` comprueba de quién es cada uno. Queda moverlo a un bucket cuando toque Vercel. |
| 5 | **Borrado real** | Botón de borrar cuenta que borre de verdad fotos, escenas y vídeos. Obligación legal, no cortesía. |

## Bloqueante para abrir Animado

| # | Qué | Por qué |
|---|---|---|
| 6 | **Cola de trabajos** (Inngest / Trigger.dev / QStash) | Un Animado de 60 s no cabe en el timeout de una función serverless. El pipeline ya está escrito para reanudarse. |
| 7 | **Validar consistencia de identidad** | 50 generaciones reales, medir cuántas mantienen la cara reconocible en la escena 8. Es el riesgo número uno del producto. |
| 8 | **Worker de render** | Contenedor con ffmpeg, o Remotion, para el MP4 descargable. |

## Bloqueante para abrir el registro

| # | Qué | Por qué |
|---|---|---|
| 9 | **Moderación de imagen** | Hoy solo se filtra el texto. Falta detectar que el selfie no es de un famoso ni de un menor. |
| 10 | **Verificación de que el selfie es tuyo** | *Liveness check* o equivalente. La casilla de consentimiento no basta. |
| 11 | **Rate limiting** | `/api/upload` y `/api/projects` no tienen ninguno. |

## Producto, después

- Rehacer una escena suelta desde la UI.
- Clonación de voz propia (plan Creador).
- Recordatorio diario y racha: el KPI es reproducciones por semana, no vídeos generados.
- **Publicar tu vídeo como plantilla** — el modelo está en los tipos (`Template` con `sourceProjectId` y `creatorId`), falta el flujo y sacar las plantillas de `src/lib/templates.ts` a base de datos.
- Medir cuánto se parece una regeneración a la vista previa del creador. De ello depende cómo se promete el market.
- Música: catálogo con licencia además del pad generativo.
- Idiomas: el guion ya sale en el idioma del usuario, falta la UI.

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

- `src/lib/db/store.ts` — un proceso, sin transacciones.
- `src/lib/ai/fal.ts` — las imágenes viajan como data URI; con ficheros grandes va justo.
- `src/lib/render/assemble.ts` — escrito pero **no ejecutado nunca** en el entorno de desarrollo. La imagen de Docker sí trae ffmpeg, así que el primer uso real será en Railway.
- El `Dockerfile` **no se ha construido nunca**: no hay demonio de Docker aquí. Sí está probado el output `standalone` que corre dentro.
- Sin tests. El primero que hay que escribir es del pipeline en modo mock, que es determinista y por tanto fácil de afirmar.
