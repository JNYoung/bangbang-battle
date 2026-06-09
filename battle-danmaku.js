export const BATTLE_DANMAKU_EMOTIONS = Object.freeze({
  cheer: {
    color: "#7dd3fc",
    background: "rgba(8, 47, 73, 0.72)",
    label: "cheer",
  },
  hype: {
    color: "#ffd166",
    background: "rgba(69, 26, 3, 0.72)",
    label: "hype",
  },
  tease: {
    color: "#f9a8d4",
    background: "rgba(80, 7, 36, 0.68)",
    label: "tease",
  },
  tension: {
    color: "#fb7185",
    background: "rgba(69, 10, 10, 0.72)",
    label: "tension",
  },
  clutch: {
    color: "#a7f3d0",
    background: "rgba(6, 78, 59, 0.72)",
    label: "clutch",
  },
  shock: {
    color: "#c4b5fd",
    background: "rgba(46, 16, 101, 0.72)",
    label: "shock",
  },
});

export const BATTLE_DANMAKU_EMOTION_ORDER = Object.freeze(Object.keys(BATTLE_DANMAKU_EMOTIONS));

export const BATTLE_DANMAKU_LINES = Object.freeze({
  zh: {
    cheer: [
      "{side} 稳住，节奏在手。",
      "{role} 今天有点会演。",
      "别眨眼，{scene} 正在加戏。",
      "这波站位有说法。",
    ],
    hype: [
      "{side} 开始提速！",
      "{role} 这一下像排练过。",
      "这波要上战报封面。",
      "场面热起来了。",
    ],
    tease: [
      "{trailer} 血条开始走神。",
      "{leaderRole}：我先热个身。",
      "这走位，导演看了都沉默。",
      "先别急，节目效果来了。",
    ],
    tension: [
      "{lowHealth} 血条报警！",
      "谁先失误谁下班。",
      "{trailerRole} 被逼到角落了。",
      "场上空气突然变薄。",
    ],
    clutch: [
      "{underdog} 还有反杀剧本？",
      "残血不退，镜头给满。",
      "{underdogRole} 这波在赌命。",
      "别结算，可能还有戏。",
    ],
    shock: [
      "刚才那一下太脆了！",
      "{side} 把节奏拍碎了。",
      "这命中率像开了天窗。",
      "裁判：我也没看清。",
    ],
  },
  "zh-TW": {
    cheer: [
      "{side} 穩住，節奏在手。",
      "{role} 今天很會做效果。",
      "別眨眼，{scene} 正在加戲。",
      "這波站位有東西。",
    ],
    hype: [
      "{side} 開始加速！",
      "{role} 這一下像排練過。",
      "這波可以放進戰報封面。",
      "場面熱起來了。",
    ],
    tease: [
      "{trailer} 血條開始發呆。",
      "{leaderRole}：我先暖個身。",
      "這走位，導播都沉默。",
      "先別急，節目效果來了。",
    ],
    tension: [
      "{lowHealth} 血條警報！",
      "誰先失誤誰下班。",
      "{trailerRole} 被逼到邊線了。",
      "場上空氣突然變薄。",
    ],
    clutch: [
      "{underdog} 還有反殺劇本？",
      "殘血不退，鏡頭給滿。",
      "{underdogRole} 這波在賭命。",
      "先別結算，可能還有戲。",
    ],
    shock: [
      "剛才那一下太狠了！",
      "{side} 把節奏拍碎了。",
      "這命中率有點離譜。",
      "裁判：我也沒看清。",
    ],
  },
  ja: {
    cheer: [
      "{side}、流れをつかんでる。",
      "{role}、今日は見せ場がある。",
      "{scene}、空気が上がってきた。",
      "この位置取り、うまい。",
    ],
    hype: [
      "{side} が加速してきた！",
      "{role}、一撃がきれい。",
      "今の流れ、ハイライト行き。",
      "アリーナが熱い。",
    ],
    tease: [
      "{trailer}、ちょっと苦しいかも。",
      "{leaderRole}、余裕を見せてる。",
      "その動き、台本あり？",
      "まだ慌てる時間じゃない。",
    ],
    tension: [
      "{lowHealth}、体力が危ない！",
      "次のミスで決まるかも。",
      "{trailerRole} が追い込まれた。",
      "空気が一気に重い。",
    ],
    clutch: [
      "{underdog}、逆転ある？",
      "瀕死でも下がらない。",
      "{underdogRole}、勝負に出た。",
      "まだ終わってない。",
    ],
    shock: [
      "今の一撃、えぐい！",
      "{side}、流れを壊した！",
      "命中が鋭すぎる。",
      "見逃した人、損してる。",
    ],
  },
  en: {
    cheer: [
      "{side} has the rhythm.",
      "{role} is reading the room.",
      "{scene} is warming up.",
      "Clean spacing right there.",
    ],
    hype: [
      "{side} just hit the gas!",
      "{role} came to make clips.",
      "That belongs on the report card.",
      "The arena is getting loud.",
    ],
    tease: [
      "{trailer} is running out of excuses.",
      "{leaderRole} looks way too comfortable.",
      "That pathing had drama.",
      "Hold the verdict, timing is everything.",
    ],
    tension: [
      "{lowHealth} is on red alert!",
      "One mistake decides this.",
      "{trailerRole} is getting boxed in.",
      "The whole lane just got quiet.",
    ],
    clutch: [
      "{underdog} still has a comeback script?",
      "Low HP, high confidence.",
      "{underdogRole} is gambling the round.",
      "Do not call it yet.",
    ],
    shock: [
      "That hit landed hard!",
      "{side} broke the tempo open.",
      "That accuracy is rude.",
      "Blink and you miss the swing.",
    ],
  },
  fr: {
    cheer: [
      "{side} tient le rythme.",
      "{role} lit bien le terrain.",
      "{scene} chauffe doucement.",
      "Placement propre ici.",
    ],
    hype: [
      "{side} accélère fort !",
      "{role} veut son moment de gloire.",
      "Ça part direct dans le best-of.",
      "L'arène monte en température.",
    ],
    tease: [
      "{trailer} manque d'arguments.",
      "{leaderRole} joue avec le tempo.",
      "Cette trajectoire avait du théâtre.",
      "On garde le verdict au chaud.",
    ],
    tension: [
      "{lowHealth} est en alerte rouge !",
      "La prochaine erreur peut tout finir.",
      "{trailerRole} est coincé.",
      "L'air devient lourd.",
    ],
    clutch: [
      "{underdog} peut encore renverser ?",
      "Peu de vie, beaucoup d'audace.",
      "{underdogRole} tente le tout pour le tout.",
      "Ne lancez pas encore le générique.",
    ],
    shock: [
      "Ce coup a claqué fort !",
      "{side} casse le rythme !",
      "Cette précision est insolente.",
      "On a à peine eu le temps de voir.",
    ],
  },
  de: {
    cheer: [
      "{side} hat den Rhythmus.",
      "{role} liest das Feld sauber.",
      "{scene} kommt langsam in Fahrt.",
      "Sauberes Stellungsspiel.",
    ],
    hype: [
      "{side} drückt aufs Tempo!",
      "{role} will ins Highlight.",
      "Das gehört in den Kampfbericht.",
      "Die Arena wird laut.",
    ],
    tease: [
      "{trailer} braucht langsam Ideen.",
      "{leaderRole} wirkt sehr entspannt.",
      "Dieser Laufweg hatte Drama.",
      "Das Urteil wartet noch kurz.",
    ],
    tension: [
      "{lowHealth} steht auf Rot!",
      "Ein Fehler kann alles entscheiden.",
      "{trailerRole} wird eng gestellt.",
      "Plötzlich ist es ganz still.",
    ],
    clutch: [
      "{underdog} hat noch ein Comeback?",
      "Wenig HP, viel Mut.",
      "{underdogRole} setzt alles auf eine Karte.",
      "Noch nicht abschreiben.",
    ],
    shock: [
      "Der Treffer saß hart!",
      "{side} sprengt den Rhythmus!",
      "Diese Präzision ist frech.",
      "Einmal blinzeln, schon vorbei.",
    ],
  },
  ar: {
    cheer: [
      "{side} ماسك الإيقاع.",
      "{role} يقرأ الساحة بهدوء.",
      "{scene} بدأ يسخن.",
      "تمركز نظيف هنا.",
    ],
    hype: [
      "{side} رفع السرعة!",
      "{role} يريد لقطة مميزة.",
      "هذه اللقطة تصلح للتقرير.",
      "الساحة صارت أعلى صوتا.",
    ],
    tease: [
      "{trailer} يحتاج خطة جديدة.",
      "{leaderRole} يلعب بثقة زائدة.",
      "هذه الحركة فيها دراما.",
      "الحكم مؤجل قليلا.",
    ],
    tension: [
      "{lowHealth} في إنذار أحمر!",
      "خطأ واحد قد ينهي الجولة.",
      "{trailerRole} محاصر الآن.",
      "الجو صار ثقيلا.",
    ],
    clutch: [
      "{underdog} هل يقلبها؟",
      "صحة قليلة وثقة كبيرة.",
      "{underdogRole} يراهن على اللحظة.",
      "لا تعلن النهاية بعد.",
    ],
    shock: [
      "هذه الضربة كانت قوية!",
      "{side} كسر الإيقاع!",
      "الدقة هنا جريئة جدا.",
      "رمشة واحدة وتفوت اللقطة.",
    ],
  },
});

