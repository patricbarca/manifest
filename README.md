# Manifest

Vídeos de visualización y manifestación generados con IA. Subes un selfie,
cuentas qué estás construyendo, y recibes un vídeo de 30 o 60 segundos donde
apareces tú viviéndolo — con un guion escrito para tu caso y una voz que lo dice
para que lo repitas en voz alta.

> **Estado: MVP.** Funciona de punta a punta, pero no hay auth real, ni pagos, ni
> almacenamiento privado. Ver [`docs/roadmap.md`](docs/roadmap.md) antes de
> ponerlo delante de nadie.

## Arrancar

```bash
npm install
npm run dev
```

Y ya está: **sin ninguna API key el producto entero funciona**. Las escenas se
generan como SVG en local, la voz sale de `speechSynthesis` del navegador y la
música de Web Audio. Coste: cero.

Para usar modelos de verdad, copia `.env.example` a `.env.local` y cambia los
proveedores:

```bash
SCRIPT_PROVIDER=anthropic   # o openai, o mock
IMAGE_PROVIDER=fal
VIDEO_PROVIDER=fal          # o kling
VOICE_PROVIDER=elevenlabs
```

## Qué hay dentro

- **Dos productos y dos precios.** *Imágenes* (9 $) y *Animado* (39 $). Sin
  suscripción, sin créditos. El primero es gratis. El porqué de cada número
  está en [`docs/business-model.md`](docs/business-model.md).
- **Un reproductor que es el producto.** Cada afirmación aparece grande, la voz
  la dice, y después se calla para que la repitas. Ese hueco es la mitad del
  ejercicio.
- **Un market donde publicas tu vídeo.** Otra persona le pone su cara y recibe
  su propia versión: mismas escenas, mismo guion, ella dentro. Paga lo mismo que
  crear de cero, y el 30 % va a quien lo creó. Lo que se publica es la receta,
  no el vídeo montado — nadie recibe nunca un vídeo con la cara de otro.
- **Capa de proveedores intercambiable.** Los precios de API cambian cada pocos
  meses y los modelos se jubilan con fecha. Cambiar de modelo es una variable de
  entorno.

## Documentación

| | |
|---|---|
| [`docs/business-model.md`](docs/business-model.md) | Costes verificados con fuentes, unit economics, planes, el market, riesgos |
| [`docs/architecture.md`](docs/architecture.md) | Cómo está montado y por qué |
| [`docs/roadmap.md`](docs/roadmap.md) | Lo que falta, ordenado por lo que bloquea |
| [`docs/deploy.md`](docs/deploy.md) | Cómo desplegarlo, y por qué GitHub Pages no sirve |

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript · Zod.
Sin base de datos ni servicios externos para arrancar.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run typecheck  # tsc --noEmit

docker build -t manifest .                              # imagen de producción
docker run -p 3000:3000 -v manifest-data:/data manifest # con volumen
```

Todo lo que la app escribe —base de datos, selfies, escenas— vive bajo
`DATA_DIR` (`.data/` en local, el volumen `/data` en el contenedor). Nada de
eso se sirve desde `/public`: los ficheros pasan por `/media/...`, que
comprueba de quién son.
