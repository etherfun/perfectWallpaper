# Plan: 重构 perfectwall 为 Vue 3 + Vite + Pinia

## 用户选择（2026-06-21）
- **重构范围**：完整替换为 Vue 3 SFC
- **构建工具**：迁移到 Vite
- **状态管理**：Pinia
- **dist 产物**：保持 Wallpaper Engine 加载方式不变（单文件 IIFE bundle）
- **SFC 存放位置**：独立子包（src/components/）
- **集成策略**：Vue 包装薄壳，原生 canvas/WebGL API 维持

## 用户二次决策（2026-06-21）
1. **自主包含**：Vue 组件内部完全自包含，canvas/WebGL 命令式代码也搬进 .vue 内部
2. **删除**：Phase 7 后立即删除旧 .ts，不留 deprecated 标记
3. **引用库**：i18n 改用 `vue-i18n` 库，删除自写 utils/i18n.ts

## 用户三次决策（2026-06-21）— 保底机制来源
- `project.json` 的 `general.localization` 字段是 **给 Wallpaper Engine 自身使用**的，不能用于网页端默认 i18n
- `project.json` 的 `general.properties.<xxx>.value` 才是 **项目内置的每个属性的默认值**（与 propertyHandler 字段一一对应），是浏览器独立运行模式下的真正保底来源
- 因此保底读取策略为：**遍历 `general.properties`，把每个有 `value` 字段的属性提取为 `{ key: { value: prop.value } }` 形式注入 Pinia**

## 三层回退优先级
```
1. window.wallpaperPropertyListener.applyUserProperties()   ← Wallpaper Engine 运行
2. localStorage.perfectwall_user_properties                  ← 上次运行时持久化
3. fetch('project.json').general.properties[*].value         ← 项目内嵌默认值（独立浏览器模式保底）
4. 各 handler / composable 内部的硬编码 default              ← 兜底中的兜底
```

## 现状关键事实

### 项目入口与构建
- `package.json`: TS 6.0.2, esbuild 0.27, vitest 2.1, sass 1.77, eslint 10, prettier 3.8
- `scripts/bundle.js`: esbuild 单入口 `src/bundle.ts` → `dist/bundle.js`（IIFE, globalName=PerfectWall, minified, target=es2020）
- 构建流程：tsc --noEmit → esbuild → sass 编译 → 复制 index.html/project.json/资源 → 生成 DEPENDENCIES.md
- `src/bundle.ts`: import main 优先（建 globals），再依次 import version/sakura/slide/video/time/date/hitokoto/countdown/player_control/fluid/RGB/PWLine/PWCircle/PWParticles/weather/WallpaperEffectController/dockbar
- `src/main.ts`: 13 行启动文件，建 `config.runtime.wallpaper = new WallpaperEffectController(document.body)`，调用 `setupWallpaperPropertyListener()` 等

### 模块清单（src/）
- 根级：`audioVisualizer.ts`（音频数据→canvas）、`countdown.ts`、`date.ts`、`debugModal.ts`（弹窗+日志面板）、`hitokoto.ts`、`main.ts`、`bundle.ts`、`PWCircle.ts`（canvas 圆环）、`PWLine.ts`（canvas 折线）、`PWParticles.ts`（canvas 粒子）、`RGB.ts`（canvas LED 灯效）、`time.ts`、`video.ts`（视频/音频播放控制）、`WallpaperEffectController.ts`（particles + audiovisualizer 控制器）
- `dockbar/`：12 文件（DockBar 主类 + 渲染、配置应用、图标缓存、添加菜单、上下文菜单等）
- `fluid/`：3 文件（FluidEffect + types + effect/ 子目录）
- `fullscreenLyrics/`：10 文件（FullscreenLyrics + 歌词渲染、字数高亮、可见性等）
- `player_control/`：15 文件（播放器控制 + 媒体监听器 + 颜色提取 + 时间线 + 标题显示等）
- `propertyHandlers/`：18 文件（wallpaperPropertyListener + 14 个具体 handler + types + _helpers）
- `sakura/`：10 文件（樱花 WebGL 场景 + 动画 + 着色器）
- `scss/`：22 个 _xxx.scss partial + main.scss
- `server-dotnet/`：.NET 4.8 sidecar 源码
- `slide/`：5 文件（背景切换 + sources/ 子目录含 6 个数据源）
- `systemMonitor/`：10 文件（SystemMonitor 主类 + cardRenderer + gpuSelector + types 等）
- `types/`：3 个 .d.ts（wallpaper-engine、global、qweather-icons）
- `utils/`：11 文件 + config/、elementManager/、elementManager/elements/ 子目录
- `version/`：2 文件（versionManager + simple-markdown）
- `weather/`：10 文件 + api/（7 文件）+ tooltip/（4 文件）+ ui/（5 文件）

