export const FALLBACK_LOCALE = "zh";
export const LOCALE_STORAGE_KEY = "bangbang.locale";
export const SUPPORTED_LOCALES = ["zh", "zh-TW", "ja", "en", "fr", "de", "ar"];

const RTL_LOCALES = new Set(["ar"]);

const translations = {
  zh: {
    language: { self: "中文" },
    app: { name: "职业球球斗技场" },
    side: { a: "球 A", b: "球 B" },
    common: {
      enabled: "已启用",
      unavailable: "未配置",
      iap: "IAP",
    },
    status: {
      playing: "自动开战中",
      paused: "已暂停",
    },
    hud: {
      shake: "Shake",
    },
    ads: {
      appOpenTitle: "职业球球补给站",
      appOpenBody: "游戏广告补给链路",
      battleTitle: "游戏补给广告位",
      cta: "继续体验",
      loading: "广告加载中",
      testLabel: "游戏广告调试，不产生扣费",
    },
    messages: {
      checkAgreement: "请先勾选同意协议",
      consentWithdrawn: "已撤回同意，请重新阅读并确认",
      purchaseRestored: "已恢复购买",
      purchaseUnavailable: "当前版本未配置应用内购买",
      quickStart: "快速开战：{professionA} 对阵 {professionB}",
      selectedProfession: "{side} 已选择 {profession}",
      selectedScene: "已切换到 {scene}",
      reportCardGenerating: "战报图生成中...",
      reportCardSaved: "战报图已生成，浏览器会保存 PNG",
      reportCardShared: "战报图已交给系统分享",
      reportCardCancelled: "已取消分享战报图",
      reportCardFailed: "战报图生成失败，请再试一次",
      deepLinkReady: "已载入分享战斗：{scene}",
      recommendedMatch: "推荐下一场：{matchup}",
    },
    consent: {
      subtitle: "上架合规确认",
      title: "开始之前",
      intro: "请先阅读并同意《隐私政策》和《用户协议》。同意后会在已配置平台启用基础游戏与性能统计，并可展示平台广告；Meta 小游戏使用 Meta Instant Games 广告能力，Android/iOS 使用 Google AdMob。当前不接入应用内购买。",
      privacy: "查看隐私政策",
      terms: "查看用户协议",
      agree: "我已阅读并同意上述协议",
      enter: "同意并进入",
      ageRating: "本游戏包含轻微卡通/幻想对战元素，不面向儿童定向投放。",
    },
    main: {
      subtitle: "主菜单",
      title: "准备开战",
      summary: "场景：{scene}  /  {sideA}：{professionA}  /  {sideB}：{professionB}",
      itemSummary: "模式：{scene}  /  无职业，随机拾取道具自动对战",
      quickStart: "快速开战",
      start: "开战设置",
      settings: "设置与协议",
      dailyProgressTitle: "今日目标",
      dailyWins: "胜利",
      dailyMatches: "开战",
      masteryTitle: "职业熟练度",
      masteryLine: "{role} Lv.{level}，已上场 {matches} 局",
      masteryEmpty: "快速开战一局后解锁",
      lastResultTitle: "上一局胜因",
      funStatsLine: "娱乐统计：最爱 {favorite} · 翻车 {flop} · 惨败 {shortestLoss} · 拉扯 {longestMatch} · 地图受害 {mapVictims}",
      statNone: "暂无",
      statSeconds: "{seconds}s",
      notice: "统计和广告仅在同意后启用；广告请求默认按非个性化和游戏场景处理。上架时请按轻微卡通/幻想对战填写内容评级问卷。",
    },
    setup: {
      subtitle: "开战设置",
      sceneLabel: "场景",
      professionHeader: "{side} 职业",
      itemModeHeader: "道具模式",
      itemModeDescription: "双方球球没有职业，初始血量均为 100。场中会随机出现道具，碰到后立即装备，耐久耗尽后继续等待下一件道具。",
      randomProfession: "随机职业",
      randomStart: "随机开始",
      saveBack: "保存并返回",
      start: "开始游戏",
    },
    pause: {
      title: "暂停",
      resume: "继续",
      restart: "重新开始",
      settings: "设置",
      exit: "退出",
      backToPause: "返回暂停菜单",
    },
    settings: {
      subtitle: "设置",
      languageTitle: "语言",
      feedbackTitle: "声音与体验",
      vibration: "震动",
      music: "背景音乐",
      soundEffects: "音效",
      reducedShake: "减少震屏",
      highlightText: "高光飘字",
      compactReport: "简洁战报",
      quickSettlement: "快速结算",
      on: "开",
      off: "关",
      legalTitle: "协议与合规",
      legalInfo: "协议版本：{version}。开发者：{developerName}。联系邮箱：{contactEmail}。",
      analytics: "数据统计",
      ads: "广告",
      privacy: "查看隐私政策",
      terms: "查看用户协议",
      restore: "恢复购买",
      withdraw: "撤回同意",
      statsInfo: "统计：{analytics}。广告：{ads}。{iap}：未配置真实商品。广告按平台分流，Meta 包使用 Meta 广告能力，移动端使用 AdMob，调试 Web 使用本地测试广告。",
      sdkNotice: "你可以关闭数据统计，或撤回同意后重新确认协议。",
      backMain: "返回主菜单",
    },
    legal: {
      back: "返回",
      pageUp: "上翻",
      pageDown: "下翻",
      scrollHint: "可使用鼠标滚轮或触控板滚动查看全文。",
      privacy: {
        title: "隐私政策",
        sections: [
          {
            title: "一、我们如何处理信息",
            body: "同意后，本游戏会在已配置平台通过 Firebase Analytics 上报基础游戏与性能事件，例如初始化成功、开始游戏、游戏结束、帧率快照和设置选择。不收集账号、定位、通讯录、相机、麦克风等敏感权限数据。",
          },
          {
            title: "二、本地保存",
            body: "为了让你下次打开游戏时保留选择，本游戏会使用设备本地存储保存隐私政策版本、用户协议版本、球 A/球 B 的职业选择和设置项。",
          },
          {
            title: "三、统计、广告与支付",
            body: "数据统计和广告展示可在设置中关闭，撤回同意会同时关闭统计与广告。当前版本按平台使用广告能力：Meta 小游戏环境通过 Meta Instant Games 广告接口展示插屏或激励视频，Android/iOS 通过 Google AdMob 展示应用场景广告。对应广告平台可能为了展示、衡量和防止广告欺诈处理广告相关信息。当前版本不接入应用内购买，不会发起支付。",
          },
          {
            title: "四、未成年人和内容分级",
            body: "本游戏不是专门面向儿童的产品。由于存在血量、武器职业和自动对战，请在 Apple App Store、Google Play 和其他渠道按轻微卡通/幻想暴力如实填写内容评级问卷。",
          },
          {
            title: "五、联系我们",
            body: "开发者：{developerName}。如需咨询隐私相关事项，请通过 {contactEmail} 联系我们。提审前请将开发者名称和邮箱替换为真实信息。",
          },
        ],
      },
      terms: {
        title: "用户协议",
        sections: [
          {
            title: "一、服务说明",
            body: "欢迎使用《{appName}》。本游戏提供基于 Canvas 的 2D 自动对战体验，玩家可以选择双方职业并观看自动战斗结果。",
          },
          {
            title: "二、用户行为",
            body: "你应遵守适用法律法规和应用商店规则，不得利用本游戏进行破坏、逆向攻击、作弊传播或其他影响服务稳定性的行为。",
          },
          {
            title: "三、虚拟内容和付费预留",
            body: "当前版本没有真实付费商品。代码中的 IAP 能力仅为后续扩展预留，不会在当前版本中产生扣费。若未来上线付费内容，将以商店展示和实际购买流程为准。",
          },
          {
            title: "四、免责声明",
            body: "游戏仍处于早期版本，职业数值、视觉表现、平台能力和内容可能会持续调整。我们会尽力保持体验稳定，但不承诺所有设备上完全一致。",
          },
          {
            title: "五、协议更新",
            body: "当协议或隐私政策发生重要变化时，游戏会重新展示确认页面。继续使用前，你需要阅读并同意更新后的条款。",
          },
        ],
      },
    },
    result: {
      draw: "平局",
      winner: "{side}（{profession}）获胜",
      winnerNoProfession: "{side} 获胜",
      analysisTitle: "战报小剧场",
      reasonDamage: [
        "{side} 像把油门焊死了，{damage} 点伤害一路轰到终点。",
        "{side} 开局像试探，打着打着突然掀桌，{damage} 点伤害直接清场。",
        "{side} 这局主打一个火力全开：血条还没反应过来，比赛已经变天了。",
      ],
      reasonAttack: [
        "{side} 像踩着鼓点进攻，{count} 次命中一下一下把场面敲碎。",
        "{side} 今天手感烫得离谱，{count} 次命中像连招没断过。",
        "{side} 不等奇迹降临，自己把 {count} 次命中砸成了结局。",
      ],
      reasonSpecial: [
        "{side} 的 {source} 一出手，像片场突然换了主角。",
        "{side} 靠 {source} 把局势从悬疑片打成爽片。",
        "{side} 真正的转折点不是碰撞，是 {source} 落下来的那一秒。",
      ],
      reasonSource: [
        "{side} 把 {source} 玩成了招牌节目，对面全程被迫买票观看。",
        "{side} 抓着 {source} 不放，硬是把小优势写成大结局。",
        "{side} 靠 {source} 一路加戏，最后把胜利灯牌自己点亮。",
      ],
      reasonEndurance: [
        "{side} 前半段像在攒镜头，后半段突然开始收割剧情。",
        "{side} 把这局拖成耐力大片，最后对面先掉线的是气势。",
        "{side} 打到后面越打越稳，像在残局里铺好了红毯。",
      ],
      reasonClose: [
        "{side} 赢得像电影最后三秒拆弹，手一抖就要改结局。",
        "{side} 这把胜利薄得像纸，但最后一下就是写上去了。",
        "{side} 没有大优势，只有一个更会抢镜的收尾。",
      ],
      reasonDraw: [
        "两边像约好了一起退场，烟尘散开，只剩一个平局。",
        "这局最后不是胜利，是双主角同时倒在聚光灯下。",
        "谁都不肯让，最后把比赛打成了同步谢幕。",
      ],
      stats: "后台补充：伤害 {sideADamage}/{sideBDamage} · 命中 {sideAAttacks}/{sideBAttacks}",
      sourceAttack: "普通攻击",
      sourceRoleAttack: "{role}的招牌进攻",
      sourceHeroAttack: "英雄普攻",
      sourceSkill: "技能",
      sourceItem: "道具",
      sourceExplosion: "爆炸",
      sourceFrost: "冰轮",
      sourceCollision: "碰撞吸血",
      sourcePoison: "毒刺",
      sourceStatic: "静电",
      sourceWeb: "蛛网",
      sourceFlame: "火焰路径",
      again: "再来一局",
      shareCard: "生成战报图",
      nextChallenge: "挑战克星：{role}",
      nextRevenge: "复仇阵容：{role}",
      nextDrawBreaker: "破平局：{role}",
      nextItemChaos: "道具乱斗加码",
      setup: "开战设置",
      backMain: "返回主菜单",
    },
    shareTargets: {
      title: "选择分享渠道",
      facebook: "Facebook",
      tiktok: "TikTok",
      system: "系统分享",
      cancel: "取消",
    },
    reportCard: {
      eyebrow: "像素战报 · 适合转发",
      reasonLabel: "胜因",
      worstLabel: "最惨瞬间",
      titleLabel: "今日称号",
      reasonFallback: "这局没有留下太多证词，但胜负已经在像素尘埃里写完。",
      worstDraw: "终场前两颗球一起倒下，裁判连胜者栏都没法写。",
      worstSource: "{loser} 被 {source} 现场点名，硬吃 {damage} 点，血条当场安静。",
      worstCountered: "{loser} 明明出手 {count} 次，最后却像把高光镜头递给了对面。",
      worstDamage: "{loser} 这一局吃下 {damage} 点伤害，像被整场比赛追着结账。",
      worstFallback: "{loser} 刚想改写剧本，{winner} 已经把结局盖章了。",
      todayTitleDraw: "同步谢幕导演",
      todayTitleDailyCloser: "今日收工王",
      todayTitleMastery: "{role} Lv.{level} 片场王牌",
      todayTitleCloser: "结尾抢镜人",
      todayTitleDramaWitness: "全天候剧情见证官",
      todayTitleWitness: "前排吃瓜解说员",
      meta: "{scene} · {date}",
      footer: "长按保存，把这场小剧场发出去",
      shareTitle: "职业球球斗技场战报",
      shareText: "刚在《职业球球斗技场》打完一局：{winner}\n像素战报已生成，点开官网链接可下载 App 或打开这局回放：\n{link}",
    },
    scenes: {
      classic: {
        name: "经典斗技场",
        description: "自动对战，小地图正面对撞",
      },
      super: {
        name: "超能斗技场",
        description: "超能职业专属对战",
      },
      items: {
        name: "道具模式",
        description: "随机拾取武器",
      },
      heroes: {
        name: "英雄模式",
        description: "英雄生命与魔法技能对战",
      },
    },
    items: {
      category: { building: "建筑", weapon: "道具" },
      sword: { name: "刀" },
      spear: { name: "长枪" },
      bow: { name: "弓箭" },
      pistol: { name: "手枪" },
      rocket: { name: "火箭筒" },
      flamethrower: { name: "喷火器" },
      torch: { name: "火把" },
      staff: { name: "法杖" },
      prismTower: { name: "光棱塔" },
      bunker: { name: "地堡" },
      cannon: { name: "巨炮" },
      teslaCoil: { name: "磁暴线圈" },
      gasStation: { name: "加油站" },
      spells: { fire: "火球", ice: "冰锥", lightning: "闪电" },
    },
    professions: {
      bat: { name: "蝙蝠球", skill: "尖牙吸血", item: "暗翼尖牙" },
      venom: { name: "毒液球", skill: "毒刺孢子", item: "剧毒尖刺" },
      spider: { name: "蜘蛛球", skill: "蛛丝结网", item: "蛛丝节点" },
      lava: { name: "熔岩球", skill: "熔火路径", item: "熔岩核心" },
      reaper: { name: "死神球", skill: "镰刃收割", item: "终末大镰刀" },
      frost: { name: "冰冻球", skill: "冰轮冻结", item: "环绕冰轮" },
      yoyo: { name: "悠悠球", skill: "像素回旋", item: "像素悠悠球" },
      static: { name: "静电球", skill: "静电充能", item: "静电核心" },
      summoner: { name: "召唤师", skill: "熊灵契约", item: "召熊图腾" },
      spear: { name: "长矛球", skill: "正面突刺", item: "破风长矛" },
      blade: { name: "大刀球", skill: "重斩", item: "厚刃大刀" },
      shield: { name: "盾牌球", skill: "盾墙反震", item: "守卫方盾" },
      assassin: { name: "刺客球", skill: "双刀连斩", item: "影牙双刀" },
      archer: { name: "弓箭球", skill: "穿云箭", item: "藤弦短弓" },
      chain: { name: "链球", skill: "链锤重摆", item: "铁星链锤" },
      mage: { name: "法师球", skill: "三相法术", item: "三相法杖" },
    },
    heroes: {
      demon: { name: "恶魔人", weapon: "影牙双刀", skills: { dodge: "闪避", manaBurn: "魔法燃烧" } },
      dwarfKing: { name: "矮人王", weapon: "雷铸战锤", skills: { thunderHammer: "雷神之锤", groundSlam: "锤地板" } },
      minotaur: { name: "牛头人", weapon: "战争图腾", skills: { warStomp: "战争践踏", rebirth: "复生" } },
      elfKing: { name: "精灵王", weapon: "森林长弓", skills: { fireArrow: "火箭", forestBlessing: "森林祝福" } },
      wukong: { name: "孙悟空", weapon: "金箍棒", skills: { tripleStaff: "三头六臂", giantStaff: "法天象地" } },
      cryptLord: { name: "洞穴领主", weapon: "巨虫利爪", skills: { impale: "地刺", summonBeetle: "召唤小甲虫" } },
      zeus: { name: "宙斯", weapon: "金色长枪", skills: { lightningStrike: "落雷", divineDescent: "天神下凡" } },
    },
  },
  en: {
    language: { self: "English" },
    app: { name: "Profession Ball Arena" },
    side: { a: "Ball A", b: "Ball B" },
    common: { enabled: "Enabled", unavailable: "Not configured", iap: "IAP" },
    status: { playing: "Auto battle", paused: "Paused" },
    hud: { shake: "Shake" },
    ads: {
      appOpenTitle: "Arena Supply",
      appOpenBody: "Game ad supply flow",
      battleTitle: "Game Supply Ad Slot",
      cta: "Continue",
      loading: "Loading ad",
      testLabel: "Game ad debug, no charge",
    },
    messages: {
      checkAgreement: "Please agree to the terms first",
      consentWithdrawn: "Consent withdrawn. Please review and confirm again",
      purchaseRestored: "Purchases restored",
      purchaseUnavailable: "In-app purchases are not configured in this build",
      quickStart: "Quick battle: {professionA} vs {professionB}",
      selectedProfession: "{side} selected {profession}",
      selectedScene: "Switched to {scene}",
      reportCardGenerating: "Creating battle report card...",
      reportCardSaved: "Battle report card created. The browser will save a PNG",
      reportCardShared: "Battle report card sent to system sharing",
      reportCardCancelled: "Battle report card sharing cancelled",
      reportCardFailed: "Could not create the battle report card. Try again",
      deepLinkReady: "Loaded shared battle: {scene}",
      recommendedMatch: "Recommended next: {matchup}",
    },
    consent: {
      subtitle: "Release compliance",
      title: "Before You Start",
      intro: "Please read and accept the Privacy Policy and User Agreement. After consent, configured platforms may report basic gameplay/performance events and show platform ads. Meta Instant Games uses Meta ads, while Android/iOS use Google AdMob. In-app purchases remain unconfigured.",
      privacy: "Privacy Policy",
      terms: "User Agreement",
      agree: "I have read and agree",
      enter: "Agree and Enter",
      ageRating: "This game contains mild cartoon/fantasy combat and is not directed at children.",
    },
    main: {
      subtitle: "Main Menu",
      title: "Ready to Battle",
      summary: "Scene: {scene}  /  {sideA}: {professionA}  /  {sideB}: {professionB}",
      itemSummary: "Mode: {scene}  /  no professions, random item pickups",
      quickStart: "Quick Battle",
      start: "Battle Setup",
      settings: "Settings & Terms",
      dailyProgressTitle: "Today's Goals",
      dailyWins: "Wins",
      dailyMatches: "Battles",
      masteryTitle: "Mastery",
      masteryLine: "{role} Lv.{level}, {matches} battles played",
      masteryEmpty: "Unlocks after one quick battle",
      lastResultTitle: "Last win reason",
      funStatsLine: "Fun stats: favorite {favorite} · most cursed {flop} · shortest loss {shortestLoss} · longest tug {longestMatch} · map hits {mapVictims}",
      statNone: "None",
      statSeconds: "{seconds}s",
      notice: "Analytics and ads only run after consent. Ad requests default to non-personalized game-context placements. For store submission, answer content-rating questions as mild cartoon/fantasy combat.",
    },
    setup: {
      subtitle: "Battle Setup",
      sceneLabel: "Scene",
      professionHeader: "{side} Profession",
      itemModeHeader: "Item Mode",
      itemModeDescription: "Both balls have no profession and start at 100 HP. Items spawn randomly in the arena; touching one equips it immediately until its durability runs out.",
      randomProfession: "Random Profession",
      randomStart: "Random Start",
      saveBack: "Save & Back",
      start: "Start Game",
    },
    pause: {
      title: "Paused",
      resume: "Resume",
      restart: "Restart",
      settings: "Settings",
      exit: "Exit",
      backToPause: "Back to Pause",
    },
    settings: {
      subtitle: "Settings",
      languageTitle: "Language",
      feedbackTitle: "Sound & Feel",
      vibration: "Vibration",
      music: "Music",
      soundEffects: "Sound FX",
      reducedShake: "Less Shake",
      highlightText: "Hit Text",
      compactReport: "Compact Report",
      quickSettlement: "Fast Result",
      on: "On",
      off: "Off",
      legalTitle: "Terms & Compliance",
      legalInfo: "Agreement version: {version}. Developer: {developerName}. Contact: {contactEmail}.",
      analytics: "Analytics",
      ads: "Ads",
      privacy: "Privacy Policy",
      terms: "User Agreement",
      restore: "Restore",
      withdraw: "Withdraw Consent",
      statsInfo: "Analytics: {analytics}. Ads: {ads}. {iap}: no real products. Ads are routed by platform: Meta ads for the Meta bundle, AdMob for mobile, local test ads for debug web.",
      sdkNotice: "You can turn analytics off here or withdraw consent to review the terms again.",
      backMain: "Back to Menu",
    },
    legal: {
      back: "Back",
      pageUp: "Page Up",
      pageDown: "Page Down",
      scrollHint: "Use the mouse wheel or trackpad to read the full text.",
      privacy: {
        title: "Privacy Policy",
        sections: [
          {
            title: "1. How We Handle Information",
            body: "After consent, this game uses Firebase Analytics on configured platforms to report basic gameplay and performance events such as initialization success, game start, game end, frame-rate snapshots, and setting selection. It does not collect account, location, contacts, camera, microphone, or other sensitive permission data.",
          },
          {
            title: "2. Local Storage",
            body: "To keep your choices for the next launch, the game uses local device storage for policy versions, agreement versions, Ball A/B profession choices, and settings.",
          },
          {
            title: "3. Analytics, Ads, and Payments",
            body: "Analytics and ad display can be turned off in Settings, and withdrawing consent disables both. This build routes ads by platform: Meta Instant Games uses Meta ad APIs for interstitial or rewarded video placements, while Android/iOS use Google AdMob for app-context ads. The relevant ad platform may process ad-related information to serve ads, measure performance, and prevent fraud. In-app purchases remain unconfigured and no payment flow is started.",
          },
          {
            title: "4. Minors and Ratings",
            body: "This game is not specifically directed at children. Because it includes health values, weapon professions, and automatic combat, please answer Apple App Store, Google Play, and other store rating questionnaires truthfully as mild cartoon/fantasy violence.",
          },
          {
            title: "5. Contact",
            body: "Developer: {developerName}. For privacy questions, contact {contactEmail}. Replace the developer name and email with real information before submission.",
          },
        ],
      },
      terms: {
        title: "User Agreement",
        sections: [
          {
            title: "1. Service Description",
            body: "Welcome to {appName}. This game provides a Canvas-based 2D auto-battle experience where players choose professions for both sides and watch the result.",
          },
          {
            title: "2. User Conduct",
            body: "You should follow applicable laws, regulations, and store rules. Do not use the game for disruption, reverse attacks, cheat distribution, or other behavior that affects service stability.",
          },
          {
            title: "3. Virtual Content and Payment Reservation",
            body: "This build has no real paid products. IAP code is reserved for future expansion and will not charge users in this version. If paid content is released later, store listings and actual purchase flows will control.",
          },
          {
            title: "4. Disclaimer",
            body: "The game is still in an early version. Profession values, visuals, platform capabilities, and content may continue to change. We try to keep the experience stable, but cannot guarantee identical behavior on every device.",
          },
          {
            title: "5. Updates",
            body: "When the agreement or privacy policy changes materially, the game will show the confirmation screen again. You need to read and accept the updated terms before continuing.",
          },
        ],
      },
    },
    result: {
      draw: "Draw",
      winner: "{side} ({profession}) wins",
      winnerNoProfession: "{side} wins",
      analysisTitle: "Match Drama",
      reasonDamage: [
        "{side} welded the throttle down and blasted to the finish with {damage} damage.",
        "{side} opened like a probe, then flipped the table with {damage} damage.",
        "{side} went full fireworks. The health bar blinked, and the match had already changed seasons.",
      ],
      reasonAttack: [
        "{side} attacked like a drumline: {count} hits, and the arena lost its balance.",
        "{side} had ridiculous timing today. {count} hits felt like one long combo.",
        "{side} did not wait for a miracle; {count} hits wrote the ending by hand.",
      ],
      reasonSpecial: [
        "{side}'s {source} landed, and suddenly the match had a new main character.",
        "{side} used {source} to turn a tense scene into a victory montage.",
        "{side}'s real plot twist was {source} arriving right on cue.",
      ],
      reasonSource: [
        "{side} turned {source} into the headline act, and the other side had front-row seats.",
        "{side} kept pulling on {source} until a small lead became the whole ending.",
        "{side} gave {source} all the screen time, then let victory take the bow.",
      ],
      reasonEndurance: [
        "{side} looked quiet early, then saved every dramatic shot for the late game.",
        "{side} turned this into an endurance epic, and the other side ran out of swagger first.",
        "{side} got steadier the longer it went, like the endgame had been rehearsed.",
      ],
      reasonClose: [
        "{side} won like a last-second wire cut. One bounce later, different movie.",
        "{side} had a paper-thin win, but the final stroke signed it in ink.",
        "{side} had no huge lead, just the more dramatic final touch.",
      ],
      reasonDraw: [
        "Both sides exited at the same time. Smoke cleared, win missing.",
        "No winner, just two leads collapsing under the same spotlight.",
        "Nobody backed off, so the match ended in a synchronized curtain call.",
      ],
      stats: "Score whisper: damage {sideADamage}/{sideBDamage} · hits {sideAAttacks}/{sideBAttacks}",
      sourceAttack: "basic attacks",
      sourceRoleAttack: "{role}'s signature pressure",
      sourceHeroAttack: "hero attacks",
      sourceSkill: "skills",
      sourceItem: "items",
      sourceExplosion: "explosions",
      sourceFrost: "frost orbit",
      sourceCollision: "collision drain",
      sourcePoison: "poison spikes",
      sourceStatic: "static shock",
      sourceWeb: "web lines",
      sourceFlame: "flame trails",
      again: "Play Again",
      shareCard: "Share Card",
      nextChallenge: "Counter Test: {role}",
      nextRevenge: "Revenge Pick: {role}",
      nextDrawBreaker: "Draw Breaker: {role}",
      nextItemChaos: "Item Chaos+",
      setup: "Battle Setup",
      backMain: "Back to Menu",
    },
    shareTargets: {
      title: "Share To",
      facebook: "Facebook",
      tiktok: "TikTok",
      system: "System Share",
      cancel: "Cancel",
    },
    reportCard: {
      eyebrow: "Pixel Report · Share Ready",
      reasonLabel: "Why It Won",
      worstLabel: "Worst Moment",
      titleLabel: "Today's Title",
      reasonFallback: "The replay left only dust, but the result was already carved into the pixels.",
      worstDraw: "Both balls dropped at the final beat, leaving the winner box completely unemployed.",
      worstSource: "{loser} got called out by {source}, ate {damage} damage, and the health bar went quiet.",
      worstCountered: "{loser} threw {count} attacks, then somehow handed the highlight reel away.",
      worstDamage: "{loser} took {damage} damage and spent the whole match getting chased by the invoice.",
      worstFallback: "{loser} reached for a rewrite, but {winner} had already stamped the ending.",
      todayTitleDraw: "Synchronized Curtain Director",
      todayTitleDailyCloser: "Daily Closer",
      todayTitleMastery: "{role} Lv.{level} Headliner",
      todayTitleCloser: "Final-Shot Thief",
      todayTitleDramaWitness: "All-Day Drama Witness",
      todayTitleWitness: "Front-Row Commentator",
      meta: "{scene} · {date}",
      footer: "Long press to save, then send this tiny drama out",
      shareTitle: "Profession Ball Arena Report",
      shareText: "Just finished a match in Profession Ball Arena: {winner}\nPixel report is ready. Open the official link to download the app or watch this replay:\n{link}",
    },
    scenes: {
      classic: { name: "Classic Arena", description: "Auto battle in a compact arena" },
      super: { name: "Super Arena", description: "Super professions only" },
      items: { name: "Item Mode", description: "Random weapon pickups" },
      heroes: { name: "Hero Mode", description: "Hero duels with health, mana, and skills" },
    },
    items: {
      category: { building: "Building", weapon: "Item" },
      sword: { name: "Sword" },
      spear: { name: "Spear" },
      bow: { name: "Bow" },
      pistol: { name: "Pistol" },
      rocket: { name: "Rocket" },
      flamethrower: { name: "Flamethrower" },
      torch: { name: "Torch" },
      staff: { name: "Staff" },
      prismTower: { name: "Prism Tower" },
      bunker: { name: "Bunker" },
      cannon: { name: "Cannon" },
      teslaCoil: { name: "Tesla Coil" },
      gasStation: { name: "Gas Station" },
      spells: { fire: "Fireball", ice: "Ice Shard", lightning: "Lightning" },
    },
    professions: {
      bat: { name: "Bat Ball", skill: "Fang Drain", item: "Darkwing Fangs" },
      venom: { name: "Venom Ball", skill: "Toxic Spikes", item: "Venom Spike" },
      spider: { name: "Spider Ball", skill: "Web Nodes", item: "Web Strand" },
      lava: { name: "Lava Ball", skill: "Flame Trail", item: "Lava Core" },
      reaper: { name: "Reaper Ball", skill: "Scythe Edge", item: "Great Scythe" },
      frost: { name: "Frost Ball", skill: "Ice Orbit", item: "Frost Wheels" },
      yoyo: { name: "Yo-Yo Ball", skill: "Pixel Loop", item: "Pixel Yo-Yo" },
      static: { name: "Static Ball", skill: "Static Charge", item: "Static Core" },
      summoner: { name: "Summoner Ball", skill: "Bear Pact", item: "Bear Totem" },
      spear: { name: "Spear Ball", skill: "Frontal Thrust", item: "Wind Spear" },
      blade: { name: "Blade Ball", skill: "Heavy Slash", item: "Broad Blade" },
      shield: { name: "Shield Ball", skill: "Shield Wall", item: "Guard Shield" },
      assassin: { name: "Assassin Ball", skill: "Twin Slash", item: "Shadow Fangs" },
      archer: { name: "Archer Ball", skill: "Sky Piercer", item: "Vine Bow" },
      chain: { name: "Flail Ball", skill: "Heavy Swing", item: "Iron Star Flail" },
      mage: { name: "Mage Ball", skill: "Tri-Spell", item: "Triune Staff" },
    },
    heroes: {
      demon: { name: "Demon", weapon: "Shadow Twin Blades", skills: { dodge: "Dodge", manaBurn: "Mana Burn" } },
      dwarfKing: { name: "Dwarf King", weapon: "Storm Hammer", skills: { thunderHammer: "Thunder Hammer", groundSlam: "Ground Slam" } },
      minotaur: { name: "Minotaur", weapon: "War Totem", skills: { warStomp: "War Stomp", rebirth: "Rebirth" } },
      elfKing: { name: "Elf King", weapon: "Forest Longbow", skills: { fireArrow: "Fire Arrow", forestBlessing: "Forest Blessing" } },
      wukong: { name: "Sun Wukong", weapon: "Golden Cudgel", skills: { tripleStaff: "Three Heads Six Arms", giantStaff: "Cosmic Form" } },
      cryptLord: { name: "Crypt Lord", weapon: "Claws", skills: { impale: "Impale", summonBeetle: "Summon Beetle" } },
      zeus: { name: "Zeus", weapon: "Golden Spear", skills: { lightningStrike: "Lightning Strike", divineDescent: "Divine Descent" } },
    },
  },
  fr: {
    language: { self: "Français" },
    app: { name: "Arène des Balles" },
    side: { a: "Balle A", b: "Balle B" },
    common: { enabled: "Activé", unavailable: "Non configuré", iap: "IAP" },
    status: { playing: "Combat auto", paused: "Pause" },
    hud: { shake: "Secouer" },
    messages: {
      checkAgreement: "Veuillez accepter les conditions",
      consentWithdrawn: "Consentement retiré. Veuillez relire et confirmer",
      purchaseRestored: "Achats restaurés",
      purchaseUnavailable: "Les achats intégrés ne sont pas configurés",
      selectedProfession: "{side} a choisi {profession}",
      selectedScene: "Scène changée : {scene}",
    },
    consent: {
      subtitle: "Conformité de publication",
      title: "Avant de commencer",
      intro: "Veuillez lire et accepter la Politique de confidentialité et le Contrat utilisateur. Après accord, les plateformes configurées peuvent envoyer des événements de jeu/performance de base et afficher des publicités de plateforme. Meta Instant Games utilise les publicités Meta, Android/iOS utilisent Google AdMob. Les achats intégrés restent non configurés.",
      privacy: "Confidentialité",
      terms: "Contrat utilisateur",
      agree: "J'ai lu et j'accepte",
      enter: "Accepter et entrer",
      ageRating: "Ce jeu contient de légers combats cartoon/fantasy et ne cible pas les enfants.",
    },
    main: {
      subtitle: "Menu principal",
      title: "Prêt au combat",
      summary: "Scène : {scene}  /  {sideA} : {professionA}  /  {sideB} : {professionB}",
      itemSummary: "Mode : {scene}  /  sans profession, objets aléatoires",
      start: "Jouer",
      settings: "Réglages & accords",
      notice: "Les statistiques et publicités ne fonctionnent qu'après accord. Les demandes de publicité utilisent par défaut des emplacements de contexte jeu non personnalisés. Pour les stores, indiquez un combat cartoon/fantasy léger.",
    },
    setup: { subtitle: "Préparation", sceneLabel: "Scène", professionHeader: "Profession {side}", itemModeHeader: "Mode objets", itemModeDescription: "Les deux balles n'ont pas de profession et commencent avec 100 PV. Des objets apparaissent au hasard dans l'arène ; toucher un objet l'équipe jusqu'à épuisement de sa durabilité.", randomProfession: "Profession aléatoire", randomStart: "Départ aléatoire", saveBack: "Sauver & retour", start: "Jouer" },
    pause: { title: "Pause", resume: "Reprendre", restart: "Redémarrer", settings: "Réglages", exit: "Quitter", backToPause: "Retour à la pause" },
    settings: {
      subtitle: "Réglages",
      languageTitle: "Langue",
      feedbackTitle: "Son & vibrations",
      vibration: "Vibrations",
      music: "Musique",
      soundEffects: "Effets sonores",
      on: "Oui",
      off: "Non",
      legalTitle: "Accords & conformité",
      legalInfo: "Version : {version}. Développeur : {developerName}. Contact : {contactEmail}.",
      analytics: "Statistiques",
      ads: "Publicité",
      privacy: "Confidentialité",
      terms: "Contrat utilisateur",
      restore: "Restaurer",
      withdraw: "Retirer accord",
      statsInfo: "Statistiques : {analytics}. Publicité : {ads}. {iap} : aucun produit réel. Les publicités privilégient le contexte jeu et les builds de debug utilisent des blocs de test.",
      sdkNotice: "Vous pouvez désactiver les statistiques ici ou retirer l'accord pour relire les conditions.",
      backMain: "Retour au menu",
    },
    legal: {
      back: "Retour",
      pageUp: "Haut",
      pageDown: "Bas",
      scrollHint: "Utilisez la molette ou le pavé tactile pour lire le texte complet.",
      privacy: {
        title: "Politique de confidentialité",
        sections: [
          { title: "1. Traitement des informations", body: "Après accord, le jeu utilise Firebase Analytics sur les plateformes configurées pour envoyer des événements de jeu et de performance de base comme l'initialisation réussie, le début et la fin de partie, des instantanés de fréquence d'images et les choix de réglages. Il ne collecte pas de compte, position, contacts, caméra, micro ni données issues de permissions sensibles." },
          { title: "2. Stockage local", body: "Pour garder vos choix au prochain lancement, le jeu utilise le stockage local de l'appareil pour les versions des politiques, les choix de profession des balles A/B et les réglages." },
          { title: "3. Statistiques, publicités et paiements", body: "Les statistiques et l'affichage publicitaire peuvent être désactivés dans les réglages, et le retrait de l'accord désactive les deux. Cette version route les publicités selon la plateforme : Meta Instant Games utilise les API publicitaires Meta pour les interstitiels ou vidéos récompensées, tandis qu'Android/iOS utilisent Google AdMob. La plateforme publicitaire concernée peut traiter des informations publicitaires pour afficher, mesurer et protéger les publicités contre la fraude. Les achats intégrés restent non configurés et aucun paiement n'est lancé." },
          { title: "4. Mineurs et classification", body: "Ce jeu ne vise pas spécialement les enfants. Comme il contient des points de vie, des professions armées et du combat automatique, remplissez honnêtement les questionnaires des stores comme violence cartoon/fantasy légère." },
          { title: "5. Contact", body: "Développeur : {developerName}. Pour toute question de confidentialité, contactez {contactEmail}. Remplacez le nom du développeur et l'adresse par les informations réelles avant soumission." },
        ],
      },
      terms: {
        title: "Contrat utilisateur",
        sections: [
          { title: "1. Description du service", body: "Bienvenue dans {appName}. Ce jeu propose un combat automatique 2D basé sur Canvas : les joueurs choisissent les professions des deux côtés et observent le résultat." },
          { title: "2. Conduite de l'utilisateur", body: "Vous devez respecter les lois applicables et les règles des boutiques. N'utilisez pas le jeu pour perturber le service, mener des attaques inverses, diffuser des triches ou nuire à la stabilité." },
          { title: "3. Contenu virtuel et paiements", body: "Cette version ne contient aucun produit payant réel. Le code IAP est réservé à une extension future et ne facturera pas les utilisateurs dans cette version." },
          { title: "4. Clause de non-responsabilité", body: "Le jeu est encore en version précoce. Les valeurs, visuels, capacités de plateforme et contenus peuvent évoluer. Nous cherchons la stabilité, sans garantir un comportement identique sur tous les appareils." },
          { title: "5. Mises à jour", body: "En cas de changement important du contrat ou de la politique de confidentialité, le jeu affichera de nouveau l'écran de confirmation. Vous devrez accepter les nouveaux termes avant de continuer." },
        ],
      },
    },
    result: { draw: "Égalité", winner: "{side} ({profession}) gagne", winnerNoProfession: "{side} gagne", again: "Rejouer", shareCard: "Carte de combat", setup: "Préparation", backMain: "Retour au menu" },
    scenes: {
      classic: { name: "Arène classique", description: "Combat auto dans une petite arène" },
      super: { name: "Arène super", description: "Professions super uniquement" },
      items: { name: "Mode objets", description: "Armes aléatoires" },
      heroes: { name: "Mode héros", description: "Duel avec vie, mana et compétences" },
    },
    items: {
      category: { building: "Bâtiment", weapon: "Objet" },
      sword: { name: "Épée" },
      spear: { name: "Lance" },
      bow: { name: "Arc" },
      pistol: { name: "Pistolet" },
      rocket: { name: "Lance-roquettes" },
      flamethrower: { name: "Lance-flammes" },
      torch: { name: "Torche" },
      staff: { name: "Bâton" },
      prismTower: { name: "Tour à prisme" },
      bunker: { name: "Bunker" },
      cannon: { name: "Grand canon" },
      teslaCoil: { name: "Bobine Tesla" },
      gasStation: { name: "Station-service" },
      spells: { fire: "Boule de feu", ice: "Éclat de glace", lightning: "Éclair" },
    },
    professions: {
      bat: { name: "Balle chauve-souris", skill: "Drain de crocs", item: "Crocs sombres" },
      venom: { name: "Balle venin", skill: "Pics toxiques", item: "Pic venimeux" },
      spider: { name: "Balle araignée", skill: "Noeuds de toile", item: "Fil de toile" },
      lava: { name: "Balle lave", skill: "Trace de feu", item: "Coeur de lave" },
      reaper: { name: "Balle faucheuse", skill: "Tranchant de faux", item: "Grande faux" },
      frost: { name: "Balle gel", skill: "Orbite glacée", item: "Roues de glace" },
      yoyo: { name: "Balle yo-yo", skill: "Boucle pixel", item: "Yo-yo pixel" },
      static: { name: "Balle statique", skill: "Charge statique", item: "Coeur statique" },
      summoner: { name: "Balle invocateur", skill: "Pacte ours", item: "Totem ours" },
      spear: { name: "Balle lance", skill: "Estoc frontal", item: "Lance du vent" },
      blade: { name: "Balle lame", skill: "Coup lourd", item: "Grande lame" },
      shield: { name: "Balle bouclier", skill: "Mur bouclier", item: "Bouclier garde" },
      assassin: { name: "Balle assassin", skill: "Double coupe", item: "Crocs d'ombre" },
      archer: { name: "Balle archer", skill: "Flèche céleste", item: "Arc de vigne" },
      chain: { name: "Balle fléau", skill: "Grand balancier", item: "Fléau étoilé" },
      mage: { name: "Balle mage", skill: "Triple sort", item: "Bâton triade" },
    },
    heroes: {
      demon: { name: "Démon", weapon: "Lames jumelles d'ombre", skills: { dodge: "Esquive", manaBurn: "Brûlure de mana" } },
      dwarfKing: { name: "Roi nain", weapon: "Marteau d'orage", skills: { thunderHammer: "Marteau de tonnerre", groundSlam: "Frappe au sol" } },
      minotaur: { name: "Minotaure", weapon: "Totem de guerre", skills: { warStomp: "Piétinement", rebirth: "Renaissance" } },
      elfKing: { name: "Roi elfe", weapon: "Grand arc forestier", skills: { fireArrow: "Flèche de feu", forestBlessing: "Bénédiction de la forêt" } },
      wukong: { name: "Sun Wukong", weapon: "Bâton d'or", skills: { tripleStaff: "Trois têtes six bras", giantStaff: "Forme cosmique" } },
      cryptLord: { name: "Seigneur des cryptes", weapon: "Griffes", skills: { impale: "Empalement", summonBeetle: "Invoquer scarabée" } },
      zeus: { name: "Zeus", weapon: "Lance dorée", skills: { lightningStrike: "Foudre", divineDescent: "Descente divine" } },
    },
  },
  de: {
    language: { self: "Deutsch" },
    app: { name: "Berufsball-Arena" },
    side: { a: "Ball A", b: "Ball B" },
    common: { enabled: "Aktiv", unavailable: "Nicht konfiguriert", iap: "IAP" },
    status: { playing: "Auto-Kampf", paused: "Pausiert" },
    hud: { shake: "Rütteln" },
    messages: {
      checkAgreement: "Bitte stimme zuerst den Bedingungen zu",
      consentWithdrawn: "Zustimmung widerrufen. Bitte erneut lesen und bestätigen",
      purchaseRestored: "Käufe wiederhergestellt",
      purchaseUnavailable: "In-App-Käufe sind in diesem Build nicht konfiguriert",
      selectedProfession: "{side} wählt {profession}",
      selectedScene: "Szene gewechselt: {scene}",
    },
    consent: {
      subtitle: "Release-Konformität",
      title: "Vor dem Start",
      intro: "Bitte lies und akzeptiere Datenschutzrichtlinie und Nutzungsvereinbarung. Nach Zustimmung können konfigurierte Plattformen grundlegende Spiel-/Performance-Ereignisse melden und Plattformanzeigen anzeigen. Meta Instant Games nutzt Meta-Anzeigen, Android/iOS nutzen Google AdMob. In-App-Käufe bleiben nicht konfiguriert.",
      privacy: "Datenschutz",
      terms: "Nutzungsvereinbarung",
      agree: "Ich habe gelesen und stimme zu",
      enter: "Zustimmen",
      ageRating: "Dieses Spiel enthält leichte Cartoon-/Fantasy-Kämpfe und richtet sich nicht gezielt an Kinder.",
    },
    main: {
      subtitle: "Hauptmenü",
      title: "Bereit zum Kampf",
      summary: "Szene: {scene}  /  {sideA}: {professionA}  /  {sideB}: {professionB}",
      itemSummary: "Modus: {scene}  /  keine Berufe, zufällige Gegenstände",
      start: "Spiel starten",
      settings: "Einstellungen & Recht",
      notice: "Analyse und Werbung laufen nur nach Zustimmung. Anzeigenanfragen verwenden standardmäßig nicht personalisierte Platzierungen mit Spielkontext. Für Stores bitte als leichte Cartoon-/Fantasy-Kämpfe einstufen.",
    },
    setup: { subtitle: "Kampf-Setup", sceneLabel: "Szene", professionHeader: "{side} Beruf", itemModeHeader: "Gegenstandsmodus", itemModeDescription: "Beide Bälle haben keinen Beruf und starten mit 100 LP. Gegenstände erscheinen zufällig in der Arena; Berührung rüstet sie sofort aus, bis die Haltbarkeit verbraucht ist.", randomProfession: "Zufallsberuf", randomStart: "Zufallsstart", saveBack: "Speichern", start: "Starten" },
    pause: { title: "Pause", resume: "Fortsetzen", restart: "Neustart", settings: "Einstellungen", exit: "Beenden", backToPause: "Zurück zur Pause" },
    settings: {
      subtitle: "Einstellungen",
      languageTitle: "Sprache",
      feedbackTitle: "Ton & Haptik",
      vibration: "Vibration",
      music: "Musik",
      soundEffects: "Soundeffekte",
      on: "Ein",
      off: "Aus",
      legalTitle: "Recht & Konformität",
      legalInfo: "Version: {version}. Entwickler: {developerName}. Kontakt: {contactEmail}.",
      analytics: "Analyse",
      ads: "Werbung",
      privacy: "Datenschutz",
      terms: "Nutzungsvereinbarung",
      restore: "Wiederherstellen",
      withdraw: "Zustimmung widerrufen",
      statsInfo: "Analyse: {analytics}. Werbung: {ads}. {iap}: keine echten Produkte. Anzeigen bevorzugen Spielkontext, Debug-Builds nutzen Test-Anzeigenblöcke.",
      sdkNotice: "Du kannst Analyse hier deaktivieren oder die Zustimmung widerrufen, um die Bedingungen erneut zu prüfen.",
      backMain: "Zurück zum Menü",
    },
    legal: {
      back: "Zurück",
      pageUp: "Hoch",
      pageDown: "Runter",
      scrollHint: "Mit Mausrad oder Trackpad den vollständigen Text lesen.",
      privacy: {
        title: "Datenschutzrichtlinie",
        sections: [
          { title: "1. Umgang mit Informationen", body: "Nach Zustimmung nutzt das Spiel Firebase Analytics auf konfigurierten Plattformen, um grundlegende Spiel- und Performance-Ereignisse wie erfolgreiche Initialisierung, Spielstart, Spielende, Bildraten-Snapshots und Einstellungswahl zu melden. Es sammelt keine Konten, Standorte, Kontakte, Kamera-, Mikrofon- oder andere sensible Berechtigungsdaten." },
          { title: "2. Lokaler Speicher", body: "Damit deine Auswahl beim nächsten Start erhalten bleibt, nutzt das Spiel lokalen Gerätespeicher für Richtlinienversionen, Berufsauswahl von Ball A/B und Einstellungen." },
          { title: "3. Analyse, Werbung und Zahlung", body: "Analyse und Werbeanzeigen können in den Einstellungen deaktiviert werden; das Widerrufen der Zustimmung deaktiviert beides. Dieser Build leitet Anzeigen je nach Plattform weiter: Meta Instant Games nutzt Meta-Anzeigen-APIs für Interstitials oder Rewarded Videos, Android/iOS nutzen Google AdMob. Die jeweilige Anzeigenplattform kann werbebezogene Informationen verarbeiten, um Anzeigen auszuliefern, zu messen und Betrug zu verhindern. In-App-Käufe bleiben nicht konfiguriert und es wird keine Zahlung gestartet." },
          { title: "4. Minderjährige und Altersfreigabe", body: "Dieses Spiel richtet sich nicht speziell an Kinder. Wegen Lebenspunkten, Waffenberufen und automatischem Kampf sollten Store-Fragebögen wahrheitsgemäß als leichte Cartoon-/Fantasy-Gewalt beantwortet werden." },
          { title: "5. Kontakt", body: "Entwickler: {developerName}. Bei Datenschutzfragen kontaktiere {contactEmail}. Entwicklername und E-Mail vor Einreichung durch echte Angaben ersetzen." },
        ],
      },
      terms: {
        title: "Nutzungsvereinbarung",
        sections: [
          { title: "1. Dienstbeschreibung", body: "Willkommen bei {appName}. Dieses Spiel bietet ein Canvas-basiertes 2D-Auto-Kampferlebnis, bei dem Spieler für beide Seiten Berufe wählen und das Ergebnis ansehen." },
          { title: "2. Nutzerverhalten", body: "Du musst geltende Gesetze und Store-Regeln einhalten. Nutze das Spiel nicht für Störungen, Reverse-Angriffe, Cheat-Verbreitung oder Verhalten, das die Stabilität beeinträchtigt." },
          { title: "3. Virtuelle Inhalte und Zahlungen", body: "Dieser Build enthält keine echten kostenpflichtigen Produkte. IAP-Code ist nur für spätere Erweiterungen reserviert und berechnet in dieser Version nichts." },
          { title: "4. Haftungsausschluss", body: "Das Spiel ist noch früh in der Entwicklung. Werte, Darstellung, Plattformfunktionen und Inhalte können sich ändern. Wir bemühen uns um Stabilität, garantieren aber keine identische Funktion auf allen Geräten." },
          { title: "5. Aktualisierungen", body: "Bei wichtigen Änderungen an Vereinbarung oder Datenschutzrichtlinie zeigt das Spiel erneut den Bestätigungsbildschirm. Vor der weiteren Nutzung musst du die aktualisierten Bedingungen akzeptieren." },
        ],
      },
    },
    result: { draw: "Unentschieden", winner: "{side} ({profession}) gewinnt", winnerNoProfession: "{side} gewinnt", again: "Noch einmal", shareCard: "Kampfkarte", setup: "Kampf-Setup", backMain: "Zurück zum Menü" },
    scenes: {
      classic: { name: "Klassische Arena", description: "Auto-Kampf in kompakter Arena" },
      super: { name: "Super-Arena", description: "Nur Super-Berufe" },
      items: { name: "Gegenstandsmodus", description: "Zufällige Waffen" },
      heroes: { name: "Heldenmodus", description: "Heldenduelle mit Leben, Mana und Fähigkeiten" },
    },
    items: {
      category: { building: "Gebäude", weapon: "Gegenstand" },
      sword: { name: "Schwert" },
      spear: { name: "Speer" },
      bow: { name: "Bogen" },
      pistol: { name: "Pistole" },
      rocket: { name: "Raketenwerfer" },
      flamethrower: { name: "Flammenwerfer" },
      torch: { name: "Fackel" },
      staff: { name: "Stab" },
      prismTower: { name: "Prismenturm" },
      bunker: { name: "Bunker" },
      cannon: { name: "Riesenkanone" },
      teslaCoil: { name: "Teslaspule" },
      gasStation: { name: "Tankstelle" },
      spells: { fire: "Feuerball", ice: "Eissplitter", lightning: "Blitz" },
    },
    professions: {
      bat: { name: "Fledermausball", skill: "Zahndrain", item: "Dunkelflügel-Zähne" },
      venom: { name: "Giftball", skill: "Giftstacheln", item: "Giftstachel" },
      spider: { name: "Spinnenball", skill: "Netzknoten", item: "Netzfaden" },
      lava: { name: "Lavaball", skill: "Flammenspur", item: "Lavakern" },
      reaper: { name: "Sensenball", skill: "Sensenrand", item: "Große Sense" },
      frost: { name: "Frostball", skill: "Eisorbit", item: "Eisräder" },
      yoyo: { name: "Jo-Jo-Ball", skill: "Pixelwirbel", item: "Pixel-Jo-Jo" },
      static: { name: "Statikball", skill: "Statische Ladung", item: "Statikkern" },
      summoner: { name: "Beschwörerball", skill: "Bärenpakt", item: "Bärentotem" },
      spear: { name: "Speerball", skill: "Frontstoß", item: "Windspeer" },
      blade: { name: "Klingenball", skill: "Schwerer Hieb", item: "Breitklinge" },
      shield: { name: "Schildball", skill: "Schildwall", item: "Wächterschild" },
      assassin: { name: "Assassinenball", skill: "Doppelschnitt", item: "Schattenzähne" },
      archer: { name: "Bogenschützenball", skill: "Himmelspfeil", item: "Rankenbogen" },
      chain: { name: "Flegelball", skill: "Schwerer Schwung", item: "Eisenstern-Flegel" },
      mage: { name: "Magierball", skill: "Dreifachzauber", item: "Dreistab" },
    },
    heroes: {
      demon: { name: "Dämon", weapon: "Schatten-Doppelklingen", skills: { dodge: "Ausweichen", manaBurn: "Manabrand" } },
      dwarfKing: { name: "Zwergenkönig", weapon: "Sturmhammer", skills: { thunderHammer: "Donnerhammer", groundSlam: "Bodenschlag" } },
      minotaur: { name: "Minotaurus", weapon: "Kriegstotem", skills: { warStomp: "Kriegsstampfer", rebirth: "Wiedergeburt" } },
      elfKing: { name: "Elfenkönig", weapon: "Wald-Langbogen", skills: { fireArrow: "Feuerpfeil", forestBlessing: "Waldsegen" } },
      wukong: { name: "Sun Wukong", weapon: "Goldener Stab", skills: { tripleStaff: "Drei Köpfe sechs Arme", giantStaff: "Kosmische Gestalt" } },
      cryptLord: { name: "Gruftenlord", weapon: "Klauen", skills: { impale: "Aufspießen", summonBeetle: "Käfer beschwören" } },
      zeus: { name: "Zeus", weapon: "Goldener Speer", skills: { lightningStrike: "Blitzschlag", divineDescent: "Göttlicher Abstieg" } },
    },
  },
  ar: {
    language: { self: "العربية" },
    app: { name: "ساحة كرات المهن" },
    side: { a: "الكرة A", b: "الكرة B" },
    common: { enabled: "مفعل", unavailable: "غير مهيأ", iap: "الشراء داخل التطبيق" },
    status: { playing: "قتال تلقائي", paused: "متوقف مؤقتا" },
    hud: { shake: "هز" },
    messages: {
      checkAgreement: "يرجى الموافقة على الشروط أولا",
      consentWithdrawn: "تم سحب الموافقة. يرجى القراءة والتأكيد مرة أخرى",
      purchaseRestored: "تمت استعادة المشتريات",
      purchaseUnavailable: "المشتريات داخل التطبيق غير مهيأة في هذا الإصدار",
      selectedProfession: "{side} اختارت {profession}",
      selectedScene: "تم التبديل إلى {scene}",
    },
    consent: {
      subtitle: "توافق النشر",
      title: "قبل البدء",
      intro: "يرجى قراءة سياسة الخصوصية واتفاقية المستخدم والموافقة عليهما. بعد الموافقة، قد ترسل المنصات المهيأة أحداث اللعبة والأداء الأساسية وقد تعرض إعلانات المنصة. تستخدم Meta Instant Games إعلانات Meta، بينما يستخدم Android/iOS إعلانات Google AdMob. يبقى الشراء داخل التطبيق غير مهيأ.",
      privacy: "سياسة الخصوصية",
      terms: "اتفاقية المستخدم",
      agree: "قرأت وأوافق",
      enter: "موافقة ودخول",
      ageRating: "تتضمن اللعبة قتالا كرتونيا/خياليا خفيفا ولا تستهدف الأطفال.",
    },
    main: {
      subtitle: "القائمة الرئيسية",
      title: "جاهز للقتال",
      summary: "المشهد: {scene}  /  {sideA}: {professionA}  /  {sideB}: {professionB}",
      itemSummary: "النمط: {scene}  /  بلا مهن، التقاط عشوائي للأدوات",
      start: "ابدأ اللعبة",
      settings: "الإعدادات والاتفاقيات",
      notice: "تعمل الإحصاءات والإعلانات بعد الموافقة فقط. تستخدم طلبات الإعلان افتراضيا مواضع غير مخصصة بسياق ألعاب. عند النشر، صنفه كقتال كرتوني/خيالي خفيف.",
    },
    setup: { subtitle: "إعداد القتال", sceneLabel: "المشهد", professionHeader: "مهنة {side}", itemModeHeader: "نمط الأدوات", itemModeDescription: "لا تملك الكرتان أي مهنة وتبدآن بصحة 100. تظهر الأدوات عشوائيا في الساحة، ولمسها يجهزها فورا حتى تنفد المتانة.", randomProfession: "مهنة عشوائية", randomStart: "بدء عشوائي", saveBack: "حفظ وعودة", start: "ابدأ" },
    pause: { title: "إيقاف مؤقت", resume: "متابعة", restart: "إعادة البدء", settings: "الإعدادات", exit: "خروج", backToPause: "العودة للإيقاف" },
    settings: {
      subtitle: "الإعدادات",
      languageTitle: "اللغة",
      feedbackTitle: "الصوت والاهتزاز",
      vibration: "الاهتزاز",
      music: "الموسيقى",
      soundEffects: "المؤثرات",
      on: "تشغيل",
      off: "إيقاف",
      legalTitle: "الاتفاقيات والتوافق",
      legalInfo: "إصدار الاتفاقية: {version}. المطوّر: {developerName}. التواصل: {contactEmail}.",
      analytics: "الإحصاءات",
      ads: "الإعلانات",
      privacy: "سياسة الخصوصية",
      terms: "اتفاقية المستخدم",
      restore: "استعادة",
      withdraw: "سحب الموافقة",
      statsInfo: "الإحصاءات: {analytics}. الإعلانات: {ads}. {iap}: لا منتجات حقيقية. تفضل الإعلانات سياق الألعاب وتستخدم إصدارات التصحيح وحدات إعلان اختبارية.",
      sdkNotice: "يمكنك إيقاف الإحصاءات هنا أو سحب الموافقة لمراجعة الشروط من جديد.",
      backMain: "العودة للقائمة",
    },
    legal: {
      back: "رجوع",
      pageUp: "أعلى",
      pageDown: "أسفل",
      scrollHint: "استخدم عجلة الفأرة أو لوحة اللمس لقراءة النص الكامل.",
      privacy: {
        title: "سياسة الخصوصية",
        sections: [
          { title: "1. كيف نتعامل مع المعلومات", body: "بعد الموافقة، تستخدم اللعبة Firebase Analytics على المنصات المهيأة لإرسال أحداث اللعبة والأداء الأساسية مثل نجاح التهيئة وبدء اللعبة ونهايتها ولقطات معدل الإطارات واختيار الإعدادات. لا تجمع حسابات أو موقعا أو جهات اتصال أو كاميرا أو ميكروفونا أو بيانات أذونات حساسة أخرى." },
          { title: "2. التخزين المحلي", body: "للاحتفاظ باختياراتك عند التشغيل التالي، تستخدم اللعبة تخزين الجهاز المحلي لحفظ إصدارات السياسات واختيارات مهنة الكرة A/B والإعدادات." },
          { title: "3. الإحصاءات والإعلانات والدفع", body: "يمكن إيقاف الإحصاءات وعرض الإعلانات من الإعدادات، كما أن سحب الموافقة يوقفهما معا. يوجه هذا الإصدار الإعلانات حسب المنصة: تستخدم Meta Instant Games واجهات إعلانات Meta للإعلانات البينية أو إعلانات الفيديو المكافأة، بينما يستخدم Android/iOS Google AdMob. قد تعالج منصة الإعلانات ذات الصلة معلومات مرتبطة بالإعلانات لعرضها وقياسها ومنع الاحتيال. يبقى الشراء داخل التطبيق غير مهيأ ولا تبدأ أي عملية دفع." },
          { title: "4. القاصرون والتصنيف العمري", body: "هذه اللعبة ليست موجهة خصيصا للأطفال. وبسبب نقاط الصحة ومهن الأسلحة والقتال التلقائي، يرجى تعبئة استبيانات المتاجر بصدق على أنها عنف كرتوني/خيالي خفيف." },
          { title: "5. التواصل", body: "المطوّر: {developerName}. لأسئلة الخصوصية تواصل عبر {contactEmail}. استبدل اسم المطوّر والبريد بمعلومات حقيقية قبل الإرسال." },
        ],
      },
      terms: {
        title: "اتفاقية المستخدم",
        sections: [
          { title: "1. وصف الخدمة", body: "مرحبا بك في {appName}. تقدم هذه اللعبة تجربة قتال تلقائي ثنائية الأبعاد مبنية على Canvas، حيث يختار اللاعبون مهن الطرفين ويشاهدون النتيجة." },
          { title: "2. سلوك المستخدم", body: "يجب الالتزام بالقوانين والقواعد المعمول بها وقواعد المتاجر. لا تستخدم اللعبة للتخريب أو الهجمات العكسية أو نشر الغش أو أي سلوك يؤثر في استقرار الخدمة." },
          { title: "3. المحتوى الافتراضي والدفع", body: "لا يحتوي هذا الإصدار على منتجات مدفوعة حقيقية. كود الشراء داخل التطبيق محجوز للتوسع المستقبلي ولن يفرض أي رسوم في هذا الإصدار." },
          { title: "4. إخلاء المسؤولية", body: "ما زالت اللعبة في إصدار مبكر. قد تتغير قيم المهن والمظهر وقدرات المنصات والمحتوى. سنحاول الحفاظ على الاستقرار، لكن لا نضمن تطابق السلوك على كل الأجهزة." },
          { title: "5. التحديثات", body: "عند حدوث تغييرات مهمة في الاتفاقية أو سياسة الخصوصية، ستعرض اللعبة شاشة التأكيد مرة أخرى. يجب قراءة الشروط المحدثة والموافقة عليها قبل المتابعة." },
        ],
      },
    },
    result: { draw: "تعادل", winner: "{side} ({profession}) فازت", winnerNoProfession: "{side} فازت", again: "جولة أخرى", shareCard: "بطاقة القتال", setup: "إعداد القتال", backMain: "العودة للقائمة" },
    scenes: {
      classic: { name: "الساحة الكلاسيكية", description: "قتال تلقائي في ساحة صغيرة" },
      super: { name: "الساحة الخارقة", description: "مهن خارقة فقط" },
      items: { name: "نمط الأدوات", description: "أسلحة عشوائية" },
      heroes: { name: "نمط الأبطال", description: "مبارزات أبطال بالصحة والمانا والمهارات" },
    },
    items: {
      category: { building: "مبنى", weapon: "أداة" },
      sword: { name: "سيف" },
      spear: { name: "رمح" },
      bow: { name: "قوس" },
      pistol: { name: "مسدس" },
      rocket: { name: "قاذف صواريخ" },
      flamethrower: { name: "قاذف لهب" },
      torch: { name: "شعلة" },
      staff: { name: "عصا" },
      prismTower: { name: "برج المنشور" },
      bunker: { name: "ملجأ" },
      cannon: { name: "مدفع ضخم" },
      teslaCoil: { name: "ملف تسلا" },
      gasStation: { name: "محطة وقود" },
      spells: { fire: "كرة نار", ice: "شظية جليد", lightning: "برق" },
    },
    professions: {
      bat: { name: "كرة الخفاش", skill: "امتصاص الأنياب", item: "أنياب الجناح الداكن" },
      venom: { name: "كرة السم", skill: "أشواك سامة", item: "شوكة سامة" },
      spider: { name: "كرة العنكبوت", skill: "عقد الشبكة", item: "خيط الشبكة" },
      lava: { name: "كرة الحمم", skill: "مسار النار", item: "نواة الحمم" },
      reaper: { name: "كرة الحاصد", skill: "حافة المنجل", item: "منجل كبير" },
      frost: { name: "كرة الجليد", skill: "مدار الجليد", item: "عجلات الجليد" },
      yoyo: { name: "كرة اليويو", skill: "دوران بكسلي", item: "يويو بكسلي" },
      static: { name: "كرة الكهرباء الساكنة", skill: "شحنة ساكنة", item: "نواة ساكنة" },
      summoner: { name: "كرة المستدعي", skill: "عهد الدب", item: "طوطم الدب" },
      spear: { name: "كرة الرمح", skill: "طعنة أمامية", item: "رمح الريح" },
      blade: { name: "كرة النصل", skill: "ضربة ثقيلة", item: "نصل عريض" },
      shield: { name: "كرة الدرع", skill: "جدار الدرع", item: "درع الحارس" },
      assassin: { name: "كرة القاتل", skill: "قطع مزدوج", item: "أنياب الظل" },
      archer: { name: "كرة الرامي", skill: "سهم السماء", item: "قوس الكرمة" },
      chain: { name: "كرة المذبة", skill: "تأرجح ثقيل", item: "مذبة النجمة الحديدية" },
      mage: { name: "كرة الساحر", skill: "تعويذة ثلاثية", item: "عصا ثلاثية" },
    },
    heroes: {
      demon: { name: "الرجل الشيطاني", weapon: "نصلان ظليان", skills: { dodge: "مراوغة", manaBurn: "حرق المانا" } },
      dwarfKing: { name: "ملك الأقزام", weapon: "مطرقة العاصفة", skills: { thunderHammer: "مطرقة الرعد", groundSlam: "ضربة الأرض" } },
      minotaur: { name: "المينوتور", weapon: "طوطم الحرب", skills: { warStomp: "دوس الحرب", rebirth: "الانبعاث" } },
      elfKing: { name: "ملك الجان", weapon: "قوس الغابة", skills: { fireArrow: "سهم ناري", forestBlessing: "بركة الغابة" } },
      wukong: { name: "سون ووكونغ", weapon: "العصا الذهبية", skills: { tripleStaff: "ثلاثة رؤوس وستة أذرع", giantStaff: "هيئة كونية" } },
      cryptLord: { name: "سيد السراديب", weapon: "مخالب", skills: { impale: "طعن أرضي", summonBeetle: "استدعاء خنفساء" } },
      zeus: { name: "زيوس", weapon: "رمح ذهبي", skills: { lightningStrike: "صاعقة", divineDescent: "هبوط إلهي" } },
    },
  },
};

