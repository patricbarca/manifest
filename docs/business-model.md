# Manifest — análisis de producto y modelo de negocio

> **Sobre la fiabilidad de este documento.** Los precios de proveedor se
> consultaron el **19 de septiembre de 2026** y están etiquetados como
> `Confirmado` (leído en una fuente concreta, citada), `Probable` (coherente
> entre varias fuentes secundarias pero sin verificar en la página oficial) o
> `Sin verificar`. Los precios de API de vídeo cambian cada pocos meses y bajan
> con volumen: **vuelve a comprobarlos antes de fijar tarifas**. Todo el cálculo
> vive en `src/lib/pricing.ts` para poder re-tarifar en un solo sitio.

---

## 1. Qué se vende exactamente

No se vende "un vídeo con IA". Se vende **una práctica diaria de visualización
con tu propia cara dentro**, en tres piezas que van juntas:

1. **Las escenas** — tú viviendo el resultado, no persiguiéndolo.
2. **El guion** — afirmaciones en primera persona y presente, escritas para tu
   caso concreto, no genéricas.
3. **El hueco** — después de cada frase el vídeo calla para que la repitas en
   voz alta. Es la mitad del ejercicio y es lo que diferencia esto de un
   *vision board* animado.

Ese tercer punto es el que hay que defender en el diseño: la app está construida
alrededor del reproductor, no alrededor del archivo MP4. El MP4 es un derivado
para compartir.

---

## 2. Los dos productos

| | **Imágenes** | **Animado** |
|---|---|---|
| Qué es | 6–12 escenas con tu cara + movimiento de cámara | 6–10 clips animados de verdad |
| Duración | 30 s o 60 s, mismo precio | 30 s o 60 s, mismo precio |
| Tiempo de generación | 1–2 min | 4–10 min |
| Coste de producción (60 s) | ~0,58 $ | ~6,50 $ |
| **Precio** | **9 $** | **39 $** |
| Margen bruto (60 s) | ~94 % | ~83 % |
| Margen bruto (30 s) | ~96 % | ~91 % |

**Recomendación: que el producto por defecto sea Imágenes, no Animado.**

El motivo no es solo el coste. Para el uso real —verlo a diario, dos veces al
día— una secuencia de imágenes bien encuadradas con movimiento de cámara
funciona casi igual de bien que vídeo animado, y tiene dos ventajas grandes:

- **Consistencia de identidad.** Mantener la misma cara reconocible a lo largo de
  8 clips generados es el riesgo técnico número uno del producto *(Probable, no
  medido: hay que validarlo con pruebas reales antes de vender Animado a escala)*.
  Con imágenes fijas el problema es mucho menor, porque cada imagen se genera
  desde la foto de referencia y se puede descartar y rehacer una suelta.
- **Velocidad.** 90 segundos de espera se aguantan; 8 minutos hacen que la
  gente cierre la pestaña.

Animado es el producto de escaparate y de upsell: la gente lo quiere una vez, para
su objetivo grande del año. No es el producto de uso diario.

---

## 3. Costes de proveedor verificados

### Vídeo (imagen → vídeo)

