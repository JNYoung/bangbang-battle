# Meta Developer 新手引导

更新日期：2026-05-29

这份文档面向第一次使用 Meta Developer Dashboard 的开发者。后台字段名称可能会随 Meta 更新略有变化，遇到不一致时以后台页面提示为准，并把截图发给 Codex 继续判断。

## 0. 先准备好本地材料

当前项目已经生成可上传测试包：

```text
release/meta-instant/profession-ball-arena-meta.zip
```

上传前先确认：

- 游戏名：`Profession Ball Arena` / `职业球球斗技场`
- 官网：`https://professionballarena.top/`
- 隐私政策：`https://professionballarena.top/privacy/`
- 用户协议：`https://professionballarena.top/terms/`
- 支持页面：`https://professionballarena.top/support/`
- 数据删除说明：`https://professionballarena.top/data-deletion/`
- 联系邮箱：`j.n.young0209@gmail.com`

2026-05-29 实操注意：当前 `https://professionballarena.top/...` 证书与域名不匹配，Meta 后台会把 URL 判为无效。临时保存后台时用了 `http://professionballarena.top/...`；提审前必须修复 HTTPS 证书并切回 HTTPS。代码侧 `official-site/public/CNAME` 和 DNS 指向已正确，GitHub Pages 仍提示证书尚未生成，需要等待 GitHub 签发证书或在仓库 Pages 设置里重新检查域名。

## 1. 创建 Meta Developer 应用

1. 打开 `https://developers.facebook.com/apps/`。
2. 登录你的 Facebook / Meta 账号。
3. 点击创建应用，应用类型优先选择 `Instant Games`、`Gaming Services` 或明确写着小游戏/游戏托管的类型。
4. 填写应用名称：`Profession Ball Arena`。
5. 填写联系邮箱：`j.n.young0209@gmail.com` 或你准备用于审核沟通的邮箱。
6. 如果后台要求选择 Business Manager：
   - 个人开发者可以先选择个人/无企业归属的路径。
   - 如果必须绑定企业，就需要准备 Business Manager 资料。

完成后记录：

```text
Meta App ID:
Meta App Secret: 不要发到公开仓库，不要写进代码。
```

2026-05-29 已创建过一个消费者应用：

```text
App Name: Profession Ball Arena
App ID: 1013763001162439
App Type: 消费者
```

这个应用可保留作记录，但当前没有 Instant Games / Web Hosting 入口，不能作为最终上传小游戏 ZIP 的应用。不要删除它，除非你明确确认要清理旧应用。

## 2. 添加 Instant Games 能力

进入应用后台后，找类似这些入口：

- `Add product`
- `Products`
- `Instant Games`
- `Facebook Instant Games`
- `Gaming Services`

添加后重点看三类页面：

- 基础设置：应用名、图标、联系邮箱、隐私政策 URL、数据删除 URL。
- Web Hosting / Bundle 上传：上传 `profession-ball-arena-meta.zip`。
- 测试/发布：添加测试人员、启动测试链接、提交审核。

如果找不到 Instant Games，先截图后台左侧菜单和 Add product 页面，因为不同账号、地区或应用类型可能影响可见产品。

本次实操结果：

- `消费者` 应用的产品入口只显示 App Events、Audience Network、Facebook 登录、Webhook、Fundraisers。
- 新建应用页当前只显示 `业务` 和 `消费者` 两类；选择 `业务` 后下一页也没有 Instant Games 选项。
- 这通常意味着当前账号/后台没有开放 Instant Games Developer Platform 访问权限。下一步应先开通或申请该平台访问，而不是继续创建普通应用。

## 3. 配置基础设置

优先填写这些字段：

```text
Display Name: Profession Ball Arena
Contact Email: j.n.young0209@gmail.com
Privacy Policy URL: https://professionballarena.top/privacy/
Terms of Service URL: https://professionballarena.top/terms/
Data Deletion Instructions URL: https://professionballarena.top/data-deletion/
App Domains: professionballarena.top
Category: Games / Arcade / Casual，按后台选项最接近的填
```