const FALLBACK_DANMAKU_LOCALE = "zh";

export function normalizeDanmakuLocale(locale) {
  const rawLocale = String(locale || "").trim();
  if (Object.hasOwn(BATTLE_DANMAKU_LINES, rawLocale)) {
    return rawLocale;
  }

  const localeKey = rawLocale.toLowerCase();
  if (localeKey.startsWith("zh-hant") || localeKey.startsWith("zh-tw") || localeKey.startsWith("zh-hk")) {
    return "zh-TW";
  }
  if (localeKey.startsWith("zh")) {
    return "zh";
  }

  const baseLocale = localeKey.split("-")[0];
  return Object.hasOwn(BATTLE_DANMAKU_LINES, baseLocale) ? baseLocale : FALLBACK_DANMAKU_LOCALE;
}

export function getBattleDanmakuEmotionMeta(emotion) {
  return BATTLE_DANMAKU_EMOTIONS[emotion] || BATTLE_DANMAKU_EMOTIONS.cheer;
}

export function chooseBattleDanmakuEmotion(context = {}, random = Math.random) {
  return pickWeightedEmotion(getBattleDanmakuEmotionWeights(context), random);
}

export function getBattleDanmakuEmotionWeights(context = {}) {
  if ((context.recentHighlightPriority || 0) >= 4) {
    return [
      { emotion: "shock", weight: 5 },
      { emotion: "clutch", weight: 3 },
      { emotion: "hype", weight: 2 },
    ];
  }

  if ((context.recentHighlightPriority || 0) >= 2) {
    return [
      { emotion: "hype", weight: 4 },
      { emotion: "shock", weight: 3 },
      { emotion: "cheer", weight: 2 },
    ];
  }

  if (context.lowHealth || (Number.isFinite(context.minHpRatio) && context.minHpRatio <= 0.28)) {
    return [
      { emotion: "tension", weight: 4 },
      { emotion: "clutch", weight: 3 },
      { emotion: "shock", weight: 1 },
      { emotion: "cheer", weight: 1 },
    ];
  }

  if (context.isItemMode) {
    return [
      { emotion: "tease", weight: 4 },
      { emotion: "hype", weight: 3 },
      { emotion: "shock", weight: 2 },
      { emotion: "cheer", weight: 1 },
    ];
  }

  if (context.isHeroMode) {
    return [
      { emotion: "hype", weight: 4 },
      { emotion: "shock", weight: 2 },
      { emotion: "cheer", weight: 2 },
      { emotion: "tease", weight: 1 },
    ];
  }

  if (context.hasVariant) {
    return [
      { emotion: "hype", weight: 3 },
      { emotion: "tease", weight: 3 },
      { emotion: "shock", weight: 2 },
      { emotion: "cheer", weight: 2 },
    ];
  }

  if ((context.matchTime || 0) <= 4) {
    return [
      { emotion: "cheer", weight: 4 },
      { emotion: "hype", weight: 3 },
      { emotion: "tease", weight: 2 },
    ];
  }

  return [
    { emotion: "cheer", weight: 3 },
    { emotion: "hype", weight: 3 },
    { emotion: "tease", weight: 3 },
    { emotion: "tension", weight: 2 },
  ];
}