const TRADITIONAL_CHINESE_REPLACEMENTS = [
  ["职业", "職業"],
  ["斗技场", "鬥技場"],
  ["隐私", "隱私"],
  ["用户", "用戶"],
  ["协议", "協議"],
  ["设置", "設定"],
  ["暂停", "暫停"],
  ["继续", "繼續"],
  ["声音", "聲音"],
  ["触感", "觸感"],
  ["音乐", "音樂"],
  ["震动", "震動"],
  ["购买", "購買"],
  ["应用内", "應用程式內"],
  ["运营", "運營"],
  ["联系", "聯繫"],
  ["菜单", "菜單"],
  ["后续", "後續"],
  ["获取", "獲取"],
  ["本地", "本機"],
  ["统计", "統計"],
  ["广告", "廣告"],
  ["支付", "支付"],
  ["对战", "對戰"],
  ["战斗", "戰鬥"],
  ["轻微", "輕微"],
  ["评级", "分級"],
  ["道具", "道具"],
  ["场景", "場景"],
  ["英雄", "英雄"],
  ["模式", "模式"],
  ["职业", "職業"],
  ["图腾", "圖騰"],
  ["链锤", "鏈錘"],
  ["蝙蝠", "蝙蝠"],
  ["熔岩", "熔岩"],
  ["隐", "隱"],
  ["语", "語"],
  ["启", "啟"],
  ["状", "狀"],
  ["态", "態"],
  ["声", "聲"],
  ["乐", "樂"],
  ["动", "動"],
  ["战", "戰"],
  ["请", "請"],
  ["选", "選"],
  ["择", "擇"],
  ["协", "協"],
  ["议", "議"],
  ["阅", "閱"],
  ["读", "讀"],
  ["确", "確"],
  ["认", "認"],
  ["复", "復"],
  ["购", "購"],
  ["买", "買"],
  ["应", "應"],
  ["内", "內"],
  ["当", "當"],
  ["后", "後"],
  ["场", "場"],
  ["规", "規"],
  ["开", "開"],
  ["关", "關"],
  ["户", "戶"],
  ["仅", "僅"],
  ["储", "儲"],
  ["设", "設"],
  ["备", "備"],
  ["职", "職"],
  ["业", "業"],
  ["项", "項"],
  ["这", "這"],
  ["数", "數"],
  ["据", "據"],
  ["传", "傳"],
  ["预", "預"],
  ["发", "發"],
  ["会", "會"],
  ["并", "並"],
  ["获", "獲"],
  ["运", "運"],
  ["营", "營"],
  ["单", "單"],
  ["级", "級"],
  ["问", "問"],
  ["题", "題"],
  ["费", "費"],
  ["虚", "虛"],
  ["产", "產"],
  ["扩", "擴"],
  ["续", "續"],
  ["为", "為"],
  ["与", "與"],
  ["时", "時"],
  ["览", "覽"],
  ["联", "聯"],
  ["络", "絡"],
  ["换", "換"],
  ["将", "將"],
  ["实", "實"],
  ["际", "際"],
  ["写", "寫"],
  ["风", "風"],
  ["冻", "凍"],
  ["轮", "輪"],
  ["头", "頭"],
  ["臂", "臂"],
  ["恶", "惡"],
  ["矮", "矮"],
  ["王", "王"],
  ["锤", "錘"],
  ["击", "擊"],
  ["复", "復"],
  ["苏", "蘇"],
  ["弓", "弓"],
  ["箭", "箭"],
  ["闪", "閃"],
  ["电", "電"],
  ["枪", "槍"],
  ["剑", "劍"],
  ["绳", "繩"],
  ["网", "網"],
  ["结", "結"],
  ["节", "節"],
  ["点", "點"],
  ["锋", "鋒"],
  ["刃", "刃"],
  ["终", "終"],
  ["镰", "鐮"],
  ["刀", "刀"],
  ["挡", "擋"],
  ["墙", "牆"],
  ["卫", "衛"],
  ["双", "雙"],
  ["铁", "鐵"],
  ["星", "星"],
  ["师", "師"],
  ["术", "術"],
  ["领", "領"],
  ["唤", "喚"],
  ["虫", "蟲"],
  ["岁", "歲"],
  ["稳", "穩"],
  ["变", "變"],
  ["节", "節"],
  ["触", "觸"],
  ["导", "導"],
  ["规", "規"],
  ["则", "則"],
  ["码", "碼"],
  ["扣", "扣"],
  ["阅", "閱"],
  ["览", "覽"],
  ["项", "項"],
  ["过", "過"],
  ["还", "還"],
  ["面", "面"],
  ["向", "向"],
  ["儿", "兒"],
  ["童", "童"],
  ["专", "專"],
  ["门", "門"],
  ["产", "產"],
  ["品", "品"],
  ["填", "填"],
  ["问", "問"],
  ["卷", "卷"],
  ["载", "載"],
  ["请", "請"],
  ["将", "將"],
  ["主", "主"],
  ["体", "體"],
  ["邮", "郵"],
  ["箱", "箱"],
  ["替", "替"],
  ["换", "換"],
  ["刚", "剛"],
  ["则", "則"],
  ["坏", "壞"],
  ["压", "壓"],
];

