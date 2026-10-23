/**
 * Frases de apertura del vídeo.
 *
 * Regla: una frase lleva nombre de autor solo si su texto exacto está
 * comprobado en una fuente fiable (el libro, su web oficial). Las que no se
 * pudieron comprobar van sin autor, como idea. `source` dice de dónde sale.
 * A cada persona le salen en orden sin repetir hasta agotarlas.
 */
export interface Quote {
  id: string;
  author: string | null;
  en: string;
  es: string;
  source?: string;
}

export const QUOTES: Quote[] = [
  {
    id: "goddard-assumption",
    author: "Neville Goddard",
    en: "An assumption, though false, if persisted in will harden into fact.",
    es: "Una suposición, aunque sea falsa, si se sostiene, se endurece hasta volverse un hecho.",
    source: "Citada en Wikipedia (Neville Goddard, «Law of Assumption»); en «Five Lessons» aparece con «sustained». Pendiente de cotejar con el libro.",
  },
  {
    id: "allen-dreamers",
    author: "James Allen",
    en: "The dreamers are the saviours of the world.",
    es: "Los soñadores son los salvadores del mundo.",
    source: "As a Man Thinketh (1903), ch. \"Visions and Ideals\" (Project Gutenberg #4507)",
  },
  {
    id: "allen-lofty-dreams",
    author: "James Allen",
    en: "Dream lofty dreams, and as you dream, so shall you become.",
    es: "Sueña sueños elevados, y tal como sueñes, así llegarás a ser.",
    source: "As a Man Thinketh (1903), ch. \"Visions and Ideals\"",
  },
  {
    id: "allen-vision-promise",
    author: "James Allen",
    en: "Your Vision is the promise of what you shall one day be; your Ideal is the prophecy of what you shall at last unveil.",
    es: "Tu visión es la promesa de lo que un día serás; tu ideal es la profecía de lo que al fin revelarás.",
    source: "As a Man Thinketh (1903), ch. \"Visions and Ideals\"",
  },
  {
    id: "allen-cherish-visions",
    author: "James Allen",
    en: "Cherish your visions; cherish your ideals; cherish the music that stirs in your heart…",
    es: "Atesora tus visiones; atesora tus ideales; atesora la música que se agita en tu corazón…",
    source: "As a Man Thinketh (1903), ch. \"Visions and Ideals\" (opening of a longer sentence)",
  },
  {
    id: "allen-garden",
    author: "James Allen",
    en: "Man's mind may be likened to a garden, which may be intelligently cultivated or allowed to run wild…",
    es: "La mente del hombre puede compararse con un jardín, que puede cultivarse con inteligencia o dejarse crecer salvaje…",
    source: "As a Man Thinketh (1903), ch. \"Effect of Thought on Circumstances\" (first clause of the sentence)",
  },
  {
    id: "allen-master-gardener",
    author: "James Allen",
    en: "By pursuing this process, a man sooner or later discovers that he is the master-gardener of his soul, the director of his life.",
    es: "Siguiendo este proceso, tarde o temprano el hombre descubre que es el jardinero mayor de su alma, el director de su vida.",
    source: "As a Man Thinketh (1903), ch. \"Effect of Thought on Circumstances\"",
  },
  {
    id: "allen-circumstance",
    author: "James Allen",
    en: "Circumstance does not make the man; it reveals him to himself.",
    es: "Las circunstancias no hacen al hombre; le revelan quién es.",
    source: "As a Man Thinketh (1903), ch. \"Effect of Thought on Circumstances\"",
  },
  {
    id: "allen-attract",
    author: "James Allen",
    en: "Men do not attract that which they want, but that which they are.",
    es: "Las personas no atraen lo que quieren, sino lo que son.",
    source: "As a Man Thinketh (1903), ch. \"Effect of Thought on Circumstances\" (italics on 'want'/'are' in original)",
  },
  {
    id: "allen-outer-inner",
    author: "James Allen",
    en: "The outer world of circumstance shapes itself to the inner world of thought…",
    es: "El mundo exterior de las circunstancias se moldea según el mundo interior del pensamiento…",
    source: "As a Man Thinketh (1903), ch. \"Effect of Thought on Circumstances\" (first clause of the sentence)",
  },
  {
    id: "allen-calmness",
    author: "James Allen",
    en: "Calmness of mind is one of the beautiful jewels of wisdom.",
    es: "La calma de la mente es una de las bellas joyas de la sabiduría.",
    source: "As a Man Thinketh (1903), ch. \"Serenity\"",
  },
  {
    id: "allen-calmness-power",
    author: "James Allen",
    en: "Self-control is strength; Right Thought is mastery; Calmness is power.",
    es: "El autocontrol es fuerza; el pensamiento recto es maestría; la calma es poder.",
    source: "As a Man Thinketh (1903), ch. \"Serenity\"",
  },
  {
    id: "marcus-soul-dyed",
    author: "Marcus Aurelius",
    en: "Such as are thy habitual thoughts, such also will be the character of thy mind; for the soul is dyed by the thoughts.",
    es: "Tal como sean tus pensamientos habituales, así será el carácter de tu mente; porque el alma se tiñe de los pensamientos.",
    source: "Meditations, tr. George Long (1862), Book V, 16 (Project Gutenberg #15877)",
  },
  {
    id: "marcus-life-opinion",
    author: "Marcus Aurelius",
    en: "The universe is transformation: life is opinion.",
    es: "El universo es transformación; la vida, opinión.",
    source: "Meditations, tr. George Long (1862), Book IV, 3",
  },
  {
    id: "marcus-retire-soul",
    author: "Marcus Aurelius",
    en: "For nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul…",
    es: "Porque en ningún lugar se retira el hombre con más quietud ni más libre de inquietudes que en su propia alma…",
    source: "Meditations, tr. George Long (1862), Book IV, 3 (sentence continues)",
  },
  {
    id: "marcus-morning",
    author: "Marcus Aurelius",
    en: "In the morning when thou risest unwillingly, let this thought be present,--I am rising to the work of a human being.",
    es: "Por la mañana, cuando te levantes sin ganas, ten presente este pensamiento: me levanto para hacer la obra de un ser humano.",
    source: "Meditations, tr. George Long (1862), Book V, 1",
  },
  {
    id: "marcus-happy-life",
    author: "Marcus Aurelius",
    en: "Very little indeed is necessary for living a happy life.",
    es: "Muy poco, en verdad, es necesario para vivir una vida feliz.",
    source: "Meditations, tr. George Long (1862), Book VII, 67 (excerpt; original reads '…that very little indeed is necessary for living a happy life')",
  },
  {
    id: "james-life-worth",
    author: "William James",
    en: "Be not afraid of life. Believe that life is worth living, and your belief will help create the fact.",
    es: "No tengas miedo de la vida. Cree que la vida vale la pena, y tu creencia ayudará a crear ese hecho.",
    source: "The Will to Believe and Other Essays (1897), essay \"Is Life Worth Living?\" (italic 'is' in original)",
  },
  {
    id: "james-faith-verification",
    author: "William James",
    en: "There are then cases where faith creates its own verification.",
    es: "Hay, pues, casos en que la fe crea su propia verificación.",
    source: "The Will to Believe and Other Essays (1897), essay \"The Sentiment of Rationality\"",
  },
  {
    id: "james-nervous-ally",
    author: "William James",
    en: "The great thing in all education is to make our nervous system our ally instead of our enemy.",
    es: "Lo esencial en toda educación es hacer de nuestro sistema nervioso un aliado y no un enemigo.",
    source: "Talks to Teachers on Psychology (1899), ch. \"The Laws of Habit\" (James quoting his own Principles of Psychology)",
  },
  {
    id: "james-seize-resolution",
    author: "William James",
    en: "Seize the very first possible opportunity to act on every resolution you make…",
    es: "Aprovecha la primerísima oportunidad posible para actuar según cada propósito que te hagas…",
    source: "Talks to Teachers on Psychology (1899), ch. \"The Laws of Habit\" (opening of a longer maxim)",
  },
  {
    id: "wattles-gratitude-thought",
    author: "Wallace D. Wattles",
    en: "Gratitude will help you to own and control your own field of thought.",
    es: "La gratitud te ayudará a poseer y gobernar tu propio campo de pensamiento.",
    source: "The Science of Being Well (1910), ch. V \"Faith\" (Project Gutenberg #33917)",
  },
  {
    id: "wattles-grateful-frame",
    author: "Wallace D. Wattles",
    en: "Be, all the time, in a grateful frame of mind, and let gratitude be evident in your speech.",
    es: "Mantente en todo momento en un estado de ánimo agradecido, y deja que la gratitud se note en tus palabras.",
    source: "The Science of Being Well (1910), ch. V \"Faith\"",
  },
  {
    id: "wattles-sheet-anchor",
    author: "Wallace D. Wattles",
    en: "In times of doubt, trial, and temptation, the exercise of gratitude is always a sheet anchor which will prevent you from being swept away.",
    es: "En tiempos de duda, prueba y tentación, el ejercicio de la gratitud es siempre un ancla firme que impedirá que te arrastre la corriente.",
    source: "The Science of Being Well (1910), ch. VI \"Use of the Will\"",
  },
  {
    id: "trine-build-attract",
    author: "Ralph Waldo Trine",
    en: "We both build from within and we attract from without. Thought is the force with which we build, for thoughts are forces.",
    es: "Construimos desde dentro y atraemos desde fuera. El pensamiento es la fuerza con la que construimos, porque los pensamientos son fuerzas.",
    source: "In Tune with the Infinite (1897), Prefatory (Project Gutenberg #23559)",
  },
  {
    id: "trine-thought-returns",
    author: "Ralph Waldo Trine",
    en: "Every thought you entertain is a force that goes out, and every thought comes back laden with its kind.",
    es: "Cada pensamiento que albergas es una fuerza que sale, y cada pensamiento regresa cargado de su propia especie.",
    source: "In Tune with the Infinite (1897), chapter on health and vigor",
  },
  {
    id: "emerson-trust-thyself",
    author: "Ralph Waldo Emerson",
    en: "Trust thyself: every heart vibrates to that iron string.",
    es: "Confía en ti mismo: todo corazón vibra con esa cuerda de hierro.",
    source: "Essays, First Series (1841), \"Self-Reliance\" (Project Gutenberg #16643)",
  },
  {
    id: "emerson-peace",
    author: "Ralph Waldo Emerson",
    en: "Nothing can bring you peace but yourself.",
    es: "Nada puede traerte paz salvo tú mismo.",
    source: "Essays, First Series (1841), \"Self-Reliance\"",
  },
  {
    id: "marden-expect",
    author: "Orison Swett Marden",
    en: "We are constantly drawing to ourselves that which we expect.",
    es: "Constantemente atraemos hacia nosotros aquello que esperamos.",
    source: "The Victorious Attitude (1916), ch. VI \"Attracting the Poorhouse\"",
  },
  {
    id: "marden-expect-success",
    author: "Orison Swett Marden",
    en: "If we expect success, see it waiting for us a little bit up the road, we will act and look like successes.",
    es: "Si esperamos el éxito, si lo vemos aguardándonos un poco más adelante en el camino, actuaremos y luciremos como triunfadores.",
    source: "The Victorious Attitude (1916), ch. I \"The Victorious Attitude\"",
  },
  {
    id: "idea-feel-it-done",
    author: null,
    en: "Feel it as done. Let the feeling of the wish fulfilled arrive before the wish itself.",
    es: "Siéntelo ya hecho. Deja que la sensación del deseo cumplido llegue antes que el propio deseo.",
    source: "Idea sin atribuir, redactada por nosotros",
  },
  {
    id: "idea-imagination-rehearsal",
    author: null,
    en: "Each scene you imagine with feeling is a rehearsal for the life you are about to live.",
    es: "Cada escena que imaginas con emoción es un ensayo de la vida que estás a punto de vivir.",
    source: "Idea sin atribuir, redactada por nosotros",
  },
  {
    id: "idea-attention-energy",
    author: null,
    en: "What you keep your attention on, you keep feeding with your energy.",
    es: "Aquello en lo que mantienes tu atención es lo que sigues alimentando con tu energía.",
    source: "Idea sin atribuir, redactada por nosotros",
  },
  {
    id: "idea-new-self",
    author: null,
    en: "Every morning you can choose to think, feel and act as the person you are becoming.",
    es: "Cada mañana puedes elegir pensar, sentir y actuar como la persona en la que te estás convirtiendo.",
    source: "Idea sin atribuir, redactada por nosotros",
  },
  {
    id: "idea-consciousness-reality",
    author: null,
    en: "La realidad que vives está tejida por la forma en que tu conciencia la observa.",
    es: "The reality you live is woven by the way your consciousness observes it.",
    source: "Idea sin atribuir, redactada por nosotros",
  },
  {
    id: "idea-repetition",
    author: null,
    en: "What you repeat with intention, you become without effort.",
    es: "Lo que repites con intención, lo llegas a ser sin esfuerzo.",
    source: "Idea sin atribuir, redactada por nosotros",
  },
  {
    id: "idea-gratitude-now",
    author: null,
    en: "Gratitude for what has not yet arrived is the quiet signal that it is already on its way.",
    es: "Agradecer lo que aún no ha llegado es la señal serena de que ya viene en camino.",
    source: "Idea sin atribuir, redactada por nosotros",
  },
  {
    id: "idea-inner-first",
    author: null,
    en: "Change the picture inside, and the world outside begins to follow.",
    es: "Cambia la imagen de dentro, y el mundo de fuera empieza a seguirla.",
    source: "Idea sin atribuir, redactada por nosotros",
  },
];

export function quoteById(id: string | undefined): Quote | undefined {
  return id ? QUOTES.find((q) => q.id === id) : undefined;
}

/**
 * La siguiente frase que esta persona no ha visto. El orden se baraja por
 * persona (con su id como semilla) para que no todo el mundo empiece igual.
 * Cuando ya las vio todas, vuelve a empezar.
 */
export function nextQuoteId(used: string[], seed: string): string {
  const order = shuffled(QUOTES.map((q) => q.id), seed);
  const seen = new Set(used);
  const fresh = order.find((id) => !seen.has(id));
  if (fresh) return fresh;
  // Todas vistas: la menos reciente.
  const lastSeen = new Map(used.map((id, i) => [id, i]));
  return order.reduce((a, b) => ((lastSeen.get(a) ?? -1) <= (lastSeen.get(b) ?? -1) ? a : b));
}

function shuffled<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
