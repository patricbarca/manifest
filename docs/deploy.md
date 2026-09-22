# Desplegar Manifest

## Por qué no GitHub Pages

Pages solo sirve ficheros estáticos. Next llama a eso *static export*, y no
soporta lo que esta app necesita. Se puede comprobar en 30 segundos: pon
`output: "export"` en `next.config.ts` y lanza `npm run build`.

```
Error: export const dynamic = "force-static" not configured on route
"/api/projects/[id]" with "output: export"
```

De las 11 rutas, **7 necesitan servidor** (`ƒ` en la tabla del build): las
cuatro de `/api`, `/media/[...path]`, `/crear`, `/biblioteca` y `/video/[id]`.

Y el argumento que zanja el debate: sin servidor, la llamada a fal.ai saldría
del navegador del usuario, con `FAL_KEY` dentro del JavaScript que descarga
cualquiera. **El servidor es el sitio donde viven los secretos.**

---

## Railway (recomendado para empezar)

Railway da disco persistente, que es lo que el código de hoy necesita: la base
de datos es un JSON y los ficheros están en disco. Sin migrar nada.

### 1. Crear el servicio

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Elige `patricbarca/manifest`
3. Railway detecta `railway.json` y construye con el `Dockerfile`

### 2. Montar el volumen — no te lo saltes

**Service → Settings → Volumes → New Volume**, con punto de montaje:

```
/data
```

Sin esto la app arranca igual, pero **cada despliegue borra todos los vídeos y
las cuentas**: el disco de un contenedor es efímero. Es el único paso del que
no avisa nada hasta que ya ha pasado.

### 3. Variables de entorno

`DATA_DIR` y `FFMPEG_PATH` ya vienen en el `Dockerfile`. Solo hacen falta las
de los proveedores, y solo cuando quieras salir del modo demo:

```
SCRIPT_PROVIDER=anthropic
IMAGE_PROVIDER=fal
VIDEO_PROVIDER=fal
VOICE_PROVIDER=elevenlabs
ANTHROPIC_API_KEY=...
FAL_KEY=...
ELEVENLABS_API_KEY=...
```

Sin ninguna, la app despliega y funciona en modo demo. Sirve para comprobar
que el despliegue está bien antes de gastar un euro.

### 4. Comprobar

Railway asigna un dominio en **Settings → Networking → Generate Domain**.

```bash
curl https://<tu-dominio>/api/health
# {"ok":true,"at":"..."}
```

A partir de aquí, **cada `git push` despliega solo**.

---

## Vercel (cuando toque cobrar)

Vercel es un adaptador verificado por el equipo de Next, pero **el código de
hoy no funciona ahí tal cual**: escribe en disco, y en serverless el disco es
efímero y de solo lectura salvo `/tmp`.

Antes hay que:

1. Cambiar `src/lib/db/store.ts` de JSON a Postgres
2. Cambiar `src/lib/ai/storage.ts` de disco a Supabase Storage o R2
3. Sacar el pipeline a una cola (el tier Cine no cabe en el timeout)

Los tres puntos están aislados a propósito en esos ficheros.

---

## Infraestructura ya creada

| | |
|---|---|
| Proyecto Supabase | `manifest` · ref `qugjxooqaxkqexxacfhv` · `ap-southeast-2` (Sídney) |

Todavía sin usar: el código sigue con el store JSON. Es el siguiente paso.

> **Nota de cumplimiento.** Los selfies son datos biométricos. Guardarlos en
> Sídney es correcto para usuarios de Australia; si el producto crece a la UE,
> la transferencia internacional necesita su propia base legal. Decidirlo
> antes de abrir el registro, no después.

---

## Construir la imagen a mano

```bash
docker build -t manifest .
docker run -p 3000:3000 -v manifest-data:/data manifest
```

La imagen trae `ffmpeg`, así que la descarga MP4 funciona dentro del
contenedor aunque no la tengas en local.

> **Sin verificar:** la construcción de la imagen no se ha ejecutado nunca —
> el contenedor de desarrollo no tiene demonio de Docker. Lo que sí está
> probado es el output `standalone` que corre dentro (`node server.js` con
> `DATA_DIR`), incluido el flujo completo de generación. El primer
> `docker build` real será en Railway.