| Dato | Etiqueta | Fuente |
|---|---|---|
| Rango general en fal.ai: 0,05 $/s (Wan 2.5) a 0,40 $/s (Veo 3) | Probable | [NodeTool](https://nodetool.ai/blog/ai-video-generation-cost), [buildmvpfast](https://www.buildmvpfast.com/api-costs/ai-video) |
| Kling 3.0 Pro en fal: 0,224 $/s sin audio, 0,336 $/s con audio | Probable | [ofox.ai](https://ofox.ai/blog/fal-ai-alternatives-video-generation-api-2026/) |
| API oficial de Kling: 0,14 $ por unidad; 1080p HQ con audio consume 1 unidad/s → 5 s = 0,70 $ | Probable | [magichour](https://magichour.ai/blog/kling-ai-pricing), [eesel](https://www.eesel.ai/blog/kling-ai-pricing) — la página oficial `kling.ai/dev/pricing` está bloqueada desde este entorno, **no verificada en origen** |
| Paquete de recursos Kling: 700 $ por 5.000 unidades, 180 días, sin *rollover*, 20 peticiones concurrentes | Probable | mismas fuentes |
| Reventa de terceros desde 0,075 $/s (Kling 3.0) | Sin verificar | [magichour](https://magichour.ai/blog/kling-ai-pricing) |

**Lo importante de esta tabla:** el mismo modelo cuesta hasta **3× distinto**
según por dónde entres. Por eso la app tiene adaptadores separados para fal y
para Kling directo (`src/lib/ai/`): con volumen, el paquete de Kling sale mejor
que el markup del agregador, y cambiar es una variable de entorno.

### Imagen (con identidad preservada)

| Dato | Etiqueta | Fuente |
|---|---|---|
| FLUX en Replicate: 0,003–0,04 $/imagen según variante | Probable | [NodeTool](https://nodetool.ai/blog/ai-image-generation-cost) |
| FLUX.1 Kontext [dev] 0,015 $ / Kontext Pro 0,04 $ (SiliconFlow) | Probable | [SiliconFlow](https://www.siliconflow.com/articles/the-cheapest-image-gen-models) |
| Gemini 2.5 Flash Image ("Nano Banana"): ~0,039 $/imagen, 0,0195 $ en batch | Probable | [pricepertoken](https://pricepertoken.com/pricing-page/model/google-gemini-2.5-flash-image), [OpenRouter](https://openrouter.ai/google/gemini-2.5-flash-image) |
| **El Nano Banana original se retira el 2 de octubre de 2026** | Probable | [benchlm](https://benchlm.ai/media-pricing/nano-banana) |

Ese último punto es un aviso de diseño, no una curiosidad: **los modelos se
jubilan con meses de preaviso**. La capa de proveedores tiene que ser
reemplazable sin tocar el pipeline, y lo es.

Nota: el mismo modelo cuesta distinto según proveedor (Ideogram v3 a 0,03 $ en
fal y 0,09 $ en Replicate, *Probable*, misma fuente NodeTool). Merece la pena
comparar antes de cerrar contrato.

### Voz

| Dato | Etiqueta | Fuente |
|---|---|---|
| ElevenLabs TTS: 0,10 $/1.000 caracteres (multilingüe v2/v3), 0,05 $/1.000 (Flash/Turbo) | Probable | [ElevenLabs API pricing](https://elevenlabs.io/pricing/api), [Puter](https://developer.puter.com/tutorials/elevenlabs-api-pricing/) |
| Había una promoción de −50 % en TTS activa al consultar | Sin verificar | [Puter](https://developer.puter.com/tutorials/elevenlabs-api-pricing/) |

Un guion de 60 s son ~780 caracteres → **menos de 4 céntimos**. La voz es
irrelevante en el coste; no la escatimes, es donde más se nota la calidad.

### Guion (LLM)

Céntimos por vídeo. Contabilizado a 0,01 $ y redondeando hacia arriba.

---

## 4. Unit economics

Todo en dólares. Dos precios y ninguna otra cifra que aprenderse.

| Producto | Duración | Precio | Coste proveedor | Margen bruto |
|---|---|---:|---:|---:|
| Imágenes | 30 s | 9 $ | 0,32 $ | **~96 %** |
| Imágenes | 60 s | 9 $ | 0,58 $ | **~94 %** |
| Animado | 30 s | 39 $ | 3,32 $ | **~91 %** |
| Animado | 60 s | 39 $ | 6,50 $ | **~83 %** |

Desglose de un Animado de 60 s: 10 imágenes (0,40 $) + 60 s de animación a
0,10 $/s (6,00 $) + voz (0,04 $) + guion (0,01 $) + infraestructura (0,05 $).

### Por qué precio plano y no por duración

Un vídeo de 30 s nos cuesta la mitad que uno de 60. Cobrar lo mismo por los dos
significa que el margen **mejora** cuando el usuario elige corto, y ahorra dos
precios más en la tabla. La simplicidad se paga sola.

### Por qué se cayó el sistema de créditos

La versión anterior tenía créditos, cuatro planes de suscripción y tres packs:
nueve números distintos para un catálogo de dos productos. Los créditos tienen
sentido cuando hay muchas acciones con costes muy distintos; con dos productos
son una moneda que el usuario tiene que aprender para comprar dos cosas.

Con precio directo, la pregunta "¿cuánto me cuesta esto?" se contesta sin
convertir nada.

### Por qué no hay suscripción

El KPI de este producto no es cuántos vídeos crea la gente: es **cuántas veces
ve el que ya tiene**. Un vídeo se mira dos veces al día durante semanas, y
volver a verlo no cuesta nada. Cobrar una cuota mensual por algo que se usa sin
consumir recursos genera la presión equivocada — empuja a producir vídeos en
vez de a usarlos.

Pago por vídeo: pagas cuando creas, y mirarlo es gratis para siempre.

### El primer vídeo, gratis

Coste de adquisición: **0,32 $**. El output es un vídeo vertical con la cara del
usuario que él mismo comparte. Es el anuncio más barato que se puede comprar, y
se lo lleva puesto.

Lleva una marca de agua discreta. Los vídeos de pago no.

## 5. El market: publicas tu vídeo, otro le pone su cara

Cuando alguien termina un vídeo que le gusta, puede publicarlo. Otra persona lo
ve en el market, le pone su cara, y recibe su propia versión: las mismas
escenas, el mismo guion, con ella dentro.

**Paga exactamente lo mismo que si empezara de cero** — 9 $ o 39 $. De ese
pago, el **30 %** va a quien lo creó.

Sin tarifa de plantilla aparte. Dos cobros por una compra obligan a explicar por
qué son dos, y ninguna explicación mejora que no haya nada que explicar.

| | |
|---|---|
| Imágenes | comprador paga 9 $ · creador recibe 2,70 $ |
| Animado | comprador paga 39 $ · creador recibe 11,70 $ |

### Qué se publica exactamente

**La receta, no el vídeo montado.** El guion, las descripciones de escena, el
estilo y el tono. El vídeo del creador se ve en la ficha como vista previa —lo
publica él, a sabiendas— pero lo que el comprador recibe se **genera de nuevo**
con su cara.

Nunca se entrega el vídeo de una persona con la cara de otra pegada encima. Esa
línea sostiene dos cosas a la vez: el producto (el vídeo que te sirve para
visualizarte es aquel en el que sales tú) y lo legal (procesar la cara de un
tercero para fabricar el producto de otro es otro juego, con consentimiento
revocable y responsabilidades que no queremos).

### La consecuencia incómoda

Como cada versión se regenera, **la del comprador no será idéntica a la vista
previa.** Mismas escenas, mismo encuadre, misma luz — pero no el mismo fotograma.

*(Probable, sin medir: falta cuantificar cuánto se parecen dos generaciones del
mismo prompt con identidades distintas. Es de las primeras cosas que hay que
medir con proveedores reales.)*

Eso se gestiona diciéndolo, no escondiéndolo: la ficha tiene que dejar claro que
la vista previa es la versión de otra persona. Prometer un clon exacto y
entregar un parecido es la forma más rápida de generar reembolsos.

### Por qué escala

El creador hace el trabajo una vez y se vende infinitas. El coste de generación
lo paga cada comprador con su propia compra. Y el catálogo crece solo: cada
usuario satisfecho es un proveedor potencial.

## 6. Riesgos, ordenados por lo que duelen

1. **Consistencia de identidad entre escenas** *(Probable, sin medir)*. Si a la
   escena 6 la cara ya no es reconocible, el producto no vale. Mitigación:
   Imágenes por defecto, poder regenerar una escena suelta, y validar el
   modelo de identidad antes de abrir Animado al público.
2. **Datos biométricos.** Un selfie es dato personal de categoría especial en la
   UE. Hace falta: consentimiento explícito y granular (ya está en el asistente),
   almacenamiento privado con URLs firmadas (**pendiente**, ahora es `/public`),
   borrado real y verificable, retención limitada, y no usar las fotos para
   entrenar nada.
3. **Volatilidad de precios y jubilación de modelos.** Nano Banana se retira en
   octubre de 2026. Mitigación: la capa de proveedores ya es intercambiable, y
   los márgenes aguantan un encarecimiento de 2× sin tocar tarifas.
4. **Churn.** Las apps de manifestación tienen retención mala *(creencia del
   sector, no verificada — hay que medirlo con cohortes propias)*. El antídoto
   del producto es el reproductor: si la gente vuelve a ver el mismo vídeo a
   diario, el coste marginal es cero y el plan se paga solo. Por eso el KPI
   principal no es "vídeos generados" sino **reproducciones por usuario y
   semana**.
5. **Promesas.** Ni salud ni dinero garantizado. El filtro de
   `src/lib/safety.ts` bloquea las intenciones de curación y de rentabilidad, y
   el pie de página lo dice. Esto protege del disgusto regulatorio y también de
   los reembolsos.
6. **Abuso: cara de otra persona.** Hoy solo hay una casilla de consentimiento.
   Antes de abrir el registro hace falta *liveness check* o, como mínimo,
   detección de que el selfie no es una foto de famoso.

---

## 7. Métricas que importan

| Métrica | Por qué | Objetivo inicial |
|---|---|---|
| Reproducciones / usuario activo / semana | Mide si es una práctica o un juguete | > 5 |
| Conversión gratis → pago | El vídeo gratis es el anuncio | > 6 % |
| Coste de proveedor por vídeo vendido | El margen se rompe por aquí | < 17 % del precio |
| % de vídeos con escena regenerada | Proxy de fallo de identidad | < 20 % |
| Plantillas con ≥ 1 uso | Si el market tiene oferta viva | > 30 % |

---

## 8. Por dónde empezaría

1. **Semanas 1–2.** Conectar proveedores reales (fal + ElevenLabs + un LLM) y
   medir *de verdad* la consistencia de identidad en 50 generaciones. Todo lo
   demás depende de ese número.
2. **Semanas 3–4.** Auth y pagos (Supabase Auth + Stripe), almacenamiento
   privado, borrado real. Solo entonces se puede cobrar.
3. **Semana 5.** Lanzar **solo Imágenes**, en abierto, con el primer vídeo gratis como
   gancho. Animado en lista de espera.
4. **Semanas 6–8.** Cola de trabajos real para Animado y apertura del producto.
5. **Mes 3.** Market en modo curado, con 20–30 plantillas invitadas, antes de
   dejar publicar a cualquiera.

El market va al final a propósito: un mercado vacío resta credibilidad, y hasta
que no hay usuarios generando no hay creadores interesados.
