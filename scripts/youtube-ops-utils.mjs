export const DAILY_YOUTUBE_CLIP_COUNT = 3;
export const DEFAULT_DAILY_CANDIDATE_COUNT = 9;
export const OPS_PROMPT_VERSION = "2026-06-topic-drama-v1";

export const YOUTUBE_VIEWPORT_PRESETS = {
  landscape: {
    id: "landscape",
    label: "YouTube 16:9",
    surface: "standard video",
    viewport: { width: 1280, height: 720 },
  },
  short: {
    id: "short",
    label: "YouTube Shorts 9:16",
    surface: "shorts",
    viewport: { width: 1080, height: 1920 },
  },
  square: {
    id: "square",
    label: "Square 1:1",
    surface: "cross-platform short clip",
    viewport: { width: 1080, height: 1080 },
  },
};

const TOPIC_TAG_META = {
  perfect: {
    weight: 100,
    zhAngle: "无伤压制局",
    enAngle: "no-damage pressure run",
    zhHook: "这局最离谱的点是赢家几乎没掉血，像是在给对手上课。",
    enHook: "The wild part: the winner barely took damage and turned the match into a lesson.",
    zhTitles: ["一滴血不掉也能赢？这局压迫感拉满", "无伤拿下！对面全程像在撞墙", "这把不是对战，是单方面教学"],
    enTitles: ["No-Damage Win? This Match Was Pure Pressure", "Zero Damage, Full Control", "This Was Not a Duel. It Was a Lesson."],
  },
  comeback: {
    weight: 96,
    zhAngle: "逆风反杀局",
    enAngle: "comeback finisher",
    zhHook: "前半段看着要崩，后半段突然反打，这种转折最适合做开头钩子。",
    enHook: "It looks doomed early, then flips suddenly. That reversal is the opening hook.",
    zhTitles: ["逆风还敢回头？最后直接反杀", "以为输了，结果它把剧本抢回来了", "这局翻盘点太适合剪成短片了"],
    enTitles: ["It Looked Over, Then the Comeback Hit", "The Match Flipped in One Turn", "A Comeback Built for Shorts"],
  },
  clutch: {
    weight: 92,
    zhAngle: "残血极限收割",
    enAngle: "low-HP clutch",
    zhHook: "血量见底还不退，最后一口气把比赛收走。",
    enHook: "Almost no HP left, no retreat, and somehow the final hit lands.",
    zhTitles: ["残血不退，最后一口气收掉比赛", "这血量还敢打？真让它打成了", "极限残血反杀，结算页都紧张"],
    enTitles: ["Low HP, No Retreat, Final Hit", "How Did It Win With That HP?", "A Clutch Finish Down to the Last Hit"],
  },
  draw: {
    weight: 86,
    zhAngle: "同步倒地神结局",
    enAngle: "double-KO ending",
    zhHook: "两边一起倒下，这种结尾天然有评论区话题。",
    enHook: "Both sides drop together. That ending is instant comment bait.",
    zhTitles: ["双双倒地！这结局到底算谁赢？", "同归于尽名场面，评论区来判", "最后一秒一起倒，这局有点会演"],
    enTitles: ["Double KO! Who Won This?", "Both Dropped at the Same Time", "The Ending Needs a Replay"],
  },
  signature: {
    weight: 78,
    zhAngle: "招牌技能名场面",
    enAngle: "signature move highlight",
    zhHook: "这局有一个清晰的封面镜头：关键伤害来源直接决定胜负。",
    enHook: "There is a clean thumbnail moment: one signature damage source decides the match.",
    zhTitles: ["招牌一击改写比赛，这下有封面了", "关键技能打穿了整局节奏", "这招一出，对局直接变味"],
    enTitles: ["One Signature Hit Changed Everything", "The Skill That Broke the Match", "This Move Became the Thumbnail"],
  },
  stomp: {
    weight: 70,
    zhAngle: "速通碾压局",
    enAngle: "speedrun stomp",
    zhHook: "节奏太快，适合剪成爽感很直接的短素材。",
    enHook: "The pace is fast enough to cut into a clean, satisfying short.",
    zhTitles: ["速通现场：这一把也太快了", "碾压局不用解释，伤害自己会说话", "开局还没看懂，比赛已经结束"],
    enTitles: ["Speedrun Stomp: This Ended Fast", "The Damage Explains It All", "The Match Ended Before It Started"],
  },
  endurance: {
    weight: 60,
    zhAngle: "长线拉扯局",
    enAngle: "long tug-of-war",
    zhHook: "这局不是一拳结束，而是一路拉扯到观众开始站队。",
    enHook: "This one is not a one-hit finish. It drags long enough for viewers to pick a side.",
    zhTitles: ["拉扯到最后，谁先失误谁出局", "这局越拖越像连续剧", "长线互耗，最后一波才见真章"],
    enTitles: ["A Long Tug-of-War Until One Mistake", "This Match Turned Into a Mini Drama", "The Final Exchange Decided Everything"],
  },
  close: {
    weight: 50,
    zhAngle: "险胜收尾局",
    enAngle: "close finish",
    zhHook: "分差不大，胜负只差一个回合，适合做悬念型剪辑。",
    enHook: "The margin is thin. One exchange could have changed the result.",
    zhTitles: ["险胜一回合！这把差点反过来", "只差一下，胜负就换边了", "最后一波太近了，得重看"],
    enTitles: ["One Exchange From a Different Result", "This Close Finish Needs a Replay", "Barely Won, Almost Lost"],
  },
  normal: {
    weight: 20,
    zhAngle: "备选对局素材",
    enAngle: "backup match clip",
    zhHook: "这条更适合作为补位素材，需要靠标题和节奏包装。",
    enHook: "This is a backup clip. It needs stronger pacing and title packaging.",
    zhTitles: ["这局节奏不错，可以做备选素材", "一场自动对战小剧场", "斗球球今日备选高光"],
    enTitles: ["A Solid Backup Match Clip", "Auto Battle Mini Drama", "Profession Ball Arena Highlight"],
  },
};