translations["zh-TW"] = {
  ...createTraditionalChineseTranslations(translations.zh),
  language: { self: "繁體中文" },
};

translations.ja = {
  language: { self: "日本語" },
  app: { name: "職業ボール闘技場" },
  side: { a: "ボール A", b: "ボール B" },
  common: { enabled: "有効", unavailable: "未設定", iap: "IAP" },
  status: { playing: "自動バトル中", paused: "一時停止中" },
  hud: { shake: "シェイク" },
  messages: {
    checkAgreement: "先に規約への同意を確認してください",
    consentWithdrawn: "同意を取り消しました。内容を再確認してください",
    purchaseRestored: "購入情報を復元しました",
    purchaseUnavailable: "このビルドではアプリ内購入は設定されていません",
    selectedProfession: "{side} が {profession} を選択しました",
    selectedScene: "{scene} に切り替えました",
  },
  consent: {
    subtitle: "公開前の確認",
    title: "始める前に",
    intro: "プライバシーポリシーとユーザー規約を読んで同意してください。同意後、設定済みのプラットフォームでは基本的なゲーム/パフォーマンスイベントを送信し、プラットフォーム広告が表示される場合があります。Meta Instant Games は Meta 広告、Android/iOS は Google AdMob を使用します。アプリ内購入は未設定です。",
    privacy: "プライバシーポリシー",
    terms: "ユーザー規約",
    agree: "上記の内容を読み、同意します",
    enter: "同意して開始",
    ageRating: "このゲームには軽度のカートゥーン/ファンタジー戦闘表現が含まれ、子ども向けに提供するものではありません。",
  },
  main: {
    subtitle: "メインメニュー",
    title: "バトル準備",
    summary: "シーン：{scene}  /  {sideA}：{professionA}  /  {sideB}：{professionB}",
    itemSummary: "モード：{scene}  /  職業なし、ランダムなアイテムを拾って自動対戦",
    start: "ゲーム開始",
    settings: "設定と規約",
    notice: "分析と広告は同意後のみ有効になります。広告リクエストは既定で非パーソナライズかつゲーム文脈の枠を使用します。ストア提出時は、軽度のカートゥーン/ファンタジー戦闘としてレーティング質問に回答してください。",
  },
  setup: {
    subtitle: "バトル設定",
    sceneLabel: "シーン",
    professionHeader: "{side} の職業",
    itemModeHeader: "アイテムモード",
    itemModeDescription: "両方のボールは職業なしで、初期 HP は 100 です。アリーナにはアイテムがランダムに出現し、触れるとすぐに装備します。耐久が尽きると次のアイテムを待ちます。",
    randomProfession: "ランダム職業",
    randomStart: "ランダム開始",
    saveBack: "保存して戻る",
    start: "ゲーム開始",
  },
  pause: {
    title: "一時停止",
    resume: "再開",
    restart: "最初から",
    settings: "設定",
    exit: "終了",
    backToPause: "一時停止へ戻る",
  },
  settings: {
    subtitle: "設定",
    languageTitle: "言語",
    feedbackTitle: "サウンドと振動",
    vibration: "振動",
    music: "BGM",
    soundEffects: "効果音",
    on: "オン",
    off: "オフ",
    legalTitle: "規約とコンプライアンス",
    legalInfo: "規約バージョン：{version}。開発者：{developerName}。連絡先：{contactEmail}。",
    analytics: "分析",
    ads: "広告",
    privacy: "プライバシーポリシー",
    terms: "ユーザー規約",
    restore: "購入を復元",
    withdraw: "同意を取り消す",
    statsInfo: "分析：{analytics}。広告：{ads}。{iap}：実際の商品は未設定です。広告はゲーム文脈の枠を優先し、デバッグビルドではテスト広告ユニットを使用します。",
    sdkNotice: "ここで分析をオフにするか、同意を取り消して規約を再確認できます。",
    backMain: "メインメニューへ",
  },
  legal: {
    back: "戻る",
    pageUp: "上へ",
    pageDown: "下へ",
    scrollHint: "マウスホイールまたはトラックパッドで全文を確認できます。",
    privacy: {
      title: "プライバシーポリシー",
      sections: [
        { title: "1. 情報の取り扱い", body: "同意後、設定済みのプラットフォームでは Firebase Analytics を使用し、初期化成功、ゲーム開始、ゲーム終了、フレームレートのスナップショット、設定選択などの基本的なゲームおよびパフォーマンスイベントを送信します。アカウント、位置情報、連絡先、カメラ、マイクなどの機微な権限データは収集しません。" },
        { title: "2. ローカル保存", body: "次回起動時に選択を保持するため、ゲームは端末のローカルストレージにポリシーバージョン、規約バージョン、ボール A/B の職業選択、設定項目を保存します。" },
        { title: "3. 分析、広告、決済", body: "分析と広告表示は設定でオフにでき、同意を取り消すと両方が無効になります。このビルドはプラットフォームごとに広告を切り替えます。Meta Instant Games では Meta 広告 API によるインタースティシャルまたはリワード動画、Android/iOS では Google AdMob を使用します。該当する広告プラットフォームは、広告の表示、測定、不正防止のために広告関連情報を処理する場合があります。アプリ内購入は未設定で、決済フローは開始しません。" },
        { title: "4. 未成年者とレーティング", body: "このゲームは子ども向け専用の製品ではありません。HP、武器職業、自動戦闘が含まれるため、Apple App Store、Google Play などのレーティング質問には、軽度のカートゥーン/ファンタジー暴力として正確に回答してください。" },
        { title: "5. お問い合わせ", body: "開発者：{developerName}。プライバシーに関するお問い合わせは {contactEmail} までご連絡ください。提出前に開発者名とメールアドレスを実際の情報へ差し替えてください。" },
      ],
    },
    terms: {
      title: "ユーザー規約",
      sections: [
        { title: "1. サービス内容", body: "『{appName}』へようこそ。本ゲームは Canvas ベースの 2D 自動対戦体験を提供し、プレイヤーは両陣営の職業を選んで結果を観戦できます。" },
        { title: "2. ユーザー行動", body: "適用される法令およびアプリストアのルールを遵守してください。本ゲームを妨害、リバース攻撃、チート配布、その他サービスの安定性を損なう行為に利用してはいけません。" },
        { title: "3. 仮想コンテンツと有料機能の予約", body: "このビルドには実際の有料商品はありません。コード内の IAP 機能は将来拡張のための予約であり、このバージョンで課金は発生しません。将来有料コンテンツを提供する場合は、ストア表示と実際の購入フローが優先されます。" },
        { title: "4. 免責事項", body: "ゲームは初期バージョンです。職業バランス、ビジュアル、プラットフォーム機能、内容は継続的に調整される場合があります。安定した体験に努めますが、すべての端末で完全に同一の動作を保証するものではありません。" },
        { title: "5. 規約の更新", body: "規約またはプライバシーポリシーに重要な変更がある場合、ゲームは確認画面を再表示します。続けて利用する前に、更新後の条項を読み、同意する必要があります。" },
      ],
    },
  },
  result: { draw: "引き分け", winner: "{side}（{profession}）が勝利", winnerNoProfession: "{side} が勝利", again: "もう一戦", shareCard: "戦報カード", setup: "バトル設定", backMain: "メインメニューへ" },
  scenes: {
    classic: { name: "クラシック闘技場", description: "小さなマップで自動対戦" },
    super: { name: "スーパー闘技場", description: "超能職業専用バトル" },
    items: { name: "アイテムモード", description: "ランダムに武器を拾う" },
    heroes: { name: "ヒーローモード", description: "HP と MP とスキルで戦うヒーローバトル" },
  },
  items: {
    category: { building: "建築", weapon: "アイテム" },
    sword: { name: "刀" },
    spear: { name: "槍" },
    bow: { name: "弓" },
    pistol: { name: "ピストル" },
    rocket: { name: "ロケットランチャー" },
    flamethrower: { name: "火炎放射器" },
    torch: { name: "松明" },
    staff: { name: "杖" },
    prismTower: { name: "プリズムタワー" },
    bunker: { name: "バンカー" },
    cannon: { name: "巨砲" },
    teslaCoil: { name: "テスラコイル" },
    gasStation: { name: "ガソリンスタンド" },
    spells: { fire: "火球", ice: "氷柱", lightning: "雷撃" },
  },
  professions: {
    bat: { name: "コウモリボール", skill: "牙の吸血", item: "闇翼の牙" },
    venom: { name: "毒液ボール", skill: "毒針胞子", item: "猛毒の針" },
    spider: { name: "クモボール", skill: "糸の結界", item: "蜘蛛糸ノード" },
    lava: { name: "溶岩ボール", skill: "溶火の道", item: "溶岩コア" },
    reaper: { name: "死神ボール", skill: "鎌刃の収穫", item: "終末の大鎌" },
    frost: { name: "氷結ボール", skill: "氷輪凍結", item: "周回氷輪" },
    yoyo: { name: "ヨーヨーボール", skill: "ピクセル回転", item: "ピクセルヨーヨー" },
    static: { name: "静電ボール", skill: "静電チャージ", item: "静電コア" },
    summoner: { name: "召喚師", skill: "熊霊契約", item: "熊呼びトーテム" },
    spear: { name: "長槍ボール", skill: "正面突き", item: "風切りの長槍" },
    blade: { name: "大刀ボール", skill: "重斬り", item: "厚刃の大刀" },
    shield: { name: "盾ボール", skill: "盾壁反撃", item: "守護の方盾" },
    assassin: { name: "刺客ボール", skill: "双刀連斬", item: "影牙の双刀" },
    archer: { name: "弓矢ボール", skill: "雲貫きの矢", item: "藤弦の短弓" },
    chain: { name: "鎖球", skill: "鎖槌の大振り", item: "鉄星の鎖槌" },
    mage: { name: "魔法師ボール", skill: "三相魔法", item: "三相の杖" },
  },
  heroes: {
    demon: { name: "悪魔人", weapon: "影牙の双刀", skills: { dodge: "回避", manaBurn: "マナ燃焼" } },
    dwarfKing: { name: "ドワーフ王", weapon: "雷鋳の戦槌", skills: { thunderHammer: "雷神の槌", groundSlam: "地面叩き" } },
    minotaur: { name: "ミノタウロス", weapon: "戦争トーテム", skills: { warStomp: "戦争の踏みつけ", rebirth: "復生" } },
    elfKing: { name: "エルフ王", weapon: "森の長弓", skills: { fireArrow: "火矢", forestBlessing: "森の祝福" } },
    wukong: { name: "孫悟空", weapon: "如意棒", skills: { tripleStaff: "三面六臂", giantStaff: "法天象地" } },
    cryptLord: { name: "クリプトロード", weapon: "爪", skills: { impale: "インペイル", summonBeetle: "小甲虫召喚" } },
    zeus: { name: "ゼウス", weapon: "黄金の長槍", skills: { lightningStrike: "落雷", divineDescent: "神降ろし" } },
  },
};

