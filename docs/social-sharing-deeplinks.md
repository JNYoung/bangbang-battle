# 社交分享与 DeepLink 接入

## 客户端能力

- 结果页战报图会生成可复现战斗链接：`https://professionballarena.top/battle/?scene=...&seed=...&auto=play`。
- 该 HTTPS 链接是官网落地页：已安装 App 时尝试打开客户端回放；未安装时展示 Android / iOS 下载入口。
- Android 原生桥 `GameSocial` 支持 `facebook`、`tiktok`、`system` 三个分享目标。
- Android 有平台 key 时优先使用 Facebook Share SDK / TikTok Share Kit；未配置 key 时回退到已安装 App 的定向 Intent 或系统分享面板。
- `professionballarena://battle/replay?...` 可直接唤起客户端；官网 `/battle/` 页面会把 HTTPS 分享链接转成客户端 scheme，并保留官网下载入口。

## Android 配置

可在 `android/gradle.properties` 或环境变量中配置：

| Gradle property | Environment | 用途 |
| --- | --- | --- |
| `facebookAppId` | `FACEBOOK_APP_ID` | Meta Developer 后台的 Facebook App ID |
| `facebookClientToken` | `FACEBOOK_CLIENT_TOKEN` | Facebook Android SDK client token |
| `tiktokClientKey` | `TIKTOK_CLIENT_KEY` | TikTok Developer 后台的 client_key |
| `deepLinkHost` | `BATTLE_DEEP_LINK_HOST` | HTTPS App Link 域名，默认 `professionballarena.top` |

当前 Android 客户端配置已写入本地 `android/gradle.properties`：

```properties
facebookAppId=1013763001162439
facebookClientToken=<已配置，实际值不写入文档>
```

`facebookClientToken` 来自 Meta Developer Dashboard 的 App settings -> Advanced -> Client token。不要把 App Secret 写进客户端文件或仓库。

TikTok 后台需要登记 release 签名的 MD5 和 SHA-256。Facebook 后台需要登记包名 `com.professionballarena.game`、主 Activity `com.professionballarena.game.MainActivity` 和 key hash。

当前本机 debug 包的 Facebook key hash：

```text
DxsUYbsKWsJwphKb+JWeQqbPdEM=
```

上线包还需要用 release keystore 重新生成并登记 release key hash。

## DeepLink 格式

推荐分享 HTTPS 链接：

```text
https://professionballarena.top/battle/?scene=classic&a=spear&b=blade&count=2&seed=12345&auto=play
```

客户端 scheme：

```text
professionballarena://battle/replay?scene=classic&a=spear&b=blade&count=2&seed=12345
```

Android 商店跳转：

```text
https://play.google.com/store/apps/details?id=com.professionballarena.game
market://details?id=com.professionballarena.game
```

Android Intent 路径示例：

```text
intent://battle/replay?scene=classic&a=spear&b=blade&count=2&seed=12345&auto=play#Intent;scheme=professionballarena;package=com.professionballarena.game;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.professionballarena.game;end
```

iOS 当前使用 scheme 打开客户端；App Store Connect 应用 ID 确认后，应把官网里的 App Store 搜索链接替换为正式详情页：

```text
professionballarena://battle/replay?scene=classic&a=spear&b=blade&count=2&seed=12345
https://apps.apple.com/search?term=Profession%20Ball%20Arena
itms-apps://itunes.apple.com/search?term=Profession%20Ball%20Arena
```

`seed` 用于复现地形、道具池和自动战斗流程；如果用户在回放中主动触发 Shake，后续结果可能发生变化。
