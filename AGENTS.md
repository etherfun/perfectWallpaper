# AGENTS.md

Wallpaper Engine 动态壁纸项目（Vue 3 + Pinia + TypeScript + Canvas/WebGL，单文件 IIFE bundle 供 WE 加载）。本文件重点说明**如何新增配置项（property）并在代码中使用**，以及构建/测试命令与常见坑。

## 构建与验证命令

- `yarn install` — 安装依赖（yarn.lock 为准；CI 用 yarn）
- `yarn build` — `vue-tsc --noEmit`（typecheck）+ `vite build` + `node scripts/post-build.js`。产物写入 `dist/`（`bundle.js` IIFE 全局名 `PerfectWall`、`default.css`、处理后的 `index.html`/`project.json`）。这是 WE 实际加载的目录。
- `yarn typecheck` / `yarn lint` / `yarn format` — 分别对应 vue-tsc、eslint src、prettier --check src
- `yarn test` / `yarn test:watch` / `yarn test:coverage` — Vitest，node 环境，仅收录 `tests/**/*.test.ts`；`tests/setup.ts` 注入最小 `window`/`localStorage` stub，需要 DOM 的测试用 `// @vitest-environment jsdom` 逐文件切换
- `yarn build:server` — 构建 .NET Framework 4.8 服务器（`scripts/build-dotnet.ps1`），产物在 `dist/perfectwall-server/`
- `yarn build:dev` / `yarn build:dev:watch` — 生成自包含的 `dev/` 预览目录。dev-kit 通过 npm 依赖 `wallpaper-engine-web-dev-kit` 引入（`prepareDevBuild` 从 `node_modules` 自动解析 dist），无需再设置 `WE_DEV_KIT_PATH`

入口：`src/modules/core/bundle.ts` 顺序 import 所有模块；`setupWallpaperPropertyListener()` 注册 `window.wallpaperPropertyListener`。

## 目录结构（README 的树已过时，以实际为准）

- `src/modules/<feature>/` — 每个功能一个目录（clock、date、countdown、weather、slide、audio-visualizer、player_control、systemMonitor、dockbar、fluid、sakura、hitokoto、rgb-effect、fullscreenLyrics、version、debug、core），内含 `use*Properties.ts` 属性处理器 + Vue 组件/渲染逻辑
- `src/stores/config.ts` — Pinia 配置 store，唯一配置入口；`BUILTIN_DEFAULTS` 是默认值
- `src/stores/types/config.ts` — `ConfigStoreState` 类型
- `src/types/types/wallpaper-*.ts` — WE 推送属性（`WallpaperProperties`）的拆分类型，`wallpaper-properties.ts` 交叉聚合
- `src/types/wallpaper-engine.d.ts` — WE 全局 API 声明（`wallpaperPropertyListener`、媒体/音频/插件监听器）
- `src/utils/i18n.ts` — vue-i18n，运行时 UI 文案
- `src/server-dotnet/` — 系统监控服务器（另见其 README）

## 新增配置项：完整步骤（重点）

WE 的配置项在 `project.json → general.properties` 声明，用户在设置面板改动后 WE 向 `window.wallpaperPropertyListener.applyUserProperties` 推送 `{ 属性名: { value: 值 } }`。本仓库改动涉及 4 个文件 + 文案：

1. **`project.json` → `general.properties`** 新增键。常用字段：`type`（`bool`/`slider`/`combo`/`color`/`textinput`/`directory`/`group`/`text`）、`value`、`min`/`max`、`options`（combo 用，每项含 `label`+`value`）、`condition`（WE 表达式，如 `"server_mode.value == true"`，条件不满足时整项隐藏）、`index` 与 `order`（取未占用的唯一值，惯例 `order = index + 100`；当前 index 最大 427、order 最大 527，新增从更大值开始）。
   - `text` 填的是本地化 key（`ui_*`），**必须**同时写进 `general.localization.en-us` 和 `general.localization.zh-chs`，否则设置面板显示原始 key。combo 的 `options[].label` 同理。
   - 改根目录的 `project.json`（WE 用这个，其 `"file": "dist/index.html"`）。`post-build.js` 会把它复制到 `dist/` 并剥掉 `"dist/"` 前缀（仅供发布 zip），不要改 `dist/`。
