# Lego System — guion de vídeos modulares

Piezas sueltas que se combinan: **Gancho (H) + Cuerpo (B) + Llamada a la acción (C)**.
10 × 50 × 7 = 3.500 combinaciones posibles. Formato vertical 9:16, 1080×1920.

Duración objetivo de cada pieza:

| Pieza | Duración | Palabras aprox. |
|---|---|---|
| Gancho | 2–4 s | 6–14 |
| Cuerpo | 8–14 s | 25–35 |
| CTA | 3–5 s | 8–15 |
| **Vídeo final** | **15–25 s** | |

Para vídeos de 30–45 s: Gancho + 2 cuerpos del mismo bloque + CTA.

---

## Reglas de grabación

- **Cada pieza es un clip independiente.** Ningún cuerpo empieza con "y", "pero", "por eso"
  ni hace referencia al gancho. Así cualquier pieza encaja con cualquier otra.
- **1 segundo de silencio** antes y después de cada frase, mirando a cámara, sin moverte.
  Es el margen para cortar limpio.
- **2 tomas por pieza** como mínimo. Si fallas, repite la frase entera, no desde el error.
- Misma ropa, luz y encuadre dentro de cada sesión, para que los cortes no se noten.
  Si quieres variedad, haz sesiones completas con otro look, no mezcles dentro de una.
- Graba los textos en pantalla aparte: no los leas, se añaden en edición.
- Nombra los ficheros así, para que Claude los encuentre y monte sin preguntar:

```
clips/
  hooks/   H01_t1.mp4  H01_t2.mp4 ...
  bodies/  B01_t1.mp4  ...
  ctas/    C01_t1.mp4  ...
  broll/   app_selfie.mp4  app_deseos.mp4  app_escenas.mp4  video_final.mp4 ...
```

- **B-roll de la app** (graba una vez, sirve para todo): subir selfie, escribir 3 deseos,
  revisar guion, ver escenas, regenerar una escena, reproducir el vídeo final,
  biblioteca, cambio de idioma EN/ES.
- **Sin cara** también vale: voz en off + B-roll + escenas generadas. El texto es el mismo.

## Reglas de contenido (no negociables)

- No prometer resultados: nada de "vas a ganar dinero", "vas a adelgazar", "vas a encontrar pareja".
  Hablamos de **verte, enfocarte y practicar**, no de conseguir.
- Texto fijo en pantalla en todos los vídeos, pequeño, abajo:
  *"Visualización generada con IA. No garantiza resultados."*
- Los ejemplos de personas de la web son generados con IA: no presentarlos como clientes reales.
- No citar a autores ni estudios por nombre.

---

## 10 ganchos

| ID | Texto | Visual / texto en pantalla |
|---|---|---|
| H01 | "Imagina verte ya viviendo la vida que quieres. Literalmente verte." | Primer plano. TXT: "Literalmente." |
| H02 | "Subí un selfie, escribí tres deseos, y mira lo que me devolvió." | Selfie → corte a escena del vídeo final |
| H03 | "Si cierras los ojos para visualizar y no ves nada, esto es para ti." | Ojos cerrados → abre los ojos a cámara |
| H04 | "Llevo años escribiendo afirmaciones. Nunca me había visto diciéndolas." | Libreta en mano |
| H05 | "Esto no es un vision board. Es un vision board donde sales tú." | Corcho con recortes → escena con tu cara |
| H06 | "POV: tu yo del futuro te manda un vídeo." | TXT grande "POV". Móvil vibrando |
| H07 | "Dos minutos al día. Es lo único que te voy a pedir." | TXT: "2 min" |
| H08 | "¿Y si tu vision board se moviera?" | Foto fija que empieza a animarse |
| H09 | "Deja de imaginar a otra persona viviendo tu vida soñada." | Foto de stock tachada → tu cara |
| H10 | "Lo que miras cada día empieza a parecerte posible." | Plano lento, tono calmado |

---

## 50 cuerpos

### A. Qué es (B01–B08)

| ID | Texto |
|---|---|
| B01 | "ManifestLifeAI convierte tus deseos en un vídeo corto donde sales tú, viviéndolos. Tu cara, tus palabras y una voz que te guía." |
| B02 | "No es una plantilla genérica. El guion se escribe a partir de lo que tú quieres, con tus palabras, y cada escena es una de tus metas." |
| B03 | "Es un vídeo de visualización guiada de unos dos minutos: un pensamiento de apertura, respiración, una escena por cada deseo y un cierre donde repites en voz alta." |
| B04 | "Un vision board es una foto quieta de una casa que no es la tuya. Esto es un vídeo en movimiento donde la persona en esa casa eres tú." |
| B05 | "A mucha gente le cuesta imaginar con los ojos cerrados. Aquí no hace falta: lo ves en pantalla, con tu cara, y solo tienes que mirarlo." |
| B06 | "Piensa en él como tu ensayo diario. Ves la escena, respiras, repites tu afirmación. Lo mismo que harías en tu cabeza, pero con imagen." |
| B07 | "Es una herramienta de enfoque, no magia. Te ayuda a tener tus metas delante cada día, en vez de en una libreta que no vuelves a abrir." |
| B08 | "Todo empieza con una foto tuya y tres frases. El resto lo hace la IA: guion, escenas, animación y voz." |

