# Qué falta antes de que esto vea un usuario real

Ordenado por lo que bloquea. Lo de arriba no es opcional.

## Bloqueante para cobrar

| # | Qué | Por qué |
|---|---|---|
| 1 | **Auth real** (Supabase Auth / Clerk / NextAuth) | Ahora la identidad es una cookie anónima. Sustituye `src/lib/db/session.ts`. |
| 2 | **Base de datos real** (Postgres) | El store JSON no aguanta dos procesos. Sustituye `src/lib/db/store.ts`. |
| 3 | **Pagos** (Stripe) | Suscripciones, packs de créditos, webhooks de renovación y reparto del market. |
| 4 | **Almacenamiento privado** | Los selfies y los vídeos están en `/public` con URL adivinable. Tienen que ir a un bucket privado con URLs firmadas y caducidad. |
| 5 | **Borrado real** | Botón de borrar cuenta que borre de verdad fotos, escenas y vídeos. Obligación legal, no cortesía. |

## Bloqueante para abrir Cine

| # | Qué | Por qué |
|---|---|---|
| 6 | **Cola de trabajos** (Inngest / Trigger.dev / QStash) | Un Cine de 60 s no cabe en el timeout de una función serverless. El pipeline ya está escrito para reanudarse. |
| 7 | **Validar consistencia de identidad** | 50 generaciones reales, medir cuántas mantienen la cara reconocible en la escena 8. Es el riesgo número uno del producto. |
| 8 | **Worker de render** | Contenedor con ffmpeg, o Remotion, para el MP4 descargable. |

## Bloqueante para abrir el registro

| # | Qué | Por qué |
|---|---|---|
| 9 | **Moderación de imagen** | Hoy solo se filtra el texto. Falta detectar que el selfie no es de un famoso ni de un menor. |
| 10 | **Verificación de que el selfie es tuyo** | *Liveness check* o equivalente. La casilla de consentimiento no basta. |
| 11 | **Rate limiting** | `/api/upload` y `/api/projects` no tienen ninguno. |

## Producto, después

- Rehacer una escena suelta desde la UI (el precio ya existe, falta el endpoint).
- Clonación de voz propia (plan Creador).
- Recordatorio diario y racha: el KPI es reproducciones por semana, no vídeos generados.
- Publicación de blueprints por usuarios, con revisión previa.
- Música: catálogo con licencia además del pad generativo.
- Idiomas: el guion ya sale en el idioma del usuario, falta la UI.

## Deuda técnica conocida

- `src/lib/db/store.ts` — un proceso, sin transacciones.
- `src/lib/ai/fal.ts` — el selfie viaja como data URI; con imágenes grandes va justo.
- `src/lib/render/assemble.ts` — escrito pero **no ejecutado nunca**: no hay ffmpeg en el entorno de desarrollo.
- Sin tests. El primero que hay que escribir es del pipeline en modo mock, que es determinista y por tanto fácil de afirmar.
