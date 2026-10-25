import type { Locale } from "./i18n/locale";

/**
 * EL BLOG
 *
 * Artículos para traer tráfico de búsqueda. Cada artículo existe en un idioma
 * y en su propia URL; `translation` apunta al slug de la versión en el otro
 * idioma para declarar el hreflang. El idioma de la web va en cookie, así que
 * el blog es la única parte con URLs separadas por idioma: es lo que indexa Google.
 *
 * Regla del contenido: consejos prácticos y honestos. Nada de estudios ni
 * cifras sin fuente, y nada de prometer resultados: es una herramienta de
 * visualización y enfoque.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string };

export interface Post {
  slug: string;
  locale: Locale;
  /** Slug de la misma entrada en el otro idioma. */
  translation?: string;
  title: string;
  /** Meta description: 140–160 caracteres. */
  description: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  readingMinutes: number;
  /** Plantilla del market relacionada, si la hay. */
  template?: string;
  body: Block[];
}

export const POSTS: Post[] = [
  // ── 1 · Visualizar metas ─────────────────────────────────────────────────
  {
    slug: "como-visualizar-tus-metas",
    locale: "es",
    translation: "how-to-visualize-your-goals",
    title: "Cómo visualizar tus metas: una práctica de 2 minutos al día",
    description:
      "Guía práctica para visualizar tus metas cada día: qué imaginar, cuándo hacerlo, cómo usar afirmaciones en voz alta y los errores más comunes.",
    date: "2026-10-25",
    readingMinutes: 5,
    body: [
      { type: "p", text: "Visualizar no es fantasear. Fantasear es imaginar algo bonito y quedarte ahí. Visualizar es ensayar: verte, con detalle, haciendo lo que quieres hacer, para que cuando llegue el momento no sea la primera vez." },
      { type: "p", text: "La buena noticia es que no hace falta meditar una hora. Una práctica corta, repetida cada día, funciona mejor que una sesión larga una vez al mes. Esta es la que proponemos." },
      { type: "h2", text: "1. Elige una meta concreta, no un deseo general" },
      { type: "p", text: "«Ser feliz» o «tener éxito» no se pueden ver. «Dar la charla del jueves sin leer el papel» sí. Cuanto más concreta sea la escena, más fácil es imaginarla y más útil es el ensayo." },
      { type: "ul", items: [
        "Mal: «Quiero más dinero».",
        "Mejor: «Termino el mes con el 20 % de mi sueldo ahorrado».",
        "Mal: «Quiero viajar».",
        "Mejor: «Subo al avión a Japón en abril con una sola maleta».",
      ] },
      { type: "h2", text: "2. Imagina el momento, no el resultado abstracto" },
      { type: "p", text: "Piensa en el instante exacto en que ya está pasando: dónde estás, qué llevas puesto, qué ves, quién está contigo. Una escena que podrías fotografiar. Si no puedes describir la luz de la habitación, todavía es demasiado abstracta." },
      { type: "h2", text: "3. Dilo en presente y en voz alta" },
      { type: "p", text: "Las afirmaciones en primera persona y en presente («Hablo y la sala me sigue») convierten la escena en algo que haces, no algo que esperas. Decirlas en voz alta obliga a prestar atención: es difícil repetir una frase y pensar en otra cosa a la vez." },
      { type: "h2", text: "4. Hazlo siempre a la misma hora" },
      { type: "p", text: "La constancia importa más que la intensidad. Ata la práctica a algo que ya haces: al levantarte, antes del café o antes de dormir. Dos minutos por la mañana y dos por la noche son suficientes." },
      { type: "h2", text: "5. Acompáñalo de un paso real" },
      { type: "p", text: "Visualizar no sustituye a actuar. Úsalo para empezar el día sabiendo qué harás hoy para acercarte. Un truco sencillo: después de visualizar, escribe en una línea la acción de hoy." },
      { type: "h2", text: "Errores comunes" },
      { type: "ul", items: [
        "Visualizar diez metas a la vez: elige una o dos, como mucho seis frases.",
        "Imaginar solo el final: incluye también el camino (el entrenamiento, la conversación difícil).",
        "Abandonar en la semana tres: es justo cuando más se nota la diferencia entre quien sigue y quien no.",
        "Esperar que ocurra sin hacer nada: la visualización ayuda a enfocarte, no garantiza resultados.",
      ] },
      { type: "h2", text: "Cómo lo hacemos en ManifestLifeAI" },
      { type: "p", text: "Si te cuesta imaginar la escena, te la enseñamos. Subes un selfie, escribes tus deseos y recibes un vídeo de unos 2 minutos en el que te ves viviéndolos, con una voz que te guía y pausas para que repitas cada frase en voz alta. Lo miras dos veces al día; el resto lo pones tú." },
    ],
  },
  {
    slug: "how-to-visualize-your-goals",
    locale: "en",
    translation: "como-visualizar-tus-metas",
    title: "How to visualize your goals: a 2-minute daily practice",
    description:
      "A practical guide to visualizing your goals every day: what to picture, when to do it, how to use spoken affirmations, and the most common mistakes.",
    date: "2026-10-25",
    readingMinutes: 5,
    body: [
      { type: "p", text: "Visualizing isn't daydreaming. Daydreaming is picturing something nice and staying there. Visualizing is rehearsing: seeing yourself, in detail, doing the thing you want to do, so that when the moment comes it isn't the first time." },
      { type: "p", text: "The good news: you don't need an hour of meditation. A short practice, repeated every day, beats a long session once a month. Here's the one we suggest." },
      { type: "h2", text: "1. Pick a concrete goal, not a general wish" },
      { type: "p", text: "\"Be happy\" or \"be successful\" can't be seen. \"Give Thursday's talk without reading my notes\" can. The more concrete the scene, the easier it is to picture and the more useful the rehearsal." },
      { type: "ul", items: [
        "Vague: \"I want more money.\"",
        "Better: \"I end the month with 20% of my salary saved.\"",
        "Vague: \"I want to travel.\"",
        "Better: \"I board the plane to Japan in April with a single bag.\"",
      ] },
      { type: "h2", text: "2. Picture the moment, not an abstract result" },
      { type: "p", text: "Think of the exact instant it's already happening: where you are, what you're wearing, what you see, who's with you. A scene you could photograph. If you can't describe the light in the room, it's still too abstract." },
      { type: "h2", text: "3. Say it in the present tense, out loud" },
      { type: "p", text: "First-person, present-tense affirmations (\"I speak and the room follows\") turn the scene into something you do, not something you wait for. Saying them out loud forces attention: it's hard to repeat one sentence while thinking about another." },
      { type: "h2", text: "4. Do it at the same time every day" },
      { type: "p", text: "Consistency matters more than intensity. Tie the practice to something you already do: waking up, before coffee, before bed. Two minutes in the morning and two at night are enough." },
      { type: "h2", text: "5. Pair it with a real step" },
      { type: "p", text: "Visualizing doesn't replace acting. Use it to start the day knowing what you'll do today to get closer. A simple trick: after visualizing, write one line with today's action." },
      { type: "h2", text: "Common mistakes" },
      { type: "ul", items: [
        "Visualizing ten goals at once: pick one or two, six lines at most.",
        "Only picturing the finish: include the path too (the training, the hard conversation).",
        "Quitting in week three: that's exactly when the difference between those who continue and those who don't shows.",
        "Expecting it to happen without doing anything: visualization helps you focus, it doesn't guarantee results.",
      ] },
      { type: "h2", text: "How we do it at ManifestLifeAI" },
      { type: "p", text: "If picturing the scene is hard, we show it to you. Upload a selfie, write your desires and get a video of about 2 minutes where you see yourself living them, with a guiding voice and pauses so you repeat each line out loud. Watch it twice a day; the rest is up to you." },
    ],
  },

  // ── 2 · Afirmaciones ─────────────────────────────────────────────────────
  {
    slug: "como-escribir-afirmaciones",
    locale: "es",
    translation: "how-to-write-affirmations",
    title: "Cómo escribir afirmaciones que sí te puedas creer",
    description:
      "Por qué muchas afirmaciones no funcionan y cómo escribir las tuyas: en presente, concretas, creíbles y fáciles de decir en voz alta. Con ejemplos.",
    date: "2026-10-25",
    readingMinutes: 4,
    template: "la-conversacion-de-sueldo",
    body: [
      { type: "p", text: "«Soy millonario» dicho por alguien que llega justo a fin de mes suele producir lo contrario de lo que busca: una vocecita que contesta «no, no lo eres». El problema no es afirmar, es afirmar algo que tu cabeza rechaza." },
      { type: "h2", text: "Las cuatro reglas" },
      { type: "ol", items: [
        "En presente y en primera persona: «Pido lo que me corresponde con calma», no «Algún día pediré un aumento».",
        "Concreta: nombra la acción o el momento, no una cualidad abstracta.",
        "Creíble hoy: un paso por delante de donde estás, no diez.",
        "Corta: si no la puedes decir de un tirón en voz alta, recórtala.",
      ] },
      { type: "h2", text: "Afirmar el comportamiento, no solo el resultado" },
      { type: "p", text: "«Gasto menos de lo que gano» es algo que puedes hacer hoy. «Soy rico» no. Las mejores afirmaciones describen lo que hace la persona que ya consiguió lo que tú quieres. Así cada frase es también un recordatorio de qué hacer." },
      { type: "h2", text: "Ejemplos por área" },
      { type: "ul", items: [
        "Trabajo: «Mi trabajo habla por mí, y yo también».",
        "Dinero: «Cada euro que ahorro es un ladrillo de mi casa».",
        "Salud: «Me presento aunque no tenga ganas».",
        "Confianza: «Me sostengo aunque me tiemble la voz».",
        "Pareja: «Elijo la calma también cuando discutimos».",
      ] },
      { type: "h2", text: "Cuántas usar" },
      { type: "p", text: "Entre tres y seis. Más de eso y se convierten en una lista que recitas sin pensar. Es mejor decir pocas frases con atención que muchas en piloto automático." },
      { type: "h2", text: "Dilas, no solo las leas" },
      { type: "p", text: "Leer en silencio es fácil de hacer distraído. Decirlas en voz alta, con una pausa después de cada una, obliga a escucharte. Por eso en nuestros vídeos la voz calla después de cada frase: ese hueco es para ti." },
      { type: "quote", text: "Una afirmación útil no te describe como eres: te describe como actúas cuando estás en tu mejor día." },
      { type: "p", text: "Si quieres un punto de partida, las plantillas del market traen frases ya escritas para momentos concretos (una negociación de sueldo, una charla, una mudanza) que puedes editar antes de crear tu vídeo." },
    ],
  },
  {
    slug: "how-to-write-affirmations",
    locale: "en",
    translation: "como-escribir-afirmaciones",
    title: "How to write affirmations you can actually believe",
    description:
      "Why many affirmations don't work and how to write your own: present tense, concrete, believable and easy to say out loud. With examples.",
    date: "2026-10-25",
    readingMinutes: 4,
    template: "la-conversacion-de-sueldo",
    body: [
      { type: "p", text: "\"I am a millionaire,\" said by someone who barely makes it to the end of the month, often does the opposite of what it's meant to: a small voice answers \"no, you're not.\" The problem isn't affirming; it's affirming something your mind rejects." },
      { type: "h2", text: "The four rules" },
      { type: "ol", items: [
        "Present tense, first person: \"I calmly ask for what I've earned,\" not \"Someday I'll ask for a raise.\"",
        "Concrete: name the action or the moment, not an abstract quality.",
        "Believable today: one step ahead of where you are, not ten.",
        "Short: if you can't say it out loud in one breath, cut it.",
      ] },
      { type: "h2", text: "Affirm the behavior, not just the outcome" },
      { type: "p", text: "\"I spend less than I earn\" is something you can do today. \"I am rich\" isn't. The best affirmations describe what the person who already got what you want does. That way each line is also a reminder of what to do." },
      { type: "h2", text: "Examples by area" },
      { type: "ul", items: [
        "Work: \"My work speaks for me, and so do I.\"",
        "Money: \"Every dollar I save is a brick in my home.\"",
        "Health: \"I show up even when I don't feel like it.\"",
        "Confidence: \"I hold steady even when my voice shakes.\"",
        "Relationships: \"I choose calm even when we argue.\"",
      ] },
      { type: "h2", text: "How many to use" },
      { type: "p", text: "Between three and six. More than that and they become a list you recite without thinking. A few lines said with attention beat many on autopilot." },
      { type: "h2", text: "Say them, don't just read them" },
      { type: "p", text: "Reading silently is easy to do distracted. Saying them out loud, with a pause after each one, makes you listen to yourself. That's why in our videos the voice goes quiet after every line: that gap is for you." },
      { type: "quote", text: "A useful affirmation doesn't describe who you are: it describes how you act on your best day." },
      { type: "p", text: "If you want a starting point, the templates in the market come with lines already written for specific moments (a salary negotiation, a talk, a move) that you can edit before creating your video." },
    ],
  },

  // ── 3 · Vision board vs vídeo ────────────────────────────────────────────
  {
    slug: "vision-board-o-video-de-visualizacion",
    locale: "es",
    translation: "vision-board-vs-visualization-video",
    title: "Vision board o vídeo de visualización: cuál usar y cuándo",
    description:
      "Diferencias entre un vision board y un vídeo de visualización, ventajas de cada uno y cómo combinarlos para practicar cada día tus metas.",
    date: "2026-10-25",
    readingMinutes: 4,
    template: "despegar",
    body: [
      { type: "p", text: "El vision board (un tablero con imágenes de lo que quieres) es la herramienta de visualización más conocida. Funciona como recordatorio: lo ves al pasar y te acuerdas de tus metas. Su límite es que las imágenes no son tuyas y no te piden nada." },
      { type: "h2", text: "Lo que hace bien un vision board" },
      { type: "ul", items: [
        "Está siempre a la vista, sin esfuerzo.",
        "Te obliga a elegir: no cabe todo.",
        "Es barato y personal: lo haces tú.",
      ] },
      { type: "h2", text: "Dónde se queda corto" },
      { type: "ul", items: [
        "Las fotos son de otras personas: ves la casa, no te ves a ti dentro.",
        "Es pasivo: lo miras, pero no ensayas nada.",
        "Con el tiempo se vuelve parte del decorado y dejas de verlo.",
      ] },
      { type: "h2", text: "Qué aporta un vídeo de visualización" },
      { type: "p", text: "Un vídeo guiado convierte el recordatorio en práctica: dura unos minutos, tiene un principio y un final, y te pide algo (respirar, mirar cada escena, repetir cada frase). Si además las escenas te muestran a ti, el salto entre «eso que quiero» y «yo haciéndolo» es más corto." },
      { type: "h2", text: "Cuál elegir" },
      { type: "ul", items: [
        "Si quieres un recordatorio constante en tu espacio: vision board.",
        "Si quieres un hábito diario de unos minutos: vídeo de visualización.",
        "Si tienes una fecha concreta (una entrevista, un viaje, una charla): vídeo, visto cada día hasta ese momento.",
      ] },
      { type: "h2", text: "Cómo combinarlos" },
      { type: "p", text: "Usa el tablero para el «qué» y el vídeo para el «cómo». Por ejemplo: en el tablero, la foto del destino; en el vídeo, tú subiendo al avión, llegando y despertando allí. Mira el vídeo por la mañana y deja que el tablero te lo recuerde durante el día." },
      { type: "p", text: "En ManifestLifeAI creamos ese vídeo con tu cara a partir de un selfie: hasta seis escenas, una por cada deseo, con una voz que te guía. Puedes empezar desde cero o desde una plantilla del market." },
    ],
  },
  {
    slug: "vision-board-vs-visualization-video",
    locale: "en",
    translation: "vision-board-o-video-de-visualizacion",
    title: "Vision board vs. visualization video: which to use and when",
    description:
      "The differences between a vision board and a visualization video, what each does well, and how to combine them to practice your goals every day.",
    date: "2026-10-25",
    readingMinutes: 4,
    template: "despegar",
    body: [
      { type: "p", text: "The vision board (a board with images of what you want) is the best-known visualization tool. It works as a reminder: you see it as you walk by and remember your goals. Its limit is that the pictures aren't of you and they don't ask anything of you." },
      { type: "h2", text: "What a vision board does well" },
      { type: "ul", items: [
        "It's always in sight, effortlessly.",
        "It forces you to choose: not everything fits.",
        "It's cheap and personal: you make it.",
      ] },
      { type: "h2", text: "Where it falls short" },
      { type: "ul", items: [
        "The photos are of other people: you see the house, not yourself in it.",
        "It's passive: you look at it, but you don't rehearse anything.",
        "Over time it becomes part of the furniture and you stop seeing it.",
      ] },
      { type: "h2", text: "What a visualization video adds" },
      { type: "p", text: "A guided video turns the reminder into practice: it lasts a few minutes, has a beginning and an end, and asks something of you (breathe, watch each scene, repeat each line). If the scenes also show you, the jump from \"the thing I want\" to \"me doing it\" gets shorter." },
      { type: "h2", text: "Which to choose" },
      { type: "ul", items: [
        "If you want a constant reminder in your space: vision board.",
        "If you want a daily habit of a few minutes: visualization video.",
        "If you have a specific date (an interview, a trip, a talk): video, watched every day until then.",
      ] },
      { type: "h2", text: "How to combine them" },
      { type: "p", text: "Use the board for the \"what\" and the video for the \"how.\" For example: on the board, a photo of the destination; in the video, you boarding the plane, arriving and waking up there. Watch the video in the morning and let the board remind you during the day." },
      { type: "p", text: "At ManifestLifeAI we create that video with your face from a selfie: up to six scenes, one for each desire, with a guiding voice. You can start from scratch or from a template in the market." },
    ],
  },
  // ── 4 · Entrevista de trabajo ────────────────────────────────────────────
  {
    slug: "afirmaciones-para-entrevista-de-trabajo",
    locale: "es",
    translation: "affirmations-for-a-job-interview",
    title: "Afirmaciones para una entrevista de trabajo (y cómo usarlas la semana antes)",
    description:
      "Afirmaciones concretas para preparar una entrevista de trabajo, un plan de 7 días para visualizarla y qué hacer la mañana de la entrevista.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "primer-dia",
    body: [
      { type: "p", text: "Los nervios antes de una entrevista no se van del todo, y no hace falta. Lo que sí puedes hacer es llegar habiendo ensayado: haber visto ya, muchas veces, cómo entras, cómo saludas y cómo contestas la pregunta que más te preocupa." },
      { type: "h2", text: "Afirmaciones que puedes usar" },
      { type: "p", text: "Elige tres o cuatro, o adáptalas a tu caso. Funcionan mejor si describen lo que haces, no solo cómo te sientes." },
      { type: "ul", items: [
        "«Llego con tiempo y con la cabeza tranquila».",
        "«Hablo de lo que he hecho sin quitarle mérito».",
        "«Si no sé algo, lo digo con calma y explico cómo lo resolvería».",
        "«Escucho la pregunta entera antes de contestar».",
        "«Pregunto lo que quiero saber de ellos: yo también estoy eligiendo».",
        "«Salgo sabiendo que di lo mejor que tenía hoy».",
      ] },
      { type: "h2", text: "Plan de 7 días" },
      { type: "ol", items: [
        "Días 1–2: escribe las tres preguntas que más te preocupan y una respuesta corta para cada una.",
        "Días 3–5: cada mañana, visualiza la entrevista de principio a fin (dos minutos) y repite tus afirmaciones en voz alta.",
        "Día 6: ensaya las respuestas en voz alta, de pie, como si estuvieras allí.",
        "Día 7 (la víspera): visualiza solo el principio (llegar, saludar, sentarte) y el final (salir tranquilo). Nada más.",
      ] },
      { type: "h2", text: "Qué visualizar exactamente" },
      { type: "p", text: "No te imagines solo el «sí, estás contratado». Imagina lo que depende de ti: entrar en la sala, la primera frase, la pregunta difícil y tú respondiendo despacio. Ese es el momento que el ensayo hace más fácil." },
      { type: "h2", text: "La mañana de la entrevista" },
      { type: "ul", items: [
        "Una sola vez tu visualización, no más: el objetivo es llegar tranquilo, no darle vueltas.",
        "Tres respiraciones lentas antes de entrar.",
        "Una frase de ancla para repetir mentalmente si te bloqueas, por ejemplo: «Despacio. Escucho y contesto».",
      ] },
      { type: "p", text: "Si quieres verte en la escena en vez de imaginarla, la plantilla «El primer día» del market está pensada para ese momento: llegar al nuevo trabajo con la sensación de que es tu sitio. Visualizar te ayuda a prepararte; no garantiza el resultado, pero sí que llegues mejor." },
    ],
  },
  {
    slug: "affirmations-for-a-job-interview",
    locale: "en",
    translation: "afirmaciones-para-entrevista-de-trabajo",
    title: "Affirmations for a job interview (and how to use them the week before)",
    description:
      "Concrete affirmations to prepare for a job interview, a 7-day plan to visualize it, and what to do on the morning of the interview.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "primer-dia",
    body: [
      { type: "p", text: "Nerves before an interview don't go away completely, and they don't need to. What you can do is arrive having rehearsed: having already seen, many times, how you walk in, how you say hello and how you answer the question that worries you most." },
      { type: "h2", text: "Affirmations you can use" },
      { type: "p", text: "Pick three or four, or adapt them to your situation. They work better when they describe what you do, not just how you feel." },
      { type: "ul", items: [
        "\"I arrive early and with a calm head.\"",
        "\"I talk about what I've done without downplaying it.\"",
        "\"If I don't know something, I say so calmly and explain how I'd solve it.\"",
        "\"I listen to the whole question before answering.\"",
        "\"I ask what I want to know about them: I'm choosing too.\"",
        "\"I leave knowing I gave the best I had today.\"",
      ] },
      { type: "h2", text: "A 7-day plan" },
      { type: "ol", items: [
        "Days 1–2: write down the three questions that worry you most and a short answer for each.",
        "Days 3–5: every morning, visualize the interview from start to finish (two minutes) and repeat your affirmations out loud.",
        "Day 6: rehearse your answers out loud, standing up, as if you were there.",
        "Day 7 (the night before): visualize only the beginning (arriving, saying hello, sitting down) and the end (leaving calm). Nothing more.",
      ] },
      { type: "h2", text: "What exactly to visualize" },
      { type: "p", text: "Don't just picture the \"you're hired.\" Picture what depends on you: walking into the room, the first sentence, the hard question and you answering slowly. That's the moment rehearsal makes easier." },
      { type: "h2", text: "On the morning of the interview" },
      { type: "ul", items: [
        "Your visualization once, no more: the goal is to arrive calm, not to overthink.",
        "Three slow breaths before walking in.",
        "One anchor phrase to repeat in your head if you freeze, for example: \"Slowly. I listen and I answer.\"",
      ] },
      { type: "p", text: "If you'd rather see yourself in the scene than imagine it, the \"The first day\" template in the market is built for that moment: arriving at the new job feeling it's your place. Visualizing helps you prepare; it doesn't guarantee the outcome, but it does help you show up better." },
    ],
  },

  // ── 5 · Dinero y ahorro ──────────────────────────────────────────────────
  {
    slug: "afirmaciones-para-el-dinero-y-el-ahorro",
    locale: "es",
    translation: "money-affirmations-for-saving",
    title: "Afirmaciones para el dinero que van con tus hábitos, no contra ellos",
    description:
      "Por qué «soy rico» no suele ayudar y qué afirmaciones sobre dinero y ahorro sí: ligadas a hábitos concretos, con ejemplos y un pequeño ritual semanal.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "el-mes-que-no-llego-justo",
    body: [
      { type: "p", text: "Con el dinero, las afirmaciones grandilocuentes chocan rápido con la realidad: abres la app del banco y la frase se cae. Las que sí ayudan son las que hablan de lo que haces con el dinero, porque eso sí lo puedes cumplir hoy." },
      { type: "h2", text: "Del resultado al hábito" },
      { type: "ul", items: [
        "En vez de «Soy rico»: «Gasto menos de lo que gano».",
        "En vez de «El dinero me llega fácil»: «Cobro lo que vale mi trabajo».",
        "En vez de «Nunca me falta»: «Aparto algo cada vez que cobro, aunque sea poco».",
        "En vez de «Tengo mi casa»: «Cada euro que ahorro es un ladrillo de mi casa».",
      ] },
      { type: "h2", text: "Afirmaciones por objetivo" },
      { type: "p", text: "Llegar a fin de mes sin agobio:" },
      { type: "ul", items: [
        "«Sé exactamente en qué se va mi dinero».",
        "«Elijo mi meta por encima del capricho».",
        "«Un mes flojo no rompe mi plan».",
      ] },
      { type: "p", text: "Ahorrar para algo grande (una casa, un viaje, un colchón de seguridad):" },
      { type: "ul", items: [
        "«Mi fondo crece mes a mes».",
        "«Firmo con calma y con los números claros».",
        "«Lo que aparto hoy me da tranquilidad mañana».",
      ] },
      { type: "h2", text: "Un ritual semanal de 10 minutos" },
      { type: "ol", items: [
        "Domingo: mira tus gastos de la semana, sin juzgarte.",
        "Visualiza el momento concreto de tu meta (las llaves en la mano, el billete comprado, el mes cerrado con margen).",
        "Repite tus tres afirmaciones en voz alta.",
        "Decide una sola acción para la semana: cancelar algo, apartar una cantidad, pedir un presupuesto.",
      ] },
      { type: "h2", text: "Lo que una afirmación no hace" },
      { type: "p", text: "No sustituye a un presupuesto ni a un consejo financiero, y no hace que el dinero aparezca. Lo que sí hace es recordarte cada día qué decidiste y por qué. Eso, sostenido en el tiempo, es lo que cambia los números." },
      { type: "p", text: "En el market tienes dos plantillas pensadas para esto: «El mes que no llegó justo», para salir del agobio de fin de mes, y «Las llaves de mi casa», para quien ahorra la entrada de su primera vivienda." },
    ],
  },
  {
    slug: "money-affirmations-for-saving",
    locale: "en",
    translation: "afirmaciones-para-el-dinero-y-el-ahorro",
    title: "Money affirmations that work with your habits, not against them",
    description:
      "Why \"I am rich\" rarely helps and which money and saving affirmations do: tied to concrete habits, with examples and a small weekly ritual.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "el-mes-que-no-llego-justo",
    body: [
      { type: "p", text: "With money, grandiose affirmations collide with reality fast: you open your banking app and the sentence falls apart. The ones that help talk about what you do with money, because that's something you can live up to today." },
      { type: "h2", text: "From outcome to habit" },
      { type: "ul", items: [
        "Instead of \"I am rich\": \"I spend less than I earn.\"",
        "Instead of \"Money comes to me easily\": \"I charge what my work is worth.\"",
        "Instead of \"I never run short\": \"I set something aside every payday, even if it's small.\"",
        "Instead of \"I own my home\": \"Every dollar I save is a brick in my home.\"",
      ] },
      { type: "h2", text: "Affirmations by goal" },
      { type: "p", text: "Getting to the end of the month without stress:" },
      { type: "ul", items: [
        "\"I know exactly where my money goes.\"",
        "\"I choose my goal over the impulse.\"",
        "\"One weak month doesn't break my plan.\"",
      ] },
      { type: "p", text: "Saving for something big (a home, a trip, an emergency fund):" },
      { type: "ul", items: [
        "\"My fund grows month after month.\"",
        "\"I sign calmly, with the numbers clear.\"",
        "\"What I set aside today gives me peace tomorrow.\"",
      ] },
      { type: "h2", text: "A 10-minute weekly ritual" },
      { type: "ol", items: [
        "Sunday: look at the week's spending, without judging yourself.",
        "Visualize the concrete moment of your goal (keys in hand, ticket bought, the month closed with room to spare).",
        "Repeat your three affirmations out loud.",
        "Decide one single action for the week: cancel something, set an amount aside, ask for a quote.",
      ] },
      { type: "h2", text: "What an affirmation doesn't do" },
      { type: "p", text: "It doesn't replace a budget or financial advice, and it doesn't make money appear. What it does is remind you every day what you decided and why. That, sustained over time, is what changes the numbers." },
      { type: "p", text: "The market has two templates built for this: \"The month that wasn't tight\", for getting out of end-of-month stress, and \"The keys to my home\", for anyone saving for a first down payment." },
    ],
  },

  // ── 6 · Hablar en público ────────────────────────────────────────────────
  {
    slug: "visualizacion-para-hablar-en-publico",
    locale: "es",
    translation: "visualization-for-public-speaking",
    title: "Visualización para hablar en público: cómo ensayar la charla antes de darla",
    description:
      "Cómo usar la visualización para preparar una charla o presentación: qué escenas ensayar, afirmaciones útiles y una rutina para los días previos.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "salir-al-escenario",
    body: [
      { type: "p", text: "Casi nadie pierde del todo el miedo a hablar en público. Lo que cambia con la práctica es lo que haces con él: sales igualmente. La visualización sirve para eso: para que, cuando subas, la escena ya te resulte conocida." },
      { type: "h2", text: "Las cuatro escenas que conviene ensayar" },
      { type: "ol", items: [
        "Los minutos antes: entre bastidores o en tu silla, respirando despacio.",
        "Los primeros 30 segundos: tu primera frase, dicha despacio y mirando a la sala.",
        "El momento difícil: una pregunta inesperada, una diapositiva que falla, un silencio. Y tú resolviéndolo con calma.",
        "El final: tu última frase y el silencio después, sin prisa por bajar.",
      ] },
      { type: "p", text: "La segunda y la tercera son las más importantes: son donde los nervios suelen ganar, y donde el ensayo mental más ayuda." },
      { type: "h2", text: "Afirmaciones para antes de salir" },
      { type: "ul", items: [
        "«Mi voz merece ser escuchada».",
        "«Me sostengo aunque me tiemble la voz».",
        "«Hablo despacio: la sala me espera».",
        "«Si me pierdo, respiro y sigo».",
        "«Actúo aunque tenga miedo».",
      ] },
      { type: "h2", text: "Rutina para los 7 días previos" },
      { type: "ul", items: [
        "Cada mañana: dos minutos visualizando las cuatro escenas y tus afirmaciones en voz alta.",
        "Tres veces en la semana: ensayo real, de pie y en voz alta, al menos del principio y del final.",
        "El día de la charla: una vez más tu visualización, idealmente justo antes de entrar.",
      ] },
      { type: "h2", text: "Un error frecuente" },
      { type: "p", text: "Imaginar una charla perfecta, sin ningún fallo. Cuando llega el primer tropiezo, la imagen se rompe. Es más útil visualizar que algo sale mal y que tú sigues: eso es lo que te da seguridad de verdad." },
      { type: "p", text: "La plantilla «Salir al escenario» del market está pensada para estos días previos: escenas tuyas antes, durante y después de la charla, y frases para decir en voz alta cada mañana." },
    ],
  },
  {
    slug: "visualization-for-public-speaking",
    locale: "en",
    translation: "visualizacion-para-hablar-en-publico",
    title: "Visualization for public speaking: how to rehearse your talk before you give it",
    description:
      "How to use visualization to prepare a talk or presentation: which scenes to rehearse, useful affirmations and a routine for the days before.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "salir-al-escenario",
    body: [
      { type: "p", text: "Almost nobody fully loses the fear of public speaking. What changes with practice is what you do with it: you go on anyway. Visualization is for exactly that: so that when you step up, the scene already feels familiar." },
      { type: "h2", text: "The four scenes worth rehearsing" },
      { type: "ol", items: [
        "The minutes before: backstage or in your seat, breathing slowly.",
        "The first 30 seconds: your opening line, said slowly while looking at the room.",
        "The hard moment: an unexpected question, a slide that fails, a silence. And you handling it calmly.",
        "The end: your last line and the silence after it, in no hurry to step down.",
      ] },
      { type: "p", text: "The second and third matter most: they're where nerves usually win, and where mental rehearsal helps the most." },
      { type: "h2", text: "Affirmations for before you go on" },
      { type: "ul", items: [
        "\"My voice deserves to be heard.\"",
        "\"I hold steady even when my voice shakes.\"",
        "\"I speak slowly: the room is waiting for me.\"",
        "\"If I lose my place, I breathe and keep going.\"",
        "\"I act even when I'm afraid.\"",
      ] },
      { type: "h2", text: "A routine for the 7 days before" },
      { type: "ul", items: [
        "Every morning: two minutes visualizing the four scenes and saying your affirmations out loud.",
        "Three times that week: a real rehearsal, standing and out loud, at least of the opening and the ending.",
        "On the day: your visualization once more, ideally right before you walk in.",
      ] },
      { type: "h2", text: "A common mistake" },
      { type: "p", text: "Picturing a perfect talk with no slip-ups. When the first stumble comes, the image breaks. It's more useful to visualize something going wrong and you carrying on: that's what gives you real confidence." },
      { type: "p", text: "The \"Walking on stage\" template in the market is built for these days before: scenes of you before, during and after the talk, and lines to say out loud every morning." },
    ],
  },
  // ── 7 · Calma antes de dormir ────────────────────────────────────────────
  {
    slug: "afirmaciones-para-dormir-tranquilo",
    locale: "es",
    translation: "affirmations-for-a-calm-night",
    title: "Afirmaciones para calmar la mente antes de dormir",
    description:
      "Una rutina corta de afirmaciones y visualización para soltar el día y acostarte con la cabeza más tranquila. Con frases de ejemplo y qué evitar.",
    date: "2026-10-25",
    readingMinutes: 4,
    body: [
      { type: "p", text: "Por la noche la cabeza tiende a repasar lo que salió mal y a adelantar lo que queda pendiente. Una rutina corta antes de dormir no hace desaparecer las preocupaciones, pero puede ayudarte a dejarlas para mañana." },
      { type: "p", text: "Una aclaración importante: esto es una práctica de calma, no un tratamiento. Si la ansiedad o el insomnio te afectan de forma persistente, habla con un profesional de la salud." },
      { type: "h2", text: "Rutina de 5 minutos" },
      { type: "ol", items: [
        "Pantallas fuera unos minutos antes, si puedes. Luz baja.",
        "Escribe en un papel lo pendiente de mañana. Lo que está escrito no hace falta recordarlo.",
        "Tres respiraciones lentas, con la exhalación más larga que la inhalación.",
        "Repite despacio dos o tres afirmaciones, en voz baja.",
        "Visualiza una escena sencilla y tranquila de mañana: el primer café, la luz de la ventana.",
      ] },
      { type: "h2", text: "Afirmaciones para la noche" },
      { type: "ul", items: [
        "«Hoy hice lo que pude, y es suficiente».",
        "«Lo pendiente está apuntado: mañana me ocupo».",
        "«Suelto lo que no depende de mí».",
        "«Mi cuerpo sabe descansar».",
        "«Mañana empiezo con calma».",
      ] },
      { type: "h2", text: "Qué evitar" },
      { type: "ul", items: [
        "Visualizar metas grandes o retos difíciles justo antes de dormir: activan en vez de calmar. Déjalos para la mañana.",
        "Frases que discutes por dentro: si no te crees una, cámbiala por otra más sencilla.",
        "Convertirlo en una obligación más: si una noche no lo haces, no pasa nada.",
      ] },
      { type: "h2", text: "Mañana y noche, dos usos distintos" },
      { type: "p", text: "Por la mañana, la visualización sirve para enfocarte en lo que quieres conseguir. Por la noche, para cerrar el día. En ManifestLifeAI recomendamos ver tu vídeo dos veces al día; por la noche, con el volumen bajo y sin prisa, puede formar parte de esta rutina." },
    ],
  },
  {
    slug: "affirmations-for-a-calm-night",
    locale: "en",
    translation: "afirmaciones-para-dormir-tranquilo",
    title: "Affirmations to calm your mind before sleep",
    description:
      "A short routine of affirmations and visualization to let go of the day and go to bed with a calmer mind. With example lines and what to avoid.",
    date: "2026-10-25",
    readingMinutes: 4,
    body: [
      { type: "p", text: "At night the mind tends to replay what went wrong and rehearse what's still pending. A short routine before bed won't make worries disappear, but it can help you leave them for tomorrow." },
      { type: "p", text: "An important note: this is a calming practice, not a treatment. If anxiety or insomnia affect you persistently, talk to a health professional." },
      { type: "h2", text: "A 5-minute routine" },
      { type: "ol", items: [
        "Screens away a few minutes before, if you can. Low light.",
        "Write tomorrow's to-dos on paper. What's written down doesn't need remembering.",
        "Three slow breaths, with the exhale longer than the inhale.",
        "Repeat two or three affirmations slowly, quietly.",
        "Visualize a simple, calm scene from tomorrow: the first coffee, the light through the window.",
      ] },
      { type: "h2", text: "Affirmations for the night" },
      { type: "ul", items: [
        "\"Today I did what I could, and that's enough.\"",
        "\"What's pending is written down: I'll handle it tomorrow.\"",
        "\"I let go of what doesn't depend on me.\"",
        "\"My body knows how to rest.\"",
        "\"Tomorrow I start calmly.\"",
      ] },
      { type: "h2", text: "What to avoid" },
      { type: "ul", items: [
        "Visualizing big goals or hard challenges right before sleep: they wind you up instead of calming you. Save them for the morning.",
        "Lines you argue with inside: if you don't believe one, swap it for something simpler.",
        "Turning it into one more obligation: if you skip it one night, nothing happens.",
      ] },
      { type: "h2", text: "Morning and night, two different uses" },
      { type: "p", text: "In the morning, visualization helps you focus on what you want to achieve. At night, it helps you close the day. At ManifestLifeAI we suggest watching your video twice a day; at night, with the volume low and no rush, it can be part of this routine." },
    ],
  },

  // ── 8 · Ejercicio con constancia ─────────────────────────────────────────
  {
    slug: "visualizacion-para-hacer-ejercicio-con-constancia",
    locale: "es",
    translation: "visualization-for-exercise-consistency",
    title: "Cómo usar la visualización para hacer ejercicio con constancia",
    description:
      "Por qué abandonamos el ejercicio en la semana tres y cómo usar la visualización y afirmaciones para seguir presentándote, sobre todo los días sin ganas.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "noventa-dias-de-constancia",
    body: [
      { type: "p", text: "Empezar a entrenar es fácil: la motivación de los primeros días hace el trabajo. Lo difícil llega más tarde, cuando la novedad se acaba y aparecen los días sin ganas. Ahí es donde una práctica de visualización puede ser útil." },
      { type: "h2", text: "Visualiza el momento de empezar, no el cuerpo final" },
      { type: "p", text: "Imaginarte con el cuerpo que quieres motiva un rato, pero no te ayuda a levantarte del sofá. Es más útil ensayar el momento exacto que cuesta: atarte las zapatillas, salir por la puerta, los primeros cinco minutos." },
      { type: "ul", items: [
        "La alarma suena y te levantas sin negociar.",
        "La ropa ya preparada desde la noche anterior.",
        "Los primeros minutos lentos, hasta que el cuerpo entra en calor.",
        "La sensación de después: ducha, energía, el día ganado.",
      ] },
      { type: "h2", text: "Afirmaciones sobre presentarte, no sobre el resultado" },
      { type: "ul", items: [
        "«Me presento aunque no tenga ganas».",
        "«Un día flojo no rompe nada».",
        "«Diez minutos cuentan».",
        "«Descanso porque me cuido, no porque abandono».",
        "«Esto ya es parte de mí».",
      ] },
      { type: "h2", text: "El plan para los días sin ganas" },
      { type: "ol", items: [
        "Visualiza solo los primeros cinco minutos, no el entrenamiento entero.",
        "Comprométete a esos cinco minutos. Si después quieres parar, paras.",
        "Casi siempre seguirás. Y si no, mantuviste el hábito, que es lo que importa.",
      ] },
      { type: "h2", text: "Cuándo hacerlo" },
      { type: "p", text: "Justo antes del momento de entrenar, o al despertar si entrenas por la mañana. Dos minutos bastan. Lo importante es que la visualización esté pegada a la acción, no separada de ella." },
      { type: "p", text: "Una nota: ante cualquier lesión, dolor o condición médica, consulta a un profesional antes de cambiar tu rutina de ejercicio." },
      { type: "p", text: "La plantilla «Noventa días de constancia» del market está hecha para esto: escenas tuyas entrenando, comiendo bien y descansando, y frases para los días en los que más cuesta." },
    ],
  },
  {
    slug: "visualization-for-exercise-consistency",
    locale: "en",
    translation: "visualizacion-para-hacer-ejercicio-con-constancia",
    title: "How to use visualization to exercise consistently",
    description:
      "Why we quit exercising in week three and how to use visualization and affirmations to keep showing up, especially on the days you don't feel like it.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "noventa-dias-de-constancia",
    body: [
      { type: "p", text: "Starting to train is easy: early motivation does the work. The hard part comes later, when the novelty wears off and the days you don't feel like it show up. That's where a visualization practice can help." },
      { type: "h2", text: "Visualize the moment you start, not the final body" },
      { type: "p", text: "Picturing yourself with the body you want motivates for a while, but it doesn't get you off the couch. It's more useful to rehearse the exact moment that's hard: lacing up, walking out the door, the first five minutes." },
      { type: "ul", items: [
        "The alarm goes off and you get up without negotiating.",
        "Your clothes laid out the night before.",
        "The first few minutes slow, until your body warms up.",
        "The feeling afterwards: shower, energy, the day already won.",
      ] },
      { type: "h2", text: "Affirmations about showing up, not about the result" },
      { type: "ul", items: [
        "\"I show up even when I don't feel like it.\"",
        "\"One weak day breaks nothing.\"",
        "\"Ten minutes count.\"",
        "\"I rest because I take care of myself, not because I'm quitting.\"",
        "\"This is part of me now.\"",
      ] },
      { type: "h2", text: "The plan for the days you don't feel like it" },
      { type: "ol", items: [
        "Visualize only the first five minutes, not the whole workout.",
        "Commit to those five minutes. If you want to stop after that, you stop.",
        "Most of the time you'll keep going. And if not, you kept the habit, which is what matters.",
      ] },
      { type: "h2", text: "When to do it" },
      { type: "p", text: "Right before your training time, or when you wake up if you train in the morning. Two minutes is enough. What matters is that the visualization is attached to the action, not separate from it." },
      { type: "p", text: "A note: with any injury, pain or medical condition, check with a professional before changing your exercise routine." },
      { type: "p", text: "The \"Ninety days of showing up\" template in the market is built for this: scenes of you training, eating well and resting, and lines for the days it's hardest." },
    ],
  },

  // ── 9 · Amor propio ──────────────────────────────────────────────────────
  {
    slug: "afirmaciones-de-amor-propio",
    locale: "es",
    translation: "self-love-affirmations",
    title: "Afirmaciones de amor propio que no suenan a póster motivacional",
    description:
      "Afirmaciones de amor propio realistas: cómo escribir frases que te traten con respeto sin forzar, ejemplos para días difíciles y para tus relaciones.",
    date: "2026-10-25",
    readingMinutes: 4,
    template: "amor-tranquilo",
    body: [
      { type: "p", text: "«Soy perfecto tal y como soy» está bien en un póster, pero muchos días cuesta decirlo sin que suene falso. El amor propio que se sostiene no es pensar que todo en ti está bien: es tratarte con el mismo respeto con el que tratarías a alguien que quieres." },
      { type: "h2", text: "Cambia la admiración por el trato" },
      { type: "p", text: "Las afirmaciones que funcionan mejor no te describen como alguien admirable, sino como alguien que se cuida. Eso sí lo puedes hacer hoy, aunque el día sea malo." },
      { type: "ul", items: [
        "En vez de «Soy increíble»: «Me hablo como le hablaría a un amigo».",
        "En vez de «Me amo por completo»: «Me cuido incluso los días que no me gusto».",
        "En vez de «No necesito a nadie»: «Merezco relaciones donde me siento tranquilo».",
      ] },
      { type: "h2", text: "Para los días difíciles" },
      { type: "ul", items: [
        "«Un mal día no dice quién soy».",
        "«Puedo equivocarme y seguir mereciendo respeto».",
        "«Descansar también es avanzar».",
        "«No tengo que demostrar nada hoy».",
      ] },
      { type: "h2", text: "Para tus relaciones" },
      { type: "ul", items: [
        "«Pido lo que necesito con claridad y con calma».",
        "«Pongo límites sin sentir culpa».",
        "«Elijo a quien me elige».",
        "«El amor tranquilo también es amor».",
      ] },
      { type: "h2", text: "Cómo practicarlas" },
      { type: "ol", items: [
        "Elige tres, no más.",
        "Dilas en voz alta por la mañana, mirándote al espejo si te resulta cómodo.",
        "Cuando te descubras hablándote mal durante el día, cambia esa frase por una de las tuyas.",
      ] },
      { type: "p", text: "Si lo que estás atravesando pesa demasiado, apoyarte en un profesional es también una forma de quererte." },
      { type: "p", text: "La plantilla «Amor tranquilo» del market está pensada para quien quiere una relación en calma, empezando por la que tiene consigo mismo." },
    ],
  },
  {
    slug: "self-love-affirmations",
    locale: "en",
    translation: "afirmaciones-de-amor-propio",
    title: "Self-love affirmations that don't sound like a motivational poster",
    description:
      "Realistic self-love affirmations: how to write lines that treat you with respect without forcing it, examples for hard days and for your relationships.",
    date: "2026-10-25",
    readingMinutes: 4,
    template: "amor-tranquilo",
    body: [
      { type: "p", text: "\"I am perfect just as I am\" looks fine on a poster, but on many days it's hard to say without it sounding false. Self-love that lasts isn't believing everything about you is fine: it's treating yourself with the same respect you'd give someone you love." },
      { type: "h2", text: "Swap admiration for how you treat yourself" },
      { type: "p", text: "The affirmations that work best don't describe you as someone admirable, but as someone who takes care of themselves. That you can do today, even on a bad day." },
      { type: "ul", items: [
        "Instead of \"I am amazing\": \"I talk to myself the way I'd talk to a friend.\"",
        "Instead of \"I love myself completely\": \"I take care of myself even on days I don't like myself.\"",
        "Instead of \"I don't need anyone\": \"I deserve relationships where I feel at peace.\"",
      ] },
      { type: "h2", text: "For hard days" },
      { type: "ul", items: [
        "\"One bad day doesn't say who I am.\"",
        "\"I can make mistakes and still deserve respect.\"",
        "\"Resting is also moving forward.\"",
        "\"I don't have to prove anything today.\"",
      ] },
      { type: "h2", text: "For your relationships" },
      { type: "ul", items: [
        "\"I ask for what I need clearly and calmly.\"",
        "\"I set boundaries without guilt.\"",
        "\"I choose those who choose me.\"",
        "\"Calm love is love too.\"",
      ] },
      { type: "h2", text: "How to practice them" },
      { type: "ol", items: [
        "Pick three, no more.",
        "Say them out loud in the morning, in front of a mirror if that feels comfortable.",
        "When you catch yourself talking down to yourself during the day, swap that line for one of yours.",
      ] },
      { type: "p", text: "If what you're going through feels too heavy, leaning on a professional is also a way of caring for yourself." },
      { type: "p", text: "The \"A calm love\" template in the market is built for anyone who wants a calm relationship, starting with the one they have with themselves." },
    ],
  },
  // ── 10 · Vision board digital ────────────────────────────────────────────
  {
    slug: "como-hacer-un-vision-board-digital",
    locale: "es",
    translation: "how-to-make-a-digital-vision-board",
    title: "Cómo hacer un vision board digital (y que no se quede en el olvido)",
    description:
      "Paso a paso para crear un vision board digital: cómo elegir metas e imágenes, dónde ponerlo para verlo cada día y cómo convertirlo en una práctica.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "despegar",
    body: [
      { type: "p", text: "Un vision board digital tiene una ventaja clara sobre el de corcho: lo llevas encima. Puede ser el fondo de tu móvil, de tu ordenador o una carpeta que abres cada mañana. El riesgo también es claro: se pierde entre todo lo demás que hay en la pantalla." },
      { type: "h2", text: "1. Empieza por las metas, no por las imágenes" },
      { type: "p", text: "Antes de buscar fotos, escribe de tres a seis metas concretas, una por área si quieres (trabajo, dinero, salud, relaciones, viajes). «Correr una media maratón en marzo» se puede representar con una imagen; «estar en forma», no tanto." },
      { type: "h2", text: "2. Una imagen por meta, y que sea una escena" },
      { type: "ul", items: [
        "Busca momentos, no objetos: la línea de meta, no unas zapatillas.",
        "Prefiere fotos con luz natural y gente en acción a imágenes de catálogo.",
        "Si puedes, usa fotos tuyas o de lugares concretos que vas a visitar.",
        "Añade una frase corta en presente bajo cada imagen.",
      ] },
      { type: "h2", text: "3. Herramientas sencillas" },
      { type: "p", text: "Cualquier editor de diseño o de presentaciones sirve. Lo importante es el formato: vertical (9:16) si va a ser el fondo del móvil, horizontal (16:9) si va al ordenador. No hace falta que sea bonito; hace falta que sea claro." },
      { type: "h2", text: "4. Ponlo donde lo vas a ver" },
      { type: "ul", items: [
        "Fondo de pantalla de bloqueo del móvil: lo ves decenas de veces al día.",
        "Fondo del escritorio del ordenador de trabajo.",
        "Una nota fijada que abras con tu primer café.",
      ] },
      { type: "h2", text: "5. Conviértelo en práctica" },
      { type: "p", text: "Ver el tablero de pasada es un recordatorio. Para que sea práctica, dedícale un minuto al día con intención: mira cada imagen, di su frase en voz alta y piensa en un paso que puedes dar hoy hacia esa meta." },
      { type: "h2", text: "6. Revísalo cada mes" },
      { type: "p", text: "Cambia lo que ya conseguiste o lo que dejó de importarte. Un tablero que no cambia acaba siendo decoración." },
      { type: "p", text: "Si quieres dar un paso más, en ManifestLifeAI convertimos tus metas en un vídeo en el que sales tú, con una voz que te guía y pausas para repetir cada frase. Es como un vision board que se mira y se escucha." },
    ],
  },
  {
    slug: "how-to-make-a-digital-vision-board",
    locale: "en",
    translation: "como-hacer-un-vision-board-digital",
    title: "How to make a digital vision board (that you won't forget about)",
    description:
      "Step by step to create a digital vision board: how to pick goals and images, where to put it so you see it daily, and how to turn it into a practice.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "despegar",
    body: [
      { type: "p", text: "A digital vision board has one clear advantage over a cork one: you carry it with you. It can be your phone wallpaper, your desktop or a folder you open every morning. The risk is just as clear: it gets lost among everything else on the screen." },
      { type: "h2", text: "1. Start with goals, not images" },
      { type: "p", text: "Before looking for photos, write three to six concrete goals, one per area if you like (work, money, health, relationships, travel). \"Run a half marathon in March\" can be pictured; \"get in shape\" not so much." },
      { type: "h2", text: "2. One image per goal, and make it a scene" },
      { type: "ul", items: [
        "Look for moments, not objects: the finish line, not a pair of sneakers.",
        "Prefer photos with natural light and people in action over stock-catalog images.",
        "If you can, use photos of yourself or of specific places you'll visit.",
        "Add a short present-tense line under each image.",
      ] },
      { type: "h2", text: "3. Simple tools" },
      { type: "p", text: "Any design or presentation editor works. What matters is the format: vertical (9:16) if it'll be your phone wallpaper, horizontal (16:9) for your computer. It doesn't need to be pretty; it needs to be clear." },
      { type: "h2", text: "4. Put it where you'll see it" },
      { type: "ul", items: [
        "Your phone's lock screen: you see it dozens of times a day.",
        "The desktop of your work computer.",
        "A pinned note you open with your first coffee.",
      ] },
      { type: "h2", text: "5. Turn it into a practice" },
      { type: "p", text: "Glancing at the board is a reminder. To make it a practice, give it one intentional minute a day: look at each image, say its line out loud and think of one step you can take today toward that goal." },
      { type: "h2", text: "6. Review it every month" },
      { type: "p", text: "Swap out what you've achieved or what stopped mattering. A board that never changes ends up as decoration." },
      { type: "p", text: "If you want to go a step further, at ManifestLifeAI we turn your goals into a video with you in it, a guiding voice and pauses to repeat each line. It's like a vision board you watch and listen to." },
    ],
  },

  // ── 11 · Emprendedores ───────────────────────────────────────────────────
  {
    slug: "afirmaciones-para-emprendedores",
    locale: "es",
    translation: "affirmations-for-entrepreneurs",
    title: "Afirmaciones para emprendedores: para lanzar, vender y no rendirse",
    description:
      "Afirmaciones para emprendedores según la fase de tu proyecto: empezar, lanzar, vender y aguantar los meses lentos. Con ejemplos y cómo usarlas cada día.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "fundadora-en-lisboa",
    body: [
      { type: "p", text: "Emprender tiene una parte que no sale en las fotos: decidir sin saber si es la decisión correcta, vender cuando te da vergüenza y seguir cuando los números tardan en llegar. Las afirmaciones no resuelven nada de eso, pero sí pueden ayudarte a sostener la actitud con la que lo afrontas." },
      { type: "h2", text: "Para empezar (o atreverte a empezar)" },
      { type: "ul", items: [
        "«Empiezo con lo que tengo».",
        "«Hecho es mejor que perfecto».",
        "«Aprendo más lanzando que planeando».",
      ] },
      { type: "h2", text: "Para lanzar y vender" },
      { type: "ul", items: [
        "«Lo que ofrezco resuelve un problema real».",
        "«Hablo de mi trabajo sin pedir perdón».",
        "«Pongo precio a lo que vale».",
        "«Un “no” es información, no un juicio sobre mí».",
      ] },
      { type: "h2", text: "Para los meses lentos" },
      { type: "ul", items: [
        "«Un mes flojo no define mi proyecto».",
        "«Mido, ajusto y sigo».",
        "«Cuido mi energía igual que cuido mi negocio».",
      ] },
      { type: "h2", text: "Para decidir" },
      { type: "ul", items: [
        "«Decido con la información que tengo y corrijo si hace falta».",
        "«Confío en mi criterio».",
      ] },
      { type: "h2", text: "Cómo usarlas en tu semana" },
      { type: "ol", items: [
        "Elige tres, según la fase en la que estás ahora mismo.",
        "Antes de abrir el correo, visualiza un momento concreto: tu primera venta, la reunión con un cliente, el día del lanzamiento.",
        "Repite tus tres frases en voz alta y escribe la acción más importante del día.",
        "Una vez por semana, revisa si las frases siguen encajando con tu momento.",
      ] },
      { type: "p", text: "Visualizar te ayuda a enfocarte y a mantener el rumbo; los resultados dependen de muchas más cosas. La plantilla «Mi propio estudio» del market está pensada para quien abre su propio negocio: el día que abres la puerta de tu sitio." },
    ],
  },
  {
    slug: "affirmations-for-entrepreneurs",
    locale: "en",
    translation: "afirmaciones-para-emprendedores",
    title: "Affirmations for entrepreneurs: to launch, sell and keep going",
    description:
      "Affirmations for entrepreneurs by stage: getting started, launching, selling and getting through the slow months. With examples and how to use them daily.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "fundadora-en-lisboa",
    body: [
      { type: "p", text: "Building a business has a side that doesn't make it into the photos: deciding without knowing if it's the right call, selling when it makes you uncomfortable, and keeping going while the numbers take their time. Affirmations don't solve any of that, but they can help you hold the attitude you face it with." },
      { type: "h2", text: "For getting started (or daring to)" },
      { type: "ul", items: [
        "\"I start with what I have.\"",
        "\"Done beats perfect.\"",
        "\"I learn more by launching than by planning.\"",
      ] },
      { type: "h2", text: "For launching and selling" },
      { type: "ul", items: [
        "\"What I offer solves a real problem.\"",
        "\"I talk about my work without apologizing.\"",
        "\"I price my work at what it's worth.\"",
        "\"A 'no' is information, not a verdict on me.\"",
      ] },
      { type: "h2", text: "For the slow months" },
      { type: "ul", items: [
        "\"One slow month doesn't define my project.\"",
        "\"I measure, adjust and keep going.\"",
        "\"I take care of my energy the way I take care of my business.\"",
      ] },
      { type: "h2", text: "For deciding" },
      { type: "ul", items: [
        "\"I decide with the information I have and correct course if needed.\"",
        "\"I trust my judgment.\"",
      ] },
      { type: "h2", text: "How to use them in your week" },
      { type: "ol", items: [
        "Pick three, based on the stage you're in right now.",
        "Before opening your email, visualize a specific moment: your first sale, a client meeting, launch day.",
        "Say your three lines out loud and write down the day's most important action.",
        "Once a week, check whether the lines still fit where you are.",
      ] },
      { type: "p", text: "Visualizing helps you focus and stay on course; results depend on much more. The \"My own studio\" template in the market is built for anyone opening their own business: the day you open the door to your own place." },
    ],
  },

  // ── 12 · Scripting ───────────────────────────────────────────────────────
  {
    slug: "que-es-el-scripting",
    locale: "es",
    translation: "what-is-scripting",
    title: "Qué es el scripting y cómo escribir tu día ideal",
    description:
      "El scripting consiste en escribir tu día ideal en presente, como si ya estuviera pasando. Cómo hacerlo paso a paso, un ejemplo y cómo usarlo después.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "un-ano-sin-oficina",
    body: [
      { type: "p", text: "El scripting (de «script», guion) es una técnica de escritura muy usada en el mundo de la manifestación: escribes un día de tu vida tal y como te gustaría que fuera, en presente y en primera persona, como si ya estuviera pasando. Es, en esencia, una visualización por escrito." },
      { type: "h2", text: "Por qué escribirlo" },
      { type: "p", text: "Escribir obliga a concretar. Es fácil imaginar «una vida más tranquila»; al escribirla tienes que decidir a qué hora te levantas, dónde trabajas y con quién comes. Esas decisiones son las que luego se pueden convertir en pasos reales." },
      { type: "h2", text: "Cómo hacerlo paso a paso" },
      { type: "ol", items: [
        "Elige un horizonte: un día dentro de un año, por ejemplo.",
        "Escribe en presente y en primera persona: «Me despierto a las 7 sin alarma…».",
        "Recorre el día entero: mañana, trabajo, comida, tarde, noche.",
        "Incluye detalles que se puedan ver: lugares, personas, objetos, luz.",
        "Escribe también cómo te sientes, pero sin quedarte solo en eso.",
        "Una o dos páginas son suficientes.",
      ] },
      { type: "h2", text: "Un ejemplo breve" },
      { type: "quote", text: "Me despierto con la luz entrando por la ventana. Preparo café y respondo dos correos desde la terraza: hoy no hay oficina. A media mañana cierro con un cliente nuevo. Por la tarde salgo a caminar junto al mar y llamo a mi madre sin prisa." },
      { type: "h2", text: "Qué hacer con tu guion" },
      { type: "ul", items: [
        "Léelo en voz alta por la mañana durante unas semanas.",
        "Subraya tres momentos del día que más te importan: son tus escenas clave.",
        "Para cada uno, escribe una afirmación corta y el siguiente paso real hacia él.",
        "Reescríbelo cada pocos meses: tu día ideal también cambia.",
      ] },
      { type: "h2", text: "Del guion al vídeo" },
      { type: "p", text: "Esas tres escenas clave son justo lo que convertimos en vídeo en ManifestLifeAI: escribe cada una como un deseo y verás un vídeo de unos 2 minutos en el que sales tú viviéndolas, con una voz que te guía. Es tu guion, convertido en algo que puedes mirar cada día." },
    ],
  },
  {
    slug: "what-is-scripting",
    locale: "en",
    translation: "que-es-el-scripting",
    title: "What scripting is and how to write your ideal day",
    description:
      "Scripting means writing your ideal day in the present tense, as if it were already happening. How to do it step by step, an example and how to use it after.",
    date: "2026-10-25",
    readingMinutes: 5,
    template: "un-ano-sin-oficina",
    body: [
      { type: "p", text: "Scripting is a writing technique popular in the manifestation world: you write a day of your life exactly the way you'd like it to be, in the present tense and first person, as if it were already happening. In essence, it's visualization on paper." },
      { type: "h2", text: "Why write it down" },
      { type: "p", text: "Writing forces you to be specific. It's easy to imagine \"a calmer life\"; when you write it, you have to decide what time you wake up, where you work and who you have lunch with. Those decisions are what can later turn into real steps." },
      { type: "h2", text: "How to do it step by step" },
      { type: "ol", items: [
        "Pick a horizon: a day one year from now, for example.",
        "Write in the present tense and first person: \"I wake up at 7 without an alarm…\"",
        "Walk through the whole day: morning, work, lunch, afternoon, evening.",
        "Include details you can see: places, people, objects, light.",
        "Write how you feel too, but don't stop at that.",
        "One or two pages is enough.",
      ] },
      { type: "h2", text: "A short example" },
      { type: "quote", text: "I wake up with light coming through the window. I make coffee and answer two emails from the terrace: no office today. Mid-morning I close a deal with a new client. In the afternoon I walk by the sea and call my mom with no rush." },
      { type: "h2", text: "What to do with your script" },
      { type: "ul", items: [
        "Read it out loud in the mornings for a few weeks.",
        "Underline the three moments of the day that matter most to you: those are your key scenes.",
        "For each one, write a short affirmation and the next real step toward it.",
        "Rewrite it every few months: your ideal day changes too.",
      ] },
      { type: "h2", text: "From script to video" },
      { type: "p", text: "Those three key scenes are exactly what we turn into video at ManifestLifeAI: write each one as a desire and you'll get a video of about 2 minutes with you living them, and a guiding voice. It's your script, turned into something you can watch every day." },
    ],
  },
];

export function postBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Más recientes primero. */
export function postsFor(locale: Locale): Post[] {
  return POSTS.filter((p) => p.locale === locale).sort((a, b) => b.date.localeCompare(a.date));
}

export const SITE_URL = process.env.SITE_URL ?? "https://manifestlife.ai";