2. **`src/types/types/wallpaper-*.ts`** 对应接口加可选字段 `xxx?: { value: T }`（聚合入口在 `wallpaper-properties.ts`）。
3. **属性处理器** `src/modules/<feature>/use*Properties.ts` 加分支。这些处理器统一由 `src/modules/core/wallpaperPropertyListener.ts` 的 `createWallpaperPropertyListener` 用 `safeHandle` 调用（每个处理器独立 try/catch，出错不拖垮整体）。惯例：
   - 读值用 `properties.<Key>?.value`；
   - 写配置一律 `store.$patch({ snake_case_key: 值 })`（`store = useConfigStore()`）；
   - 需要即时视觉反馈的，同时写 CSS 变量（`elements.body.style.setProperty('--xxx', ...)`）或驱动响应式 Vue 组件。
   - 不要依赖 `applyUserProperties` 自动合并——它只 patch 与 store 键**同名**的 WE 键，而 WE 键常为 camelCase（如 `tX`、`DateSize`）而 store 键是 snake_case（`time_x`），所以必须显式写 handler 分支。
4. **`src/stores/config.ts`** 的 `BUILTIN_DEFAULTS` 加默认值，并在 `src/stores/types/config.ts` 的 `ConfigStoreState` 加类型（WE 未推送时也靠它兜底，dev 预览同样读它）。
5. **使用**：Vue 组件或命令式模块里 `const store = useConfigStore()` 后读 `store.字段`；属性值改动时 handler 已同步进 store，组件自动响应。

### 特殊类型属性的处理

- `type: "directory"`（如 `customdirectory`、`musicdirectory`）：WE 通过 `userDirectoryFilesAddedOrChanged`/`userDirectoryFilesRemoved` 推送文件列表，监听器存入 `runtime.files[属性名]` 并调用 `updateFileList`（`src/modules/slide/transition.ts`，并入 `runtimeStore.myList`）；目录路径本身则走 `properties.<Key>.value` 写入 store。
- 按钮型 bool（如 `wallpaper_updata`）：监听器只在 `!FirstLoad && value === true` 时响应，避免首帧推送的 `false` 误触。新增按钮类属性要沿用这个 `FirstLoad` 守卫。
- `applyGeneralProperties` 有意留空；音频走 `window.wallpaperRegisterAudioListener(audioDataListener)`；LED 插件走 `window.wallpaperPluginListener.onPluginLoaded('led'|'cue')`。

## 常见坑

- **CI 脚本名不匹配**：`.github/workflows/tag-trigger.yml` 调用 `yarn build:server:dotnet`，但 package.json 里只有 `build:server` → 该 tag 工作流会在服务器构建步骤失败。
- **不要手改 `dist/`、`dev/`**：它们由构建脚本生成。`post-build.js` 会改写路径、剥离 `index.html` 里的 legacy 组件壳（`#clock`/`#countdown`/`#oDate`/`#hitokoto`，已由 Vue 在 `#app-root` 渲染）。
- `build:dev` 通过 npm 包 `wallpaper-engine-web-dev-kit` 注入 dev-kit，无需 `WE_DEV_KIT_PATH`。
- 服务器相关功能（系统监控、DockBar）用 `server_mode` 属性门控，且需要用户手动启动 `dist/perfectwall-server/perfectwall-server.exe`（管理员模式才有温度/风扇数据，走 `--admin`/右键管理员运行，触发 WinRing0 的 Defender 警告是预期的）。
- 新增 UI 文案（非设置面板）：`src/utils/i18n.ts` 的 `FALLBACK_MESSAGES` + `source/i18n/{zh-CN,en-US}.json` 都要加。