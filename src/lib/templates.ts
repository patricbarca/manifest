import type { Template } from "./types";

/**
 * EL MARKET
 *
 * Cómo funciona: alguien crea su vídeo, le gusta, y lo publica. Lo que se
 * publica es la receta —guion, escenas, estilo, tono—, no el vídeo montado.
 * Quien la usa genera su propia versión con su cara, paga el precio normal
 * del producto, y el 30 % va a quien la creó.
 *
 * ── Qué hace que una plantilla valga dinero ──
 *
 * Especificidad. "Confianza" no vale nada; "los siete días antes de tu
 * charla" sí. Nadie paga por seis frases bonitas: paga por que alguien que ya
 * pasó por eso lo haya pensado por él.
 *
 * Por eso cada una lleva `protocol`. Una plantilla sin instrucciones de uso es
 * una lista de frases; con ellas es un método.
 *
 * ── Estas son de la casa ──
 *
 * Son la semilla: el catálogo del día uno, para que nadie entre a un mercado
 * vacío. Van firmadas por Manifest porque las escribimos nosotros. `uses`
 * empieza en cero y solo sube cuando alguien las usa de verdad — no hay ni un
 * número inventado en este fichero, y no debe haberlo nunca.
 */

const SEEDED_AT = Date.UTC(2026, 8, 1);