### B. Cómo funciona (B09–B16)

| ID | Texto | B-roll |
|---|---|---|
| B09 | "Paso uno: subes de una a cuatro fotos tuyas con buena luz. Paso dos: escribes tus tres deseos. Paso tres: recibes tu vídeo." | app_selfie, app_deseos |
| B10 | "Antes de animar nada, revisas el guion y las escenas. Si una no te convence, la regeneras. Tienes tres intentos gratis por escena." | app_escenas |
| B11 | "Escribe tus deseos como los dirías tú. No hace falta saber de prompts ni de IA. La app traduce eso en escenas." | app_deseos |
| B12 | "La voz te guía: primero respiras, luego ves cada escena contigo dentro, y al final repites tus afirmaciones en voz alta." | video_final |
| B13 | "Mientras se genera puedes cerrar la app. Tarda unos minutos y luego queda guardado en tu biblioteca." | biblioteca |
| B14 | "Funciona en español y en inglés. Escribes en tu idioma y el vídeo sale en tu idioma." | cambio EN/ES |
| B15 | "Te lo descargas en MP4. Ponlo en el móvil, en el portátil o en la tele. Donde lo vayas a ver cada día." | descarga |
| B16 | "Puedes elegir el color del fondo entre varias paletas, para que el vídeo se sienta tuyo también en lo visual." | paletas |

### C. Dinero y trabajo (B17–B21)

| ID | Texto |
|---|---|
| C-nota | *No decir "vas a ganar más". Decir "te ves", "te enfocas".* |
| B17 | "Uno de mis deseos era tener mi propio negocio. Ver una escena de mí abriendo esa puerta es muy distinto a escribirlo en una lista." |
| B18 | "Si tu meta es cambiar de trabajo, verte entrando en esa oficina cada mañana te obliga a tenerla presente. Y lo que tienes presente, lo trabajas." |
| B19 | "Mucha gente escribe metas financieras en enero y en febrero ya no se acuerda. Un vídeo de dos minutos al día es más difícil de olvidar." |
| B20 | "No te va a dar dinero un vídeo. Lo que hace es recordarte cada mañana para qué te estás esforzando." |
| B21 | "Escribí: 'Trabajo desde donde quiero'. Y la escena me puso con un portátil frente al mar. Me reí, pero lo veo cada día." |

### D. Cuerpo y bienestar (B22–B25)

| ID | Texto |
|---|---|
| D-nota | *Nunca peso, enfermedades ni resultados físicos. Solo hábitos y cómo te sientes.* |
| B22 | "Una de mis escenas es yo corriendo por la mañana, con calma. No es una promesa, es un recordatorio de quién quiero ser." |
| B23 | "La parte de respiración del principio me baja las pulsaciones antes de empezar el día. Solo eso ya vale la pena." |
| B24 | "Me pedí verme tranquila, descansada, con energía. Verlo me ayuda a elegir mejor qué hago hoy." |
| B25 | "No sustituye a un médico ni a un psicólogo. Es un momento al día para enfocarte en cómo quieres sentirte." |

### E. Amor y relaciones (B26–B29)

| ID | Texto |
|---|---|
| B26 | "Uno de mis deseos fue una relación tranquila y bonita. La escena no muestra a nadie concreto: muestra cómo me siento yo en ella." |
| B27 | "Puedes incluir a otras personas en tus escenas, siempre que sean adultas y te den permiso." |
| B28 | "Lo hice con mi pareja: tres deseos que tenemos juntos. Verlo en pantalla fue mucho más fuerte de lo que esperaba." |
| B29 | "A veces el deseo no es encontrar a alguien, es quererte más a ti. También se puede visualizar." |

### F. Viajes y estilo de vida (B30–B33)

| ID | Texto |
|---|---|
| B30 | "Llevo años diciendo que quiero ir a Japón. Ahora tengo un vídeo donde camino por Kioto. Ya no es un 'algún día', es una escena." |
| B31 | "Mi deseo era vivir cerca del mar. Me vi abriendo la ventana por la mañana con el mar delante. Es el primer vídeo que veo cada día." |
| B32 | "La casa, el viaje, la mañana tranquila. Lo que normalmente pegas en un corcho, aquí lo ves en movimiento y contigo dentro." |
| B33 | "Lo bonito es que cada escena sale de tus palabras. Si escribes 'una cabaña en la nieve', no te pone en una playa." |

