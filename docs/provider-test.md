# Prueba de proveedor: consistencia de identidad

Protocolo fijo para comparar proveedores de vídeo con el **mismo** input.
Se escribe antes de generar para que el criterio no se ajuste al resultado.

## Criterio de éxito (fijado de antemano)

La misma persona es reconocible en **5 de las 6** escenas, **incluyendo al menos
una de las tres difíciles**. Si solo aguanta en las fáciles, el resultado no es
"funciona": es "funciona con encuadres restringidos", y el producto tendría que
limitar el catálogo a esos encuadres.

Juez: el propio usuario sobre su propia cara. Nadie la conoce mejor.

## Input

4 fotos de referencia, **recortadas a cabeza y hombros**. El recorte es la
defensa real contra que el sujeto absorba la ropa: si la camiseta no está en
el encuadre, no hay casi señal que absorber. No se puede controlar qué mira
el codificador de sujetos de Kling por dentro; sí se puede controlar qué
entra en la foto.

| # | Ángulo | Qué aporta |
|---|---|---|
| 1 | Frontal (portada) | rasgos, ojos claros, sonrisa |
| 2 | Tres cuartos | estructura 3D |
| 3 | Casi perfil | nariz, mandíbula |
| 4 | Perfil trasero | **el moño y el degradado de los lados** |

La cuarta se añadió tras revisar las tres primeras: en ninguna aparecía el
moño. Todas mostraban el pelo tirante hacia atrás, de lo que el modelo no
puede distinguir pelo largo recogido de pelo corto engominado. La cuarta
además revela un degradado corto en los lados que ninguna de las otras
dejaba ver.

**Conflicto conocido:** la cuarta es de otra sesión y la barba se ve más
corta que en las tres primeras. Se asume a propósito — los usuarios reales
subirán fotos de épocas distintas, así que el input es más representativo
así. También lleva un AirPod puesto; va anotado por si aparece en la salida.

## Definición del sujeto (Element)

Aspecto de referencia confirmado por el usuario: **el de las fotos 1-3**
(barba poblada). La cuarta es anterior y entra únicamente por el pelo.

- `name`: `Patric`
- `tags`: `["Characters"]`
- `resource.cover`: recorte frontal
- `resource.secondary`: recortes tres cuartos, perfil, perfil trasero
- `description`:

> Adult man in his early thirties. Light green-hazel eyes, thick dark
> eyebrows, straight nose. Full dark beard and moustache covering the jaw
> and chin. Long dark hair worn pulled back and tied in a top knot, with
> short faded sides. Warm olive complexion.

**La descripción no menciona ropa a propósito.** Nombrarla, aunque fuese
para negarla, es meterla en el condicionamiento.

**Riesgo anotado:** la cuarta referencia lleva un AirPod. Si aparece un
auricular blanco en las escenas de oficina, el origen es ése.

## Escenas

Área `carrera` de `src/lib/script-engine.ts`, elegidas para cubrir el rango de
dificultad, no para salir bien.

| # | Dificultad | Por qué |
|---|---|---|
| 1 | Fácil | plano general, luz frontal |
| 2 | Media | tres cuartos, contraluz suave de ventanal |
| 3 | **Difícil** | cabeza inclinada hacia abajo |
| 4 | **Difícil** | varias caras en cuadro, el modelo puede mezclarlas |
| 5 | **Difícil** | contraluz duro de escenario |
| 6 | Media-alta | movimiento y oclusión por confeti |

## Prompts

Reglas aplicadas en los seis:
- **Encuadre medio o general.** La cara al 15-25% del alto. La deriva existe
  siempre; a ese tamaño no se ve.
- **Vestuario explícito**, para que no herede la camiseta de las referencias.
- **Luz de relleno frontal explícita** en la escena 5, para pelear el contraluz.
- **"face clearly visible"** en la 3 y la 5, donde el brief original la esconde.
- Sin primeros planos. Sin giros de cabeza. Es donde el modelo se inventa rasgos.
- **"framed from the waist up"** en los seis: "medium-wide" salió plano entero
  con la cara al ~7% (revisión v2, tras la escena 1).
- **Sin negaciones** ("without a tie", "not in shadow", "not obscured"): la
  escena 1 salió con corbata. Se describe lo que sí debe haber (revisión v2).

1. Medium shot of <<<SUBJECT>>>, framed from the waist up, walking through glass doors into a bright modern office lobby at sunrise, wearing a well-fitted charcoal suit over an open-collar white shirt. Warm golden light across the polished floor. Confident relaxed stride, face turned toward camera and clearly visible, natural expression. Photorealistic, cinematic, shallow depth of field.

2. Medium shot of <<<SUBJECT>>>, framed from the waist up, standing and presenting to an attentive boardroom, warm daylight through floor-to-ceiling windows behind him, wearing a navy suit. Gesturing naturally while speaking, three-quarter angle, face clearly lit and visible. Seated colleagues softly out of focus. Photorealistic, cinematic.

