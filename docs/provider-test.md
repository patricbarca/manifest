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

- 3 fotos de referencia: frontal, tres cuartos, casi perfil.
- Misma sesión, misma ropa, mismo peinado → riesgo de que el sujeto
  absorba "camiseta blanca" como parte de la identidad. Los prompts
  especifican vestuario para contrarrestarlo.

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

1. Medium-wide shot of <<<SUBJECT>>> walking through glass doors into a bright modern office lobby at sunrise, wearing a well-fitted charcoal suit without a tie. Warm golden light across the polished floor. Confident relaxed stride, face turned toward camera and clearly visible, natural expression. Photorealistic, cinematic, shallow depth of field.

2. Medium shot of <<<SUBJECT>>> standing and presenting to an attentive boardroom, warm daylight through floor-to-ceiling windows behind him, wearing a navy suit. Gesturing naturally while speaking, three-quarter angle, face clearly lit and visible. Seated colleagues softly out of focus. Photorealistic, cinematic.

3. Medium shot of <<<SUBJECT>>> signing a contract at a clean minimal desk, calm and focused, wearing a light blue dress shirt with rolled sleeves. Soft window light from the left. Head tilted slightly down but face remains clearly visible and well lit, not obscured. Photorealistic.

4. Medium shot of <<<SUBJECT>>> being congratulated by two colleagues in a bright office, genuine smiles, candid moment. He is the clear focal point, centered and sharp; colleagues slightly behind and softly out of focus. Charcoal blazer over a white shirt, natural daylight. Photorealistic.

5. Wide-medium shot of <<<SUBJECT>>> stepping onto a stage to speak, audience in silhouette in the foreground, warm spotlight on him from the front. Dark suit. His face is fully lit by the front key light, not in shadow, clearly visible. Photorealistic, cinematic.

6. Medium shot of <<<SUBJECT>>> celebrating a product launch with a small team, confetti in the air, natural joy, laughing. He is centered and in focus, wearing a charcoal blazer. Warm indoor light. Photorealistic, cinematic.

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

_Pendiente._
