# Meta 小游戏推进计划

更新日期：2026-05-30

本文按 Meta Instant Games / Facebook Instant Games 上传包方向推进。由于 Meta 后台和审核规则会随账号状态变化，最终字段以登录 Meta Developer Dashboard 后的实时提示为准。

如果你是第一次使用 Meta Developer Dashboard，先按 `docs/meta-developer-beginner-guide.md` 逐步创建应用、添加 Instant Games、上传 ZIP 和跑后台测试。

## 当前工程状态

- 主游戏构建通过：`npm run build`
- 完整质量检查通过：`npm run test:ci`
- Meta 上传包已生成并校验：`release/meta-instant/profession-ball-arena-meta.zip`
- 最近一次包体校验：2026-05-30 执行 `npm run meta:bundle` 和 `node scripts/verify-build-artifacts.mjs` 通过。
- 最近一次质量检查：2026-05-30 执行 `npm run lint:syntax && npm test && npm run test:artifacts` 通过，43 个单元测试全部通过。
- 当前 ZIP 大小约 2.2 MB，根目录包含 `index.html`、`fbapp-config.json` 和静态资源。
- `fbapp-config.json` 已配置：
  - `platform_version`: `RICH_GAMEPLAY`
  - `orientation`: `PORTRAIT`
  - `navigation_menu_version`: `NAV_FLOATING`
- `platform.js` 已支持 `FBInstant.initializeAsync()`、`setLoadingProgress()`、`startGameAsync()` 和 `getEntryPointData()`。
- 官网可构建：`official-site/dist/`
- 已配置公开域名：`professionballarena.top`
- 当前版本不展示广告，也不会发起广告请求；Meta 包仅保留 `FBInstant` 平台初始化链路。

## 2026-05-29/30 后台实操记录

- 已在 Meta Developer 创建应用：`Profession Ball Arena`
- 当前 App ID：`1013763001162439`
- 当前应用类型：`消费者`
- 已填写并保存基础设置；当前 Meta 页面已保存 HTTPS 隐私政策和服务条款：
  - App domain: `professionballarena.top`
  - Privacy Policy URL: `https://professionballarena.top/privacy/`
  - Terms URL: `https://professionballarena.top/terms/`
  - Data Deletion URL: 暂未保存；Meta 后台当前对有效 HTTPS URL 报 `name_placeholder should represent a valid URL`
  - Category: `游戏`
  - Subcategory: `策略`
- 2026-05-30 已上传并保存 1024x1024 应用图标。
- 2026-05-30 已创建 Business portfolio：`Profession Ball Arena`；完整编号保留在 Meta 后台，不写入公开仓库。
- 2026-05-30 已创建 Meta ad account：`Profession Ball Arena Ads`；完整广告账号编号保留在 Meta 后台，不写入公开仓库。
- 未添加支付方式，未创建投放广告系列，未开启任何真实广告花费。
- 2026-05-30 已确认并点击 `Connect`，后台提示成功：应用现由 `Profession Ball Arena` 管理；后续可在 Meta Business Suite 中再次核对业务资产。
- 2026-05-30 已将 GitHub Pages 自定义域名证书修复完成，并开启 Enforce HTTPS；Meta 后台隐私政策和服务条款 URL 已从临时 `http://` 改为 `https://` 并保存成功。
- 2026-05-30 再次复核基础设置页：应用仍为 `开发中` + `消费者` 类型，分类为 `游戏 / 策略`，基础资料页显示 `已保存`。
- 2026-05-30 Meta 后台的 `用户数据删除` 字段对 `https://professionballarena.top/data-deletion/`、`https://professionballarena.top/data-deletion/index.html` 和同域隐私政策 URL 均报 `name_placeholder should represent a valid URL`；清空该字段后可保存。不要回退为 `http://`，后续需在正确 Instant Games 应用或 Meta 表单恢复后重新填写。
- 当前消费者应用的 Add product 页面只显示 App Events、Audience Network、Facebook 登录、Webhook、Fundraisers；直接访问 Instant Games / Web Hosting 候选后台路径会回到面板或空白页。
- 2026-05-30 再次进入 Add product 区域确认：仍没有 Instant Games / Web Hosting / Gaming Services 入口。
- 2026-05-30 进入 Audience Network 变现入口后，后台要求先完善国家/地区并继续开通变现资料；尚未提交该步骤，因为它会把业务资料继续提交到 Meta Audience Network 变现流程。该入口不等同于 Instant Games Web Hosting，暂不能上传小游戏 ZIP。
- 2026-05-30 Business portfolio 在基础设置页仍显示 `未验证`；目前不影响已保存基础资料，但若后续申请高级访问权、商业化或用户数据能力，可能需要完成公司验证。
- 新建应用流程当前也只显示 `业务` 和 `消费者` 两种应用类型；选择 `业务` 后下一页只有应用名称、联系邮箱、业务资产组合，没有 Instant Games 入口。
- `必要操作` 页面显示当前没有任何必要措施。
- `应用审核 > 申请` 页面显示当前没有未提交内容；本次提交尚未添加任何权限和功能。
- `应用审核 > 权限和功能` 页面显示标准访问权列表。最小单机游戏提审暂不申请高级访问权；如果后续接 Facebook 登录、邮箱或公开资料相关功能，再按后台要求完成验证和审核申请。
- GitHub Pages 配置已检查：
  - Pages source: `gh-pages`
  - CNAME: `professionballarena.top`
  - `official-site/public/CNAME` 已存在并会构建到 `official-site/dist/CNAME`
  - DNS 健康检查有效，裸域名 A 记录指向 GitHub Pages IP，`www` CNAME 指向 `jnyoung.github.io`
  - 2026-05-30 通过 Pages API 清空并重新写回自定义域名后重新触发构建，状态为 `built`
  - HTTPS certificate state: `approved`，覆盖 `professionballarena.top` 和 `www.professionballarena.top`，到期日 `2026-08-28`
  - `https_enforced`: `true`

