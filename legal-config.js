import { getLocalizedLegalDocument, translate } from "./i18n.js";

export const LegalConfig = {
  version: "2026.05.29",
  developerName: "JN.Young",
  contactEmail: "j.n.young0209@gmail.com",
  appName: "斗球球",
  ageRatingGuidance: "本游戏包含轻微卡通/幻想对战元素，不面向儿童定向投放。",
  privacyPolicy: {
    title: "隐私政策",
    sections: [
      {
        title: "一、我们如何处理信息",
        body:
          "同意后，本游戏会在已配置平台通过 Firebase Analytics 上报基础游戏与性能事件，例如初始化成功、开始游戏、游戏结束、帧率快照和设置选择。不收集账号、定位、通讯录、相机、麦克风等敏感权限数据。",
      },
      {
        title: "二、本地保存",
        body:
          "为了让你下次打开游戏时保留选择，本游戏会使用设备本地存储保存隐私政策版本、用户协议版本、球 A/球 B 的职业选择和设置项。",
      },
      {
        title: "三、统计、广告与支付",
        body:
          "数据统计和广告展示可在设置中关闭，撤回同意会同时关闭统计与广告。当前版本按平台使用广告能力：Meta 小游戏环境通过 Meta Instant Games 广告接口展示插屏或激励视频，Android/iOS 通过 Google AdMob 展示应用场景广告。对应广告平台可能为了展示、衡量和防止广告欺诈处理广告相关信息。当前版本不接入应用内购买，不会发起支付。",
      },
      {
        title: "四、未成年人和内容分级",
        body:
          "本游戏不是专门面向儿童的产品。由于存在血量、武器职业和自动对战，请在 Apple App Store、Google Play 和其他渠道按轻微卡通/幻想暴力如实填写内容评级问卷。",
      },
      {
        title: "五、联系我们",
        body:
          "开发者：" +
          "JN.Young" +
          "。如需咨询隐私相关事项，请通过 j.n.young0209@gmail.com 联系我们。",
      },
    ],
  },
  userAgreement: {
    title: "用户协议",
    sections: [
      {
        title: "一、服务说明",
        body:
          "欢迎使用《斗球球》。本游戏提供基于 Canvas 的 2D 自动对战体验，玩家可以选择双方职业并观看自动战斗结果。",
      },
      {
        title: "二、用户行为",
        body:
          "你应遵守适用法律法规和应用商店规则，不得利用本游戏进行破坏、逆向攻击、作弊传播或其他影响服务稳定性的行为。",
      },
      {
        title: "三、虚拟内容和付费预留",
        body:
          "当前版本没有真实付费商品。代码中的 IAP 能力仅为后续扩展预留，不会在当前版本中产生扣费。若未来上线付费内容，将以商店展示和实际购买流程为准。",
      },
      {
        title: "四、免责声明",
        body:
          "游戏仍处于早期版本，职业数值、视觉表现、平台能力和内容可能会持续调整。我们会尽力保持体验稳定，但不承诺所有设备上完全一致。",
      },
      {
        title: "五、协议更新",
        body:
          "当协议或隐私政策发生重要变化时，游戏会重新展示确认页面。继续使用前，你需要阅读并同意更新后的条款。",
      },
    ],
  },
};

export function getLegalVersionKey(config = LegalConfig) {
  return `${config.version}`;
}

export function getDeveloperContactMailtoUrl(config = LegalConfig) {
  const subject = `${config.appName} Support`;
  const body = [
    "请描述你遇到的问题：",
    "",
    "设备/系统：",
    "应用版本：",
    "复现步骤：",
  ].join("\n");

  return `mailto:${config.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getLegalDocument(type, config = LegalConfig, locale = "zh") {
  return getLocalizedLegalDocument(locale, type, {
    appName: translate(locale, "app.name"),
    developerName: config.developerName,
    contactEmail: config.contactEmail,
  });
}
