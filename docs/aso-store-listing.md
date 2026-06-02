# ASO Store Listing Pack

Updated: 2026-05-29

This pack prepares `斗球球` / `Profession Ball Arena` for Apple App Store, Google Play, and mobile launch review. It is based on the current app bundle id `com.professionballarena.game`, the public site `https://professionballarena.top/`, and the in-app compliance flow already present in this repo.

## ASO Readiness Score

Overall: 82 / 100

- Metadata: 25 / 30. The name is clear and under both Apple and Google 30-character limits. Descriptions are ready, but should be localized beyond zh-CN/en-US before broad global launch.
- Screenshots and visual assets: 18 / 25. App icon assets exist and screenshot capture is automated. Final upload still needs a human pass in App Store Connect / Play Console to confirm every required device slot.
- Compliance: 22 / 25. Privacy, terms, support, data deletion, consent gating, AdMob disclosure, and age-rating guidance are in place. Apple China mainland availability remains a hard compliance decision.
- Ratings strategy: 7 / 10. The compliant review timing plan is ready, but native in-app review APIs are not yet implemented.
- Launch operations: 10 / 10. Local `npm run test:ci` passes and release docs already describe Android/iOS packaging constraints.

## Store Positioning

Recommended primary positioning:

`A fast portrait auto-battle game where players choose professions, weapons, and heroes, then watch compact pixel-arena matches unfold.`

Do not use `球球大作战` as the public app name, subtitle, keyword, or comparison term. It is likely to be interpreted as another game or trademark reference. Keep the public brand as `斗球球` / `Profession Ball Arena`.

## Apple App Store Metadata

### zh-CN

- App Name: `斗球球`
- Subtitle: `职业搭配的自动对战`
- Primary Category: `Games`
- Subcategories: `Action`, `Casual`
- Promotional Text: `在小地图里选择职业、道具或英雄阵容，观看球球自动开战。轻量对局、多语言界面，适合碎片时间快速体验。`
- Keywords: `球球,自动战斗,休闲,竞技,职业,道具,像素,单机,策略,英雄`
- Support URL: `https://professionballarena.top/support/`
- Marketing URL: `https://professionballarena.top/`
- Privacy Policy URL: `https://professionballarena.top/privacy/`

Description:

```text
斗球球是一款竖屏 2D 自动对战小游戏。你可以选择双方职业、切换道具或英雄模式，然后观看球球在像素竞技场里自动碰撞、释放技能、拾取武器并决出胜负。

核心特色：
- 快速开局：轻量对局，适合碎片时间体验。
- 多职业组合：长矛球、大刀球、盾牌球、刺客球、弓箭球、法师球等职业各有战斗节奏。
- 道具模式：场内随机出现刀、长枪、弓箭、火箭筒、法杖、防御建筑等道具。
- 英雄模式：使用英雄生命、魔法和专属技能，观看更高强度的自动战斗。
- 设置透明：首次进入前展示隐私政策和用户协议，统计与广告可在设置中关闭。
- 多语言界面：支持中文、繁体中文、英文、日文、法文、德文、阿拉伯文等界面语言。

本游戏包含轻微卡通/幻想对战元素，不面向儿童定向设计。当前版本不包含真实应用内购买。
```

Review Notes:

```text
The app is a portrait Canvas 2D auto-battle game wrapped with Capacitor. On first launch, users review and accept the Privacy Policy and User Agreement before entering the main menu. Core review path: accept terms -> Start Game -> choose professions or mode -> Start -> watch battle -> result screen. The current version has no real in-app purchases. Analytics and ads are gated by user consent and can be disabled in Settings.
```

### en-US

- App Name: `Profession Ball Arena`
- Subtitle: `Pixel auto-battle arena`
- Primary Category: `Games`
- Subcategories: `Action`, `Casual`
- Promotional Text: `Pick professions, weapons, or heroes and watch compact pixel-ball battles unfold in a fast portrait arena.`
- Keywords: `auto battle,arena,ball,brawler,pixel,casual,strategy,heroes,weapons,offline,arcade`
- Support URL: `https://professionballarena.top/support/`
- Marketing URL: `https://professionballarena.top/`
- Privacy Policy URL: `https://professionballarena.top/privacy/`

Description:

```text
Profession Ball Arena is a portrait 2D auto-battle game built for quick mobile sessions. Choose professions, switch between item and hero modes, then watch pixel balls collide, cast skills, pick up weapons, and fight for the win.

Features:
- Fast rounds: start a match quickly and watch the battle unfold.
- Profession matchups: spear, blade, shield, assassin, archer, mage, summoner, and more.
- Item mode: random weapons and defensive tools appear inside the arena.
- Hero mode: heroes use health, mana, and signature skills for stronger matchups.
- Transparent settings: privacy and terms appear before the main menu, and analytics or ads can be disabled in Settings.
- Multi-language UI: includes Simplified Chinese, Traditional Chinese, English, Japanese, French, German, and Arabic.

This game contains mild cartoon/fantasy combat and is not directed at children. This version does not include real in-app purchases.
```

## Google Play Metadata

### zh-CN

- App name: `斗球球`
- Short description: `选择职业与道具，观看球球在像素竞技场自动开战。`
- Full description:

