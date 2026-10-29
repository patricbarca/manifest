import type { IconName } from "@/components/Icon";
import type { Locale } from "./i18n/locale";

/** Un texto que existe en cada idioma. */
export type Localized<T> = Record<Locale, T>;

/** Dominio de Manifest. Un "proyecto" es un video de visualizacion. */

export type LifeArea =
  | "carrera"
  | "abundancia"
  | "salud"
  | "amor"
  | "confianza"
  | "libertad";

/**
 * Las áreas y los estilos guardan aquí solo lo que NO se traduce: el
 * identificador, el icono y el prompt que va al modelo de imagen. Las
 * etiquetas visibles viven en el diccionario (lib/i18n), porque cambian con
 * el idioma y esto no.
 */
export const LIFE_AREAS: { id: LifeArea; icon: IconName }[] = [
  { id: "carrera", icon: "briefcase" },
  { id: "abundancia", icon: "growth" },
  { id: "salud", icon: "pulse" },
  { id: "amor", icon: "heart" },
  { id: "confianza", icon: "person" },
  { id: "libertad", icon: "compass" },
];

/**
 * Los tres productos.
 * - `vision`: imágenes fijas con movimiento de cámara.
 * - `cinematic`: escenas animadas (MiniMax).
 * - `elevated`: escenas animadas con el modelo premium (Kling 3.0 Pro).
 */
export type Tier = "vision" | "cinematic" | "elevated";

export const TIERS: readonly Tier[] = ["vision", "cinematic", "elevated"];

/** True si el producto anima las escenas (todo menos `vision`). */
export function isAnimated(tier: Tier): boolean {
  return tier !== "vision";
}

export type VisualStyle =
  | "cinematic"
  | "editorial"
  | "golden"
  | "minimal"
  | "dream";

/** El prompt de estilo va siempre en inglés: es lo que entiende el modelo. */
// "editorial" no dice "magazine cover": Seedream lo leía literal y pintaba el titular de una revista.
export const VISUAL_STYLES: { id: VisualStyle; prompt: string }[] = [
  { id: "cinematic", prompt: "cinematic film still, 35mm, shallow depth of field, moody volumetric light, anamorphic" },
  { id: "editorial", prompt: "high-end editorial photography, clean composition, natural light, premium commercial look" },
  { id: "golden", prompt: "golden hour photography, warm sunlight, lens flare, soft glow, aspirational" },
  { id: "minimal", prompt: "minimal modern photography, neutral palette, architectural negative space, calm" },
  { id: "dream", prompt: "dreamlike ethereal photography, soft focus, pastel haze, surreal serenity" },
];

export type VoiceTone = "calma" | "firme" | "cercana";

/**
 * Otra persona que sale en el vídeo (pareja, familia, amigos). La sube el
 * usuario con su permiso; sus fotos se borran al terminar el vídeo.
 */
export interface Person {
  id: string;
  name: string;
  /** Cómo la llama el usuario: "mi pareja", "mamá"… */
  relation?: string;
  photoUrls: string[];
}

/** Color del fondo animado del vídeo (render/build_glass.py tiene los valores). */
export type Palette = "dusk" | "ocean" | "sage" | "rose" | "lavender" | "gold";
export const PALETTES: Palette[] = ["dusk", "ocean", "sage", "rose", "lavender", "gold"];

/** "review": imágenes hechas, esperando que la persona las apruebe antes de animar. */
export type ProjectStatus = "draft" | "queued" | "generating" | "review" | "ready" | "failed";

export type StepId = "script" | "images" | "motion" | "voice" | "assemble";

export interface PipelineStep {
  id: StepId;
  label: string;
  status: "pending" | "running" | "done" | "skipped" | "failed";
  startedAt?: number;
  endedAt?: number;
  error?: string;
  /** Coste real acumulado en esta etapa, en centimos de USD. */
  costCents?: number;
}

