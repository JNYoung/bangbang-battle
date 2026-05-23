# 自动化测试

项目使用 Node 原生测试框架和轻量脚本，避免给小游戏运行时引入额外测试依赖。

## 命令

```bash
npm run lint:syntax
npm test
npm run test:matchups
npm run test:artifacts
npm run test:ci
```

## 本地 Android 模拟器环境

这台机器的 Android SDK 在 `/Users/zhengjinyang/Library/Android/sdk`，`adb` 可直接使用：

```bash
/Users/zhengjinyang/Library/Android/sdk/platform-tools/adb devices -l
```

Android Gradle 配置要求 Java 21；本机可使用 Android Studio 自带 JBR：

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
```

在已启动的模拟器上编译、同步并安装 debug 包：

```bash
npm run build
npx cap sync android
cd android
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
ANDROID_HOME="$HOME/Library/Android/sdk" \
ANDROID_SDK_ROOT="$HOME/Library/Android/sdk" \
./gradlew :app:installDebug --console=plain
```

当前验证过的模拟器是 `emulator-5554` / `Medium_Phone_API_36.1`。安装后启动应用：

```bash
/Users/zhengjinyang/Library/Android/sdk/platform-tools/adb -s emulator-5554 shell am start -n com.professionballarena.game/.MainActivity
```

## 覆盖范围

- `lint:syntax`：检查核心 JS、平台脚本和打包脚本语法。
- `npm test`：验证职业配置、速度曲线、技能伤害、挂件/攻击特效配置、合规同意状态、职业选择持久化和统计/广告/IAP 预留接口。
- `test:matchups`：按场景职业池跑职业对战模拟，确保胜负时间仍落在 18-75 秒目标曲线内。
- `test:artifacts`：构建 Web 产物、生成 Meta Instant Games ZIP，并验证 SDK 注入、`fbapp-config.json` 和 ZIP 文件。
- `test:ci`：串联以上所有检查，适合 GitHub Actions。

## 开发约束

- Canvas 外层页面保持全屏，不依赖浏览器原生页面滚动；任何超出可视区域的列表或面板内容都必须在 Canvas 内实现滚动。
- 职业选择页在手机宽度下必须保持稳定卡片高度。经典、超能、英雄等模式的职业列表超过可视网格时，使用拖拽/滚轮滚动，不通过压缩卡片、挤压文字或遮挡底部按钮来硬塞进页面。
- 新增模式或职业后，至少检查一次窄屏职业选择页，确认模式切换、职业列表滚动、底部操作按钮都可达。

## 新增职业时

新增职业需要同时更新：

- `game-config.js` 的 `ProfessionConfig`
- `cosmetics.js` 的 `ProfessionCosmeticConfig`

测试会检查两张配置表是否同步，避免出现职业有数值但没有视觉配置，或反过来。
