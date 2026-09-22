import type { Blueprint } from "./types";

/**
 * EL MARKET.
 *
 * Decision de producto importante: en el market NO se venden vídeos acabados,
 * se venden *blueprints*. Un blueprint es el guion, las escenas, el estilo y
 * el tono; el comprador le pone su propia cara y genera su propio vídeo.
 *
 * El motivo es doble. Uno, de valor: un vídeo con la cara de otra persona no
 * le sirve a nadie para visualizarse, así que no se puede revender. Dos, legal:
 * revender un vídeo con la cara de alguien es tratar datos biométricos de un
 * tercero, y eso no se arregla con un checkbox.
 *
 * El blueprint sí escala: se crea una vez, se vende infinitas veces, y el coste
 * de generación lo paga el comprador con sus propios créditos.
 */

export const BLUEPRINTS: Blueprint[] = [
  {
    slug: "primer-millon-con-calma",
    title: "Mi primer millón, con calma",
    author: "Lucía R.",
    area: "abundancia",
    style: "golden",
    tone: "calma",
    tier: "vision",
    priceCents: 490,
    sales: 1284,
    rating: 4.8,
    summary:
      "Doce escenas de una vida próspera sin prisa. Pensado para quien asocia el dinero con el estrés y quiere desarmar esa conexión.",
    affirmations: [
      "El dinero llega y se queda.",
      "Administro lo que tengo con serenidad.",
      "Recibo sin culpa lo que he trabajado.",
      "Mi valor se traduce en ingresos.",
      "Tomo decisiones de dinero sin miedo.",
      "Tengo de sobra y comparto.",
    ],
    sceneBriefs: [
      "standing at the window of a serene apartment overlooking the city at dawn",
      "reviewing a rising chart on a tablet, relaxed, morning coffee",
      "handing over the keys of a new home, warm afternoon light",
      "long family table full of food, laughter, evening light",
      "walking unhurried through a calm high-end space",
      "reading on a terrace with the sea in the distance, golden hour",
    ],
    cover: { from: "#0d0b0a", to: "#9d7f5e" },
  },
  {
    slug: "salir-al-escenario",
    title: "Salir al escenario",
    author: "Dani M.",
    area: "confianza",
    style: "cinematic",
    tone: "firme",
    tier: "cinematic",
    priceCents: 890,
    sales: 612,
    rating: 4.9,
    summary:
      "Para hablar en público sin que te tiemble la voz. Se usa los 7 días antes de la charla, una vez al levantarte.",
    affirmations: [
      "Mi voz merece ser escuchada.",
      "Me sostengo aunque me tiemble la voz.",
      "Hablo y la sala me sigue.",
      "Ocupo mi espacio sin pedir permiso.",
      "Actúo aunque tenga miedo.",
      "Confío en mi criterio.",
    ],
    sceneBriefs: [
      "waiting in the wings before walking on stage, calm breath",
      "stepping into a spotlight, audience silhouettes",
      "speaking into a microphone, self-assured, warm stage light",
      "the audience leaning in, engaged faces",
      "answering a question with an easy smile",
      "walking off stage to applause, quiet satisfaction",
    ],
    cover: { from: "#0a0b10", to: "#6f7a99" },
  },
  {
    slug: "fundadora-en-lisboa",
    title: "Fundadora en Lisboa",
    author: "Marta S.",
    area: "carrera",
    style: "editorial",
    tone: "cercana",
    tier: "cinematic",
    priceCents: 1190,
    sales: 344,
    rating: 4.7,
    summary:
      "Montar tu propio estudio en una ciudad con luz. Escenas de equipo pequeño, clientes buenos y decisiones tuyas.",
    affirmations: [
      "Dirijo mi propio estudio.",
      "Elijo con quién trabajo.",
      "Mi trabajo habla por mí.",
      "Tomo decisiones difíciles con calma.",
      "El equipo confía en mi criterio.",
      "Construyo algo que dura.",
    ],
    sceneBriefs: [
      "unlocking a small studio office in a sunlit old building",
      "sketching on a large table with two colleagues, natural light",
      "presenting work to a client, confident and warm",
      "signing a contract at a clean desk by a window",
      "team toast on a rooftop at sunset over a pastel city",
      "walking home through tiled streets, unhurried",
    ],
    cover: { from: "#0a0c0c", to: "#6d8f87" },
  },
  {
    slug: "cuerpo-fuerte-90-dias",
    title: "Cuerpo fuerte en 90 días",
    author: "Iván T.",
    area: "salud",
    style: "cinematic",
    tone: "firme",
    tier: "vision",
    priceCents: 390,
    sales: 2107,
    rating: 4.6,
    summary:
      "Sobre la constancia, no sobre el físico. Escenas de entrenar, dormir y comer bien repetidas hasta que son tuyas.",
    affirmations: [
      "Mi cuerpo es fuerte y responde.",
      "Elijo lo que me da energía.",
      "Descanso porque me cuido.",
      "Cada día me muevo con más soltura.",
      "Me presento aunque no tenga ganas.",
      "Mi salud es la base de todo.",
    ],
    sceneBriefs: [
      "running along a coastal path at sunrise, strong stride",
      "lifting weights in a clean gym, focused",
      "preparing a colorful fresh meal in a bright kitchen",
      "swimming in clear open water",
      "sleeping peacefully in a quiet bedroom at dawn",
      "laughing outdoors with friends after exercise",
    ],
    cover: { from: "#0a0c0a", to: "#71906f" },
  },
  {
    slug: "amor-tranquilo",
    title: "Amor tranquilo",
    author: "Noa P.",
    area: "amor",
    style: "dream",
    tone: "calma",
    tier: "vision",
    priceCents: 490,
    sales: 1893,
    rating: 4.9,
    summary:
      "Para quien ya no quiere montañas rusas. Un vínculo aburrido en el mejor sentido de la palabra.",
    affirmations: [
      "Merezco un amor tranquilo.",
      "Doy y recibo con las manos abiertas.",
      "Digo lo que siento sin miedo.",
      "Pongo límites y sigo siendo querido.",
      "Atraigo a quien me trata bien.",
      "Confío en lo que se está formando.",
    ],
    sceneBriefs: [
      "slow breakfast by a sunlit window, easy intimacy",
      "walking hand in hand along a quiet street at dusk",
      "dancing in a living room, unposed",
      "sitting close on a sofa reading, comfortable silence",
      "laughing at a candlelit dinner with close friends",
      "watching the sunset from a balcony together",
    ],
    cover: { from: "#0d0a0b", to: "#9b7480" },
  },
  {
    slug: "un-ano-sin-oficina",
    title: "Un año sin oficina",
    author: "Kai L.",
    area: "libertad",
    style: "minimal",
    tone: "cercana",
    tier: "cinematic",
    priceCents: 990,
    sales: 771,
    rating: 4.5,
    summary:
      "Trabajo remoto de verdad: menos cosas, más horas tuyas. Escenas sin postal de Instagram.",
    affirmations: [
      "Mi tiempo me pertenece.",
      "Trabajo desde donde quiero estar.",
      "Me muevo ligero.",
      "Diseño mis días a mi manera.",
      "Lo simple me basta.",
      "Soy libre y responsable a la vez.",
    ],
    sceneBriefs: [
      "working on a laptop on a terrace overlooking the ocean",
      "boarding a plane with a single small bag",
      "waking up in a sunlit room in an unfamiliar city",
      "slow coffee at a corner cafe, no rush",
      "driving an empty coastal road at golden hour",
      "watching stars from a quiet campsite",
    ],
    cover: { from: "#090b0d", to: "#68849b" },
  },
];

export function blueprintBySlug(slug: string): Blueprint | undefined {
  return BLUEPRINTS.find((b) => b.slug === slug);
}