export function resolveYoutubeVideoFormat(format = "landscape") {
  const normalized = String(format || "landscape").trim().toLowerCase();
  if (normalized === "shorts" || normalized === "vertical" || normalized === "portrait") {
    return YOUTUBE_VIEWPORT_PRESETS.short;
  }
  if (normalized === "1:1") {
    return YOUTUBE_VIEWPORT_PRESETS.square;
  }
  return YOUTUBE_VIEWPORT_PRESETS[normalized] || YOUTUBE_VIEWPORT_PRESETS.landscape;
}

export function createCustomYoutubeVideoFormat(baseFormat, viewport) {
  const preset = resolveYoutubeVideoFormat(baseFormat?.id || baseFormat || "landscape");
  if (!viewport) {
    return preset;
  }

  return {
    ...preset,
    id: "custom",
    label: `Custom ${viewport.width}x${viewport.height}`,
    viewport,
  };
}

export function scoreClipCandidate(clip) {
  const tags = normalizeTags(clip?.recordingTags);
  const match = clip?.match || {};
  const primaryTag = tags[0] || "normal";
  const primaryMeta = TOPIC_TAG_META[primaryTag] || TOPIC_TAG_META.normal;
  const reasons = [];
  let score = 0;

  tags.forEach((tag, index) => {
    const meta = TOPIC_TAG_META[tag] || TOPIC_TAG_META.normal;
    const tagWeight = index === 0 ? meta.weight : Math.round(meta.weight * 0.38);
    score += tagWeight;
  });

  if (tags.length > 1) {
    const comboBonus = Math.min(24, (tags.length - 1) * 8);
    score += comboBonus;
    reasons.push(`多标签组合加分：${tags.join(" / ")}`);
  }

  if (primaryTag !== "normal") {
    reasons.push(`主话题：${primaryMeta.zhAngle}`);
  }

  const duration = toNumber(match.duration);
  if (duration >= 18 && duration <= 75) {
    score += 14;
    reasons.push(`时长 ${duration}s，适合短视频节奏`);
  } else if (duration > 0 && duration < 12) {
    score -= 18;
    reasons.push(`时长 ${duration}s 偏短，需要强标题包装`);
  } else if (duration > 95) {
    score -= 12;
    reasons.push(`时长 ${duration}s 偏长，建议只截高潮段`);
  }

  const ownDamage = toNumber(match.ownDamage);
  const opponentDamage = toNumber(match.opponentDamage);
  const totalDamage = ownDamage + opponentDamage;
  const damageGap = Math.abs(ownDamage - opponentDamage);
  if (totalDamage >= 55) {
    score += Math.min(18, Math.round(totalDamage / 8));
    reasons.push(`总伤害 ${totalDamage}，画面信息量够`);
  }
  if (totalDamage > 0 && damageGap <= 8) {
    score += 12;
    reasons.push(`伤害差 ${damageGap}，胜负悬念强`);
  }
  if (match.ownResult === "win" && ownDamage < opponentDamage) {
    score += 16;
    reasons.push("己方伤害落后仍获胜，适合逆风叙事");
  }

  const hitTotal = toNumber(match.ownHits) + toNumber(match.opponentHits);
  if (hitTotal >= 8) {
    score += Math.min(10, hitTotal);
    reasons.push(`有效交手 ${hitTotal} 次，剪辑点足`);
  }

  if (match.reason) {
    score += 6;
    reasons.push(`胜因可讲：${match.reason}`);
  }
  if (match.lesson) {
    score += 4;
  }

  return {
    score: Math.max(0, Math.round(score)),
    primaryTag,
    angle: primaryMeta.zhAngle,
    reasons: reasons.slice(0, 5),
  };
}