export const TEMPLATES: Template[] = [
  {
    slug: "salir-al-escenario",
    title: { es: "Salir al escenario", en: "Walking on stage" },
    author: "Manifest",
    area: "confianza",
    style: "cinematic",
    tone: "firme",
    tier: "cinematic",
    durationSec: 30,
    summary: {
      es: "Para los días previos a hablar en público. No va de perder el miedo: va de salir igualmente.",
      en: "For the days before speaking in public. It isn't about losing the fear: it's about going on anyway.",
    },
    protocol: {
      es: "Los 7 días antes de tu charla, nada más levantarte. El día de la charla, una vez más en el baño, justo antes de entrar.",
      en: "The 7 days before your talk, first thing when you wake up. On the day, once more in the bathroom, right before you walk in.",
    },
    affirmations: {
      es: [
        "Mi voz merece ser escuchada.",
        "Me sostengo aunque me tiemble la voz.",
        "Hablo y la sala me sigue.",
        "Ocupo mi espacio sin pedir permiso.",
        "Actúo aunque tenga miedo.",
        "Confío en mi criterio.",
      ],
      en: [
        "My voice deserves to be heard.",
        "I hold steady even when my voice shakes.",
        "I speak and the room follows.",
        "I take up my space without asking.",
        "I act even when I'm afraid.",
        "I trust my judgment.",
      ],
    },
    sceneBriefs: [
      "waiting in the wings before walking on stage, calm breath",
      "stepping into a spotlight, audience silhouettes",
      "speaking into a microphone, self-assured, warm stage light",
      "the audience leaning in, engaged faces",
      "answering a question with an easy smile",
      "walking off stage to applause, quiet satisfaction",
    ],
    cover: { from: "#0a0b10", to: "#6f7a99" },
    publishedAt: SEEDED_AT,
    uses: 0,
  },
  {
    slug: "la-conversacion-de-sueldo",
    title: { es: "La conversación de sueldo", en: "The salary conversation" },
    author: "Manifest",
    area: "carrera",
    style: "editorial",
    tone: "firme",
    tier: "vision",
    durationSec: 30,
    summary: {
      es: "Pedir lo que vales sin disculparte por pedirlo. Para la semana antes de sentarte a negociar.",
      en: "Asking for what you're worth without apologizing for asking. For the week before you sit down to negotiate.",
    },
    protocol: {
      es: "Una vez al día durante los 5 días previos. Escucha la frase, dila en alto, y luego di en alto la cifra que vas a pedir.",
      en: "Once a day for the 5 days before. Hear the line, say it out loud, then say out loud the number you're going to ask for.",
    },
    affirmations: {
      es: [
        "Digo mi cifra sin bajar la voz.",
        "Lo que aporto tiene un precio.",
        "Aguanto el silencio después de pedir.",
        "No me disculpo por querer más.",
        "Negocio tranquilo, no a la defensiva.",
        "Si es no, sigo entero.",
      ],
      en: [
        "I say my number without dropping my voice.",
        "What I bring has a price.",
        "I hold the silence after asking.",
        "I don't apologize for wanting more.",
        "I negotiate calmly, not defensively.",
        "If it's no, I'm still whole.",
      ],
    },
    sceneBriefs: [
      "walking into a quiet meeting room, composed, morning light",
      "sitting across a table in calm conversation, steady posture",
      "a handshake over a desk, mutual respect",
      "reviewing a signed document with quiet satisfaction",
      "leaving an office building into afternoon sun, unhurried",
      "a private moment of relief on a street corner, small smile",
    ],
    cover: { from: "#0a0c0c", to: "#6d8f87" },
    publishedAt: SEEDED_AT,
    uses: 0,
  },
  {
    slug: "primer-dia",
    title: { es: "El primer día", en: "The first day" },
    author: "Manifest",
    area: "carrera",
    style: "editorial",
    tone: "cercana",
    tier: "vision",
    durationSec: 30,
    summary: {
      es: "Empezar en un sitio nuevo sin sentirte un impostor. Para la noche antes y la mañana de.",
      en: "Starting somewhere new without feeling like an impostor. For the night before and the morning of.",
    },
    protocol: {
      es: "La noche anterior, antes de dormir. Y otra vez por la mañana, antes de salir de casa.",
      en: "The night before, as you go to sleep. Then again in the morning, before you leave the house.",
    },
    affirmations: {
      es: [
        "Me han elegido por algo.",
        "No tengo que saberlo todo hoy.",
        "Pregunto sin sentirme menos.",
        "Caigo bien siendo yo.",
        "Aprendo rápido y se nota.",
        "Este sitio va a ser mío.",
      ],
      en: [
        "They chose me for a reason.",
        "I don't have to know it all today.",
        "I ask questions without feeling smaller.",
        "People like me when I'm myself.",
        "I learn fast and it shows.",
        "This place is going to be mine.",
      ],
    },
    sceneBriefs: [
      "walking through a bright office lobby for the first time, curious",
      "being introduced to a small team, warm handshakes",
      "setting up a clean desk by a window",
      "taking notes in a meeting, engaged and calm",
      "sharing lunch with new colleagues, easy laughter",
      "leaving the building at dusk, satisfied",
    ],
    cover: { from: "#0d0b0a", to: "#9d7f5e" },
    publishedAt: SEEDED_AT,
    uses: 0,
  },
  {
    slug: "noventa-dias-de-constancia",
    title: { es: "Noventa días de constancia", en: "Ninety days of showing up" },
    author: "Manifest",
    area: "salud",
    style: "cinematic",
    tone: "firme",
    tier: "vision",
    durationSec: 60,
    summary: {
      es: "No va del físico, va de presentarte. Para quien empieza fuerte y abandona en la semana tres.",
      en: "It isn't about your body, it's about showing up. For anyone who starts strong and quits in week three.",
    },
    protocol: {
      es: "Cada mañana antes de entrenar, los días que no tengas ganas especialmente. Ese es el día para el que está hecho.",
      en: "Every morning before training — especially on the days you don't feel like it. That's the day it was made for.",
    },
    affirmations: {
      es: [
        "Me presento aunque no tenga ganas.",
        "Mi cuerpo responde cuando insisto.",
        "Elijo lo que me da energía.",
        "Descanso porque me cuido.",
        "Un día flojo no rompe nada.",
        "Cada día me muevo con más soltura.",
        "Trato a mi cuerpo con respeto.",
        "Esto ya es parte de mí.",
      ],
      en: [
        "I show up even when I don't feel like it.",
        "My body responds when I insist.",
        "I choose what gives me energy.",
        "I rest because I take care of myself.",
        "One weak day breaks nothing.",
        "Every day I move more easily.",
        "I treat my body with respect.",
        "This is part of me now.",
      ],
    },
    sceneBriefs: [
      "lacing up shoes in a quiet hallway at dawn",
      "running along a coastal path at sunrise, strong stride",
      "lifting weights in a clean gym, focused",
      "preparing a colorful fresh meal in a bright kitchen",
      "swimming in clear open water",
      "stretching in a sunlit room after a workout",
      "sleeping peacefully in a quiet bedroom at dawn",
      "laughing outdoors with friends, healthy glow",
    ],
    cover: { from: "#0a0c0a", to: "#71906f" },
    publishedAt: SEEDED_AT,
    uses: 0,
  },
  {
    slug: "el-mes-que-no-llego-justo",
    title: { es: "El mes que no llegó justo", en: "The month that wasn't tight" },
    author: "Manifest",
    area: "abundancia",
    style: "golden",
    tone: "calma",
    tier: "vision",
    durationSec: 60,
    summary: {
      es: "Para quien asocia el dinero con el estrés. No es hacerse rico: es dejar de mirar la cuenta con miedo.",
      en: "For anyone who ties money to stress. It isn't about getting rich: it's about stopping the fear when you check your balance.",
    },
    protocol: {
      es: "Cada noche antes de dormir, un mes entero. Funciona mejor de noche: es cuando aparece la ansiedad de dinero.",
      en: "Every night before sleep, for a full month. It works better at night: that's when money anxiety shows up.",
    },
    affirmations: {
      es: [
        "Administro lo que tengo con serenidad.",
        "Miro mi cuenta sin encogerme.",
        "Recibo sin culpa lo que he trabajado.",
        "Mi valor se traduce en ingresos.",
        "Tomo decisiones de dinero sin prisa.",
        "Tengo margen para respirar.",
        "El dinero llega y se queda.",
        "Vivo tranquilo con lo que gano.",
      ],
      en: [
        "I manage what I have calmly.",
        "I check my balance without flinching.",
        "I receive what I've earned without guilt.",
        "My value turns into income.",
        "I make money decisions without rushing.",
        "I have room to breathe.",
        "Money reaches me and stays.",
        "I live at ease with what I earn.",
      ],
    },
    sceneBriefs: [
      "standing at the window of a serene apartment at dawn, coffee in hand",
      "reviewing numbers on a tablet, relaxed posture",
      "paying at a market without checking the price twice",
      "long family table full of food, laughter, evening light",
      "putting money aside at a desk, deliberate and calm",
      "walking unhurried through a quiet neighbourhood",
      "handing over the keys of a new home, warm afternoon light",
      "reading on a terrace at golden hour",
    ],
    cover: { from: "#0d0a08", to: "#a68a63" },
    publishedAt: SEEDED_AT,
    uses: 0,
  },
  {
    slug: "amor-tranquilo",
    title: { es: "Amor tranquilo", en: "A calm love" },
    author: "Manifest",
    area: "amor",
    style: "dream",
    tone: "calma",
    tier: "vision",
    durationSec: 60,
    summary: {
      es: "Para quien ya no quiere montañas rusas. Un vínculo aburrido, en el mejor sentido de la palabra.",
      en: "For anyone done with rollercoasters. A boring bond, in the best sense of the word.",
    },
    protocol: {
      es: "Tres veces por semana, sin prisa. No lo uses justo después de una discusión: úsalo en días normales.",
      en: "Three times a week, unhurried. Don't use it right after an argument: use it on ordinary days.",
    },
    affirmations: {
      es: [
        "Merezco un amor tranquilo.",
        "Doy y recibo con las manos abiertas.",
        "Digo lo que siento sin miedo.",
        "Pongo límites y sigo siendo querido.",
        "Atraigo a quien me trata bien.",
        "Confío en lo que se está formando.",
        "Soy suficiente tal y como soy.",
        "Elijo relaciones que me suman.",
      ],
      en: [
        "I deserve a calm love.",
        "I give and receive openly.",
        "I say what I feel without fear.",
        "I set limits and I'm still loved.",
        "I attract people who treat me well.",
        "I trust what's taking shape.",
        "I am enough exactly as I am.",
        "I choose relationships that add to me.",
      ],
    },
    sceneBriefs: [
      "slow breakfast by a sunlit window, easy intimacy",
      "walking hand in hand along a quiet street at dusk",
      "dancing in a living room, unposed",
      "sitting close on a sofa reading, comfortable silence",
      "laughing at a candlelit dinner with close friends",
      "watching the sunset from a balcony together",
      "a warm reunion at an airport arrivals hall",
      "cooking together in an unhurried kitchen",
    ],
    cover: { from: "#0d0a0b", to: "#9b7480" },
    publishedAt: SEEDED_AT,
    uses: 0,
  },
  {
    slug: "fundadora-en-lisboa",
    title: { es: "Mi propio estudio", en: "My own studio" },
    author: "Manifest",
    area: "carrera",
    style: "editorial",
    tone: "cercana",
    tier: "cinematic",
    durationSec: 60,
    summary: {
      es: "Montar algo tuyo y elegir con quién trabajas. Para la fase en la que todavía no te atreves a dejar el sueldo.",
      en: "Building something of your own and choosing who you work with. For the stage where you still don't dare quit the salary.",
    },
    protocol: {
      es: "Los domingos por la noche, que es cuando más pesa la semana que viene.",
      en: "Sunday nights, when the week ahead weighs the most.",
    },
    affirmations: {
      es: [
        "Dirijo mi propio estudio.",
        "Elijo con quién trabajo.",
        "Mi trabajo habla por mí.",
        "Tomo decisiones difíciles con calma.",
        "El equipo confía en mi criterio.",
        "Cobro lo que vale lo que hago.",
        "Construyo algo que dura.",
        "Esto ya está en marcha.",
      ],
      en: [
        "I run my own studio.",
        "I choose who I work with.",
        "My work speaks for me.",
        "I make hard calls calmly.",
        "The team trusts my judgment.",
        "I charge what my work is worth.",
        "I'm building something that lasts.",
        "This is already in motion.",
      ],
    },
    sceneBriefs: [
      "unlocking a small studio office in a sunlit old building",
      "sketching on a large table with two colleagues, natural light",
      "presenting work to a client, confident and warm",
      "signing a contract at a clean desk by a window",
      "a quiet moment alone in the studio after hours",
      "team toast on a rooftop at sunset over a pastel city",
      "walking home through tiled streets, unhurried",
      "opening the studio door with their name on the glass",
    ],
    cover: { from: "#0a0c0c", to: "#6d8f87" },
    publishedAt: SEEDED_AT,
    uses: 0,
  },
  {
    slug: "un-ano-sin-oficina",
    title: { es: "Un año sin oficina", en: "A year without an office" },
    author: "Manifest",
    area: "libertad",
    style: "minimal",
    tone: "cercana",
    tier: "cinematic",
    durationSec: 60,
    summary: {
      es: "Trabajo remoto de verdad: menos cosas, más horas tuyas. Escenas sin postal de Instagram.",
      en: "Remote work for real: fewer things, more hours that are yours. Scenes with no Instagram postcard.",
    },
    protocol: {
      es: "Una vez al día durante el mes anterior a dar el paso. Después, cuando dudes.",
      en: "Once a day for the month before you take the step. After that, whenever you doubt.",
    },
    affirmations: {
      es: [
        "Mi tiempo me pertenece.",
        "Trabajo desde donde quiero estar.",
        "Me muevo ligero.",
        "Diseño mis días a mi manera.",
        "Lo simple me basta.",
        "Soy libre y responsable a la vez.",
        "Elijo la vida que quiero vivir.",
        "Confío en el camino que estoy abriendo.",
      ],
      en: [
        "My time belongs to me.",
        "I work from where I want to be.",
        "I travel light.",
        "I design my days my way.",
        "Simple is enough for me.",
        "I am free and responsible at once.",
        "I choose the life I want to live.",
        "I trust the path I'm opening.",
      ],
    },
    sceneBriefs: [
      "working on a laptop on a terrace overlooking the ocean",
      "boarding a plane with a single small bag",
      "waking up in a sunlit room in an unfamiliar city",
      "slow coffee at a corner cafe, no rush",
      "driving an empty coastal road at golden hour",
      "walking through a foreign market, curious and relaxed",
      "sitting on a cliff edge looking at a wide valley",
      "watching stars from a quiet campsite",
    ],
    cover: { from: "#090b0d", to: "#68849b" },
    publishedAt: SEEDED_AT,
    uses: 0,
  },
];

export function templateBySlug(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}
