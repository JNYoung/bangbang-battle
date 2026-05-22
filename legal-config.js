import { getLocalizedLegalDocument, translate } from "./i18n.js";

export const LegalConfig = {
  version: "2026.05.22",
  companyName: "【请替换为公司主体名称】",
  contactEmail: "privacy@example.com",
  appName: "职业球球斗技场",
  ageRatingGuidance: "本游戏包含轻微卡通/幻想对战元素，不面向儿童定向投放。",
  privacyPolicy: {
    title: "隐私政策",
    sections: [
      {
        title: "一、我们如何处理信息",
        body:
          "当前版本不接入真实第三方统计、广告或支付 SDK，不收集账号、定位、通讯录、相机、麦克风、精确设备标识等个人敏感信息。游戏仅在本地保存协议同意状态、职业选择和基础设置。",
      },
      {
        title: "二、本地保存",
        body:
          "为了让你下次打开游戏时保留选择，本游戏会使用设备本地存储保存隐私政策版本、用户协议版本、球 A/球 B 的职业选择和设置项。这些数据不会上传到服务器。",
      },
      {
        title: "三、统计、广告与支付预留",
        body:
          "项目代码预留了统计、广告和应用内购买接口，但默认实现不会发送网络请求、不会展示广告、不会发起支付。若未来接入真实 SDK，我们会先更新本政策并重新获取必要同意。",
      },
      {
        title: "四、未成年人和内容分级",
        body:
          "本游戏不是专门面向儿童的产品。由于存在血量、武器职业和自动对战，请在 Apple App Store、Google Play 和其他渠道按轻微卡通/幻想暴力如实填写内容评级问卷。",
      },
      {
        title: "五、联系我们",
        body:
          "运营主体：" +
          "【请替换为公司主体名称】" +
          "。如需咨询隐私相关事项，请通过 privacy@example.com 联系我们。提审前请将主体和邮箱替换为正式信息。",
      },
    ],
  },
  userAgreement: {
    title: "用户协议",
    sections: [
      {
        title: "一、服务说明",
        body:
          "欢迎使用《职业球球斗技场》。本游戏提供基于 Canvas 的 2D 自动对战体验，玩家可以选择双方职业并观看自动战斗结果。",
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

export function getLegalDocument(type, config = LegalConfig, locale = "zh") {
  return getLocalizedLegalDocument(locale, type, {
    appName: translate(locale, "app.name"),
    companyName: config.companyName,
    contactEmail: config.contactEmail,
  });
}