3. Medium shot of <<<SUBJECT>>>, framed from the waist up, signing a contract at a clean minimal desk, calm and focused, wearing a light blue dress shirt with rolled sleeves. Soft window light from the left. Head tilted slightly down but face remains clearly visible and well lit. Photorealistic.

4. Medium shot of <<<SUBJECT>>>, framed from the waist up, being congratulated by two colleagues in a bright office, genuine smiles, candid moment. He is the clear focal point, centered and sharp; colleagues slightly behind and softly out of focus. Charcoal blazer over a white shirt, natural daylight. Photorealistic.

5. Medium shot of <<<SUBJECT>>>, framed from the waist up, stepping onto a stage to speak, audience in silhouette at the bottom edge of the frame, warm spotlight on him from the front. Dark suit. His face is fully lit by the front key light and clearly visible. Photorealistic, cinematic.

6. Medium shot of <<<SUBJECT>>>, framed from the waist up, celebrating a product launch with a small team, confetti in the air, natural joy, laughing. He is centered and in focus, wearing a charcoal blazer. Warm indoor light. Photorealistic, cinematic.

## Parámetros

### Kling
- Sujeto: `element_create`, portada = frontal, secundarias = tres cuartos + perfil
- Fijas: `image_to_image`, `kling-image-v3_0_omni`, `2k`, `9:16`,
  `elements: [{id, bindName}]`, `<<<id>>>` en el prompt
- Vídeo: `image_to_video`, `kling-video-v3_0_turbo`, `5s`, `1080p`
- **Sin audio.** La voz y la música las pone nuestro pipeline; pagar el audio
  de Kling son 20 créditos por clip tirados.

### Runway (pendiente)
- `gen4_image` con referencia de personaje para las fijas
- Gen-4 Turbo para los clips

## Resolución elegida

`2k` en las fijas. El vídeo sale a 1080p: generar a 4k es pagar detalle que
el siguiente paso tira.

## Aspecto

`9:16`. El contenido se ve en el móvil. **Decisión a confirmar** — el reproductor
actual no fuerza ninguna proporción.

## Resultados

### Kling — sesión 2026-09-29

- **Element**: `322695164303729` (`Patric`). Creado con los 4 recortes. Crearlo
  no consumió créditos.
- **Recortes**: la camiseta se quitó casi entera; queda el fondo (silla con
  logo en 2 y 3). La 4 conserva el AirPod.
- **Desviación del protocolo**: `kling-image-v3_0_omni` exige `image_1` aunque
  se use `elements`. Se pasó el recorte frontal (mismo que la portada).
- **Coste real de una fija** (`2k`, `9:16`, 1 imagen): **2 créditos**
  (661 → 659). Las seis fijas: ~12 créditos.
- Tiempo: ~60 s por imagen.

**Escena 1 (fácil)** — primera lectura, pendiente del juicio del usuario:
- La cara ocupa ~7% del alto, por debajo del 15-25% fijado. A ese tamaño no
  se puede juzgar identidad: el encuadre "medium-wide" salió plano entero.
- Lleva **corbata** pese a "without a tie": negar algo en el prompt lo mete.
  Mismo principio que la descripción del sujeto; hay que quitar la negación.
- Barba más corta y recortada que en las fotos 1-3 (¿influencia de la 4?).
- Moño no visible de frente; esperable.

### Kling — ronda v2 (prompts revisados), 6 escenas

- Coste: **12 créditos** (659 → 647), 2 por imagen, confirmado. Las 6 en
  paralelo, ~60 s en total.
- Total gastado en fijas hasta ahora: 14 créditos.

Lectura técnica (la identidad la juzga el usuario, no esto):

| # | Encuadre / cara | Notas |
|---|---|---|
| 1 | Plano entero otra vez, cara ~7% | "walking" gana a "waist up". Ya sin corbata. |
| 2 | Cintura, cara ~12% | Moño bajo visible. |
| 3 | Cintura, cara ~12% | Cabeza inclinada pero cara legible; moño visible. |
| 4 | Medio, cara ~15% | Dos compañeras detrás, sin mezcla de rasgos aparente. |
| 5 | Plano entero, cara ~5% | Mete **corbata negra** sin pedirla. Cara iluminada. |
| 6 | Cintura, cara ~12% | El confeti no tapa la cara. |

- **Barba**: en las seis sale más corta y recortada que en las fotos 1-3.
  Es consistente entre escenas, así que parece venir del sujeto, no del azar.
- **"waist up" no basta** cuando la acción implica cuerpo entero (caminar,
  subir a un escenario). Para 1 y 5 haría falta cambiar la acción, no el
  encuadre.
- **Juicio del usuario**: se reconoce ("sí, está bueno"), pero los rasgos
  (peinado, barba, piel) no se ven tan reales como él.