### 状态与 DOM 操作模式
- **全局单例 config**：`src/utils/config/index.ts` 的 `AppConfig` 类，`config` 是 `new AppConfig()` 单例，含 `runtime: RuntimeData`
- **DOM 引用集中化**：`src/utils/elementManager/` 按域分文件，统一导出 `elements` 对象
- **DOM 操作**：50+ `innerHTML =`、`insertAdjacentHTML`、`createElement`/`appendChild`、`document.querySelector`
- **CSS 变量**：propertyHandler 通过 `document.body.style.setProperty('--clock-color', ...)` 控制样式
- **Canvas 高度命令式**：PWCircle/PWLine/PWParticles/RGB/樱花直接持 `let canvasEl: HTMLCanvasElement`
- **window 监听器注册**：`window.wallpaperPropertyListener`、`window.wallpaperRegisterMediaPropertiesListener` 等 7+ 个
- **i18n**：`src/utils/i18n.ts` 加载 JSON，`i18n('key')` 函数；DOM 上 `[data-i18n]` 属性 + MutationObserver
- **Property → Handler**：`wallpaperPropertyListener.ts` 收 100+ 属性，转发给 14 个 `handleXxxProperties` 函数

### 测试
- vitest + jsdom，245 测试

### Wallpaper Engine 集成约束
- `project.json` 指定 `file: "dist/index.html"`，路径替换后变成 `file: "index.html"`
- `index.html` 内嵌 `<script id="sakura_point_vsh">` 等 GLSL 着色器源
- 资源路径在 `scripts/bundle.js` 中通过 `htmlPathReplacements` 重写
- `dist/` 必须包含：bundle.js、index.html、project.json、source/i18n、source/imgs、source/map、source/QWeather-Icons、update/、preview.jpg、default.css、THIRD_PARTY_LICENSES

### 现状硬约束（必须保留）
- WE 通过 `window.wallpaperPropertyListener.applyUserProperties(properties)` 推送配置
- WE 媒体集成（`window.wallpaperRegisterMedia*`）7 个事件通道
- `dist/bundle.js` IIFE + globalName=PerfectWall，与 wallpapaper engine 兼容
- 全部 i18n JSON 文件路径（`source/i18n/{en-US,zh-CN}.json`）
- DOM 中 `#system-monitor .sysmon-row[data-metric=cpu/gpu/memory/network]` 预置结构
- `<canvas id="sakura">`、`<canvas id="sakurashow">`、`<canvas id="can">`、`<canvas id="CanLine">`、`<canvas id="canvas-particles">`、`<canvas id="canvas-audio">`、`<canvas id="RGBuse">` 这 7 个预置 canvas

## 重构策略要点

### 关键路径（不重构）
- `src/server-dotnet/`：.NET sidecar 源码，与前端无关
- `src/types/*.d.ts`：类型声明
- `scripts/build-dotnet.ps1`：.NET 编译脚本