export function selectTopicClips(clips, count = DAILY_YOUTUBE_CLIP_COUNT) {
  const targetCount = Math.max(1, Number.parseInt(count, 10) || DAILY_YOUTUBE_CLIP_COUNT);
  const ranked = clips
    .map((clip, index) => ({
      ...clip,
      topic: clip.topic || scoreClipCandidate(clip),
      originalOrder: index,
    }))
    .sort((clipA, clipB) => clipB.topic.score - clipA.topic.score || clipA.originalOrder - clipB.originalOrder);
  const selected = [];
  const usedMatchups = new Set();
  const usedPrimaryTags = new Set();

  for (const clip of ranked) {
    if (selected.length >= targetCount) {
      break;
    }

    const matchupKey = getMatchupKey(clip);
    const primaryTag = clip.topic.primaryTag || "normal";
    const needsDiversity = selected.length < Math.min(targetCount, 3);
    if (needsDiversity && usedMatchups.has(matchupKey) && ranked.length - selected.length > targetCount - selected.length) {
      continue;
    }
    if (needsDiversity && usedPrimaryTags.has(primaryTag) && ranked.length - selected.length > targetCount - selected.length + 1) {
      continue;
    }

    selected.push(clip);
    usedMatchups.add(matchupKey);
    usedPrimaryTags.add(primaryTag);
  }

  for (const clip of ranked) {
    if (selected.length >= targetCount) {
      break;
    }
    if (!selected.some((selectedClip) => selectedClip.index === clip.index && selectedClip.fileName === clip.fileName)) {
      selected.push(clip);
    }
  }

  return selected.slice(0, targetCount).map((clip, index) => ({
    ...clip,
    selected: true,
    selectionRank: index + 1,
  }));
}