```text
斗球球是一款竖屏 2D 自动对战小游戏，适合快速开一局、观察不同职业和道具组合的战斗结果。

你可以选择双方职业，进入经典斗技场；也可以切换到道具模式，让球球随机拾取武器和建筑；还可以体验英雄模式，观看英雄生命、魔法和专属技能的对抗。

主要内容：
- 自动对战：选择配置后即可开始，战斗过程自动推进。
- 多职业：长矛球、大刀球、盾牌球、刺客球、弓箭球、法师球、召唤师等。
- 随机道具：刀、长枪、弓箭、手枪、火箭筒、法杖和防御建筑。
- 多语言：支持中文、繁体中文、英文、日文、法文、德文、阿拉伯文等界面语言。
- 透明设置：首次进入前展示隐私政策和用户协议，统计与广告可在设置中关闭。

内容提示：本游戏包含轻微卡通/幻想对战元素，不面向儿童定向设计。当前版本不包含真实应用内购买。
```

### en-US

- App name: `Profession Ball Arena`
- Short description: `Pick professions and watch quick pixel-ball auto battles.`
- Full description:

```text
Profession Ball Arena is a portrait 2D auto-battle game for quick mobile sessions and compact arena matchups.

Choose two professions and start a classic duel, switch to item mode for random weapons and defensive tools, or enter hero mode for battles with health, mana, and signature skills.

What is inside:
- Auto battles: configure the match, start, and watch the fight play out.
- Profession variety: spear, blade, shield, assassin, archer, mage, summoner, and more.
- Random items: swords, spears, bows, pistols, rockets, staffs, and defensive buildings.
- Multi-language UI: Simplified Chinese, Traditional Chinese, English, Japanese, French, German, Arabic, and more.
- Transparent settings: privacy and terms appear before the main menu, and analytics or ads can be disabled in Settings.

Content note: this game contains mild cartoon/fantasy combat and is not directed at children. This version does not include real in-app purchases.
```

## Screenshot Set

Generated screenshots should be placed in:

- `store-assets/screenshots/apple-iphone-69/`
- `store-assets/screenshots/google-phone/`

Recommended upload order:

1. `01-classic-battle.png` - active arena combat.
2. `02-profession-select.png` - profession and mode setup.
3. `03-item-mode.png` - random items and weapons.
4. `04-hero-battle.png` - hero mode battle.
5. `05-settings-privacy.png` - settings, privacy, and transparent controls.

Optional caption themes for future marketing variants:

- `职业搭配，自动开战`
- `随机道具，局局不同`
- `英雄技能，强度对撞`
- `轻量竖屏，快速一局`

For Google Play, avoid screenshots that are mostly title cards or decorative text. Use actual gameplay/UI as the visual base.

## Ratings And Reviews Plan

Do not buy ratings, incentivize reviews, gate features behind reviews, or ask users to give a 5-star review.

Recommended timing:

- Only consider prompting after a successful result screen, not at first launch.
- Wait until the user has completed at least 4 matches and has spent at least 2 separate sessions in the app.
- Prompt at most once per app version and back off for at least 30 days if no prompt is shown or the user dismisses it.
- Never ask a pre-question such as "Do you like this app?" before the native review prompt.
- Keep a persistent support/contact entry in Settings and on the store page for frustrated users.
- If adding a manual `Rate this app` settings button later, open the store listing write-review URL instead of forcing the native in-app review API.

Implementation status:

- Current code has no native review prompt yet.
- Recommended future bridge:
  - iOS: StoreKit `RequestReviewAction` / `SKStoreReviewController` after the result screen delay.
  - Android: Google Play In-App Review API after the result screen delay.

## Compliance And Launch Checklist

### Required before App Store submission

- Full Xcode installed and selected.
- Apple Developer team, signing certificate, provisioning profile, and App Store Connect app record.
- Signed archive uploaded through Xcode Organizer or Transporter.
- App privacy answers aligned with actual behavior: local preferences, Firebase Analytics after consent, AdMob ads after consent, no account system, no precise location, no contacts/camera/microphone.
- Age rating answered as mild cartoon/fantasy violence, not Made for Kids.
- If releasing in China mainland, prepare ICP filing and game approval/ISBN materials or exclude China mainland from availability.

### Required before Google Play production

- Google Play developer account and app record.
- Release AAB signed with the project release key or Play App Signing setup.
- Data safety form aligned with actual behavior: local app data, analytics after consent, AdMob ads after consent, no account system, no real IAP.
- App category: Game. Suggested tags: casual, action, offline, single player if available in Play Console.
- Content rating questionnaire answered as mild cartoon/fantasy violence.
- App access instructions: no login required.

### Public URLs

- Homepage: `https://professionballarena.top/`
- Privacy: `https://professionballarena.top/privacy/`
- Terms: `https://professionballarena.top/terms/`
- Support: `https://professionballarena.top/support/`
- Data deletion: `https://professionballarena.top/data-deletion/`
- app-ads.txt: `https://professionballarena.top/app-ads.txt`

## Official References Checked

- Apple App Store Connect app information: https://developer.apple.com/help/app-store-connect/reference/app-information/app-information
- Apple screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- Apple platform version metadata: https://developer.apple.com/help/app-store-connect/reference/platform-version-information/
- Apple product page guidance: https://developer.apple.com/app-store/product-page/
- Apple ratings and reviews: https://developer.apple.com/app-store/ratings-and-reviews/
- Google Play app setup and metadata limits: https://support.google.com/googleplay/android-developer/answer/9859152
- Google Play preview assets: https://support.google.com/googleplay/android-developer/answer/9866151
- Google Play metadata policy: https://support.google.com/googleplay/android-developer/answer/9898842
- Google Play In-App Reviews API: https://developer.android.com/guide/playcore/in-app-review