export function chooseBattleDanmakuLine(locale, emotion, context = {}, random = Math.random) {
  const normalizedLocale = normalizeDanmakuLocale(locale);
  const linesByEmotion = BATTLE_DANMAKU_LINES[normalizedLocale] || BATTLE_DANMAKU_LINES[FALLBACK_DANMAKU_LOCALE];
  const safeEmotion = BATTLE_DANMAKU_EMOTIONS[emotion] ? emotion : "cheer";
  const linePool = linesByEmotion[safeEmotion] || linesByEmotion.cheer || [];
  const line = linePool[getRandomIndex(linePool.length, random)] || "";
  return formatBattleDanmakuLine(line, context);
}

export function formatBattleDanmakuLine(line, context = {}) {
  const values = {
    side: "",
    role: "",
    scene: "",
    leader: "",
    leaderRole: "",
    trailer: "",
    trailerRole: "",
    lowHealth: "",
    lowHealthRole: "",
    underdog: "",
    underdogRole: "",
    variant: "",
    ...context,
  };

  return String(line).replace(/\{([a-zA-Z]+)\}/g, (_, key) => String(values[key] ?? ""));
}

function pickWeightedEmotion(weightedEmotions, random) {
  const candidates = weightedEmotions.filter((entry) => BATTLE_DANMAKU_EMOTIONS[entry.emotion] && entry.weight > 0);
  if (candidates.length === 0) {
    return "cheer";
  }

  const totalWeight = candidates.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = getRandomValue(random) * totalWeight;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) {
      return candidate.emotion;
    }
  }
  return candidates[candidates.length - 1].emotion;
}

function getRandomIndex(length, random) {
  if (length <= 0) {
    return 0;
  }

  return Math.min(length - 1, Math.floor(getRandomValue(random) * length));
}

function getRandomValue(random) {
  const value = typeof random === "function" ? random() : Math.random();
  return Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.999999) : Math.random();
}