### Kling — ronda v3: sujeto revisado + escenas de visualización

Cambios respecto a v2:
- Descripción del sujeto (`element_update`, mismas 4 fotos):

> Adult man in his early thirties. Light green-hazel eyes, thick dark
> eyebrows, straight nose. Full, untrimmed dark beard and moustache covering
> the jaw and chin. Long dark hair pulled tightly back and tied in a high top
> knot on the crown of the head, with short faded sides. Slightly high
> temples. Natural skin texture with light freckles. Warm olive complexion.

- En los prompts, "cinematic" pasa a "Natural, unretouched, documentary-style
  photo, realistic skin texture".
- Escenas nuevas pedidas por el usuario: Ferrari rojo, liderando Settlia (IA
  para plantas solares), programando, liderando ManifestAI, ático de lujo.
- A/B: la escena del Ferrari se repitió pasando además las 4 fotos como
  `image_1..4`.

Coste: 12 créditos (647 → 635). Total en fijas: 26.

| Escena | Lectura |
|---|---|
| Ferrari (solo sujeto) | Sale un coupé, no descapotable. El moño no se ve. |
| Settlia | El rótulo dice **"Settilia"**: falta de ortografía. Hay que repetirla. |
| Programando | Moño alto visible: la mejor en pelo. |
| ManifestAI | Rótulo bien escrito. El pelo parece suelto por detrás. |
| Ático | Correcta. |
| Ferrari + 4 refs | Descapotable, moño visible, barba más natural. **Copia el AirPod** de la foto 4. |

- Pasar las fotos como `image_n` ayuda al pelo, pero arrastra objetos de las
  referencias. Confirma el riesgo anotado: la foto 4 hay que sustituirla por
  una sin auricular.
- El texto en imagen funciona a veces ("ManifestAI" bien, "Settlia" mal). En
  producto convendría poner logos en postproducción y no fiarse del modelo.
- Error de contexto, no del modelo: Settlia es una app de gastos compartidos,
  no una empresa de plantas solares. Se asumió sin preguntar. De ahí salió el
  paso de preguntas del asistente.

### Kling — prueba de plantilla reutilizable (4 créditos según Kling)

Kling informó 2 créditos por llamada, pero el saldo pasó de 635 a **571**
(−64). Hay 60 créditos sin explicar: o hubo otro uso de la cuenta en ese
intervalo, o alguna llamada cobró más de lo que dijo. **Sin verificar.**

Pregunta: ¿el market puede guardar una escena hecha y cambiar solo a la persona?

1. `text_to_image`: escena genérica con una persona anónima (fundador en una
   cena enseñando una app de gastos compartidos a sus amigos). Sin rótulos.
2. `image_to_image` con esa escena como `image_1` y el sujeto `Patric`:
   "Recreate 图片1 with <<<id>>> as the man… Keep the scene, pose, clothing,
   lighting and framing".

Resultado:
- La escena se conserva casi píxel a píxel: mesa, amigos, móvil, luz.
- La persona cambia entera, no solo la cara: sale el moño alto. Es mejor que un
  cambio de cara, que dejaría el pelo y el cuerpo de la plantilla.
- La barba sale **demasiado** larga y poblada: "full, untrimmed" se pasó.
  Hay que suavizar a "full, medium-length beard".
- **Repetición con la barba ajustada** (2 créditos, 571 → 569, esta vez cuadra):
  descripción cambiada a "Full dark beard and moustache of medium length, about
  two centimetres, natural and slightly uneven, following the jawline and
  chin". Mismo prompt y plantilla. La barba baja a una longitud parecida a la
  real; el moño alto y la escena se mantienen.
- Conclusión: la receta del market puede llevar una imagen de composición y
  regenerarse con el sujeto de cada usuario. Coincide con lo que ya dice
  `Template` en `src/lib/types.ts`: se regenera con la cara del comprador,
  nunca se pega una cara encima.


## Cómo retomar esto en una sesión nueva

Esta prueba se quedó parada porque el entorno cloud estaba en **Trusted**, que
solo permite la lista de dominios por defecto. `kling.ai` no está en ella.

Los conectores MCP **no** pasan por esa lista — van por los servidores de
Anthropic — así que las herramientas de Kling respondían (créditos, elements)
mientras que subir un fichero al host fallaba con 403 en el CONNECT. Esa
asimetría es esperada, no un fallo.

**Arreglo:** Edit cloud environment → Network access → **Custom**, y en
Allowed domains:

```
kling.ai
*.kling.ai
*.klingai.com
```

Se aplica solo a sesiones nuevas.

**Para arrancar:** adjunta los 4 recortes de referencia y di "retoma
docs/provider-test.md". Los recortes no se versionan aquí a propósito: son
datos biométricos y este repositorio es público.

Primer paso al retomar: `element_create`, luego **una sola imagen**, y parar
a reportar el coste real antes de generar las cinco restantes.
