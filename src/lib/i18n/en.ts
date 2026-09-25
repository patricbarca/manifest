/**
 * Diccionario en inglés. Es la fuente de verdad: de aquí sale el tipo
 * `Dictionary`, así que si falta una clave en español, TypeScript lo dice.
 */
export const en = {
  nav: {
    create: "Create",
    market: "Market",
    pricing: "Pricing",
    library: "Library",
    start: "Get started",
  },
  footer: {
    disclaimer:
      "Manifest is a visualization and focus tool. It does not replace medical treatment or financial advice, and it does not guarantee results.",
  },
  common: {
    back: "Back",
    continue: "Continue",
    seeAll: "See all",
    free: "Free",
    perVideo: "per video",
    seconds: "s",
    createAnother: "Create another",
  },
  home: {
    demoBanner:
      "Demo mode · with no API keys, scenes and voice are generated locally at no cost",
    eyebrow: "Guided visualization",
    titleA: "Seeing yourself live it",
    titleB: "before it happens.",
    lede: "Upload a photo and get a 30 or 60 second video where you're the one achieving what you're working towards. With a script written for your case and a voice that says it out loud, so you can say it along.",
    ctaPrimary: "Create my video",
    ctaSecondary: "See the market",
    freeNote: "Your first video is free. No card.",
    previewLine: "I run my own studio.",
    previewCue: "your turn — say it out loud",
    steps: [
      {
        n: "01",
        title: "Upload a photo of yourself",
        body: "A front-facing selfie in good light. It's only used to generate your scenes, and you can delete it whenever you want.",
      },
      {
        n: "02",
        title: "Say what you're building",
        body: "In your own words. «I want to run my own studio in Lisbon» works better than «success».",
      },
      {
        n: "03",
        title: "Get your video, with script and voice",
        body: "Scenes with you in them, affirmations written for your case, and a voice that says them so you can repeat them.",
      },
    ],
    productsTitle: "Two ways to see it",
    productsLede:
      "The difference isn't image quality: it's whether the scenes actually move. Both work for visualizing, and they cost very different amounts to produce.",
    freeAfterProducts:
      "Your first video is free. After that you only pay when you create — no subscription.",
    areasTitle: "What do you want to see?",
    marketTitle: "From the market",
    marketLede:
      "Videos other people have created. You put your face in and your version is generated, with you inside.",
    closingTitle: "What you look at every day starts to feel possible.",
    closingCta: "Get started",
    costNote: "Costs us {cost} to produce.",
    durationBoth: "30 s or 60 s",
  },
  pricing: {
    title: "Two prices, that's it",
    lede: "You pay per video. No subscription, no credits, no bundles. The first one is free so you can see if it resonates.",
    sameDuration: "per video · 30 or 60 seconds, same price",
    create: "Create",
    freeNote:
      "Your first video is free and carries a small watermark. After that you only pay when you create.",
    marketTitle: "And if you use someone's template",
    marketLede:
      "You pay exactly the same. There's no separate template fee: {share}% of the video price goes to whoever created it.",
    publishTitle: "If you publish your own",
    publishBody:
      "When you finish a video you like, you can publish it as a template. Whoever uses it generates their own version with their face, and you get {stills} for every stills video and {animated} for every animated one.",
    publishNote:
      "What gets published is the recipe — script, scenes, style — not your finished video. Nobody ever receives a video with your face in it.",
    transparency:
      "So you can see where the numbers come from: producing a 60 s stills video costs us {stills} in AI models, and a 60 s animated one, {animated}. The price difference isn't a whim: animating each scene costs 30 to 100 times more than generating an image.",
  },
  products: {
    vision: {
      name: "Stills",
      tagline: "Scenes of you with camera movement",
      waitLabel: "ready in a couple of minutes",
      points: [
        "6 to 12 scenes generated with your face",
        "Smooth camera movement over each one",
        "Script written for your case, voice included",
        "MP4 download",
      ],
    },
    cinematic: {
      name: "Animated",
      tagline: "Scenes that actually move",
      waitLabel: "takes 4 to 10 minutes",
      points: [
        "Each scene is a generated clip, not a photo",
        "You move inside the scene",
        "Same script and voice, with more room between lines",
        "MP4 download",
      ],
    },
  },
  market: {
    title: "The market",
    lede: "Videos other people have created. Pick one, put your face in, and your version gets generated: the same scenes and the same script, with you inside.",
    note: "It costs the same as creating one from scratch. {share}% of the price goes to whoever created it.",
    all: "All",
    howToUse: "How to use it",
    affirmationsTitle: "The affirmations",
    scenesTitle: "The scenes",
    scenesNote:
      "Descriptions in English: it's the language image models respond to best. {style} style.",
    useTemplate: "Use this template",
    priceNote: "The same as creating one from scratch. No separate template fee.",
    usedBySingular: "person has used it",
    usedByPlural: "people have used it",
    by: "by",
  },
  create: {
    steps: ["Area", "Intention", "Photo", "Format"],
    fromTemplate:
      "Starting from {title} by {author}. The script and scenes come ready; you bring your face and your intention.",
    areaTitle: "Which part of your life do you want to see differently?",
    areaHint: "Pick one. It works better one at a time.",
    intentionTitle: "Tell it as if it had already happened",
    intentionHint:
      "The more specific, the better the scenes. A place, an action, a person.",
    intentionPlaceholder:
      "I run my own studio in Lisbon, with three people on the team and clients who come looking for me.",
    ideas: {
      carrera: [
        "I run my own design studio and I choose which clients I work with",
        "I get promoted to team lead and I handle it calmly",
        "I give the opening talk at a conference in my field",
      ],
      abundancia: [
        "I end the year with six months of expenses saved and no stress",
        "My business earns enough for me to live at ease",
        "I buy my home and sign without fear",
      ],
      salud: [
        "I run 10 km without stopping and wake up with energy",
        "I sleep well, train three times a week, and I keep it up",
        "I look strong and I like what I see",
      ],
      amor: [
        "I'm in a calm relationship with someone who treats me well",
        "I say what I feel without fearing it will break",
        "I surround myself with people who add to my life",
      ],
      confianza: [
        "I speak up in meetings without my voice shaking",
        "I go for what I want even when I don't feel ready",
        "I stop comparing myself and keep my own pace",
      ],
      libertad: [
        "I work from wherever I want and organize my own days",
        "I spend a year living in another country",
        "I have time for myself without feeling guilty",
      ],
    },
    ideasLabel: "Or start from one of these:",
    photoTitle: "Your face in the scenes",
    photoHint:
      "A front-facing selfie, natural light, no sunglasses. It also works without a photo: scenes are generated with no visible face.",
    noPhoto: "No photo",
    uploading: "Uploading…",
    photoPrivacy:
      "Your photo is yours. It isn't published, it isn't used to train models, and you can delete it from your library along with the video.",
    formatTitle: "How you want it to look",
    formatHint: "This is what determines the price.",
    videoType: "What kind of video",
    duration: "Duration",
    visualStyle: "Visual style",
    voice: "Voice",
    firstVideo: "Your first video",
    price: "Price",
    watermarkNote: " · carries a watermark",
    submit: "Create my video",
    submitting: "Creating…",
  },
  tones: {
    calma: { label: "Calm", blurb: "Slow and low. For the evening." },
    firme: { label: "Firm", blurb: "Direct and driving. For the morning." },
    cercana: { label: "Close", blurb: "Like someone who knows you." },
  },
  library: {
    title: "Library",
    videosSingular: "video",
    videosPlural: "videos",
    freeOne: "your first video is free",
    freeMany: "{n} free videos",
    createBtn: "Create video",
    emptyTitle: "You haven't created anything yet",
    emptyBody:
      "Start with whatever weighs on you most right now. It takes less than two minutes.",
    emptyCta: "Create my first video",
    noScenes: "no scenes",
    status: {
      draft: "Draft",
      queued: "Queued",
      generating: "Generating",
      ready: "Ready",
      failed: "Failed",
    },
  },
  video: {
    failedTitle: "We couldn't finish your video",
    failedUnknown: "Unknown error",
    failedRefund: "If no scene was generated, you weren't charged.",
    tryAgain: "Try again",
    download: "Download MP4",
    downloadUnavailable: "MP4 download not available in this environment",
    scriptTitle: "Your script",
    scriptNote: "Read it out loud in the morning even without the video.",
    scenesTitle: "Scenes",
    detailsTitle: "Production details",
    paid: "Paid",
    freeLabel: "free",
    providerCost: "Provider cost",
    sceneCount: "Scenes",
    voiceLabel: "Voice",
    voiceBrowser: "synthesized in the browser (demo)",
    voiceFile: "generated track",
    generatingTitle: "We're creating your video",
    generatingStills: "Usually takes less than two minutes.",
    generatingAnimated:
      "The animated video takes a few minutes: each scene is generated separately.",
    firstScenes: "First scenes",
    steps: {
      script: "Writing your script",
      images: "Creating the scenes with you in them",
      motion: "Bringing each scene to life",
      voice: "Recording the voice",
      assemble: "Putting the video together",
    },
  },
  player: {
    speakNow: "your turn — say it out loud",
    noScenes: "No scenes yet",
    instructions:
      "Put your headphones on, watch it all the way through, and repeat each line out loud when {cue} appears. Twice a day, morning and before bed.",
    play: "Play",
    pause: "Pause",
    restart: "Start over",
    loopOn: "Repeat on",
    loopOff: "Repeat off",
    musicOn: "Mute music",
    musicOff: "Play music",
    voiceOn: "Mute voice",
    voiceOff: "Unmute voice",
    fullscreen: "Fullscreen",
  },
  areas: {
    carrera: { label: "Career & purpose", blurb: "Promotion, your own business, recognition" },
    abundancia: { label: "Abundance", blurb: "Money, financial freedom, prosperity" },
    salud: { label: "Health & body", blurb: "Energy, strength, habits that stick" },
    amor: { label: "Love & bonds", blurb: "Partner, family, healthy relationships" },
    confianza: { label: "Confidence", blurb: "Self-worth, presence, speaking without fear" },
    libertad: { label: "Freedom & travel", blurb: "Nomad, your own time, living where you want" },
  },
  styles: {
    cinematic: "Cinematic",
    editorial: "Editorial",
    golden: "Golden hour",
    minimal: "Minimal",
    dream: "Dreamlike",
  },
  consent:
    "I confirm this photo is of me, that I am over 18, and I authorize its use to generate my video.",
  safety: {
    tooShort: "Tell us a little more: at least one full sentence.",
    tooLong: "Too long. Sum it up in a few sentences.",
    health:
      "We don't generate visualizations about curing illness. We can work on wellbeing, energy and habits.",
    finance: "We don't generate guaranteed financial return promises.",
    minors:
      "Visualizations can only be created of adults, and only of yourself.",
    sexual: "We don't generate sexual content or nudity.",
  },
  errors: {
    noFile: "File missing",
    noConsent: "We need you to confirm the photo is yours",
    badFormat: "Format not supported. Use JPG, PNG or WebP.",
    tooBig: "The photo is over 8 MB",
    incomplete: "Incomplete data",
    notFound: "That video doesn't exist",
    notYours: "Not yours",
    invalidPath: "Invalid path",
    createFailed: "Couldn't create the video",
    uploadFailed: "Couldn't upload the photo",
    noFreeLeft:
      "You've used your free video. Payments aren't active yet.",
  },
};

export type Dictionary = typeof en;