注意：

- 隐私政策页面必须公网可访问，不能需要登录。
- 数据删除说明页面也必须公网可访问。
- 域名建议只填裸域名 `professionballarena.top`，URL 字段再填完整 `https://...`。

## 4. 上传游戏 ZIP

在 Instant Games 的 Web Hosting 或类似页面上传：

```text
release/meta-instant/profession-ball-arena-meta.zip
```

上传成功后一般会看到一个 build、version 或 hosting 状态。

如果后台报错：

- `bundle config missing`：ZIP 根目录没有 `fbapp-config.json`，或 ZIP 内多套了一层文件夹。
- `index.html missing`：ZIP 根目录没有 `index.html`，或上传了错误文件。
- JSON 配置错误：检查 `public/fbapp-config.json`。
- 启动卡住：检查后台测试日志、浏览器控制台，以及 `FBInstant` SDK 是否加载。

## 4.1 配置 Meta 广告

Meta 小游戏包不使用 Google AdMob。广告链路已经在代码里按平台拆分：

- Meta Instant Games：使用 `FBInstant.getInterstitialAdAsync()` 和预留的 `FBInstant.getRewardedVideoAsync()`。
- Android/iOS：继续使用 Google AdMob。
- 普通 Web 调试：使用本地 Canvas 测试广告。

在 Meta 后台创建广告 placement 后，构建 Meta ZIP 前配置：

```bash
VITE_META_APP_OPEN_AD_PLACEMENT_ID=你的_Meta_插屏广告位_ID npm run meta:bundle
```

如果后续要做奖励广告，再增加：

```bash
VITE_META_REWARDED_VIDEO_PLACEMENT_ID=你的_Meta_激励视频广告位_ID npm run meta:bundle
```

没有配置 Meta placement ID 时，游戏会安全跳过广告请求，不会回退到 AdMob。

## 5. 添加测试人员并试玩

后台通常需要先把 Facebook 账号加入测试角色：

- Developer
- Tester
- Administrator

添加后，用后台提供的测试链接打开游戏。测试路径：

1. 打开游戏。
2. 看到隐私政策和用户协议弹窗。
3. 同意后进入主菜单。
4. 选择模式和职业。
5. 开始一局战斗。
6. 看到结算结果。

测试时如果出现任何异常，保存：

- 后台报错截图。
- 浏览器控制台错误。
- 当前上传 build/version。
- 设备、浏览器和时间。

## 6. 准备审核材料

至少准备：

- 1024x1024 应用图标。
- 3-5 张截图：合规弹窗、主菜单、职业选择、战斗、结算。
- 15-30 秒试玩录屏。
- 一段审核说明：

```text
Profession Ball Arena is a portrait Canvas 2D auto-battle game. Users first review and accept the Privacy Policy and Terms before entering the main menu. The core flow is: choose a battle mode, select professions, start a match, and view the result. The current version has no real in-app purchases. Ads are designed to use non-personalized requests where applicable.
```

## 7. 第一次提审建议

第一次提审不要一次性打开复杂能力。建议先按最小范围提交：

- 单机试玩体验。
- 不申请额外社交权限。
- 不接入排行榜、分享、邀请等扩展能力。
- 广告按后台要求如实填写；如果 Meta Instant Games 环境暂未展示广告，就在说明里写清当前行为。

等第一版通过或后台测试稳定后，再逐步加分享、排行榜、邀请、商业化能力。

## 8. 你操作时发给 Codex 的信息

如果你想让我继续带你走后台，每一步发这些就够：

- 当前页面截图。
- 你点到的菜单名称。
- 报错原文。
- 是否已经创建 App ID。
- 是否已经看到 Instant Games / Web Hosting 页面。

不要发 App Secret、密码、验证码、支付信息。
