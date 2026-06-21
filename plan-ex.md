# Plan-ex: 实施阶段蒸馏参考

## 项目一句话
Wallpaper Engine 壁纸项目（`perfectwall`），当前为 vanilla TypeScript + esbuild 单文件 IIFE bundle + 自写全局 `config` 单例 + DOM 命令式操作。重构为 Vue 3 SFC + Vite + Pinia + vue-i18n。

## 关键路径
- 工作目录：`D:\SOFT\steam\steamapps\common\wallpaper_engine\projects\myprojects\perfectwall`
- 入口（当前）：`src/main.ts` 13 行 → 已被删除（独立运行模式开发中）；`src/bundle.ts` 19 行
- 入口（目标）：`src/main.ts` createApp + pinia + i18n + `<App>`；`src/bundle.ts` import './main'
- 构建：`scripts/bundle.js` esbuild → Vite（lib 模式，formats: ['iife']，name: 'PerfectWall'）
- 端到端类型校验：`vue-tsc --noEmit && vite build`
- 测试：vitest + @vue/test-utils，245 个现有测试
- 独立 sidecar：`build/perfectwall-server.exe` (.NET 4.8)；不重构

## dist 产物（不可变约束）
Wallpaper Engine 加载 `dist/index.html`，通过 `dist/project.json` 加载项目元数据。`dist/bundle.js` 必须是 IIFE（globalName=PerfectWall）单文件。其他必须存在：
- `dist/index.html`（含 7 个预置 canvas + GLSL `<script id="sakura_point_vsh">` + weather tooltip `<template id="weatherAlerttooltipCardTemplate">` + 大量 base64 SVG 图标）
- `dist/bundle.js`（IIFE）
- `dist/default.css`（从 src/scss/main.scss 编译）
- `dist/project.json`（重构后 Phase 0 须追加到 copyFiles 数组）
- `dist/source/i18n/{en-US,zh-CN}.json`
- `dist/source/imgs/`、`dist/source/map/`、`dist/source/QWeather-Icons/icons`
- `dist/update/`、`dist/preview.jpg`、`dist/THIRD_PARTY_LICENSES/`

## 65 个 src/ 模块（重构目标）
- 根级（13）：`audioVisualizer` `countdown` `date` `debugModal` `hitokoto` `main` `bundle` `PWCircle` `PWLine` `PWParticles` `RGB` `time` `video` `WallpaperEffectController`
- 8 个子目录：`dockbar/` 12 `fluid/` 3 `fullscreenLyrics/` 10 `player_control/` 15 `propertyHandlers/` 18 `sakura/` 10 `slide/` 5 `systemMonitor/` 10 `weather/` 10
- 工具与类型：`utils/` 11 + `utils/config/` + `utils/elementManager/` + `utils/elementManager/elements/` 7；`types/` 3 个 .d.ts
- 删除：`elementManager/` `utils/i18n.ts` `utils/config/`

## 关键架构事实（必须记住）

### 状态共享
- 全局单例：`src/utils/config/index.ts` 的 `AppConfig`，导出 `config` 单例
- DOM 引用集中化：`src/utils/elementManager/` 按域分文件（core/time/background/weather/player/sakura/ui），导出一个 `elements` 常量对象
- DOM 操作模式：50+ `innerHTML =` / `insertAdjacentHTML` / `createElement` / `document.querySelector`
- CSS 变量：propertyHandler 通过 `document.body.style.setProperty('--clock-color', ...)` 控制，SCSS 消费

### 动画与监听器
- 7 个 window 监听器：`wallpaperPropertyListener.applyUserProperties`、`wallpaperRegisterMedia*`（Status/Properties/Thumbnail/Playback/Timeline）、`wallpaperRegisterAudioListener`、`wallpaperPluginListener.onPluginLoaded`、`wallpaperMediaIntegration.PLAYBACK_*` 常量
- 3 种动画循环：`requestAnimationFrame`（time/date 彩色律动、樱花 WebGL、PWCircle/PWLine）、`setInterval` + `MultiTimerManager`（slide/weather/hitokoto）、`setTimeout` 链（timeline 本地推演）
- 7 个预置 canvas 元素：`#sakura`、`#sakurashow`、`#can`、`#CanLine`、`#canvas-particles`、`#canvas-audio`、`#RGBuse`

### Property Handler
- 14 个 handler：time/date/background/weather/hitokoto/countdown/playerControl/rgb/particle/audioVisual/sakura/fluidEffect/lyrics/systemMonitor
- 总字段数：100+ 个 `{ value: T }` 嵌套结构，类型见 `src/propertyHandlers/types.ts` 的 `WallpaperProperties`
- 关键 type：`condition`（WE 条件显示）、`index`（UI 顺序）、`order`（UI 分组）、`text`（i18n key）、`type`（bool/combo/slider/color/textinput/directory/file）

### 三个关键 property
- `wallpapermode`（1-9，combo，index=17）→ 决定 background 模式
- `visual_audio_model`（0-4，combo，index=100）→ 决定音频可视化模式
- `global_settings_language`（"zh-CN" | "en-US"，combo，index=5）→ 决定 i18n

### Web Engine 媒体
- 5 个 channel：Status/Properties/Thumbnail/Playback/Timeline
- listener 注册通过 `window.wallpaperRegisterMedia*` 钩子
- data 流向：WE → window event → listener → config.runtime.playerInfo → DOM