export function createOpsStoryPackage({ clip, topic, locale = "zh", videoFormat = YOUTUBE_VIEWPORT_PRESETS.landscape } = {}) {
  const activeTopic = topic || scoreClipCandidate(clip);
  const tag = activeTopic.primaryTag || "normal";
  const meta = TOPIC_TAG_META[tag] || TOPIC_TAG_META.normal;
  const zh = isChineseLocale(locale);
  const matchup = getClipMatchup(clip, zh);
  const winner = getWinnerName(clip, zh);
  const duration = toNumber(clip?.match?.duration);
  const surface = videoFormat?.label || YOUTUBE_VIEWPORT_PRESETS.landscape.label;
  const angle = zh ? meta.zhAngle : meta.enAngle;
  const hook = zh ? meta.zhHook : meta.enHook;
  const titleIdeas = (zh ? meta.zhTitles : meta.enTitles).map((title) => enrichTitle(title, matchup, winner, zh));
  const threeActStory = zh
    ? createChineseThreeActStory({ tag, matchup, winner, duration, clip })
    : createEnglishThreeActStory({ tag, matchup, winner, duration, clip });
  const retentionBeats = zh
    ? createChineseRetentionBeats({ tag, winner, duration })
    : createEnglishRetentionBeats({ tag, winner, duration });
  const openingCaption = zh ? createChineseOpeningCaption(tag, winner) : createEnglishOpeningCaption(tag, winner);
  const thumbnailPrompt = zh
    ? createChineseThumbnailPrompt({ angle, matchup, winner, tag })
    : createEnglishThumbnailPrompt({ angle, matchup, winner, tag });
  const editingPrompt = zh
    ? createChineseEditingPrompt({ clip, topic: activeTopic, surface, angle, matchup, winner, hook, threeActStory, retentionBeats })
    : createEnglishEditingPrompt({ clip, topic: activeTopic, surface, angle, matchup, winner, hook, threeActStory, retentionBeats });

  return {
    version: OPS_PROMPT_VERSION,
    language: zh ? "zh" : "en",
    surface,
    angle,
    hook,
    openingCaption,
    titleIdeas,
    threeActStory,
    retentionBeats,
    thumbnailPrompt,
    editingPrompt,
    promptTuningNotes: zh
      ? [
          "如果完播率低，优先把开头字幕改成问题句。",
          "如果评论少，标题里加入“算谁赢”或“你会剪哪一秒”。",
          "如果点击率低，封面只保留赢家、残血/技能、一个大字标签。",
        ]
      : [
          "If retention is weak, turn the opening caption into a question.",
          "If comments are low, add a judgment prompt to the title.",
          "If CTR is weak, simplify the thumbnail to winner, decisive moment, and one large label.",
        ],
  };
}

function normalizeTags(tags) {
  const normalized = Array.isArray(tags) ? tags.map((tag) => String(tag || "").trim()).filter(Boolean) : [];
  return normalized.length ? normalized : ["normal"];
}

function getMatchupKey(clip) {
  const match = clip?.match || {};
  return [match.ownRole || clip?.roleNames?.own || "A", match.opponentRole || clip?.roleNames?.opponent || "B"].join("::");
}

function getClipMatchup(clip, zh) {
  if (clip?.matchup) {
    return clip.matchup;
  }
  const ownRole = clip?.roleNames?.own || clip?.match?.ownRole || (zh ? "己方" : "A");
  const opponentRole = clip?.roleNames?.opponent || clip?.match?.opponentRole || (zh ? "对手" : "B");
  return `${ownRole} vs ${opponentRole}`;
}

function getWinnerName(clip, zh) {
  if (clip?.winnerRoleName) {
    return clip.winnerRoleName;
  }
  const winnerSide = clip?.match?.winnerSide;
  if (winnerSide === "A") {
    return clip?.roleNames?.own || (zh ? "己方" : "A");
  }
  if (winnerSide === "B") {
    return clip?.roleNames?.opponent || (zh ? "对手" : "B");
  }
  return zh ? "双方" : "Both sides";
}

function enrichTitle(title, matchup, winner, zh) {
  if (!title.includes("{")) {
    return title;
  }
  return title
    .replaceAll("{matchup}", matchup)
    .replaceAll("{winner}", winner)
    .replaceAll("{game}", zh ? "斗球球" : "Profession Ball Arena");
}

