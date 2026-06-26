# Meta 小游戏上架交接清单

生成时间：2026-06-21 22:00 CST

## 今晚已完成

- 完整质量检查通过：`npm run test:ci`
- 官网构建通过：`cd official-site && npm run build`
- 公网合规页面检查通过：官网、隐私政策、用户协议、支持页、数据删除说明均返回 HTTPS 200。
- Meta 上传包已重新生成并校验：`release/meta-instant/profession-ball-arena-meta.zip`
- ZIP 根目录已确认包含 `index.html`、`fbapp-config.json`、`assets/` 和图标资源。
- Meta 包已确认注入 `https://connect.facebook.net/en_US/fbinstant.latest.js`。
- Meta 包已确认不包含 `@capacitor-community/admob` 导入路径。

## 可上传文件

```text
release/meta-instant/profession-ball-arena-meta.zip
```

校验信息：

```text
Size: 2,372,923 bytes
SHA-256: d17d3ab59308ef6364411e6cb38000a2ea1b625500a15d5fd336e3a3c6314262
```

ZIP 根目录清单：

```text
app-icon.png
apple-touch-icon.png
assets/
assets/index-0AbFxexX.css
assets/index-C9nhT-Yx.js
favicon.ico
fbapp-config.json
icon-192.png
icon-32.png
icon-512.png
index.html
site.webmanifest
```

## Meta 后台字段建议

```text
Display Name: Profession Ball Arena
Chinese Name: 斗球球
App Domain: professionballarena.top
Privacy Policy URL: https://professionballarena.top/privacy/
Terms URL: https://professionballarena.top/terms/
Data Deletion URL: https://professionballarena.top/data-deletion/
Contact Email: j.n.young0209@gmail.com
Category: Games / Strategy or closest available option
Orientation: Portrait
```

如果 `Data Deletion URL` 仍报 `name_placeholder should represent a valid URL`，先不要改回 `http://`。保留其它 HTTPS 字段并记录后台报错截图。

## 公网页面检查

2026-06-21 22:05 CST 使用 `curl -I --max-time 20` 检查，以下页面均返回 `HTTP/2 200`：

```text
https://professionballarena.top/
https://professionballarena.top/privacy/
https://professionballarena.top/terms/
https://professionballarena.top/support/
https://professionballarena.top/data-deletion/
```

## 素材路径

图标：

```text
public/app-icon.png
official-site/public/assets/app-icon.png
```

封面候选：

```text
official-site/public/assets/arena-hero.png
```

截图候选：

```text
store-assets/screenshots/google-phone/01-classic-battle.png
store-assets/screenshots/google-phone/02-profession-select.png
store-assets/screenshots/google-phone/03-item-mode.png
store-assets/screenshots/google-phone/04-hero-battle.png
store-assets/screenshots/google-phone/05-settings-privacy.png
store-assets/screenshots/apple-iphone-69/01-classic-battle.png
store-assets/screenshots/apple-iphone-69/02-profession-select.png
store-assets/screenshots/apple-iphone-69/03-item-mode.png
store-assets/screenshots/apple-iphone-69/04-hero-battle.png
store-assets/screenshots/apple-iphone-69/05-settings-privacy.png
```

审核试玩录屏候选：

```text
store-assets/review-videos/profession-ball-arena-meta-review.mp4
```

## 审核说明草稿

```text
Profession Ball Arena is a portrait Canvas 2D auto-battle game for Meta Instant Games. Users first review and accept the Privacy Policy and Terms before entering the main menu. The core flow is: choose a battle mode, select professions, start a match, and view the result. The current version has no real in-app purchases and does not show ads or send ad requests.
```

## 后台继续步骤

1. 打开 Meta Developer Dashboard，确认当前账号是否出现 `Instant Games`、`Facebook Instant Games`、`Gaming Services` 或 `Web Hosting` 入口。
2. 如果仍只有 `业务` / `消费者` 应用类型，不要继续创建普通消费者应用；先申请或开通 Instant Games Developer Platform 访问。
3. 如果已出现 Instant Games 入口，进入 Web Hosting / Bundle 上传页，上传上面的 ZIP。
4. 上传后用后台测试链接启动游戏，确认能看到合规弹窗、主菜单、职业选择、战斗和结算。
5. 遇到付款、税务、公司验证、身份验证或最终提交审核按钮时，先人工复核。

## 当前阻塞

- 现有 App ID `1013763001162439` 记录为消费者应用，历史检查未看到 Instant Games / Web Hosting 入口。
- 2026-06-21 夜间尝试通过 Chrome 自动化进入 Meta 后台未成功，页面停在 `about:blank`；未进行任何后台写操作。
- 2026-06-22 08:15 CST 再次尝试推进上传：
  - 已按授权打开新的 Chrome 窗口并进入 `Profession Ball Arena` 后台标签页。
  - Chrome 中 `developers.facebook.com/apps/1013763001162439/...` 页面标题可更新为 App 面板/应用设置，但内容区持续显示浅蓝空白，左侧菜单和表单不渲染，无法操作 `Web Hosting` 或上传 ZIP。
  - 直接访问 `/hosting/` 会回到或停留在 App 面板，未出现 Web Hosting 上传页。
  - Safari 可打开公开 Meta 开发者首页，但未进入已登录 App 后台，因此不能替代 Chrome 完成上传。
  - 未上传文件、未保存后台表单、未发布、未提交审核。
- 最终上传、后台测试和提交审核仍需要可用的 Meta Developer Dashboard 登录态。
