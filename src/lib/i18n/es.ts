import type { Dictionary } from "./en";

/** Diccionario en español. El tipo obliga a que no falte ninguna clave. */
export const es: Dictionary = {
  nav: {
    create: "Crear",
    market: "Market",
    pricing: "Precios",
    library: "Biblioteca",
    start: "Empezar",
  },
  footer: {
    disclaimer:
      "Manifest es una herramienta de visualización y enfoque. No sustituye tratamiento médico ni asesoramiento financiero, y no garantiza resultados.",
  },
  common: {
    back: "Atrás",
    continue: "Continuar",
    seeAll: "Ver todo",
    free: "Gratis",
    perVideo: "por vídeo",
    seconds: "s",
    createAnother: "Crear otro",
  },
  home: {
    demoBanner:
      "Modo demo · sin claves de API las escenas y la voz se generan en local, sin coste",
    eyebrow: "Visualización guiada",
    titleA: "Verte viviéndolo",
    titleB: "antes de que pase.",
    lede: "Sube una foto y recibe un vídeo de 30 o 60 segundos donde apareces tú logrando lo que estás persiguiendo. Con un guion escrito para tu caso y una voz que lo dice en alto, para que lo repitas con ella.",
    ctaPrimary: "Crear mi vídeo",
    ctaSecondary: "Ver el market",
    freeNote: "Tu primer vídeo es gratis. Sin tarjeta.",
    previewLine: "Dirijo mi propio estudio.",
    previewCue: "ahora tú — dilo en voz alta",
    steps: [
      {
        n: "01",
        title: "Sube una foto tuya",
        body: "Un selfie de frente, con buena luz. Se usa solo para generar tus escenas y puedes borrarla cuando quieras.",
      },
      {
        n: "02",
        title: "Cuenta qué estás construyendo",
        body: "En tus palabras. «Quiero dirigir mi propio estudio en Lisboa» funciona mejor que «éxito».",
      },
      {
        n: "03",
        title: "Recibe tu vídeo con guion y voz",
        body: "Escenas contigo dentro, afirmaciones escritas para tu caso y una voz que las dice para que las repitas.",
      },
    ],
    productsTitle: "Dos formas de verlo",
    productsLede:
      "La diferencia no es la calidad de la imagen: es si las escenas se mueven de verdad. Las dos funcionan para visualizar, y cuestan muy distinto de producir.",
    freeAfterProducts:
      "Tu primer vídeo es gratis. Después pagas solo cuando creas — sin suscripción.",
    areasTitle: "¿Qué quieres ver?",
    marketTitle: "Del market",
    marketLede:
      "Vídeos que ha creado otra gente. Les pones tu cara y se genera tu versión, contigo dentro.",
    closingTitle: "Lo que miras todos los días acaba pareciéndote posible.",
    closingCta: "Empezar",
    costNote: "Nos cuesta {cost} producirlo.",
    durationBoth: "30 s o 60 s",
  },
  pricing: {
    title: "Dos precios, y ya",
    lede: "Pagas por vídeo. Sin suscripción, sin créditos, sin paquetes. El primero es gratis para que veas si te resuena.",
    sameDuration: "por vídeo · 30 o 60 segundos, mismo precio",
    create: "Crear",
    freeNote:
      "Tu primer vídeo es gratis y lleva una pequeña marca de agua. A partir de ahí pagas solo cuando creas.",
    marketTitle: "Y si usas la plantilla de alguien",
    marketLede:
      "Pagas exactamente lo mismo. No hay tarifa aparte por la plantilla: del precio del vídeo, un {share} % va a quien la creó.",
    publishTitle: "Si publicas las tuyas",
    publishBody:
      "Cuando termines un vídeo que te guste, puedes publicarlo como plantilla. Quien la use genera su propia versión con su cara, y a ti te llegan {stills} por cada vídeo de imágenes y {animated} por cada animado.",
    publishNote:
      "Lo que se publica es la receta —guion, escenas, estilo—, no tu vídeo montado. Nadie recibe nunca un vídeo con tu cara dentro.",
    transparency:
      "Para que se vea de dónde salen los números: producir un vídeo de imágenes de 60 s nos cuesta {stills} en modelos de IA, y uno animado de 60 s, {animated}. La diferencia de precio no es un capricho: animar cada escena cuesta entre 30 y 100 veces más que generar una imagen.",
  },
  products: {
    vision: {
      name: "Imágenes",
      tagline: "Escenas tuyas con movimiento de cámara",
      waitLabel: "listo en un par de minutos",
      points: [
        "6 a 12 escenas generadas con tu cara",
        "Movimiento de cámara suave sobre cada una",
        "Guion escrito para tu caso y voz incluida",
        "Descarga en MP4",
      ],
    },
    cinematic: {
      name: "Animado",
      tagline: "Escenas que se mueven de verdad",
      waitLabel: "tarda entre 4 y 10 minutos",
      points: [
        "Cada escena es un clip generado, no una foto",
        "Tú te mueves dentro de la escena",
        "Mismo guion y voz, con más aire entre frases",
        "Descarga en MP4",
      ],
    },
  },
  market: {
    title: "El market",
    lede: "Vídeos que ha creado otra gente. Eliges uno, le pones tu cara, y se genera tu versión: las mismas escenas y el mismo guion, contigo dentro.",
    note: "Cuesta lo mismo que crear uno de cero. Del precio, un {share} % va a quien lo creó.",
    all: "Todos",
    howToUse: "Cómo usarlo",
    affirmationsTitle: "Las afirmaciones",
    scenesTitle: "Las escenas",
    scenesNote:
      "Descripciones en inglés: es el idioma con el que mejor responden los modelos de imagen. Estilo {style}.",
    useTemplate: "Usar esta plantilla",
    priceNote: "Lo mismo que crear uno de cero. Sin tarifa aparte por la plantilla.",
    usedBySingular: "persona lo ha usado",
    usedByPlural: "personas lo han usado",
    by: "de",
  },
  create: {
    steps: ["Área", "Intención", "Foto", "Formato"],
    fromTemplate:
      "Partiendo de {title} de {author}. El guion y las escenas vienen dados; tú pones tu cara y tu intención.",
    areaTitle: "¿Qué parte de tu vida quieres ver distinta?",
    areaHint: "Elige una. Se trabaja mejor de una en una.",
    intentionTitle: "Cuéntalo como si ya hubiera pasado",
    intentionHint:
      "Cuanto más concreto, mejores escenas. Un lugar, una acción, una persona.",
    intentionPlaceholder:
      "Dirijo mi propio estudio en Lisboa, con tres personas en el equipo y clientes que me buscan a mí.",
    ideas: {
      carrera: [
        "Dirijo mi propio estudio de diseño y elijo con qué clientes trabajo",
        "Me ascienden a responsable de equipo y lo llevo con calma",
        "Doy la charla de apertura en una conferencia de mi sector",
      ],
      abundancia: [
        "Cierro el año con seis meses de gastos ahorrados y sin agobio",
        "Mi negocio factura lo suficiente para vivir tranquilo",
        "Compro mi casa y firmo sin miedo",
      ],
      salud: [
        "Corro 10 km sin pararme y me levanto con energía",
        "Duermo bien, entreno tres veces por semana y me sostengo",
        "Me veo fuerte y me gusta lo que veo",
      ],
      amor: [
        "Tengo una relación tranquila con alguien que me trata bien",
        "Digo lo que siento sin miedo a que se rompa",
        "Me rodeo de gente que me suma",
      ],
      confianza: [
        "Hablo en reuniones sin que me tiemble la voz",
        "Me presento a lo que quiero aunque no me sienta listo",
        "Dejo de compararme y sigo mi propio ritmo",
      ],
      libertad: [
        "Trabajo desde donde quiero y organizo mis días yo",
        "Paso un año viviendo en otro país",
        "Tengo tiempo para lo mío sin sentirme culpable",
      ],
    },
    ideasLabel: "O empieza por una de estas:",
    photoTitle: "Tu cara en las escenas",
    photoHint:
      "Un selfie de frente, con luz natural y sin gafas de sol. Sin foto también funciona: se generan escenas sin rostro visible.",
    noPhoto: "Sin foto",
    uploading: "Subiendo…",
    photoPrivacy:
      "Tu foto es tuya. No se publica, no se usa para entrenar modelos y la puedes borrar desde tu biblioteca junto con el vídeo.",
    formatTitle: "Cómo quieres que se vea",
    formatHint: "Esto es lo que determina el precio.",
    videoType: "Qué tipo de vídeo",
    duration: "Duración",
    visualStyle: "Estilo visual",
    voice: "Voz",
    firstVideo: "Tu primer vídeo",
    price: "Precio",
    watermarkNote: " · lleva marca de agua",
    submit: "Crear mi vídeo",
    submitting: "Creando…",
  },
  tones: {
    calma: { label: "Calma", blurb: "Lenta y grave. Para la noche." },
    firme: { label: "Firme", blurb: "Directa y con empuje. Para la mañana." },
    cercana: { label: "Cercana", blurb: "Como alguien que te conoce." },
  },
  library: {
    title: "Biblioteca",
    videosSingular: "vídeo",
    videosPlural: "vídeos",
    freeOne: "tu primer vídeo es gratis",
    freeMany: "{n} vídeos gratis",
    createBtn: "Crear vídeo",
    emptyTitle: "Todavía no has creado nada",
    emptyBody:
      "Empieza por el área que más te pese ahora mismo. Se tarda menos de dos minutos.",
    emptyCta: "Crear mi primer vídeo",
    noScenes: "sin escenas",
    status: {
      draft: "Borrador",
      queued: "En cola",
      generating: "Generando",
      ready: "Listo",
      failed: "Falló",
    },
  },
  video: {
    failedTitle: "No se pudo terminar tu vídeo",
    failedUnknown: "Error desconocido",
    failedRefund: "Si no llegó a generarse ninguna escena, no se te ha cobrado.",
    tryAgain: "Intentarlo otra vez",
    download: "Descargar MP4",
    downloadUnavailable: "Descarga MP4 no disponible en este entorno",
    scriptTitle: "Tu guion",
    scriptNote: "Léelo en voz alta por la mañana aunque no pongas el vídeo.",
    scenesTitle: "Escenas",
    detailsTitle: "Detalle de producción",
    paid: "Pagado",
    freeLabel: "gratis",
    providerCost: "Coste de proveedor",
    sceneCount: "Escenas",
    voiceLabel: "Voz",
    voiceBrowser: "sintetizada en el navegador (demo)",
    voiceFile: "pista generada",
    generatingTitle: "Estamos creando tu vídeo",
    generatingStills: "Suele tardar menos de dos minutos.",
    generatingAnimated:
      "El vídeo animado tarda unos minutos: cada escena se genera por separado.",
    firstScenes: "Primeras escenas",
    steps: {
      script: "Escribiendo tu guion",
      images: "Creando las escenas contigo dentro",
      motion: "Dando movimiento a cada escena",
      voice: "Grabando la voz",
      assemble: "Montando el vídeo",
    },
  },
  player: {
    speakNow: "ahora tú — dilo en voz alta",
    noScenes: "Sin escenas todavía",
    instructions:
      "Ponte los auriculares, míralo entero y repite cada frase en voz alta cuando aparezca {cue}. Dos veces al día, mañana y antes de dormir.",
    play: "Reproducir",
    pause: "Pausa",
    restart: "Empezar de nuevo",
    loopOn: "Repetición activada",
    loopOff: "Repetición desactivada",
    musicOn: "Silenciar música",
    musicOff: "Activar música",
    voiceOn: "Silenciar voz",
    voiceOff: "Activar voz",
    fullscreen: "Pantalla completa",
  },
  areas: {
    carrera: { label: "Carrera y propósito", blurb: "Ascenso, negocio propio, reconocimiento" },
    abundancia: { label: "Abundancia", blurb: "Dinero, libertad financiera, prosperidad" },
    salud: { label: "Salud y cuerpo", blurb: "Energía, fuerza, hábitos que sostienes" },
    amor: { label: "Amor y vínculos", blurb: "Pareja, familia, relaciones sanas" },
    confianza: { label: "Confianza", blurb: "Autoestima, presencia, hablar sin miedo" },
    libertad: { label: "Libertad y viaje", blurb: "Nómada, tiempo propio, vivir donde quieras" },
  },
  styles: {
    cinematic: "Cinematográfico",
    editorial: "Editorial",
    golden: "Hora dorada",
    minimal: "Minimal",
    dream: "Onírico",
  },
  consent:
    "Confirmo que la foto es mía, que soy mayor de edad y que autorizo a usarla para generar mi vídeo.",
  safety: {
    tooShort: "Cuéntanos un poco más: al menos una frase completa.",
    tooLong: "Demasiado largo. Resúmelo en unas pocas frases.",
    health:
      "No generamos visualizaciones sobre curación de enfermedades. Podemos trabajar el bienestar, la energía y los hábitos.",
    finance: "No generamos promesas de rendimiento financiero garantizado.",
    minors:
      "Solo se pueden crear visualizaciones de personas adultas, y solo de uno mismo.",
    sexual: "No generamos contenido sexual ni desnudos.",
  },
  errors: {
    noFile: "Falta el archivo",
    noConsent: "Necesitamos tu confirmación de que la foto es tuya",
    badFormat: "Formato no admitido. Usa JPG, PNG o WebP.",
    tooBig: "La foto pesa más de 8 MB",
    incomplete: "Datos incompletos",
    notFound: "No existe ese vídeo",
    notYours: "No es tuyo",
    invalidPath: "Ruta no válida",
    createFailed: "No se pudo crear el vídeo",
    uploadFailed: "No se pudo subir la foto",
    noFreeLeft: "Ya has usado tu vídeo gratis. Los pagos todavía no están activos.",
  },
};
