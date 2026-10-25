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
];

export function postBySlug(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Más recientes primero. */
export function postsFor(locale: Locale): Post[] {
  return POSTS.filter((p) => p.locale === locale).sort((a, b) => b.date.localeCompare(a.date));
}

export const SITE_URL = process.env.SITE_URL ?? "https://manifest-production-7582.up.railway.app";