export function getLocaleOptions() {
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
    label: translations[locale].language.self,
  }));
}

export function normalizeLocale(locale) {
  return getCanonicalLocale(locale) ?? FALLBACK_LOCALE;
}

export function isSupportedLocale(locale) {
  return getCanonicalLocale(locale) !== null;
}

export function isRtlLocale(locale) {
  return RTL_LOCALES.has(normalizeLocale(locale));
}

export function getTextDirection(locale) {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}

export function getInitialLocale(storage = getDefaultStorage(), client = globalThis) {
  const savedLocale = getSavedLocale(storage);
  if (savedLocale) {
    return savedLocale;
  }

  for (const clientLocale of getClientLocaleCandidates(client)) {
    if (isSupportedLocale(clientLocale)) {
      return normalizeLocale(clientLocale);
    }
  }

  return FALLBACK_LOCALE;
}

export function getSavedLocale(storage = getDefaultStorage()) {
  const savedLocale = safeGetItem(storage, LOCALE_STORAGE_KEY);
  return savedLocale && isSupportedLocale(savedLocale) ? normalizeLocale(savedLocale) : null;
}

export function getClientLocaleCandidates(client = globalThis) {
  const navigator = client?.navigator;
  const navigatorLocales = Array.isArray(navigator?.languages) ? navigator.languages : [];
  const candidates = [
    ...navigatorLocales,
    navigator?.language,
    navigator?.userLanguage,
    navigator?.browserLanguage,
    getIntlResolvedLocale(client),
  ];

  return [...new Set(candidates.filter(Boolean).map((locale) => String(locale)))];
}

