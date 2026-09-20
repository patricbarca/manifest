# Arquitectura

## Idea general

```
Navegador                Next.js (App Router)            Proveedores
─────────                ────────────────────            ───────────
Asistente  ──POST────▶   /api/projects
                          ├─ valida (zod)
                          ├─ filtro de seguridad
                          ├─ cobra créditos
                          └─ lanza pipeline ──┐
                                              │
Reproductor ◀─sondeo──   /api/projects/[id]   │
                                              ▼
                                     lib/pipeline.ts
                                       1. guion    ──▶ LLM (Anthropic/OpenAI)
                                       2. imágenes ──▶ fal (flux-kontext…)
                                       3. animación──▶ fal / Kling  (solo Cine)
                                       4. voz      ──▶ ElevenLabs
                                       5. montaje  ──▶ ffmpeg (opcional)
```

## Decisiones y por qué

### La capa de proveedores es lo único que no se puede acoplar

`src/lib/ai/` define cuatro contratos (`ScriptProvider`, `ImageProvider`,
`VideoProvider`, `VoiceProvider`) y un registro que elige la implementación por
variable de entorno. El pipeline no sabe qué modelo hay debajo.

Esto no es arquitectura por gusto: los precios cambian cada pocos meses, el mismo
modelo cuesta hasta 3× distinto según la pasarela, y los modelos se jubilan con
fecha (Nano Banana, octubre de 2026). Cambiar de proveedor tiene que ser una
línea del `.env`.

Toda llamada devuelve también **cuánto costó** (`Billed<T>`), y el pipeline lo
acumula por etapa. Sin eso no se puede cerrar el margen por vídeo.

### Modo mock por defecto

Con el repo recién clonado y sin ninguna API key, `npm run dev` da el producto
entero funcionando: escenas SVG generadas en local, voz por `speechSynthesis` del
navegador, música por Web Audio. Coste cero.

Sirve para desarrollar la UI sin quemar dinero, para enseñar el producto, y para
probar el pipeline en CI.

### El reproductor es el producto, no el MP4

`src/components/VisualizationPlayer.tsx`. El MP4 es un derivado para compartir;
la práctica ocurre en el reproductor, porque es lo único que puede sincronizar la
frase grande con el silencio en el que el usuario la repite.

Reloj: si hay pista de voz manda el `<audio>` (su duración real nunca coincide
con la teórica, así que las escenas se escalan a ella); si no, un `requestAnimationFrame`
lleva el tiempo y la voz del navegador lee cada frase al entrar.

### El chrome no lleva color

`src/app/globals.css` define tokens neutros y un único acento, y ese acento es
blanco. No es minimalismo por moda: el producto genera fotografías con la cara
del usuario, y una interfaz con degradados y dorados compite con ellas. El
resultado es que el vídeo parece un widget dentro de una web en lugar de ser lo
que se ha venido a ver. Neutro alrededor, color dentro.

Cuatro decisiones sostienen eso:

- **Jerarquía por opacidad, no por color.** Cuatro niveles de etiqueta
  (95/58/32/18 %) y ni uno más. En cuanto hay un quinto deja de leerse como
  jerarquía y pasa a leerse como descuido.
- **Tracking que se aprieta con el cuerpo.** Un titular a 64 px con el tracking
  de un párrafo se ve suelto y barato. Las clases `t-*` llevan el ajuste
  incorporado para que no dependa de que alguien se acuerde.
- **Desenfoque con saturación.** `blur()` solo apaga lo que hay detrás;
  `saturate(180%)` le devuelve la vida. Esa pareja es la diferencia entre un
  panel translúcido y algo que parece cristal.
- **Una sola curva de movimiento.** `--ease-spring` en todo. Varias curvas
  distintas en la misma pantalla se notan aunque nadie sepa decir por qué.

Para reintroducir un color de marca basta cambiar `--color-accent`.

### Los iconos son un sistema, no caracteres

`src/components/Icon.tsx`. Antes los iconos eran glifos tipográficos (`◆ ▶ ∞ ♪
⛶`). Un glifo usado como icono nunca alinea igual que sus vecinos, cambia de
forma según la fuente instalada y no comparte grosor de trazo con nada.

Es, por encima de la paleta, lo que hace que una interfaz parezca sin terminar.
Todos los iconos viven en un lienzo de 24, trazo 1.6, extremos redondos y
`currentColor`.

### Ken Burns en CSS, no en el servidor

El tier Visión no necesita modelo de vídeo: tres animaciones CSS de
*zoom + desplazamiento* alternadas dan movimiento convincente sobre imágenes
fijas, a coste cero y sin espera. Es lo que hace que Visión cueste ~0,58 $ en
lugar de ~6,50 $. Respeta `prefers-reduced-motion`.

### Persistencia deliberadamente tonta

`src/lib/db/store.ts` es un JSON por colección en `.data/`, con escritura atómica
y una cola que serializa los updates. No aguanta concurrencia ni varios procesos.

Es a propósito: el MVP tiene que demostrar el producto, no la infraestructura.
Todo el acceso pasa por ese fichero, así que migrar a Postgres/Supabase es
reimplementar seis funciones.

### El pipeline corre en proceso, y eso hay que cambiarlo

Ahora mismo `runPipeline` se lanza desde la ruta de API sin esperar, y la UI
sondea. Funciona en local y es lo mínimo para ver el producto entero.

**No vale para producción**: un Cine de 60 s son varios minutos y no cabe en el
timeout de una función serverless. Va a una cola (Inngest, Trigger.dev, QStash).
El pipeline ya está escrito para eso: cada etapa escribe su estado en el
proyecto, así que es reanudable y observable tal cual.

### Montaje opcional

`assembleMp4` busca un binario de `ffmpeg`. Si no está, el proyecto queda listo
igualmente y la descarga se marca como no disponible. En este entorno no hay
ffmpeg, así que ese camino está escrito pero **no probado en ejecución**.

## Mapa de ficheros

| Ruta | Qué hace |
|---|---|
| `src/lib/types.ts` | Dominio: proyecto, escena, afirmación, blueprint |
| `src/lib/pricing.ts` | Coste de proveedor, créditos, planes, margen |
| `src/lib/script-engine.ts` | Banco de afirmaciones, timeline, prompts de escena |
| `src/lib/safety.ts` | Filtro de intenciones y texto de consentimiento |
| `src/lib/pipeline.ts` | Orquestación de las 5 etapas |
| `src/lib/ai/contracts.ts` | Los cuatro contratos de proveedor |
| `src/lib/ai/{mock,fal,kling,elevenlabs,llm}.ts` | Implementaciones |
| `src/lib/db/{store,session}.ts` | Persistencia y "auth" |
| `src/lib/audio/ambient.ts` | Pad generativo con Web Audio |
| `src/lib/render/assemble.ts` | Montaje a MP4 con ffmpeg |
| `src/app/globals.css` | Tokens, tipografía, materiales y movimiento |
| `src/components/Icon.tsx` | Sistema de iconos |
| `src/components/VisualizationPlayer.tsx` | El reproductor |
| `src/components/CreateWizard.tsx` | Asistente de 4 pasos |
| `src/components/VideoStage.tsx` | Progreso de generación y resultado |

## Lo que NO está hecho

Está en `docs/roadmap.md`, pero lo importante en una línea: **no hay auth real,
no hay pagos, y los selfies se guardan en `/public`**. Nada de esto puede tocar
usuarios reales tal cual está.