### 调整后的目录结构
```
src/
├── components/                # 全部 .vue SFC（自包含）
│   ├── Background.vue         # 内部含 shouldShow/transition
│   ├── Clock.vue              # 内部含 setInterval + 彩色律动 RAF
│   ├── Date.vue
│   ├── Countdown.vue
│   ├── Hitokoto.vue
│   ├── Weather.vue            # 内部含 5 个 API handler
│   ├── SystemMonitor.vue      # 内部含轮询 + cardRenderer
│   ├── PlayerControl.vue      # 内部含 media listener + 颜色提取
│   ├── DockBar.vue
│   ├── FullscreenLyrics.vue
│   ├── PictureInfo.vue
│   ├── Sakura.vue             # 内部含 WebGL 初始化 + RAF
│   ├── PWCircle.vue           # 内部含 canvas API
│   ├── PWLine.vue
│   ├── PWParticles.vue
│   ├── FluidEffect.vue
│   ├── RgbEffect.vue
│   ├── Version.vue
│   └── DebugModal.vue
├── stores/                    # Pinia
│   ├── config.ts              # 包 AppConfig 全部字段
│   ├── runtime.ts
│   ├── player.ts
│   └── wallpaper-properties.ts
├── composables/               # 通用 composable
│   ├── useWallpaperProperties.ts  # window.wallpaperPropertyListener 钩子
│   ├── useProjectJsonDefaults.ts  # 启动时 fetch('./project.json') 读取 general.properties[*].value
│   ├── useAudioData.ts            # WE 音频 listener
│   └── useWEMediaEvents.ts        # 7 个 wallpaperRegisterMedia* 钩子
├── i18n/                      # vue-i18n 配置 + JSON
│   ├── index.ts
│   ├── en-US.json
│   └── zh-CN.json
├── main.ts                    # createApp + pinia + i18n + <App>
├── App.vue                    # 根组件
├── bundle.ts                  # import './main'
├── scss/                      # 22 个 partial + main.scss
├── server-dotnet/             # 保留
├── types/                     # 保留
└── utils/                     # 仅保留纯函数（color, string, tool, webgl-math, playback, logger, timer）
```

## 调整后的步骤

**Phase 0** — 脚手架：vite + vue + pinia + 基础配置
- 1. 安装 `vue@^3.5`、`pinia@^2.2`、`@vitejs/plugin-vue@^5.1`、`vue-tsc@^2.1`、`@vue/test-utils@^2.4`、`vue-i18n@^10`
- 2. 写 `vite.config.ts`（`base: './'`、`build.target: 'es2020'`、`lib` 模式 + `formats: ['iife']` + `name: 'PerfectWall'`）
- 3. 改 `tsconfig.json`：加 `"jsx": "preserve"`、include `**/*.vue`
- 4. 改造 `scripts/bundle.js`：vite build → `dist-vite/bundle.js` → 复制到 `dist/bundle.js`；保留 sass、html/license 流程
- 5. 改 `package.json`：scripts 改为 `vue-tsc --noEmit && vite build && node scripts/post-build.js`
- 6. **验收**：`yarn build` 输出 `dist/bundle.js`（IIFE）、`dist/index.html`、体积 < 500 KB
- **额外验收**：构建时 `scripts/bundle.js` 必须把 `project.json` 复制到 `dist/project.json`（与现有的 `copyFiles` 数组追加一项 `{ src: 'project.json', dest: 'project.json' }`），保证独立浏览器模式能 fetch 到

**Phase 1** — 叶子组件（Hitokoto、Date、Countdown、Clock）：命令式 setInterval/RAF 全部搬入 .vue 内部

**Phase 2** — 中等组件（Weather、SystemMonitor、DockBar、PlayerControl）：每个 .vue 自包含异步加载、CRUD、媒体监听

**Phase 3** — Canvas/WebGL（Sakura、PWCircle、PWLine、PWParticles、RGB、FluidEffect）：.vue 内部 `<script setup>` 中直接管理 canvas/WebGL 生命周期

**Phase 4** — 弹窗与全屏（Version、DebugModal、FullscreenLyrics）