export function saveLocale(locale, storage = getDefaultStorage()) {
  const normalizedLocale = normalizeLocale(locale);
  safeSetItem(storage, LOCALE_STORAGE_KEY, normalizedLocale);
  return normalizedLocale;
}

export function translate(locale, key, replacements = {}) {
  const normalizedLocale = normalizeLocale(locale);
  const value = getPath(translations[normalizedLocale], key) ?? getPath(translations[FALLBACK_LOCALE], key);
  if (typeof value !== "string") {
    return key;
  }

  return interpolate(value, replacements);
}

export function getLocalizedLegalDocument(locale, type, replacements = {}) {
  const documentKey = type === "terms" ? "terms" : "privacy";
  const normalizedLocale = normalizeLocale(locale);
  const document = getPath(translations[normalizedLocale], `legal.${documentKey}`) ?? getPath(translations[FALLBACK_LOCALE], `legal.${documentKey}`);
  return interpolateDeep(document, replacements);
}

function getPath(source, key) {
  return String(key)
    .split(".")
    .reduce((value, segment) => (value && Object.hasOwn(value, segment) ? value[segment] : undefined), source);
}

function interpolate(value, replacements) {
  return value.replace(/\{(\w+)\}/g, (match, key) => String(replacements[key] ?? match));
}

