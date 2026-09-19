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

| | **Visión** | **Cine** |
|---|---|---|
| Qué es | 6–12 imágenes con tu cara + movimiento de cámara (Ken Burns) | 6–10 clips animados de verdad |
| Duración | 30 s / 60 s | 30 s / 60 s |
| Tiempo de generación | 1–2 min | 4–10 min |
| Coste de producción (60 s) | ~0,58 $ | ~6,50 $ (hasta ~14 $ con modelo premium) |
| Precio | 40 créditos (~4 €) | 380 créditos (~38 €) |
| Margen bruto | ~86 % | ~83 % (~63 % en premium) |

**Recomendación: que el producto por defecto sea Visión, no Cine.**

El motivo no es solo el coste. Para el uso real —verlo a diario, dos veces al
día— una secuencia de imágenes bien encuadradas con movimiento de cámara
funciona casi igual de bien que vídeo animado, y tiene dos ventajas grandes:

- **Consistencia de identidad.** Mantener la misma cara reconocible a lo largo de
  8 clips generados es el riesgo técnico número uno del producto *(Probable, no
  medido: hay que validarlo con pruebas reales antes de vender Cine a escala)*.
  Con imágenes fijas el problema es mucho menor, porque cada imagen se genera
  desde la foto de referencia y se puede descartar y rehacer una suelta por
  3 créditos.
- **Velocidad.** 90 segundos de espera se aguantan; 8 minutos hacen que la
  gente cierre la pestaña.

Cine es el producto de escaparate y de upsell: la gente lo quiere una vez, para
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

Supuesto de tipo de cambio: **1 € ≈ 1 $** para simplificar. No es real; si el
euro se mueve, los márgenes se mueven 5–10 puntos. *(Supuesto, no verificado.)*

Precio por crédito: **1 crédito = 0,10 €**.

| Producto | Créditos | Ingreso | Coste proveedor | Margen bruto |
|---|---:|---:|---:|---:|
| Visión 30 s | 25 | 2,50 € | 0,32 $ | **~87 %** |
| Visión 60 s | 40 | 4,00 € | 0,58 $ | **~86 %** |
| Cine 30 s | 200 | 20,00 € | 3,32 $ | **~83 %** |
| Cine 60 s | 380 | 38,00 € | 6,50 $ | **~83 %** |
| Cine 60 s (modelo premium) | 380 | 38,00 € | 13,94 $ | **~63 %** |

Desglose de un Cine de 60 s: 10 imágenes (0,40 $) + 60 s de animación a 0,10 $/s
(6,00 $) + voz (0,04 $) + guion (0,01 $) + infraestructura (0,05 $).

### Por qué el sistema de créditos y no "vídeos incluidos"

Un plan que diga "5 vídeos al mes" se arbitra solo: el usuario gasta los cinco en
Cine de 60 s y te cuesta 32,50 $ un plan de 24,99 €. Con créditos, **el precio
interno refleja el coste real de cada camino**, así que el peor caso de cada plan
sigue siendo rentable:

| Plan | Precio | Créditos | Peor caso (todo en el producto más caro) | Coste | Margen |
|---|---:|---:|---|---:|---:|
| Semilla | 9,99 € | 120 | 3 × Visión 60 s | ~1,74 $ | ~83 % |
| Creador | 24,99 € | 350 | 1,75 × Cine 30 s | ~5,80 $ | ~77 % |
| Visionario | 59,99 € | 900 | 2,37 × Cine 60 s | ~15,40 $ | ~74 % |

El plan gratuito da 30 créditos **una sola vez**: un Visión de 30 s, con marca de
agua. Coste de adquisición: 0,32 $. Es el mejor anuncio que puedes comprar,
porque el output es un vídeo vertical con la cara del usuario que él mismo
comparte.

---

## 5. El market: vende blueprints, no vídeos

**Aquí hay que cambiar la idea original.** La propuesta era un mercado donde la
gente compra "el vídeo en el que cualquiera manifieste". Eso no funciona, por dos
razones independientes y las dos serias:

1. **No tiene valor.** Un vídeo de visualización con la cara de otra persona no
   te sirve para visualizarte a ti. Todo el producto se apoya en que **eres tú**
   quien aparece. Comprar el de otro es comprar el producto sin la parte que
   funciona.
2. **No es legal de forma cómoda.** Revender un vídeo con la cara de alguien es
   tratar datos biométricos de un tercero. En la UE eso es categoría especial
   (RGPD art. 9) y no se arregla con una casilla en el registro.

**La versión que sí escala: el *blueprint*.** Se vende el guion, las escenas, el
estilo y el tono —todo menos la cara—. El comprador le pone su propio selfie y
genera su propia versión.

| | Vender vídeos | Vender blueprints |
|---|---|---|
| Valor para el comprador | Nulo (no es su cara) | Alto (es su cara, con curaduría ajena) |
| Coste marginal para el vendedor | Uno por venta | Cero |
| Coste de generación | Lo come la plataforma | Lo paga el comprador con sus créditos |
| Riesgo biométrico | Alto | Ninguno |

Reparto: **70 % para el creador**, 80 % en el plan Visionario. Precio típico
3–12 €. Se cobra aparte de la generación, y eso se dice claro en la ficha: el
blueprint es la receta, los créditos son los ingredientes.

Quién crea aquí: coaches, terapeutas y creadores de bienestar que ya tienen
audiencia. Para ellos el market es distribución; para ti es catálogo gratis y una
razón para que traigan a su gente.

---

## 6. Riesgos, ordenados por lo que duelen

1. **Consistencia de identidad entre escenas** *(Probable, sin medir)*. Si a la
   escena 6 la cara ya no es reconocible, el producto no vale. Mitigación:
   Visión por defecto, regenerar escena suelta por 3 créditos, y validar el
   modelo de identidad antes de abrir Cine al público.
2. **Datos biométricos.** Un selfie es dato personal de categoría especial en la
   UE. Hace falta: consentimiento explícito y granular (ya está en el asistente),
   almacenamiento privado con URLs firmadas (**pendiente**, ahora es `/public`),
   borrado real y verificable, retención limitada, y no usar las fotos para
   entrenar nada.
3. **Volatilidad de precios y jubilación de modelos.** Nano Banana se retira en
   octubre de 2026. Mitigación: la capa de proveedores ya es intercambiable, y
   los márgenes aguantan un encarecimiento de 2× en imagen sin tocar tarifas.
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
| Coste de proveedor por usuario de pago | El margen se rompe por aquí | < 15 % del ARPU |
| % de vídeos con escena regenerada | Proxy de fallo de identidad | < 20 % |
| Blueprints con ≥ 1 venta | Si el market tiene oferta viva | > 30 % |

---

## 8. Por dónde empezaría

1. **Semanas 1–2.** Conectar proveedores reales (fal + ElevenLabs + un LLM) y
   medir *de verdad* la consistencia de identidad en 50 generaciones. Todo lo
   demás depende de ese número.
2. **Semanas 3–4.** Auth y pagos (Supabase Auth + Stripe), almacenamiento
   privado, borrado real. Solo entonces se puede cobrar.
3. **Semana 5.** Lanzar **solo Visión**, en abierto, con el plan gratuito como
   gancho. Cine en lista de espera.
4. **Semanas 6–8.** Cola de trabajos real para Cine y apertura del tier.
5. **Mes 3.** Market en modo curado, con 20–30 blueprints invitados, antes de
   dejar publicar a cualquiera.

El market va al final a propósito: un mercado vacío resta credibilidad, y hasta
que no hay usuarios generando no hay creadores interesados.