## 你需要准备的信息

### Meta 后台账号与应用

- Meta Developer 账号登录权限。
- 应用所属个人或 Business Manager 信息。
- 应用英文名和中文名，建议先统一为：
  - 中文：`斗球球`
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
- 开发者联系邮箱：当前为 `j.n.young0209@gmail.com`，如要换邮箱需要同步应用内文案、官网和后台。
- 数据删除说明是否满足你的实际运营流程。当前方案是本地数据清除 + 邮件联系。
- 内容分级问卷答案：轻微卡通/幻想对战，不面向儿童定向投放。
- 隐私问卷答案：当前主要涉及本地存储、基础统计预留/启用；移动端表单按 Firebase Analytics 和无广告状态如实填写。

### 审核素材

- 1024x1024 应用图标。
- 已有候选宣传图/封面图：`official-site/public/assets/arena-hero.png`，尺寸 `1672 x 941`。如果 Meta 后台要求固定比例或最小尺寸，再按后台规格二次裁切。
- 已有候选应用图标：`public/app-icon.png`，尺寸 `1024 x 1024`。
- 已有候选截图素材：
  - `store-assets/screenshots/google-phone/01-classic-battle.png`
  - `store-assets/screenshots/google-phone/02-profession-select.png`
  - `store-assets/screenshots/google-phone/03-item-mode.png`
  - `store-assets/screenshots/google-phone/04-hero-battle.png`
  - `store-assets/screenshots/google-phone/05-settings-privacy.png`
  - `store-assets/screenshots/apple-iphone-69/01-classic-battle.png`
  - `store-assets/screenshots/apple-iphone-69/02-profession-select.png`
  - `store-assets/screenshots/apple-iphone-69/03-item-mode.png`
  - `store-assets/screenshots/apple-iphone-69/04-hero-battle.png`
  - `store-assets/screenshots/apple-iphone-69/05-settings-privacy.png`
- 3-5 张截图建议优先选：
  - 首次进入合规弹窗
  - 主菜单
  - 职业选择
  - 战斗画面
  - 结算/广告占位或设置
- 已有候选试玩录屏：`store-assets/review-videos/profession-ball-arena-meta-review.mp4`，约 25 秒，竖屏 `540 x 960`，开头展示合规页，随后进入一局战斗。
- 审核说明文字：
  - 游戏是 Canvas 2D 自动对战。
  - 用户先同意隐私政策和用户协议，再进入主菜单。
  - 当前没有真实 IAP。
  - 当前版本不展示广告，也不会发起广告请求。

## 下一步推进计划

### P0：上传前确认

负责人：你 + Codex

- GitHub Pages HTTPS 已修复，`https://professionballarena.top/privacy/` 可正常访问；Meta 后台隐私政策和服务条款 URL 已保存为 `https://`。
- App ID `1013763001162439` 已绑定到 `Profession Ball Arena` 业务资产组合。
- 基础设置已复核为已保存；Business portfolio 仍未验证，后续如 Meta 要求商业化或高级访问权，需要在 Business Suite 完成验证。
- 确认当前 Meta 账号是否具备 Instant Games Developer Platform 访问权限。
- 如果后台仍只显示 `业务` / `消费者`，需要先申请或开通 Instant Games / Gaming Services 访问；不要继续创建普通消费者应用。
- 在出现 Instant Games 应用类型或产品入口后，创建正确应用并进入 Web Hosting / Upload Bundle 页面。
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
- `professionballarena.top` 的 HTTPS 证书已修复并开启强制 HTTPS；Meta 后台隐私政策和服务条款 URL 已保存为 HTTPS。
- Meta 后台 `用户数据删除` 字段暂时拒绝有效 HTTPS URL，需后续重试或在正确 Instant Games 应用中重新填写。
- App 已绑定到 `Profession Ball Arena` 业务资产组合；如后台后续要求，需在 Meta Business Suite 再次核对资产归属。
- Business portfolio 仍显示未验证；如后续申请高级访问权、Audience Network 商业化或 Meta 要求资产验证，需要补公司验证资料。
- Meta ad account 已创建但没有付款方式；没有支付方式前不能做真实投放或完成完整商业化闭环。
- Audience Network 变现入口已打开到资料完善弹窗，但需要提交国家/地区后继续；提交前应确认是否要开通该变现档案。
- 封面图、截图和试玩录屏已有候选素材；还需要按 Meta 后台尺寸要求二次裁切或上传。
- 需要在 Meta 后台确认 Instant Games 解锁后的最新审核字段；后台实时提示优先于本地文档。

## 回归测试重点

- 差异化打包必须持续通过：Meta ZIP 注入 `FBInstant` SDK，且不包含 `@capacitor-community/admob` 导入路径。
- 广告服务必须保持禁用，不调用 Meta 广告 API、AdMob 或本地 mock 广告。
- 每次改动 `services.js`、`platform.js`、`scripts/build-meta.mjs`、`scripts/verify-build-artifacts.mjs` 或合规文案后，至少执行 `npm run lint:syntax && npm test && npm run test:artifacts`。
- 手工回归时重点检查：首次合规弹窗、主菜单、职业选择、战斗、结算、隐私政策/数据删除链接。

## 常用命令

```bash
npm run test:ci
npm run meta:bundle
unzip -l release/meta-instant/profession-ball-arena-meta.zip
cd official-site && npm run build
```