export interface Affirmation {
  /** Frase en primera persona, presente. El usuario la repite en voz alta. */
  text: string;
  startSec: number;
  endSec: number;
}

/**
 * UNA MANIFESTACIÓN: un deseo convertido en una escena animada de la persona,
 * con su afirmación y su voz. Es la unidad que se compra y que se reutiliza:
 * el vídeo de manifestación se monta eligiendo varias.
 */
export interface Manifestation {
  /** Empieza por "m_": sus ficheros viven en generated/<id>/. */
  id: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  status: "queued" | "generating" | "ready" | "failed";
  /** El deseo en palabras de la persona. Privado. */
  desire: string;
  /** Nombre corto para la tarjeta (lo puede cambiar). */
  title: string;
  locale: Locale;
  style?: VisualStyle;
  voice?: string;
  /** Descripción visual de la escena (inglés). */
  brief?: string;
  /** La frase que se dice sobre la escena. */
  affirmation?: string;
  imageUrl?: string;
  /** Clip de la escena a calidad completa: es lo que se reutiliza al montar. */
  clipUrl?: string;
  /** Voz de la afirmación (con la voz y el idioma de arriba). */
  voiceUrl?: string;
  highlight?: Highlight;
  /** La muestra en su perfil público (solo el highlight, sin sonido ni el deseo). */
  onProfile?: boolean;
  /** Ajuste que pidió al rehacerla ("camisa blanca", "sin texto en la pantalla"). */
  redoNote?: string;
  /** Cuándo la marcó como cumplida. */
  manifestedAt?: number;
  /** Proyecto del que salió, si nació dentro de un vídeo completo. */
  sourceProjectId?: string;
  /** Fotos de la persona usadas para generarla (se borran a los 30 días). */
  photoUrls?: string[];
  /** Intentos tras reinicios del servidor. */
  attempts?: number;
  /** Se pagó con una manifestación de un paquete: si falla, se devuelve una vez. */
  paidCredit?: boolean;
  costCents: number;
  error?: string;
}

/** Una escena animada en pequeño, para el perfil. */
export interface Highlight {
  videoUrl: string;
  posterUrl: string;
  /** La persona la ocultó de su perfil. */
  hidden?: boolean;
  /** Nombre que le puso la persona (se ve bajo el círculo). */
  label?: string;
}

export interface Scene {
  id: string;
  /** Prompt enviado al modelo de imagen, ya con el estilo y la identidad. */
  prompt: string;
  /** Vista en primera persona: sin cara, y se genera sin el selfie. */
  pov?: boolean;
  /** Ids de las personas (Person) que salen en esta escena. */
  cast?: string[];
  imageUrl?: string;
  /** Solo en tier `cinematic`. */
  videoUrl?: string;
  startSec: number;
  endSec: number;
  /** Indice de la afirmacion que se muestra sobre esta escena. */
  affirmationIndex: number;
}

export interface ScriptDraft {
  title: string;
  /** Frase de apertura, no se repite en voz alta. */
  hook: string;
  /**
   * Gratitud por lo que la persona ya tiene, antes de pedir. Solo la escribe
   * el LLM; sin él se usan las del banco.
   */
  gratitude?: string[];
  /** La petición, formulada como ya recibida ("Gracias porque…"). */
  request?: string;
  affirmations: string[];
  closing: string;
  /**
   * Descripcion visual de cada escena, en ingles, sin el estilo aplicado.
   * Las que empiezan por "POV:" se ven desde los ojos de la persona y no
   * llevan su cara.
   */
  sceneBriefs: string[];
  /**
   * La misma escena contada en una frase en el idioma del usuario, para que
   * la revise antes de pagar. Solo la escribe el LLM; el banco no la tiene.
   */
  sceneCaptions?: string[];
}

/**
 * Pregunta de aclaración. El LLM las genera a partir de la intención para
 * no inventarse lo que no sabe: a qué se dedica una empresa que el usuario
 * nombra, qué coche, con quién. Las sugerencias son atajos, no un límite.
 */