**Phase 5** — 背景（Background/Slide/Video）

**Phase 6** — propertyHandlers 重写为 composable + 接入 project.json 三层回退
- 新增 `src/composables/useProjectJsonDefaults.ts`：
  - 启动时 `fetch('./project.json')` → 读取 `general.properties` 对象
  - 对每个有 `value` 字段的 key 构造 `{ [key]: { value: prop.value } }`
  - 把构造结果作为 `useConfigStore` 的初始 defaults（priority 最低层）
- 修改 `useWallpaperProperties` composable：
  - 接收 props 时，按 1→2→3→4 优先级合并：WE > localStorage > project.json > 内置 default
  - 与现有 `safeHandle` 错误捕获链保持不变
- 删除 `src/utils/elementManager/` 整个目录
- 删除 `src/utils/i18n.ts`（已被 `vue-i18n` 取代）
- 删除 `src/utils/config/`（已被 Pinia store 取代）
- i18n 默认 locale：从 `general.properties.global_settings_language.value` 读取（如果存在），否则 `'zh-CN'`
- **验收**：
  - 在 WE 之外打开 `dist/index.html`，5 秒内 console 出现 `[Config] project.json defaults merged: N keys` 日志（N > 100）
  - 时钟显示、樱花特效等组件直接根据 project.json 默认值显示，不依赖 WE 推送
  - WE 内启动时 WE 的属性覆盖 project.json 默认值（同一 key 优先取 WE 推送）

**Phase 7** — 删除全部旧 .ts（utils/i18n.ts、elementManager/、所有 .ts 模块）

**Phase 8** — 验证

## 风险与决策
- R1：构建产物从 esbuild IIFE → Vite IIFE，bundle size 涨到 350-400KB
- R2：vue-i18n 多 8KB，但替代自写 i18n.ts 后净减 3KB + 解锁 Composition API 风格的 `t()`
- R3：.vue 内部自包含后，单元测试需用 `@vue/test-utils` 的 `mount()`，与现有 vitest/jsdom 兼容
- R4：删除旧 .ts 后，外部导入路径（`@/sakura`、`@/dockbar` 等）需在 Phase 7 前全部清理
- R5：vue-tsc 对 TypeScript 6.0 兼容性需测试；如不兼容，TS 降到 5.x
- R6：vue-i18n 加载远端 JSON 与现有 `source/i18n/{en-US,zh-CN}.json` 路径一致；Composition API 风格的 `useI18n().t('key')` 替代自写函数
- R7（保底）：`project.json` 体积 ~180 KB，独立浏览器模式启动时多一次 `fetch('./project.json')` 延迟（通常 < 50 ms 本地）。该 fetch 失败时降级到 `src/utils/config/defaults/*` 内置默认值（现有 16 个 defaults 文件），整体仍然可用
- R8（合并去重）：三层回退合并时必须保持 `value` 嵌套结构，因为现有 14 个 `handleXxxProperties` 函数都按 `properties.xxxx.value` 访问。改写时 composable 必须输出与 WE 同形的数据结构
- R9（属性键名映射）：`project.json` 的 `properties` 键名（如 `showTime`、`global_settings_language`）与现有 `WallpaperProperties` 接口字段名 1:1 对应；可作为零修改依据。但需在 Phase 6 编写一个 type-test 校验器，确认所有 key 都能被现有 14 个 handler 识别

## 验收标准
- `yarn build` 仍输出 dist/bundle.js (IIFE) + dist/index.html，体积 < 500 KB
- `yarn lint` 0 错误
- `yarn test` 全部通过（预计 245 → 290+，因新增 SFC 测试）
- 在 WE 之外打开 `dist/index.html` 也能跑（默认走 project.json + localStorage 三层回退）
- 245+ 现有测试零修改通过
- 旧 .ts 模块全部删除（无 `@deprecated` 残留）
- `vue-i18n` 替代自写 `utils/i18n.ts`
- project.json 三层回退全部生效
