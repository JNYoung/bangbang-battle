export const FALLBACK_LOCALE = "zh";
export const LOCALE_STORAGE_KEY = "bangbang.locale";
export const SUPPORTED_LOCALES = ["zh", "en", "fr", "de", "ar"];

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
      start: "开始游戏",
      settings: "设置与协议",
      notice: "当前版本不接入真实广告、统计或 IAP SDK。上架时请按轻微卡通/幻想对战填写内容评级问卷。",
    },
    setup: {
      subtitle: "开战设置",
      sceneLabel: "场景",
      professionHeader: "{side} 职业",
      saveBack: "保存并返回",
      start: "开始游戏",
    },
    settings: {
      subtitle: "设置",
      languageTitle: "语言",
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
    },
    professions: {
      bat: { name: "蝙蝠球", skill: "尖牙吸血", item: "暗翼尖牙" },
      venom: { name: "毒液球", skill: "毒刺孢子", item: "剧毒尖刺" },
      spider: { name: "蜘蛛球", skill: "蛛丝结网", item: "蛛丝节点" },
      lava: { name: "熔岩球", skill: "熔火路径", item: "熔岩核心" },
      reaper: { name: "死神球", skill: "镰刃收割", item: "终末大镰刀" },
      frost: { name: "冰冻球", skill: "冰轮冻结", item: "环绕冰轮" },
      spear: { name: "长矛球", skill: "正面突刺", item: "破风长矛" },
      blade: { name: "大刀球", skill: "重斩", item: "厚刃大刀" },
      shield: { name: "盾牌球", skill: "盾墙反震", item: "守卫方盾" },
      assassin: { name: "刺客球", skill: "双刀连斩", item: "影牙双刀" },
      archer: { name: "弓箭球", skill: "穿云箭", item: "藤弦短弓" },
      chain: { name: "链球", skill: "链锤重摆", item: "铁星链锤" },
      mage: { name: "法师球", skill: "三相法术", item: "三相法杖" },
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
      start: "Start Game",
      settings: "Settings & Terms",
      notice: "This build has no real ads, analytics, or IAP SDK. For store submission, answer content-rating questions as mild cartoon/fantasy combat.",
    },
    setup: {
      subtitle: "Battle Setup",
      sceneLabel: "Scene",
      professionHeader: "{side} Profession",
      saveBack: "Save & Back",
      start: "Start Game",
    },
    settings: {
      subtitle: "Settings",
      languageTitle: "Language",
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
    result: { draw: "Draw", winner: "{side} ({profession}) wins", again: "Play Again", setup: "Battle Setup", backMain: "Back to Menu" },
    scenes: {
      classic: { name: "Classic Arena", description: "Auto battle in a compact arena" },
      super: { name: "Super Arena", description: "Super professions only" },
    },
    professions: {
      bat: { name: "Bat Ball", skill: "Fang Drain", item: "Darkwing Fangs" },
      venom: { name: "Venom Ball", skill: "Toxic Spikes", item: "Venom Spike" },
      spider: { name: "Spider Ball", skill: "Web Nodes", item: "Web Strand" },
      lava: { name: "Lava Ball", skill: "Flame Trail", item: "Lava Core" },
      reaper: { name: "Reaper Ball", skill: "Scythe Edge", item: "Great Scythe" },
      frost: { name: "Frost Ball", skill: "Ice Orbit", item: "Frost Wheels" },
      spear: { name: "Spear Ball", skill: "Frontal Thrust", item: "Wind Spear" },
      blade: { name: "Blade Ball", skill: "Heavy Slash", item: "Broad Blade" },
      shield: { name: "Shield Ball", skill: "Shield Wall", item: "Guard Shield" },
      assassin: { name: "Assassin Ball", skill: "Twin Slash", item: "Shadow Fangs" },
      archer: { name: "Archer Ball", skill: "Sky Piercer", item: "Vine Bow" },
      chain: { name: "Flail Ball", skill: "Heavy Swing", item: "Iron Star Flail" },
      mage: { name: "Mage Ball", skill: "Tri-Spell", item: "Triune Staff" },
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
      start: "Jouer",
      settings: "Réglages & accords",
      notice: "Cette version n'intègre pas de vrais SDK de publicité, statistiques ou IAP. Pour les stores, indiquez un combat cartoon/fantasy léger.",
    },
    setup: { subtitle: "Préparation", sceneLabel: "Scène", professionHeader: "Profession {side}", saveBack: "Sauver & retour", start: "Jouer" },
    settings: {
      subtitle: "Réglages",
      languageTitle: "Langue",
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
    result: { draw: "Égalité", winner: "{side} ({profession}) gagne", again: "Rejouer", setup: "Préparation", backMain: "Retour au menu" },
    scenes: {
      classic: { name: "Arène classique", description: "Combat auto dans une petite arène" },
      super: { name: "Arène super", description: "Professions super uniquement" },
    },
    professions: {
      bat: { name: "Balle chauve-souris", skill: "Drain de crocs", item: "Crocs sombres" },
      venom: { name: "Balle venin", skill: "Pics toxiques", item: "Pic venimeux" },
      spider: { name: "Balle araignée", skill: "Noeuds de toile", item: "Fil de toile" },
      lava: { name: "Balle lave", skill: "Trace de feu", item: "Coeur de lave" },
      reaper: { name: "Balle faucheuse", skill: "Tranchant de faux", item: "Grande faux" },
      frost: { name: "Balle gel", skill: "Orbite glacée", item: "Roues de glace" },
      spear: { name: "Balle lance", skill: "Estoc frontal", item: "Lance du vent" },
      blade: { name: "Balle lame", skill: "Coup lourd", item: "Grande lame" },
      shield: { name: "Balle bouclier", skill: "Mur bouclier", item: "Bouclier garde" },
      assassin: { name: "Balle assassin", skill: "Double coupe", item: "Crocs d'ombre" },
      archer: { name: "Balle archer", skill: "Flèche céleste", item: "Arc de vigne" },
      chain: { name: "Balle fléau", skill: "Grand balancier", item: "Fléau étoilé" },
      mage: { name: "Balle mage", skill: "Triple sort", item: "Bâton triade" },
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
      start: "Spiel starten",
      settings: "Einstellungen & Recht",
      notice: "Dieser Build enthält keine echten Werbe-, Analyse- oder IAP-SDKs. Für Stores bitte als leichte Cartoon-/Fantasy-Kämpfe einstufen.",
    },
    setup: { subtitle: "Kampf-Setup", sceneLabel: "Szene", professionHeader: "{side} Beruf", saveBack: "Speichern", start: "Starten" },
    settings: {
      subtitle: "Einstellungen",
      languageTitle: "Sprache",
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
    result: { draw: "Unentschieden", winner: "{side} ({profession}) gewinnt", again: "Noch einmal", setup: "Kampf-Setup", backMain: "Zurück zum Menü" },
    scenes: {
      classic: { name: "Klassische Arena", description: "Auto-Kampf in kompakter Arena" },
      super: { name: "Super-Arena", description: "Nur Super-Berufe" },
    },
    professions: {
      bat: { name: "Fledermausball", skill: "Zahndrain", item: "Dunkelflügel-Zähne" },
      venom: { name: "Giftball", skill: "Giftstacheln", item: "Giftstachel" },
      spider: { name: "Spinnenball", skill: "Netzknoten", item: "Netzfaden" },
      lava: { name: "Lavaball", skill: "Flammenspur", item: "Lavakern" },
      reaper: { name: "Sensenball", skill: "Sensenrand", item: "Große Sense" },
      frost: { name: "Frostball", skill: "Eisorbit", item: "Eisräder" },
      spear: { name: "Speerball", skill: "Frontstoß", item: "Windspeer" },
      blade: { name: "Klingenball", skill: "Schwerer Hieb", item: "Breitklinge" },
      shield: { name: "Schildball", skill: "Schildwall", item: "Wächterschild" },
      assassin: { name: "Assassinenball", skill: "Doppelschnitt", item: "Schattenzähne" },
      archer: { name: "Bogenschützenball", skill: "Himmelspfeil", item: "Rankenbogen" },
      chain: { name: "Flegelball", skill: "Schwerer Schwung", item: "Eisenstern-Flegel" },
      mage: { name: "Magierball", skill: "Dreifachzauber", item: "Dreistab" },
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
      start: "ابدأ اللعبة",
      settings: "الإعدادات والاتفاقيات",
      notice: "لا يحتوي هذا الإصدار على إعلانات أو إحصاءات أو شراء داخل التطبيق حقيقي. عند النشر، صنفه كقتال كرتوني/خيالي خفيف.",
    },
    setup: { subtitle: "إعداد القتال", sceneLabel: "المشهد", professionHeader: "مهنة {side}", saveBack: "حفظ وعودة", start: "ابدأ" },
    settings: {
      subtitle: "الإعدادات",
      languageTitle: "اللغة",
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
    result: { draw: "تعادل", winner: "{side} ({profession}) فازت", again: "جولة أخرى", setup: "إعداد القتال", backMain: "العودة للقائمة" },
    scenes: {
      classic: { name: "الساحة الكلاسيكية", description: "قتال تلقائي في ساحة صغيرة" },
      super: { name: "الساحة الخارقة", description: "مهن خارقة فقط" },
    },
    professions: {
      bat: { name: "كرة الخفاش", skill: "امتصاص الأنياب", item: "أنياب الجناح الداكن" },
      venom: { name: "كرة السم", skill: "أشواك سامة", item: "شوكة سامة" },
      spider: { name: "كرة العنكبوت", skill: "عقد الشبكة", item: "خيط الشبكة" },
      lava: { name: "كرة الحمم", skill: "مسار النار", item: "نواة الحمم" },
      reaper: { name: "كرة الحاصد", skill: "حافة المنجل", item: "منجل كبير" },
      frost: { name: "كرة الجليد", skill: "مدار الجليد", item: "عجلات الجليد" },
      spear: { name: "كرة الرمح", skill: "طعنة أمامية", item: "رمح الريح" },
      blade: { name: "كرة النصل", skill: "ضربة ثقيلة", item: "نصل عريض" },
      shield: { name: "كرة الدرع", skill: "جدار الدرع", item: "درع الحارس" },
      assassin: { name: "كرة القاتل", skill: "قطع مزدوج", item: "أنياب الظل" },
      archer: { name: "كرة الرامي", skill: "سهم السماء", item: "قوس الكرمة" },
      chain: { name: "كرة المذبة", skill: "تأرجح ثقيل", item: "مذبة النجمة الحديدية" },
      mage: { name: "كرة الساحر", skill: "تعويذة ثلاثية", item: "عصا ثلاثية" },
    },
  },
};

export function getLocaleOptions() {
  return SUPPORTED_LOCALES.map((locale) => ({
    locale,
    label: translations[locale].language.self,
  }));
}

export function normalizeLocale(locale) {
  const primaryLocale = String(locale || "").toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(primaryLocale) ? primaryLocale : FALLBACK_LOCALE;
}

export function isSupportedLocale(locale) {
  const primaryLocale = String(locale || "").toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(primaryLocale);
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