function interpolateDeep(value, replacements) {
  if (typeof value === "string") {
    return interpolate(value, replacements);
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateDeep(item, replacements));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, interpolateDeep(nestedValue, replacements)]));
  }
  return value;
}

function createTraditionalChineseTranslations(source) {
  return mapTranslationText(source, toTraditionalChinese);
}

function mapTranslationText(value, transform) {
  if (typeof value === "string") {
    return transform(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => mapTranslationText(item, transform));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, mapTranslationText(nestedValue, transform)]));
  }
  return value;
}

function toTraditionalChinese(text) {
  return TRADITIONAL_CHINESE_REPLACEMENTS.reduce((current, [from, to]) => current.replaceAll(from, to), text);
}

function getCanonicalLocale(locale) {
  const normalizedLocale = String(locale || "").trim().replace(/_/g, "-").toLowerCase();
  if (!normalizedLocale) {
    return null;
  }

  const directLocale = SUPPORTED_LOCALES.find((supportedLocale) => supportedLocale.toLowerCase() === normalizedLocale);
  if (directLocale) {
    return directLocale;
  }

  if (
    normalizedLocale === "zh-hk" ||
    normalizedLocale === "zh-mo" ||
    normalizedLocale.startsWith("zh-tw-") ||
    normalizedLocale.startsWith("zh-hk-") ||
    normalizedLocale.startsWith("zh-mo-") ||
    normalizedLocale.startsWith("zh-hant")
  ) {
    return "zh-TW";
  }

  if (normalizedLocale.startsWith("zh-hans")) {
    return "zh";
  }

  const primaryLocale = normalizedLocale.split("-")[0];
  return SUPPORTED_LOCALES.find((supportedLocale) => supportedLocale.toLowerCase() === primaryLocale) ?? null;
}

function getDefaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function getIntlResolvedLocale(client) {
  try {
    return client?.Intl?.DateTimeFormat?.().resolvedOptions?.().locale ?? null;
  } catch {
    return null;
  }
}

function safeGetItem(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSetItem(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Local storage can be unavailable in private browsing or embedded contexts.
  }
}
