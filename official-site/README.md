# 职业球球斗技场官网

这是独立于游戏主体工程的静态官网，用于公开应用信息、隐私政策、用户协议、支持联系方式、数据删除说明和 `app-ads.txt`。

## 开发命令

```bash
npm run dev
npm run build
npm run preview
```

## 当前线上配置

- `public/app-ads.txt`：已配置 AdMob 发布商 ID `pub-2481288993515154`。
- 页面中的官网域名已配置为 `professionballarena.top`，请确保该域名和商店后台填写的开发者网站一致。

已配置：

- 个人开发者：`JN.Young`
- 支持/隐私邮箱：`j.n.young0209@gmail.com`

## Meta / AdMob / 商店检查项

- 官网使用 HTTPS 部署。
- `/app-ads.txt` 必须位于域名根路径，并返回 HTTP 200。
- 隐私政策 URL 建议填写 `https://professionballarena.top/privacy/`。
- 支持 URL 建议填写 `https://professionballarena.top/support/`。
- 广告 SDK 已按平台拆分：Meta 小游戏使用 Meta Instant Games 广告接口，Android/iOS 使用 AdMob；发布前应确认应用内同意流程、隐私政策、商店数据安全表单、广告位 ID 和内容分级信息一致。