### 测试
- 245 个 vitest 测试，分布：utils（color/logger/markdown/playback/string/tool/webgl-math）、propertyHandlers（_helpers）、systemMonitor（cardRenderer/formatters/gpuSelector/renderer）、slide（transition）、dockbar（configApply/iconCache/renderer/storage）、player_control（colorUtils）
- 测试 setup：`tests/setup.ts` 全局 stub window/localStorage（不依赖 jsdom，纯 node 环境）
- 245+ 测试零修改通过是硬指标

## 三层回退机制（用户最终决策）
```
1. window.wallpaperPropertyListener.applyUserProperties()   ← Wallpaper Engine 运行（最高）
2. localStorage.perfectwall_user_properties                  ← 上次运行时持久化
3. fetch('project.json').general.properties[*].value         ← 项目内嵌默认值（独立浏览器模式保底）
4. 各 handler / composable 内部的硬编码 default              ← 兜底中的兜底（最低）
```

**关键认知**（用户两次纠正后定稿）：
- `project.json.general.localization` 是给 WE 用的，**不**用于网页端默认 i18n
- `project.json.general.properties.<xxx>.value` 才是项目内嵌属性默认值
- 遍历 `properties`，每个有 `value` 字段的 key 构造 `{ [key]: { value: prop.value } }` 注入 Pinia
- 启动时 `fetch('./project.json')` 一次性读取（< 50ms 本地）
- Phase 0 须把 `project.json` 加入 `copyFiles` 数组 → dist/

## 重构步骤（8 个 Phase）
- **Phase 0** 脚手架：装 vue/pinia/@vitejs/plugin-vue/vue-tsc/@vue/test-utils/vue-i18n；写 vite.config.ts（lib + iife + name=PerfectWall）；改 tsconfig.json；改造 scripts/bundle.js；package.json 脚本改 `vue-tsc --noEmit && vite build`；把 project.json 加入 copyFiles
- **Phase 1** 叶子组件：Hitokoto、Date、Countdown、Clock，setInterval/RAF 全部搬入 .vue
- **Phase 2** 中等组件：Weather、SystemMonitor、DockBar、PlayerControl，含异步加载/CRUD/媒体监听
- **Phase 3** Canvas/WebGL：Sakura、PWCircle、PWLine、PWParticles、RgbEffect、FluidEffect，.vue 内部管理 canvas/WebGL 生命周期
- **Phase 4** 弹窗与全屏：Version、DebugModal、FullscreenLyrics
- **Phase 5** 背景：Background/Slide/Video
- **Phase 6** propertyHandlers + 三层回退：新增 useProjectJsonDefaults.ts；composable 实现 1→2→3→4 优先级合并；删除 elementManager/、utils/i18n.ts、utils/config/；i18n locale 从 `global_settings_language.value` 读取
- **Phase 7** 删除全部旧 .ts（不留 deprecated）
- **Phase 8** 验证

## 实施约束（用户决策）
- 自主包含：Vue 组件内部完全自包含，canvas/WebGL 命令式代码也搬进 .vue
- 删除：Phase 7 后立即删除旧 .ts，不留 deprecated 标记
- 引用库：i18n 用 `vue-i18n`（替换自写 utils/i18n.ts）

## 验收硬指标
- `yarn build` 输出 dist/bundle.js (IIFE) + dist/index.html，体积 < 500 KB
- `yarn lint` 0 错误
- `yarn test` 全部通过（预计 245 → 290+，新增 SFC 测试）
- 在 WE 之外打开 `dist/index.html` 也能跑（三层回退自动降级）
- 245+ 现有测试零修改通过
- 旧 .ts 模块全部删除
- `vue-i18n` 替代自写 i18n
- project.json 三层回退全部生效（`[Config] project.json defaults merged: N keys` 日志）
- 9 种 wallpapermode 全部能切换
- 5 个 weather API handler 全部能加载

## 风险点
- R1：Vite IIFE 比 esbuild 大 50-100KB（Vue+Pinia+vue-i18n 运行时）
- R2：vue-i18n 替换自写 i18n.ts 净 +5KB
- R5：vue-tsc 对 TypeScript 6.0 兼容性需测试；不兼容则 TS 降 5.x
- R7：project.json fetch 失败时降级到 utils/config/defaults/*（16 个内置 defaults）
- R8：三层回退合并必须保持 `value` 嵌套结构（现有 14 个 handler 都按 `properties.xxxx.value` 访问）
- R9：project.json 的 properties 键名与 WallpaperProperties 字段名 1:1 映射

## 实施第一步建议
从 Phase 0 开始：装依赖 → 写 vite.config.ts → 改造 scripts/bundle.js → 验证 `yarn build` 输出 IIFE bundle < 500KB。这一步不删任何 .ts，零风险。

## 历史会话参考
- `perfectwall.md`（/memories/repo/）—— 项目事实、API 契约、WE 集成约束
- `plan.md`（/memories/session/）—— 完整重构计划 8 Phase
- `server-audit-2026-06-19.md`、`server-audit-round2-2026-06-19.md`、`standalone-mode-2026-06-20.md` —— 独立运行模式开发历史
- `perfectwall-encoding-issues.md`（user memory）—— CJK 编码坑
- `perfectwall-stack.md`（user memory）—— stack 关键事实