function createChineseThreeActStory({ tag, matchup, winner, duration, clip }) {
  const reason = clip?.match?.reason || "关键节奏在中后段突然成型";
  const lesson = clip?.match?.lesson || "败方没有及时把节奏打断";
  const setup = tag === "stomp"
    ? `${matchup} 开局直接进入高压节奏，观众不用等太久就能看到差距。`
    : `${matchup} 先铺出悬念，让观众猜谁会先犯错。`;
  const turn = tag === "comeback"
    ? `${winner} 在落后时抓到反打窗口，剧情从“要输”变成“要翻”。`
    : `${reason}，这里是主镜头和字幕需要同时强调的转折点。`;
  const payoff = tag === "draw"
    ? "结尾双双倒地，把问题抛给评论区：这局到底该算谁赢？"
    : `${winner} 收掉比赛后，用一句复盘字幕点出败因：${lesson}。`;

  return [
    { beat: "开场", copy: setup },
    { beat: "转折", copy: turn },
    { beat: "收尾", copy: `${payoff}${duration ? ` 全局 ${duration}s，建议剪出 20-35s 的高密度版本。` : ""}` },
  ];
}

function createEnglishThreeActStory({ tag, matchup, winner, duration, clip }) {
  const reason = clip?.match?.reason || "the key rhythm forms in the mid-game";
  const lesson = clip?.match?.lesson || "the losing side fails to interrupt the rhythm";
  const setup = tag === "stomp"
    ? `${matchup} starts under immediate pressure, so the gap becomes visible fast.`
    : `${matchup} opens with enough uncertainty for viewers to pick a side.`;
  const turn = tag === "comeback"
    ? `${winner} finds a reversal window and turns the story from doomed to dangerous.`
    : `${reason}. This is the moment that needs the clearest caption.`;
  const payoff = tag === "draw"
    ? "The double KO turns the ending into a comment prompt: who actually won?"
    : `${winner} closes it out, then the recap caption explains the mistake: ${lesson}.`;

  return [
    { beat: "Setup", copy: setup },
    { beat: "Turn", copy: turn },
    { beat: "Payoff", copy: `${payoff}${duration ? ` Full match is ${duration}s; cut a dense 20-35s version.` : ""}` },
  ];
}

function createChineseRetentionBeats({ tag, winner, duration }) {
  const beats = [
    "0-2s：用大字钩子先抛悬念，不要先放结算页。",
    "3-8s：保留第一次明显交手，让观众看懂双方强弱。",
    "中段：用 1-2 条弹幕解释转折，字幕要短。",
    "结尾：结算前 1 秒慢放或停顿，强化最后一击。",
  ];
  if (tag === "draw") {
    beats[3] = "结尾：双倒瞬间停 0.5 秒，字幕问“这局算谁赢？”";
  }
  if (tag === "clutch") {
    beats[0] = `0-2s：先放 ${winner} 残血画面，再倒回开战。`;
  }
  if (duration && duration > 70) {
    beats.push("长局只保留开头、转折、最后三段，避免流水账。");
  }
  return beats;
}

function createEnglishRetentionBeats({ tag, winner, duration }) {
  const beats = [
    "0-2s: lead with the hook caption, not the result screen.",
    "3-8s: keep the first readable exchange so viewers understand the matchup.",
    "Middle: use 1-2 short captions to explain the turn.",
    "End: slow or pause one beat before the result to emphasize the finisher.",
  ];
  if (tag === "draw") {
    beats[3] = "End: freeze the double KO for half a second and ask who won.";
  }
  if (tag === "clutch") {
    beats[0] = `0-2s: show ${winner} at low HP, then rewind to the start.`;
  }
  if (duration && duration > 70) {
    beats.push("For long matches, keep only open, turn, and final beat.");
  }
  return beats;
}

