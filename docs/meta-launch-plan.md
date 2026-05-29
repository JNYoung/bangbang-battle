# Meta 小游戏推进计划

更新日期：2026-05-29

本文按 Meta Instant Games / Facebook Instant Games 上传包方向推进。由于 Meta 后台和审核规则会随账号状态变化，最终字段以登录 Meta Developer Dashboard 后的实时提示为准。

如果你是第一次使用 Meta Developer Dashboard，先按 `docs/meta-developer-beginner-guide.md` 逐步创建应用、添加 Instant Games、上传 ZIP 和跑后台测试。

## 当前工程状态

- 主游戏构建通过：`npm run build`
- 完整质量检查通过：`npm run test:ci`
- Meta 上传包已生成并校验：`release/meta-instant/profession-ball-arena-meta.zip`
- 当前 ZIP 大小约 2.2 MB，根目录包含 `index.html`、`fbapp-config.json` 和静态资源。
- `fbapp-config.json` 已配置：
  - `platform_version`: `RICH_GAMEPLAY`
  - `orientation`: `PORTRAIT`
  - `navigation_menu_version`: `NAV_FLOATING`
- `platform.js` 已支持 `FBInstant.initializeAsync()`、`setLoadingProgress()`、`startGameAsync()` 和 `getEntryPointData()`。
- 官网可构建：`official-site/dist/`
- 已配置公开域名：`professionballarena.top`
- `app-ads.txt` 已配置 AdMob 发布商 ID：`pub-2481288993515154`，仅用于 Android/iOS/Google 广告链路；Meta 小游戏广告改走 Meta Instant Games 广告接口。

## 2026-05-29 后台实操记录

- 已在 Meta Developer 创建应用：`Profession Ball Arena`
- 当前 App ID：`1013763001162439`
- 当前应用类型：`消费者`
- 已填写并保存基础设置：
  - App domain: `professionballarena.top`
  - Privacy Policy URL: `http://professionballarena.top/privacy/`
  - Terms URL: `http://professionballarena.top/terms/`
  - Data Deletion URL: `http://professionballarena.top/data-deletion/`
  - Category: `游戏`
  - Subcategory: `策略`
- 注意：这里临时使用 `http://`，因为 `https://professionballarena.top/...` 当前证书与域名不匹配，Meta 会把 URL 判定为无效。上线/提审前应修复 GitHub Pages 自定义域名 HTTPS 证书，并改回 `https://`。
- 当前消费者应用的 Add product 页面只显示 App Events、Audience Network、Facebook 登录、Webhook、Fundraisers；直接访问 Instant Games / Web Hosting 候选后台路径会回到面板或空白页。
- 新建应用流程当前也只显示 `业务` 和 `消费者` 两种应用类型；选择 `业务` 后下一页只有应用名称、联系邮箱、业务资产组合，没有 Instant Games 入口。
- GitHub Pages 配置已检查：
  - Pages source: `gh-pages`
  - CNAME: `professionballarena.top`
  - `official-site/public/CNAME` 已存在并会构建到 `official-site/dist/CNAME`
  - DNS 健康检查有效，裸域名 A 记录指向 GitHub Pages IP，`www` CNAME 指向 `jnyoung.github.io`
  - 重新触发 Pages build 后状态为 `built`
  - 仍不能启用 `https_enforced`，GitHub API 返回 `The certificate does not exist yet`

## 你需要准备的信息

### Meta 后台账号与应用

- Meta Developer 账号登录权限。
- 应用所属个人或 Business Manager 信息。
- 应用英文名和中文名，建议先统一为：
  - 中文：`职业球球斗技场`
  - 英文：`Profession Ball Arena`
- Meta 应用 ID 和 App Secret。App Secret 不要写入仓库，只用于后台配置或私密环境变量。
- 游戏分类、目标地区和支持语言。
- 是否开启 Messenger / Facebook 分享入口。如果暂不做社交传播，先按单机体验提测。

### 合规与公开页面

- 官网部署结果，至少保证以下 URL 可 HTTPS 访问：
  - `https://professionballarena.top/`
  - `https://professionballarena.top/privacy/`
  - `https://professionballarena.top/terms/`
  - `https://professionballarena.top/support/`
  - `https://professionballarena.top/data-deletion/`
  - `https://professionballarena.top/app-ads.txt`
