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
    },
    messages: {
      checkAgreement: "请先勾选同意协议",
      consentWithdrawn: "已撤回同意，请重新阅读并确认",
      purchaseRestored: "已恢复购买",
      purchaseUnavailable: "当前版本未配置应用内购买",
      selectedProfession: "{side} 已选择 {profession}",
      selectedScene: "已切换到 {scene}",
    },
    consent: {
      subtitle: "上架合规确认",
      title: "开始之前",
      intro: "请先阅读并同意《隐私政策》和《用户协议》。当前版本仅在本地保存协议同意状态与职业选择，不接入真实统计、广告或支付 SDK。",
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
      start: "开始游戏",
      settings: "设置与协议",
      notice: "当前版本不接入真实广告、统计或 IAP SDK。上架时请按轻微卡通/幻想对战填写内容评级问卷。",
    },
    setup: {
      subtitle: "开战设置",
      sceneLabel: "场景",
      professionHeader: "{side} 职业",
      itemModeHeader: "道具模式",
      itemModeDescription: "双方球球没有职业，初始血量均为 100。场中会随机出现道具，碰到后立即装备，耐久耗尽后继续等待下一件道具。",
      saveBack: "保存并返回",
      start: "开始游戏",
    },
    settings: {
      subtitle: "设置",
      languageTitle: "语言",
      feedbackTitle: "声音与触感",
      vibration: "震动",
      music: "背景音乐",
      soundEffects: "音效",
      on: "开",
      off: "关",
      legalTitle: "协议与合规",
      legalInfo: "协议版本：{version}。运营主体：{companyName}。联系邮箱：{contactEmail}。",
      privacy: "查看隐私政策",
      terms: "查看用户协议",
      restore: "恢复购买",
      withdraw: "撤回同意",
      statsInfo: "统计：{analytics}。广告：{ads}。{iap}：未配置真实商品。当前版本不会上传数据、展示广告或发起扣费。",
      sdkNotice: "后续接入真实 SDK 前，需要更新隐私政策并重新获取同意。",
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
            body: "当前版本不接入真实第三方统计、广告或支付 SDK，不收集账号、定位、通讯录、相机、麦克风、精确设备标识等个人敏感信息。游戏仅在本地保存协议同意状态、职业选择和基础设置。",
          },
          {
            title: "二、本地保存",
            body: "为了让你下次打开游戏时保留选择，本游戏会使用设备本地存储保存隐私政策版本、用户协议版本、球 A/球 B 的职业选择和设置项。这些数据不会上传到服务器。",
          },
          {
            title: "三、统计、广告与支付预留",
            body: "项目代码预留了统计、广告和应用内购买接口，但默认实现不会发送网络请求、不会展示广告、不会发起支付。若未来接入真实 SDK，我们会先更新本政策并重新获取必要同意。",
          },
          {
            title: "四、未成年人和内容分级",
            body: "本游戏不是专门面向儿童的产品。由于存在血量、武器职业和自动对战，请在 Apple App Store、Google Play 和其他渠道按轻微卡通/幻想暴力如实填写内容评级问卷。",
          },
          {
            title: "五、联系我们",
            body: "运营主体：{companyName}。如需咨询隐私相关事项，请通过 {contactEmail} 联系我们。提审前请将主体和邮箱替换为正式信息。",
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
      again: "再来一局",
      setup: "开战设置",
      backMain: "返回主菜单",
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
      sword: { name: "刀" },
      spear: { name: "长枪" },
      bow: { name: "弓箭" },
      pistol: { name: "手枪" },
      rocket: { name: "火箭筒" },
      staff: { name: "法杖" },
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
    },
  },
  en: {
    language: { self: "English" },
    app: { name: "Profession Ball Arena" },
    side: { a: "Ball A", b: "Ball B" },
    common: { enabled: "Enabled", unavailable: "Not configured", iap: "IAP" },
    status: { playing: "Auto battle" },
    messages: {
      checkAgreement: "Please agree to the terms first",
      consentWithdrawn: "Consent withdrawn. Please review and confirm again",
      purchaseRestored: "Purchases restored",
      purchaseUnavailable: "In-app purchases are not configured in this build",
      selectedProfession: "{side} selected {profession}",
      selectedScene: "Switched to {scene}",
    },
    consent: {
      subtitle: "Release compliance",
      title: "Before You Start",
      intro: "Please read and accept the Privacy Policy and User Agreement. This build only stores consent state and profession choices locally, with no real analytics, ads, or payment SDK.",
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
      start: "Start Game",
      settings: "Settings & Terms",
      notice: "This build has no real ads, analytics, or IAP SDK. For store submission, answer content-rating questions as mild cartoon/fantasy combat.",
    },
    setup: {
      subtitle: "Battle Setup",
      sceneLabel: "Scene",
      professionHeader: "{side} Profession",
      itemModeHeader: "Item Mode",
      itemModeDescription: "Both balls have no profession and start at 100 HP. Items spawn randomly in the arena; touching one equips it immediately until its durability runs out.",
      saveBack: "Save & Back",
      start: "Start Game",
    },
    settings: {
      subtitle: "Settings",
      languageTitle: "Language",
      feedbackTitle: "Sound & Haptics",
      vibration: "Vibration",
      music: "Music",
      soundEffects: "Sound FX",
      on: "On",
      off: "Off",
      legalTitle: "Terms & Compliance",
      legalInfo: "Agreement version: {version}. Operator: {companyName}. Contact: {contactEmail}.",
      privacy: "Privacy Policy",
      terms: "User Agreement",
      restore: "Restore",
      withdraw: "Withdraw Consent",
      statsInfo: "Analytics: {analytics}. Ads: {ads}. {iap}: no real products. This build does not upload data, show ads, or charge users.",
      sdkNotice: "Before integrating real SDKs, update the Privacy Policy and request consent again.",
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
            body: "This build does not integrate real third-party analytics, ads, or payment SDKs. It does not collect accounts, location, contacts, camera, microphone, precise device identifiers, or other sensitive personal information. The game only stores consent status, profession choices, and basic settings locally.",
          },
          {
            title: "2. Local Storage",
            body: "To keep your choices for the next launch, the game uses local device storage for policy versions, agreement versions, Ball A/B profession choices, and settings. This data is not uploaded to a server.",
          },
          {
            title: "3. Reserved Analytics, Ads, and Payments",
            body: "The project contains placeholder interfaces for analytics, ads, and in-app purchases. The default implementation sends no network requests, shows no ads, and starts no payment flow. If real SDKs are added later, this policy will be updated and consent will be requested again.",
          },
          {
            title: "4. Minors and Ratings",
            body: "This game is not specifically directed at children. Because it includes health values, weapon professions, and automatic combat, please answer Apple App Store, Google Play, and other store rating questionnaires truthfully as mild cartoon/fantasy violence.",
          },
          {
            title: "5. Contact",
            body: "Operator: {companyName}. For privacy questions, contact {contactEmail}. Replace the operator and email with official information before submission.",
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
    result: { draw: "Draw", winner: "{side} ({profession}) wins", winnerNoProfession: "{side} wins", again: "Play Again", setup: "Battle Setup", backMain: "Back to Menu" },
    scenes: {
      classic: { name: "Classic Arena", description: "Auto battle in a compact arena" },
      super: { name: "Super Arena", description: "Super professions only" },
      items: { name: "Item Mode", description: "Random weapon pickups" },
      heroes: { name: "Hero Mode", description: "Hero duels with health, mana, and skills" },
    },
    items: {
      sword: { name: "Sword" },
      spear: { name: "Spear" },
      bow: { name: "Bow" },
      pistol: { name: "Pistol" },
      rocket: { name: "Rocket" },
      staff: { name: "Staff" },
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
    },
  },
  fr: {
    language: { self: "Français" },
    app: { name: "Arène des Balles" },
    side: { a: "Balle A", b: "Balle B" },
    common: { enabled: "Activé", unavailable: "Non configuré", iap: "IAP" },
    status: { playing: "Combat auto" },
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
      intro: "Veuillez lire et accepter la Politique de confidentialité et le Contrat utilisateur. Cette version ne conserve localement que l'accord et les choix de profession, sans véritable SDK de statistiques, publicité ou paiement.",
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
      notice: "Cette version n'intègre pas de vrais SDK de publicité, statistiques ou IAP. Pour les stores, indiquez un combat cartoon/fantasy léger.",
    },
    setup: { subtitle: "Préparation", sceneLabel: "Scène", professionHeader: "Profession {side}", itemModeHeader: "Mode objets", itemModeDescription: "Les deux balles n'ont pas de profession et commencent avec 100 PV. Des objets apparaissent au hasard dans l'arène ; toucher un objet l'équipe jusqu'à épuisement de sa durabilité.", saveBack: "Sauver & retour", start: "Jouer" },
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
      legalInfo: "Version : {version}. Opérateur : {companyName}. Contact : {contactEmail}.",
      privacy: "Confidentialité",
      terms: "Contrat utilisateur",
      restore: "Restaurer",
      withdraw: "Retirer accord",
      statsInfo: "Statistiques : {analytics}. Publicité : {ads}. {iap} : aucun produit réel. Cette version ne téléverse pas de données, n'affiche pas de publicité et ne facture pas.",
      sdkNotice: "Avant d'ajouter de vrais SDK, mettez à jour la politique et redemandez l'accord.",
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
          { title: "1. Traitement des informations", body: "Cette version n'intègre pas de vrais SDK tiers de statistiques, publicité ou paiement. Elle ne collecte pas de compte, position, contacts, caméra, micro, identifiant précis d'appareil ni autre information sensible. Le jeu conserve seulement localement l'accord, les choix de profession et les réglages de base." },
          { title: "2. Stockage local", body: "Pour garder vos choix au prochain lancement, le jeu utilise le stockage local de l'appareil pour les versions des politiques, les choix de profession des balles A/B et les réglages. Ces données ne sont pas envoyées à un serveur." },
          { title: "3. Statistiques, publicités et paiements réservés", body: "Le projet contient des interfaces réservées aux statistiques, publicités et achats intégrés. L'implémentation par défaut n'envoie aucune requête réseau, n'affiche aucune publicité et ne lance aucun paiement. Si de vrais SDK sont ajoutés, cette politique sera mise à jour et l'accord sera redemandé." },
          { title: "4. Mineurs et classification", body: "Ce jeu ne vise pas spécialement les enfants. Comme il contient des points de vie, des professions armées et du combat automatique, remplissez honnêtement les questionnaires des stores comme violence cartoon/fantasy légère." },
          { title: "5. Contact", body: "Opérateur : {companyName}. Pour toute question de confidentialité, contactez {contactEmail}. Remplacez l'opérateur et l'adresse par les informations officielles avant soumission." },
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
    result: { draw: "Égalité", winner: "{side} ({profession}) gagne", winnerNoProfession: "{side} gagne", again: "Rejouer", setup: "Préparation", backMain: "Retour au menu" },
    scenes: {
      classic: { name: "Arène classique", description: "Combat auto dans une petite arène" },
      super: { name: "Arène super", description: "Professions super uniquement" },
      items: { name: "Mode objets", description: "Armes aléatoires" },
      heroes: { name: "Mode héros", description: "Duel avec vie, mana et compétences" },
    },
    items: {
      sword: { name: "Épée" },
      spear: { name: "Lance" },
      bow: { name: "Arc" },
      pistol: { name: "Pistolet" },
      rocket: { name: "Lance-roquettes" },
      staff: { name: "Bâton" },
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
    },
  },
  de: {
    language: { self: "Deutsch" },
    app: { name: "Berufsball-Arena" },
    side: { a: "Ball A", b: "Ball B" },
    common: { enabled: "Aktiv", unavailable: "Nicht konfiguriert", iap: "IAP" },
    status: { playing: "Auto-Kampf" },
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
      intro: "Bitte lies und akzeptiere Datenschutzrichtlinie und Nutzungsvereinbarung. Dieser Build speichert nur Zustimmung und Berufsauswahl lokal und nutzt keine echten Analyse-, Werbe- oder Zahlungs-SDKs.",
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
      notice: "Dieser Build enthält keine echten Werbe-, Analyse- oder IAP-SDKs. Für Stores bitte als leichte Cartoon-/Fantasy-Kämpfe einstufen.",
    },
    setup: { subtitle: "Kampf-Setup", sceneLabel: "Szene", professionHeader: "{side} Beruf", itemModeHeader: "Gegenstandsmodus", itemModeDescription: "Beide Bälle haben keinen Beruf und starten mit 100 LP. Gegenstände erscheinen zufällig in der Arena; Berührung rüstet sie sofort aus, bis die Haltbarkeit verbraucht ist.", saveBack: "Speichern", start: "Starten" },
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
      legalInfo: "Version: {version}. Betreiber: {companyName}. Kontakt: {contactEmail}.",
      privacy: "Datenschutz",
      terms: "Nutzungsvereinbarung",
      restore: "Wiederherstellen",
      withdraw: "Zustimmung widerrufen",
      statsInfo: "Analyse: {analytics}. Werbung: {ads}. {iap}: keine echten Produkte. Dieser Build lädt keine Daten hoch, zeigt keine Werbung und berechnet nichts.",
      sdkNotice: "Vor echten SDKs muss die Datenschutzrichtlinie aktualisiert und die Zustimmung erneut eingeholt werden.",
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
          { title: "1. Umgang mit Informationen", body: "Dieser Build integriert keine echten Drittanbieter-SDKs für Analyse, Werbung oder Zahlung. Er sammelt keine Konten, Standorte, Kontakte, Kamera-, Mikrofon-, präzisen Gerätekennungen oder andere sensible personenbezogene Daten. Das Spiel speichert nur Zustimmung, Berufsauswahl und Grundeinstellungen lokal." },
          { title: "2. Lokaler Speicher", body: "Damit deine Auswahl beim nächsten Start erhalten bleibt, nutzt das Spiel lokalen Gerätespeicher für Richtlinienversionen, Berufsauswahl von Ball A/B und Einstellungen. Diese Daten werden nicht auf einen Server hochgeladen." },
          { title: "3. Reservierte Analyse, Werbung und Zahlung", body: "Das Projekt enthält Platzhalter für Analyse, Werbung und In-App-Käufe. Die Standardimplementierung sendet keine Netzwerkanfragen, zeigt keine Werbung und startet keine Zahlung. Bei echten SDKs wird diese Richtlinie aktualisiert und Zustimmung erneut angefragt." },
          { title: "4. Minderjährige und Altersfreigabe", body: "Dieses Spiel richtet sich nicht speziell an Kinder. Wegen Lebenspunkten, Waffenberufen und automatischem Kampf sollten Store-Fragebögen wahrheitsgemäß als leichte Cartoon-/Fantasy-Gewalt beantwortet werden." },
          { title: "5. Kontakt", body: "Betreiber: {companyName}. Bei Datenschutzfragen kontaktiere {contactEmail}. Betreiber und E-Mail vor Einreichung durch offizielle Angaben ersetzen." },
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
    result: { draw: "Unentschieden", winner: "{side} ({profession}) gewinnt", winnerNoProfession: "{side} gewinnt", again: "Noch einmal", setup: "Kampf-Setup", backMain: "Zurück zum Menü" },
    scenes: {
      classic: { name: "Klassische Arena", description: "Auto-Kampf in kompakter Arena" },
      super: { name: "Super-Arena", description: "Nur Super-Berufe" },
      items: { name: "Gegenstandsmodus", description: "Zufällige Waffen" },
      heroes: { name: "Heldenmodus", description: "Heldenduelle mit Leben, Mana und Fähigkeiten" },
    },
    items: {
      sword: { name: "Schwert" },
      spear: { name: "Speer" },
      bow: { name: "Bogen" },
      pistol: { name: "Pistole" },
      rocket: { name: "Raketenwerfer" },
      staff: { name: "Stab" },
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
    },
  },
  ar: {
    language: { self: "العربية" },
    app: { name: "ساحة كرات المهن" },
    side: { a: "الكرة A", b: "الكرة B" },
    common: { enabled: "مفعل", unavailable: "غير مهيأ", iap: "الشراء داخل التطبيق" },
    status: { playing: "قتال تلقائي" },
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
      intro: "يرجى قراءة سياسة الخصوصية واتفاقية المستخدم والموافقة عليهما. يحفظ هذا الإصدار حالة الموافقة واختيارات المهن محليا فقط، ولا يستخدم حزم إحصاءات أو إعلانات أو دفع حقيقية.",
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
      notice: "لا يحتوي هذا الإصدار على إعلانات أو إحصاءات أو شراء داخل التطبيق حقيقي. عند النشر، صنفه كقتال كرتوني/خيالي خفيف.",
    },
    setup: { subtitle: "إعداد القتال", sceneLabel: "المشهد", professionHeader: "مهنة {side}", itemModeHeader: "نمط الأدوات", itemModeDescription: "لا تملك الكرتان أي مهنة وتبدآن بصحة 100. تظهر الأدوات عشوائيا في الساحة، ولمسها يجهزها فورا حتى تنفد المتانة.", saveBack: "حفظ وعودة", start: "ابدأ" },
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
      legalInfo: "إصدار الاتفاقية: {version}. الجهة المشغلة: {companyName}. التواصل: {contactEmail}.",
      privacy: "سياسة الخصوصية",
      terms: "اتفاقية المستخدم",
      restore: "استعادة",
      withdraw: "سحب الموافقة",
      statsInfo: "الإحصاءات: {analytics}. الإعلانات: {ads}. {iap}: لا منتجات حقيقية. هذا الإصدار لا يرفع البيانات ولا يعرض إعلانات ولا يفرض رسوما.",
      sdkNotice: "قبل إضافة حزم SDK حقيقية، يجب تحديث سياسة الخصوصية وطلب الموافقة مجددا.",
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
          { title: "1. كيف نتعامل مع المعلومات", body: "لا يدمج هذا الإصدار حزم SDK حقيقية لطرف ثالث للإحصاءات أو الإعلانات أو الدفع. ولا يجمع الحسابات أو الموقع أو جهات الاتصال أو الكاميرا أو الميكروفون أو معرفات الجهاز الدقيقة أو أي معلومات شخصية حساسة أخرى. تحفظ اللعبة محليا فقط حالة الموافقة واختيارات المهن والإعدادات الأساسية." },
          { title: "2. التخزين المحلي", body: "للاحتفاظ باختياراتك عند التشغيل التالي، تستخدم اللعبة تخزين الجهاز المحلي لحفظ إصدارات السياسات واختيارات مهنة الكرة A/B والإعدادات. لا ترفع هذه البيانات إلى خادم." },
          { title: "3. الإحصاءات والإعلانات والدفع المحجوزة", body: "يحتوي المشروع على واجهات محجوزة للإحصاءات والإعلانات والشراء داخل التطبيق. التنفيذ الافتراضي لا يرسل طلبات شبكة ولا يعرض إعلانات ولا يبدأ عمليات دفع. إذا أضيفت حزم حقيقية لاحقا فسيتم تحديث هذه السياسة وطلب الموافقة مجددا." },
          { title: "4. القاصرون والتصنيف العمري", body: "هذه اللعبة ليست موجهة خصيصا للأطفال. وبسبب نقاط الصحة ومهن الأسلحة والقتال التلقائي، يرجى تعبئة استبيانات المتاجر بصدق على أنها عنف كرتوني/خيالي خفيف." },
          { title: "5. التواصل", body: "الجهة المشغلة: {companyName}. لأسئلة الخصوصية تواصل عبر {contactEmail}. استبدل الجهة والبريد بمعلومات رسمية قبل الإرسال." },
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
    result: { draw: "تعادل", winner: "{side} ({profession}) فازت", winnerNoProfession: "{side} فازت", again: "جولة أخرى", setup: "إعداد القتال", backMain: "العودة للقائمة" },
    scenes: {
      classic: { name: "الساحة الكلاسيكية", description: "قتال تلقائي في ساحة صغيرة" },
      super: { name: "الساحة الخارقة", description: "مهن خارقة فقط" },
      items: { name: "نمط الأدوات", description: "أسلحة عشوائية" },
      heroes: { name: "نمط الأبطال", description: "مبارزات أبطال بالصحة والمانا والمهارات" },
    },
    items: {
      sword: { name: "سيف" },
      spear: { name: "رمح" },
      bow: { name: "قوس" },
      pistol: { name: "مسدس" },
      rocket: { name: "قاذف صواريخ" },
      staff: { name: "عصا" },
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
  status: { playing: "自動バトル中" },
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
    intro: "プライバシーポリシーとユーザー規約を読んで同意してください。このビルドは同意状態と職業選択のみを端末内に保存し、実際の分析、広告、決済 SDK は使用しません。",
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
    notice: "このビルドには実際の広告、分析、IAP SDK は含まれていません。ストア提出時は、軽度のカートゥーン/ファンタジー戦闘としてレーティング質問に回答してください。",
  },
  setup: {
    subtitle: "バトル設定",
    sceneLabel: "シーン",
    professionHeader: "{side} の職業",
    itemModeHeader: "アイテムモード",
    itemModeDescription: "両方のボールは職業なしで、初期 HP は 100 です。アリーナにはアイテムがランダムに出現し、触れるとすぐに装備します。耐久が尽きると次のアイテムを待ちます。",
    saveBack: "保存して戻る",
    start: "ゲーム開始",
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
    legalInfo: "規約バージョン：{version}。運営主体：{companyName}。連絡先：{contactEmail}。",
    privacy: "プライバシーポリシー",
    terms: "ユーザー規約",
    restore: "購入を復元",
    withdraw: "同意を取り消す",
    statsInfo: "分析：{analytics}。広告：{ads}。{iap}：実際の商品は未設定です。このビルドはデータ送信、広告表示、課金を行いません。",
    sdkNotice: "実際の SDK を追加する前に、プライバシーポリシーを更新し、同意を再取得してください。",
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
        { title: "1. 情報の取り扱い", body: "このビルドは、実際の第三者分析、広告、決済 SDK を組み込んでいません。アカウント、位置情報、連絡先、カメラ、マイク、精密な端末識別子などの個人の機微情報を収集しません。ゲームは同意状態、職業選択、基本設定のみを端末内に保存します。" },
        { title: "2. ローカル保存", body: "次回起動時に選択を保持するため、ゲームは端末のローカルストレージにポリシーバージョン、規約バージョン、ボール A/B の職業選択、設定項目を保存します。これらのデータはサーバーへ送信されません。" },
        { title: "3. 分析、広告、決済の予約", body: "プロジェクトには分析、広告、アプリ内購入のためのインターフェースが用意されていますが、標準実装ではネットワークリクエスト、広告表示、決済フローを開始しません。将来実際の SDK を導入する場合は、本ポリシーを更新し、必要な同意を再取得します。" },
        { title: "4. 未成年者とレーティング", body: "このゲームは子ども向け専用の製品ではありません。HP、武器職業、自動戦闘が含まれるため、Apple App Store、Google Play などのレーティング質問には、軽度のカートゥーン/ファンタジー暴力として正確に回答してください。" },
        { title: "5. お問い合わせ", body: "運営主体：{companyName}。プライバシーに関するお問い合わせは {contactEmail} までご連絡ください。提出前に運営主体とメールアドレスを正式な情報へ差し替えてください。" },
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
  result: { draw: "引き分け", winner: "{side}（{profession}）が勝利", winnerNoProfession: "{side} が勝利", again: "もう一戦", setup: "バトル設定", backMain: "メインメニューへ" },
  scenes: {
    classic: { name: "クラシック闘技場", description: "小さなマップで自動対戦" },
    super: { name: "スーパー闘技場", description: "超能職業専用バトル" },
    items: { name: "アイテムモード", description: "ランダムに武器を拾う" },
    heroes: { name: "ヒーローモード", description: "HP と MP とスキルで戦うヒーローバトル" },
  },
  items: {
    sword: { name: "刀" },
    spear: { name: "槍" },
    bow: { name: "弓" },
    pistol: { name: "ピストル" },
    rocket: { name: "ロケットランチャー" },
    staff: { name: "杖" },
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

export function getInitialLocale(storage = getDefaultStorage()) {
  const savedLocale = safeGetItem(storage, LOCALE_STORAGE_KEY);
  if (savedLocale && isSupportedLocale(savedLocale)) {
    return normalizeLocale(savedLocale);
  }

  const browserLocales = globalThis.navigator?.languages || [globalThis.navigator?.language];
  for (const browserLocale of browserLocales) {
    if (browserLocale && isSupportedLocale(browserLocale)) {
      return normalizeLocale(browserLocale);
    }
  }

  return FALLBACK_LOCALE;
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