export interface ClarifyQuestion {
  question: string;
  suggestions: string[];
}

/** Lo que el usuario contestó. Se guarda la pregunta con la respuesta. */
export interface ClarifyAnswer {
  question: string;
  answer: string;
}

/**
 * Guion propuesto y aún no pagado. Se guarda en servidor para que el
 * proyecto se cree con el guion que el usuario aprobó, y no con uno que
 * el cliente pudiera mandar reescrito.
 */
export interface ScriptPreview {
  id: string;
  ownerId: string;
  createdAt: number;
  area: LifeArea;
  intention: string;
  desires?: string[];
  details: ClarifyAnswer[];
  /** Nombres y relaciones de las personas añadidas (sin fotos). */
  people?: { name: string; relation?: string }[];
  tier: Tier;
  tone: VoiceTone;
  durationSec: 30 | 60;
  locale: Locale;
  script: ScriptDraft;
  costCents: number;
}

export interface Project {
  id: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  area: LifeArea;
  /** Lo que el usuario escribio: su intencion en sus palabras. */
  intention: string;
  /** Sus deseos, uno por casilla. Cada uno da una imagen y una frase. */
  desires?: string[];
  /** Respuestas a las preguntas de aclaración, si las hubo. */
  details?: ClarifyAnswer[];
  tier: Tier;
  style: VisualStyle;
  tone: VoiceTone;
  durationSec: 30 | 60;
  /**
   * Idioma en el que se escribió el guion. Se fija al crear y no cambia
   * después: un vídeo generado en inglés no puede volverse español sin
   * regenerar la voz, así que el proyecto recuerda el suyo.
   */
  locale: Locale;
  /** Ruta publica del selfie subido. Nunca se comparte fuera de la cuenta. */
  selfieUrl?: string;
  /** Hasta 4 fotos del usuario: con varias, el parecido mejora mucho. */
  photoUrls?: string[];
  /** Otras personas con foto, hasta 4. */
  people?: Person[];
  /** Voz elegida para el vídeo (id de ElevenLabs). */
  voice?: string;
  /** Sesión de Stripe Checkout con la que se pagó. */
  stripeSessionId?: string;
  /** Frase de apertura elegida para este vídeo (id de lib/quotes). */
  quoteId?: string;
  /** Veces que se relanzó tras un reinicio del servidor. */
  attempts?: number;
  /** Duración real del vídeo final, en segundos. */
  videoDurationSec?: number;
  palette?: Palette;
  /** La persona aprobó las imágenes (o pasó el tiempo de revisión): ya se puede animar. */
  imagesApproved?: boolean;
  /** Desde cuándo espera la revisión de imágenes. */
  reviewSince?: number;
  /** Veces que se rehízo cada escena en la revisión (por id de escena). */
  redoCounts?: Record<string, number>;
  status: ProjectStatus;
  steps: PipelineStep[];
  /**
   * Si llega relleno al crear el proyecto, es el guion que el usuario
   * aprobó en la revisión y el pipeline no vuelve a escribirlo.
   */
  script?: ScriptDraft;
  /** Lo que costó el guion aprobado, que se escribió antes de crear el proyecto. */
  scriptCostCents?: number;
  affirmations: Affirmation[];
  scenes: Scene[];
  /**
   * Pista de voz. En modo mock no hay fichero: el reproductor usa la sintesis
   * de voz del navegador, que ademas deja probar el flujo sin gastar un euro.
   */
  voiceUrl?: string;
  /** Una pista por frase (montaje nuevo): clave → URL /media. */
  voiceLines?: Record<string, string>;
  voiceMode: "file" | "browser";
  musicKey?: string;
  /** Escenas animadas en pequeño (sin voz), para el perfil. Nunca el vídeo entero. */
  highlights?: Highlight[];
  /** La persona eligió mostrar los highlights de este vídeo en su perfil. */
  showOnProfile?: boolean;
  /** Tiene enlace público para compartir (/s/<id>): solo highlights, nunca el vídeo entero. */
  shared?: boolean;
  /** MP4 final, si el ensamblado corrio. Si no, el player web es la entrega. */
  exportUrl?: string;
  /** Lo que pagó el usuario, en centavos de USD. 0 si fue el vídeo gratis. */
  paidCents: number;
  /** Coste de proveedor real, centimos de USD. Para medir margen. */
  costCents: number;
  /** Plantilla del market de la que nació, si aplica. */
  templateSlug?: string;
  watermark: boolean;
  /** Cuándo pidió generar ya y aceptó perder el desistimiento de 14 días (UE). */
  waiverAt?: number;
  /** Vídeo de manifestación montado con estas manifestaciones (en este orden). */
  composedFrom?: string[];
  error?: string;
}