- 开发者联系邮箱：当前为 `j.n.young0209@gmail.com`，如要换邮箱需要同步应用内文案、官网和后台。
- 数据删除说明是否满足你的实际运营流程。当前方案是本地数据清除 + 邮件联系。
- 内容分级问卷答案：轻微卡通/幻想对战，不面向儿童定向投放。
- 隐私问卷答案：当前主要涉及本地存储、基础统计预留/启用、Meta Instant Games 广告能力；移动端表单另按 Firebase/AdMob 如实填写。

### 审核素材

- 1024x1024 应用图标。
- 横竖版宣传图或封面图，按后台实际尺寸导出。
- 3-5 张游戏截图，覆盖：
  - 首次进入合规弹窗
  - 主菜单
  - 职业选择
  - 战斗画面
  - 结算/广告占位或设置
- 15-30 秒试玩录屏，展示从进入游戏到完成一局。
- 审核说明文字：
  - 游戏是 Canvas 2D 自动对战。
  - 用户先同意隐私政策和用户协议，再进入主菜单。
  - 当前没有真实 IAP。
  - 广告能力已按平台拆分：Meta 小游戏包使用 Meta Instant Games 广告接口，移动端使用 AdMob；具体启用以对应平台后台为准。

## 下一步推进计划

### P0：上传前确认

负责人：你 + Codex

- 等待或在 GitHub Pages 设置页重新触发自定义域名证书签发，直到 `https://professionballarena.top/privacy/` 不再报证书错误；然后开启 Enforce HTTPS 并把 Meta 后台 URL 改回 `https://`。
- 确认当前 Meta 账号是否具备 Instant Games Developer Platform 访问权限。
- 如果后台仍只显示 `业务` / `消费者`，需要先申请或开通 Instant Games / Gaming Services 访问；不要继续创建普通消费者应用。
- 在出现 Instant Games 应用类型或产品入口后，创建正确应用并进入 Web Hosting / Upload Bundle 页面。
- 创建 Meta 广告 placement，并把插屏 ID 配置为 `VITE_META_APP_OPEN_AD_PLACEMENT_ID`；如果后续接奖励广告，再配置 `VITE_META_REWARDED_VIDEO_PLACEMENT_ID`。
- 上传 `release/meta-instant/profession-ball-arena-meta.zip`。
- 用后台测试入口启动游戏，确认能进入合规弹窗、主菜单和一局战斗。

### P1：后台测试闭环

负责人：Codex 辅助，你在后台操作

- 如果后台报包体结构错误，优先检查 ZIP 根目录是否有嵌套文件夹。
- 如果启动卡住，检查 `FBInstant` SDK 是否注入到 `index.html`。
- 如果画面比例异常，确认后台方向选择为竖屏，`fbapp-config.json` 保持 `PORTRAIT`。
- 记录后台测试设备、浏览器、报错截图和控制台信息。

### P2：提审资料整理

负责人：你

- 填写应用基础资料、联系信息、隐私政策 URL、数据删除 URL。
- 上传图标、截图、封面图和试玩录屏。
- 填写内容分级、数据收集、广告和未成年人相关问卷。
- 添加审核说明，强调首次进入流程和核心玩法路径。

### P3：提审后跟进

负责人：你 + Codex

- 若被拒，先保存完整拒审原因、截图和后台要求。
- 对照拒审项分类：
  - 包体/启动问题：修 `platform.js` 或 `scripts/build-meta.mjs`
  - 合规文案问题：修 `legal-config.js`、`i18n.js` 或官网页面
  - 素材问题：补截图、录屏、图标或说明
  - 平台能力问题：按后台要求增删 FBInstant 能力调用
- 每次修复后重新执行 `npm run test:ci`，再上传新 ZIP。

## 当前阻塞项

- 当前 Meta 后台没有开放 Instant Games / Web Hosting 入口，现有 App ID `1013763001162439` 是消费者应用，不能作为最终小游戏上传应用使用。
- `professionballarena.top` 的 HTTPS 证书当前不匹配，需在 GitHub Pages / DNS 侧修复后再改回 HTTPS URL。
- 需要准备审核素材，尤其是后台指定尺寸的图标、封面图和截图。
- 需要在 Meta 后台确认最新审核字段；本地网络访问 Meta 文档页面出现超时，不能替代后台实时校验。

## 常用命令

```bash
npm run test:ci
npm run meta:bundle
unzip -l release/meta-instant/profession-ball-arena-meta.zip
cd official-site && npm run build
```
