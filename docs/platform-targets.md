# 平台打包说明

## 总体方案

- 游戏逻辑和渲染保持在 Canvas Web 层，入口是 `index.html` + `game.js`。
- Vite 负责输出 `dist/`，并使用相对资源路径，方便 WebView 和 Meta ZIP 包读取。
- Android / iOS 使用 Capacitor 包装同一份 `dist/`。
- Meta Instant Games 使用 `scripts/build-meta.mjs` 从 `dist/` 生成专用 ZIP，并注入 `FBInstant` CDN SDK。

## 调研依据

- Capacitor 官方工作流要求先构建 Web bundle，再执行 `npx cap sync` 同步到 Android/iOS 原生工程。
- Meta Instant Games 的 HTML5 上传包需要 `index.html` 和根目录 `fbapp-config.json`，并通过 `FBInstant` 初始化、上报加载进度、启动游戏。

参考：

- https://capacitorjs.com/docs/basics/workflow
- https://gamemaker.io/en/help/articles/facebook-instant-games-getting-started

## 常用命令

```bash
npm run dev
npm run build
npm run meta:bundle
npm run cap:sync
npm run android:open
npm run ios:open
```

## Meta 小游戏

Meta 上传包需要在 ZIP 根目录包含 `index.html` 和 `fbapp-config.json`。构建命令会生成：

```text
release/meta-instant/profession-ball-arena-meta.zip
```

`platform.js` 会在检测到 `window.FBInstant` 时执行：

```text
initializeAsync -> setLoadingProgress -> startGameAsync
```

普通浏览器、Android、iOS 环境没有 `FBInstant` 时会直接进入游戏。

## Android / iOS

Capacitor 配置在 `capacitor.config.json`：

```text
appId: com.professionballarena.game
webDir: dist
```

每次改动 Web 代码后执行：

```bash
npm run cap:sync
```

然后用 Android Studio 或 Xcode 打开对应原生工程继续签名、图标、商店信息和真机调试。