function createChineseOpeningCaption(tag, winner) {
  const captions = {
    perfect: "它真的一滴血都没掉？",
    comeback: "以为输了，结果反杀开始了",
    clutch: `${winner} 这血量还敢回头？`,
    draw: "最后一起倒，这局算谁赢？",
    signature: "这一招把比赛打穿了",
    stomp: "开局没多久，对面已经崩了",
    endurance: "这局拉扯到最后才见真章",
    close: "只差一下，胜负就换边了",
    normal: "这场自动对战有点东西",
  };
  return captions[tag] || captions.normal;
}

function createEnglishOpeningCaption(tag, winner) {
  const captions = {
    perfect: "Did it really take zero damage?",
    comeback: "It looked lost. Then the reversal started.",
    clutch: `${winner} had no HP and still turned back?`,
    draw: "Both dropped. Who won this?",
    signature: "One move broke the whole match.",
    stomp: "The match was over before it started.",
    endurance: "This one took the long route.",
    close: "One more hit changes everything.",
    normal: "This auto battle has a moment.",
  };
  return captions[tag] || captions.normal;
}

function createChineseThumbnailPrompt({ angle, matchup, winner, tag }) {
  return [
    "像素风游戏 YouTube 封面，明亮高对比，清晰可读。",
    `主题：${angle}。对局：${matchup}。赢家/焦点：${winner}。`,
    `画面：突出 ${winner} 的最后动作或残血状态，背景保留竞技场和弹幕速度线。`,
    `文字：只放 2-5 个中文字，围绕 ${tag === "draw" ? "算谁赢" : angle}，避免小字堆叠。`,
  ].join("\n");
}

function createEnglishThumbnailPrompt({ angle, matchup, winner, tag }) {
  return [
    "Pixel-game YouTube thumbnail, bright contrast, readable at small size.",
    `Theme: ${angle}. Matchup: ${matchup}. Focus: ${winner}.`,
    `Image: emphasize the final move or low-HP state, with arena and speed-line energy in the background.`,
    `Text: 2-4 short words around ${tag === "draw" ? "Who won?" : angle}; avoid small text clutter.`,
  ].join("\n");
}

function createChineseEditingPrompt({ clip, topic, surface, angle, matchup, winner, hook, threeActStory, retentionBeats }) {
  return [
    "你是游戏短视频剪辑导演，请把这条自动对战素材剪成可发 YouTube 的版本。",
    `素材文件：${clip?.fileName || clip?.videoPath || "当前素材"}`,
    `目标尺寸：${surface}`,
    `核心话题：${angle}`,
    `对局：${matchup}`,
    `赢家/焦点：${winner}`,
    `开头钩子：${hook}`,
    `话题评分：${topic.score}，入选理由：${topic.reasons.join("；") || "节奏完整"}`,
    "剧情三段：",
    ...threeActStory.map((beat) => `- ${beat.beat}：${beat.copy}`),
    "节奏要求：",
    ...retentionBeats.map((beat) => `- ${beat}`),
    "输出：标题 3 个、15 字内封面文案 3 个、剪辑时间轴、置顶评论问题。",
  ].join("\n");
}

function createEnglishEditingPrompt({ clip, topic, surface, angle, matchup, winner, hook, threeActStory, retentionBeats }) {
  return [
    "You are a gaming short-form video editor. Turn this auto-battle recording into a YouTube-ready clip.",
    `Source file: ${clip?.fileName || clip?.videoPath || "current clip"}`,
    `Target format: ${surface}`,
    `Core angle: ${angle}`,
    `Matchup: ${matchup}`,
    `Winner/focus: ${winner}`,
    `Opening hook: ${hook}`,
    `Topic score: ${topic.score}; reasons: ${topic.reasons.join("; ") || "clean pacing"}`,
    "Three-act story:",
    ...threeActStory.map((beat) => `- ${beat.beat}: ${beat.copy}`),
    "Retention beats:",
    ...retentionBeats.map((beat) => `- ${beat}`),
    "Output: 3 titles, 3 thumbnail texts under 5 words, edit timeline, and a pinned-comment question.",
  ].join("\n");
}

function isChineseLocale(locale) {
  return String(locale || "zh").toLowerCase().startsWith("zh");
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