### G. Ritual y hábito (B34–B38)

| ID | Texto |
|---|---|
| B34 | "Mi ritual es simple: café, auriculares, dos minutos de vídeo. Y luego empiezo el día." |
| B35 | "La clave no es verlo una vez. Es verlo cada día. Por eso dura dos minutos y no veinte." |
| B36 | "La app te puede recordar cada día que veas tu vídeo. Es lo único que hace falta para que se convierta en hábito." |
| B37 | "La parte final, donde repites en voz alta, es la que más me cuesta y la que más me sirve. Decirlo cambia cómo lo sientes." |
| B38 | "Lo veo por la noche antes de dormir. Es lo último que miro en vez de las redes." |

### H. Dudas y confianza (B39–B45)

| ID | Texto |
|---|---|
| B39 | "¿Y mis fotos? Se usan solo para generar tu vídeo y se borran a los treinta días. Nadie más recibe un vídeo con tu cara." |
| B40 | "Tú tienes el control: revisas el guion y cada escena antes de que se anime. Nada sale sin que lo hayas visto." |
| B41 | "No necesitas saber nada de IA. Si sabes hacerte un selfie y escribir tres frases, sabes usarlo." |
| B42 | "No hay suscripción. Pagas por vídeo y es tuyo, sin caducidad." |
| B43 | "Si tu vídeo falla, te lo rehacemos o te devolvemos el dinero." |
| B44 | "No te voy a decir que esto hace realidad tus deseos. Te digo que te ayuda a tenerlos delante cada día, y eso ya es mucho." |
| B45 | "Pensé que me iba a dar vergüenza verme. Pero es raro y bonito a la vez: es la versión de ti que estás intentando ser." |

### I. Formatos y Market (B46–B50)

| ID | Texto |
|---|---|
| B46 | "Hay tres formatos. Imágenes con movimiento de cámara, escenas animadas, o la versión más cinematográfica en 1080p." |
| B47 | "Empecé con la versión de imágenes para probar. Cuando vi que lo usaba cada día, hice la animada." |
| B48 | "La versión Elevated parece una película. Si es tu meta más importante, merece verse así." |
| B49 | "En el Market puedes usar la receta de otra persona con tu propia cara. Solo se comparte la idea, nunca el vídeo de nadie." |
| B50 | "¿No sabes qué escribir? Mira las recetas del Market, elige una que te inspire y hazla tuya." |

---

## 7 llamadas a la acción

| ID | Texto | Uso |
|---|---|---|
| C01 | "Entra en manifestlife punto ai y crea el tuyo." | General |
| C02 | "Un selfie y tres deseos. El link está en la bio." | Redes |
| C03 | "Guarda este vídeo y mañana empieza a verte." | Alcance (guardados) |
| C04 | "Comenta cuál sería tu primer deseo." | Engagement |
| C05 | "Tu futuro, visto primero. ManifestLifeAI." | Marca, cierre suave |
| C06 | "Sígueme, que mañana te enseño el mío." | Serie / seguidores |
| C07 | "Hazlo hoy, y dentro de un mes cuéntame cómo te sientes." | Ritual |

Cierre fijo tras el CTA (no se graba, lo añade la edición):
tarjeta de marca **"ManifestLifeAI. See it. Feel it. Live it."** + manifestlife.ai.

---

## Combinaciones recomendadas para empezar

Probar primero estas 10, medir retención a 3 s y a final, y luego cruzar el mejor gancho con más cuerpos.

| # | Gancho | Cuerpo(s) | CTA | Idea |
|---|---|---|---|---|
| 1 | H02 | B09 | C02 | Demo directa |
| 2 | H05 | B04 | C01 | Vision board vs. vídeo |
| 3 | H03 | B05 | C03 | "No sé visualizar" |
| 4 | H06 | B03 | C05 | POV futuro |
| 5 | H07 | B34 + B35 | C07 | Ritual |
| 6 | H09 | B30 | C04 | Viaje |
| 7 | H01 | B17 | C02 | Trabajo |
| 8 | H04 | B37 | C03 | Afirmaciones |
| 9 | H08 | B46 | C01 | Formatos |
| 10 | H10 | B39 + B40 | C01 | Confianza |

## Antes de publicar — verificar

- **B42 y B43** (precio y garantía): la web dice "pagos aún no activos". No publicar hasta que lo estén.
- **B46–B48**: confirmar nombres y precios de los formatos vigentes.
- **B49–B50** (Market): confirmar que está abierto al público.
- **B27–B28** (otras personas): confirmar que la función está activa.
- **B36** (recordatorio diario) y **B16** (paletas): comprobar en la app.
- No usar "tu primer vídeo es gratis" hasta confirmar la oferta: la web tiene mensajes contradictorios.
