import type { Locale } from "./i18n/locale";

/**
 * Textos legales. Describen lo que la app hace de verdad (qué se guarda,
 * con quién se comparte, cuándo se borra). Si cambia el código, cambia esto.
 * Borrador: debe revisarlo un abogado antes de cobrar.
 */

export const LEGAL_UPDATED = "2026-10-26";


const UPLOAD_DAYS = Number(process.env.UPLOAD_TTL_DAYS ?? 30);

export type LegalDoc = "privacy" | "terms" | "refunds";
export interface LegalSection {
  h: string;
  p: string[];
}

function contact(locale: Locale): string {
  const CONTACT = process.env.CONTACT_EMAIL;
  if (CONTACT) return CONTACT;
  return locale === "es" ? "el correo de contacto de esta web" : "this site's contact email";
}

export function legalDoc(doc: LegalDoc, locale: Locale): { title: string; updated: string; sections: LegalSection[] } {
  const c = contact(locale);
  const OWNER = process.env.LEGAL_NAME ?? "ManifestLifeAI";
  const es = locale === "es";
  const updated = es ? `Última actualización: ${LEGAL_UPDATED}` : `Last updated: ${LEGAL_UPDATED}`;

  if (doc === "privacy") {
    return {
      title: es ? "Política de privacidad" : "Privacy policy",
      updated,
      sections: es
        ? [
            { h: "Quién es responsable", p: [`${OWNER} es responsable de los datos que se tratan en esta web. Para cualquier consulta sobre tus datos escribe a ${c}.`] },
            { h: "Qué datos usamos", p: [
              "Las fotos que subes de ti y, si las añades, de otras personas, con su nombre y relación contigo.",
              "Lo que escribes: tus deseos, tus respuestas y tus correcciones al guion.",
              "Lo que generamos para ti: guion, imágenes, clips, voz y el vídeo final.",
              "Un identificador anónimo en una cookie, para saber qué vídeos son tuyos. No usamos cookies de publicidad ni de analítica de terceros.",
              "Si pagas, los datos de pago los procesa Stripe; nosotros no vemos ni guardamos el número de tu tarjeta.",
              "Si tienes cuenta: tu perfil (nombre visible, nombre de usuario), los días en que ves tus vídeos (para calcular tu aura, nivel y racha) y las personas de tu círculo. Si los añades, tu foto de perfil, descripción, intención, enlace y ubicación. Tu perfil es privado salvo que elijas mostrarlo a tu círculo o a todo el mundo; entonces los demás ven esos datos, tu aura, nivel, racha y logros, y los highlights (escenas animadas cortas, sin sonido, en las que puede salir tu cara) de los vídeos que tú actives uno a uno. Nunca tus vídeos completos ni tus frases.",
            ] },
            { h: "Para qué", p: [
              "Solo para crear tu vídeo y mostrártelo. Tus fotos se usan como referencia para que las escenas se parezcan a ti (y a las personas que añadas).",
              "No usamos tus fotos ni tus textos para entrenar modelos de IA, no las usamos para identificarte y no las vendemos.",
            ] },
            { h: "Con quién se comparten", p: [
              "Con los proveedores técnicos imprescindibles para generar el vídeo: fal.ai (que ejecuta los modelos de imagen, animación, voz y texto, entre ellos ElevenLabs, MiniMax, ByteDance y Anthropic a través de OpenRouter), Railway (alojamiento de la web y los ficheros) y Stripe (pagos). Cada uno trata los datos según sus propias políticas y puede conservar copias temporales.",
            ] },
            { h: "Cuánto tiempo", p: [
              "Las fotos de otras personas se borran en cuanto tu vídeo está listo.",
              `Tus fotos se borran como mucho ${UPLOAD_DAYS} días después de subirlas.`,
              "Tu vídeo y sus escenas se guardan hasta que los borras. Puedes borrarlos cuando quieras desde la página del vídeo.",
            ] },
            { h: "Fotos de otras personas", p: [
              "Solo puedes subir fotos de alguien si te ha dado permiso y es mayor de edad. Si alguien aparece en un vídeo sin haberlo autorizado, escríbenos y lo borramos.",
            ] },
            { h: "Tus derechos", p: [`Puedes pedir acceso, corrección o borrado de tus datos, u oponerte a su uso, escribiendo a ${c}. También puedes reclamar ante la autoridad de protección de datos de tu país.`] },
            { h: "Menores", p: ["ManifestLifeAI es para mayores de 18 años."] },
          ]
        : [
            { h: "Who is responsible", p: [`${OWNER} is responsible for the data processed on this site. For any question about your data, write to ${c}.`] },
            { h: "What data we use", p: [
              "The photos you upload of yourself and, if you add them, of other people, with their name and relationship to you.",
              "What you write: your desires, your answers and your corrections to the script.",
              "What we generate for you: script, images, clips, voice and the final video.",
              "An anonymous identifier in a cookie, so we know which videos are yours. We don't use third-party advertising or analytics cookies.",
              "If you pay, payment details are processed by Stripe; we never see or store your card number.",
              "If you have an account: your profile (display name, username), the days you watch your videos (to calculate your aura, level and streak) and the people in your circle. If you add them, your profile photo, bio, intention, link and location. Your profile is private unless you choose to show it to your circle or to everyone; then others see those details, your aura, level, streak and achievements, and the highlights (short muted animated scenes, which may show your face) of the videos you switch on one by one. Never your full videos or your phrases.",
            ] },
            { h: "What for", p: [
              "Only to create your video and show it to you. Your photos are used as a reference so the scenes look like you (and the people you add).",
              "We don't use your photos or text to train AI models, we don't use them to identify you, and we don't sell them.",
            ] },
            { h: "Who we share it with", p: [
              "With the technical providers needed to generate the video: fal.ai (which runs the image, animation, voice and text models, including ElevenLabs, MiniMax, ByteDance and Anthropic via OpenRouter), Railway (hosting for the site and files) and Stripe (payments). Each processes data under its own policies and may keep temporary copies.",
            ] },
            { h: "How long", p: [
              "Other people's photos are deleted as soon as your video is ready.",
              `Your photos are deleted at most ${UPLOAD_DAYS} days after you upload them.`,
              "Your video and its scenes are kept until you delete them. You can delete them at any time from the video page.",
            ] },
            { h: "Photos of other people", p: [
              "You may only upload someone's photos if they've given you permission and are an adult. If someone appears in a video without having agreed to it, write to us and we'll delete it.",
            ] },
            { h: "Your rights", p: [`You can ask to access, correct or delete your data, or object to its use, by writing to ${c}. You can also complain to the data protection authority in your country.`] },
            { h: "Minors", p: ["ManifestLifeAI is for people aged 18 and over."] },
          ],
    };
  }

  if (doc === "terms") {
    return {
      title: es ? "Términos de uso" : "Terms of use",
      updated,
      sections: es
        ? [
            { h: "Qué es ManifestLifeAI", p: ["Una herramienta que crea vídeos de visualización con inteligencia artificial a partir de tus fotos y tus deseos. Es una herramienta de enfoque y motivación: no garantiza ningún resultado y no sustituye ayuda médica, psicológica, legal ni financiera."] },
            { h: "Quién puede usarla", p: ["Personas mayores de 18 años. Al usarla confirmas que lo eres."] },
            { h: "Lo que subes", p: [
              "Solo puedes subir fotos tuyas o de personas adultas que te hayan dado permiso.",
              "No está permitido: usar la cara de otra persona sin su consentimiento, suplantar a alguien, crear contenido sexual, violento, de odio o engañoso, ni incluir a menores como protagonistas.",
              "Podemos rechazar o borrar cualquier vídeo que incumpla estas normas.",
            ] },
            { h: "Lo que generamos", p: [
              "El vídeo es para tu uso personal. Puedes compartirlo, pero eres responsable de dónde y cómo lo haces, sobre todo si salen otras personas.",
              "Las imágenes y voces las crea una IA: pueden tener errores o parecidos imperfectos. Revisa el guion antes de generar.",
              "Cada vídeo lleva el aviso «Generado con IA». No lo quites ni presentes el vídeo como real al compartirlo.",
            ] },
            { h: "Pagos", p: ["Pagas por vídeo, al precio que se muestra antes de confirmar. No hay suscripción. Las condiciones de devolución están en la página de reembolsos."] },
            { h: "Disponibilidad", p: ["Hacemos lo posible por que el servicio funcione, pero puede tener interrupciones. Podemos cambiar o retirar funciones avisando en esta web."] },
            { h: "Responsabilidad", p: ["En la medida que permita la ley, nuestra responsabilidad se limita al importe que hayas pagado por el vídeo afectado."] },
            { h: "Contacto", p: [`Para cualquier duda escribe a ${c}.`] },
          ]
        : [
            { h: "What ManifestLifeAI is", p: ["A tool that creates visualization videos with artificial intelligence from your photos and your desires. It's a focus and motivation tool: it doesn't guarantee any result and doesn't replace medical, psychological, legal or financial help."] },
            { h: "Who can use it", p: ["People aged 18 and over. By using it you confirm you are."] },
            { h: "What you upload", p: [
              "You may only upload photos of yourself or of adults who have given you permission.",
              "Not allowed: using someone's face without their consent, impersonating anyone, creating sexual, violent, hateful or misleading content, or featuring minors as the main subject.",
              "We may refuse or delete any video that breaks these rules.",
            ] },
            { h: "What we generate", p: [
              "The video is for your personal use. You can share it, but you're responsible for where and how, especially if other people appear in it.",
              "Images and voices are created by AI: they can contain mistakes or imperfect likeness. Review the script before generating.",
              "Every video carries an \"AI-generated\" notice. Don't remove it or present the video as real when you share it.",
            ] },
            { h: "Payments", p: ["You pay per video, at the price shown before you confirm. There's no subscription. Refund conditions are on the refunds page."] },
            { h: "Availability", p: ["We do our best to keep the service running, but it can be interrupted. We may change or remove features with notice on this site."] },
            { h: "Liability", p: ["To the extent allowed by law, our liability is limited to the amount you paid for the affected video."] },
            { h: "Contact", p: [`For any question, write to ${c}.`] },
          ],
    };
  }

  return {
    title: es ? "Reembolsos" : "Refunds",
    updated,
    sections: es
      ? [
          { h: "Si el vídeo falla", p: ["Si el vídeo no se genera o llega con un fallo técnico (por ejemplo, una escena vacía o sin sonido), te lo volvemos a generar sin coste o te devolvemos el dinero, como prefieras."] },
          { h: "Si no te gusta el resultado", p: ["Antes de pagar revisas y corriges el guion. Una vez generado, el vídeo se crea solo para ti y tiene un coste real de producción, así que no ofrecemos devoluciones por gusto. Escríbenos igualmente: intentaremos arreglarlo."] },
          { h: "Cómo pedirlo", p: [`Escribe a ${c} en los 14 días siguientes con el enlace del vídeo. Respondemos en unos días hábiles.`] },
          { h: "Tus derechos como consumidor", p: ["Nada de esto limita los derechos que te reconozca la ley de consumo de tu país."] },
        ]
      : [
          { h: "If the video fails", p: ["If the video isn't generated or arrives with a technical fault (for example, an empty scene or no sound), we'll regenerate it at no cost or refund you, whichever you prefer."] },
          { h: "If you don't like the result", p: ["Before paying you review and correct the script. Once generated, the video is made just for you and has a real production cost, so we don't offer refunds for taste. Write to us anyway: we'll try to fix it."] },
          { h: "How to ask", p: [`Write to ${c} within 14 days with the link to your video. We reply within a few business days.`] },
          { h: "Your consumer rights", p: ["None of this limits the rights your country's consumer law gives you."] },
        ],
  };
}