/**
 * UNA PLANTILLA DEL MARKET
 *
 * Nace de un proyecto real: alguien crea su vídeo, le gusta, y lo publica.
 * Lo que se publica NO es el vídeo terminado, sino lo que hace falta para
 * reconstruirlo con otra cara: el guion, las escenas y el estilo.
 *
 * Su vídeo sí se ve en la ficha, como vista previa. Es suyo, lo publica a
 * sabiendas, y es lo que convence al comprador. Pero lo que el comprador
 * recibe se genera de nuevo con SU cara — nunca se le entrega el vídeo del
 * creador con una cara pegada encima.
 *
 * Esa distinción es la que sostiene el producto: el vídeo que te sirve para
 * visualizarte es aquel en el que sales tú.
 */
export interface Template {
  slug: string;
  title: Localized<string>;
  /** Nombre visible de quien la publicó. No se traduce. */
  author: string;
  /** Usuario real, cuando no es una plantilla de la casa. */
  creatorId?: string;
  /** Proyecto del que salió, para poder rastrear el origen. */
  sourceProjectId?: string;
  area: LifeArea;
  style: VisualStyle;
  tone: VoiceTone;
  tier: Tier;
  durationSec: 30 | 60;
  summary: Localized<string>;
  /**
   * Cuándo y cómo usarla: "los 7 días antes de la charla, al levantarte".
   * Es lo que separa una plantilla de una lista de frases bonitas.
   */
  protocol?: Localized<string>;
  affirmations: Localized<string[]>;
  /** Siempre en inglés: van a un modelo de imagen. */
  sceneBriefs: string[];
  /** La versión del creador. Lo que se ve en la ficha. */
  previewUrl?: string;
  cover: { from: string; to: string };
  publishedAt: number;
  /**
   * Cuántos vídeos se han generado a partir de ella. Contador real: empieza
   * en cero y solo sube cuando alguien la usa de verdad.
   */
  uses: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  /** Vídeos gratis ya consumidos. El primero invita la casa. */
  freeVideosUsed: number;
  /** Frases de apertura que ya le salieron, para no repetirlas. */
  usedQuotes?: string[];
  /** Cuándo dio el consentimiento expreso para tratar sus fotos de cara, y qué versión del texto. */
  photoConsent?: { at: number; version: string };
  /** Quién le invitó (userId), si llegó por un enlace compartido. */
  referredBy?: string;
  /** Zona horaria del navegador (para recordar a una hora razonable). */
  tz?: string;
  /** Idioma de la web la última vez (para escribirle en su idioma). */
  locale?: Locale;
  /** Recordatorio diario por email de la racha. Sin valor = activado. */
  reminders?: boolean;
  /** Último día (local) en que se le envió el recordatorio. */
  lastReminder?: string;
  /** Manifestaciones que puede crear (compradas y aún no usadas). No caducan. */
  credits?: number;
  /** Sesiones de Stripe ya abonadas (para no sumar dos veces el mismo pago). */
  creditSessions?: string[];
  /** Sus últimas fotos (para crear manifestaciones sin volver a subirlas mientras existan). */
  photoUrls?: string[];
}
