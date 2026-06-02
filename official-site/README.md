# 斗球球官网

这是独立于游戏主体工程的静态官网，用于公开应用信息、App 下载入口、战报分享落地页、隐私政策、用户协议、支持联系方式、数据删除说明和 `app-ads.txt`。

## 开发命令

```bash
npm run dev
npm run build
npm run preview
```

## 当前线上配置

- `public/app-ads.txt`：已配置 AdMob 发布商 ID `pub-2481288993515154`。
- 页面中的官网域名已配置为 `professionballarena.top`，请确保该域名和商店后台填写的开发者网站一致。
- `/download/`：提供 Android / iOS 下载入口和平台跳转路径。
- `/battle/`：战报分享落地页，保留回放参数，优先尝试打开客户端；未安装时引导下载。

已配置：

- 个人开发者：`JN.Young`
- 支持/隐私邮箱：`j.n.young0209@gmail.com`

## Meta / AdMob / 商店检查项

- 官网使用 HTTPS 部署。
- `/app-ads.txt` 必须位于域名根路径，并返回 HTTP 200。
- 隐私政策 URL 建议填写 `https://professionballarena.top/privacy/`。
- 支持 URL 建议填写 `https://professionballarena.top/support/`。
- 下载页 URL 建议填写 `https://professionballarena.top/download/`。
- Android 商店链接使用 `https://play.google.com/store/apps/details?id=com.professionballarena.game` 和 `market://details?id=com.professionballarena.game`。
- iOS 暂用 App Store 搜索链接；App Store Connect 应用 ID 确认后，需要替换为正式 App Store 详情页。
- 广告 SDK 已按平台拆分：Meta 小游戏使用 Meta Instant Games 广告接口，Android/iOS 使用 AdMob；发布前应确认应用内同意流程、隐私政策、商店数据安全表单、广告位 ID 和内容分级信息一致。
