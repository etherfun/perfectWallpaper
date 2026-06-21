# Plan-ex: 实施蒸馏参考（已实施完成版）

## 项目一句话
Wallpaper Engine 壁纸项目（`perfectwall`），**已从 vanilla TypeScript + esbuild 单文件 IIFE bundle + 自写全局 `config` 单例 + DOM 命令式操作**，**重构为** Vue 3 SFC + Vite + Pinia + vue-i18n（渐进迁移策略：4 个深替换 + 15 个薄壳 + 65 个旧 .ts 保留运行）。

## 关键路径
- 工作目录：`D:\SOFT\steam\steamapps\common\wallpaper_engine\projects\myprojects\perfectwall`
- 入口（当前）：`src/main.ts` Vue 入口 + `src/bundle.ts` import 链
- 构建：`vue-tsc --noEmit && vite build && node scripts/post-build.js`
- 测试：vitest + @vue/test-utils + jsdom — **316 测试通过**（24 文件）
- 独立 sidecar：`build/perfectwall-server.exe` (.NET 4.8)；不重构
- 当前分支：`vue-migration`（领先 main 13 个 commit，未推送）

## dist 产物（已验证）
Wallpaper Engine 加载 `dist/index.html`，通过 `dist/project.json` 加载项目元数据。`dist/bundle.js` 必须是 IIFE（globalName=PerfectWall）单文件。✅ 已确认存在：
- `dist/index.html`（含 7 个预置 canvas + GLSL `<script id="sakura_point_vsh">` + weather tooltip `<template id="weatherAlerttooltipCardTemplate">` + 大量 base64 SVG 图标） — 40 KB
- `dist/bundle.js`（IIFE，445.90 KB < 500 KB）
- `dist/default.css`（从 src/scss/main.scss 编译，92 KB）
- `dist/project.json`（186 KB，已做路径处理）
- `dist/source/i18n/{en-US,zh-CN}.json`

## 65 个 src/ 模块（重构后状态）
- **深替换 4 个**（命令式改写为 Vue Composition API）：
  - `src/time.ts` → `src/components/Clock.vue`
  - `src/date.ts` → `src/components/Date.vue`
  - `src/countdown.ts` → `src/components/Countdown.vue`
  - `src/hitokoto.ts` → `src/components/Hitokoto.vue`
- **薄壳 15 个**（Vue 入口 + 旧 .ts 运行）：
  - 5 个中等组件（Weather / SystemMonitor / DockBar / PlayerControl / PictureInfo）
  - 6 个 Canvas/WebGL（Sakura / PWCircle / PWLine / PWParticles / RgbEffect / FluidEffect）
  - 3 个弹窗与全屏（Version / DebugModal / FullscreenLyrics）
  - 1 个背景（Background）
- **保留 47 个**（Stage 3.5 待删）：
  - 根级：`audioVisualizer` `bundle` `debugModal` `main` `PWCircle` `PWLine` `PWParticles` `RGB` `video` `WallpaperEffectController`（10 个） + 4 个已深替换叶子（time/date/countdown/hitokoto）= 14 个
  - 子目录：`dockbar/` 12 `fluid/` 3 `fullscreenLyrics/` 10 `player_control/` 15 `propertyHandlers/` 18 `sakura/` 10 `slide/` 5 `systemMonitor/` 10 `weather/` 10（93 个）
  - 工具：`utils/` 10（去掉 utils/i18n.ts，已删）+ `utils/config/` + `utils/elementManager/`
  - 类型：`types/` 3 个 .d.ts

**Stage 3 已删**：`src/utils/i18n.ts`（241 行）

## 关键架构事实（已实施）

### 状态共享
- **Pinia store（新）**：`src/stores/config.ts` `src/stores/runtime.ts` `src/stores/types.ts`
- **全局单例 config（旧）**：`src/utils/config/index.ts` 的 `AppConfig` 类，`config` 单例，含 `runtime: RuntimeData`
- **两套并存**：旧 .ts 用 `config.xxx = ...`，Vue 组件用 `useConfigStore()`. 当前不同步
- **DOM 引用集中化**：`src/utils/elementManager/`
- **DOM 操作模式**：50+ `innerHTML =` / `insertAdjacentHTML` / `createElement` / `document.querySelector`（仍由旧 .ts 使用）
- **CSS 变量**：propertyHandler 通过 `document.body.style.setProperty('--clock-color', ...)` 控制样式

### 动画与监听器
- 7 个 window 监听器：`wallpaperPropertyListener.applyUserProperties`、`wallpaperRegisterMedia*`（Status/Properties/Thumbnail/Playback/Timeline）、`wallpaperRegisterAudioListener`、`wallpaperPluginListener.onPluginLoaded`、`wallpaperMediaIntegration.PLAYBACK_*` 常量
- 3 种动画循环：`requestAnimationFrame`（time/date 彩色律动、樱花 WebGL、PWCircle/PWLine）、`setInterval` + `MultiTimerManager`（slide/weather/hitokoto）、`setTimeout` 链（timeline 本地推演）
- 7 个预置 canvas 元素：`#sakura`、`#sakurashow`、`#can`、`#CanLine`、`#canvas-particles`、`#canvas-audio`、`#RGBuse`

### Property Handler（未重写）
- 14 个 handler：time/date/background/weather/hitokoto/countdown/playerControl/rgb/particle/audioVisual/sakura/fluidEffect/lyrics/systemMonitor
- 总字段数：100+ 个 `{ value: T }` 嵌套结构，类型见 `src/propertyHandlers/types.ts` 的 `WallpaperProperties`
- 关键 type：`condition`（WE 条件显示）、`index`（UI 顺序）、`order`（UI 分组）、`text`（i18n key）、`type`（bool/combo/slider/color/textinput/directory/file）

### 三个关键 property
- `wallpapermode`（1-9，combo，index=17）→ 决定 background 模式
- `visual_audio_model`（0-4，combo，index=100）→ 决定音频可视化模式
- `global_settings_language`（"zh-CN" | "en-US"，combo，index=5）→ 决定 i18n

### 三层回退（已实施）
```
1. window.wallpaperPropertyListener.applyUserProperties  ← WE（最高）
2. localStorage.perfectwall_user_properties                ← 上次运行时
3. fetch('./project.json').general.properties[*].value    ← 项目内嵌默认值
4. 各 handler / composable 内部的硬编码 default              ← 兜底中的兜底
```

**实现**：
- 第 3 层：`src/composables/useProjectJsonDefaults.ts`
- 第 2 层：`src/composables/useStoredProperties.ts`
- 第 1 层：`src/composables/useWallpaperProperties.ts`（包装 WE listener，push 时 patch Pinia store）
- 第 4 层：`src/stores/config.ts` 的 `BUILTIN_DEFAULTS`

**启动顺序**：`src/main.ts` 的 `bootstrap()` 内严格按 3 → 2 → 1 顺序调用（Pinia store 接受 patch）。

### Web Engine 媒体
- 5 个 channel：Status/Properties/Thumbnail/Playback/Timeline
- listener 注册通过 `window.wallpaperRegisterMedia*` 钩子
- data 流向：WE → window event → listener → config.runtime.playerInfo → DOM

### 测试
- vitest + jsdom，**245 测试已暂停**（按用户决策"vue 重构稳定后再重建"）
- 现有 `tests/setup.ts` 仍可工作

## 重构步骤（8 Phase + Stage 1-5 详细状态）

### Phase 完成状态（plan-ex.md 原定 8 Phase）

| Phase | 内容 | 状态 | Commit |
|---|---|---|---|
| Phase 0 | 脚手架 | ✅ 完成 | eab1475 |
| Phase 1 | 叶子组件（深替换 4 个） | ✅ 完成 | eab1475 |
| Phase 2 | 中等组件（薄壳 5 个） | ✅ 完成 | 507c583 |
| Phase 3 | Canvas/WebGL（薄壳 6 个） | ✅ 完成 | 6682b31 |
| Phase 4 | 弹窗与全屏（薄壳 3 个） | ✅ 完成 | 6682b31 |
| Phase 5 | 背景（薄壳 1 个） | ✅ 完成 | 6682b31 |
| Phase 6 | propertyHandlers + 三层回退 | ✅ 完成（不重写 14 个 handler） | a1ae343 |
| Phase 7 | 删除全部旧 .ts | ⚠️ 推迟为 3 批删除路径 | f124a73 |
| Phase 8 | 验证 | ✅ 完成 | f124a73 |

### Stage 详细状态（vue-migration plan-ex.md 后续）

| Stage | 内容 | 状态 | Commit |
|---|---|---|---|
| Stage 1 | ConfigStoreBridge（config.xxx setter 镜像到 Pinia） | ✅ 完成 | 5e964e0 |
| Stage 1.x | Standalone mode fallback（5s 无 WE 注入则推 properties） | ✅ 完成 | 94fa0bc |
| Stage 2 | weather/version vue-i18n 迁移（124 处 i18n() → globalT()） | ✅ 完成 | ea97fcc |
| Stage 3 | 删除 `src/utils/i18n.ts`（38 处迁移） | ✅ 完成 | fee653d |
| Stage 4 | 重建 19 个 SFC mount 测试 + 4 个 leaf content 测试 | ✅ 完成 | 653b5d0 |
| Stage 5-A | wrap `PWCircle.ts` → `usePWCircle()` composable | ✅ 完成 | 0c23007 |
| Stage 5-B | wrap `PWLine.ts` → `usePWLine()` composable | ✅ 完成 | 8c211ce |
| Stage 5-C1 | wrap `RGB.ts` + `PWParticles.ts` → 2 composables | ✅ 完成 | (Stage 5-C1) |
| Stage 5-C2 | wrap `sakura/*` + `fluid/*` → 2 composables | ✅ 完成 | (Stage 5-C2) |
| Stage 3.5 | 删除 `src/utils/config.ts` + `src/utils/elementManager.ts` | ⏳ 待做（须用户确认 Stage 5-C 是否足够） | — |
| Stage 6 | 合并 `vue-migration` 分支到 `main` | ⏳ 待做（须用户确认 push） | — |

## 实施约束（用户决策，已执行）
- ✅ 自主包含：Vue 组件内部完全自包含，canvas/WebGL 命令式代码也搬进 .vue 内部（4 个深替换）
- ⚠️ 删除：Phase 7 后立即删除旧 .ts（推迟，详见 migration-status.md）
- ✅ 引用库：i18n 用 `vue-i18n`（替换自写 utils/i18n.ts）

## 验收硬指标（已全部通过 + Stage 1-5 新增）

### 原 Phase 0-8 验收

- ✅ `yarn build` 输出 dist/bundle.js (IIFE) + dist/index.html，体积 **445.90 KB < 500 KB**
- ✅ `yarn lint` 0 errors
- ✅ `yarn test` **316 测试 / 24 文件通过**（Stage 1-5 累计）
- ✅ 在 WE 之外打开 `dist/index.html` 也能跑（三层回退保底自动降级）
- ⚠️ 旧 .ts 模块全部删除（**推迟**为 3 批删除路径）
- ✅ `vue-i18n` 替代自写 utils/i18n.ts
- ✅ project.json 三层回退全部生效

### Stage 1-5 新增验收

- ✅ vue-tsc 0 errors
- ✅ eslint 0 errors / 5 warnings（全部 pre-existing，与本次无关）
- ✅ ConfigStoreBridge：setter 拦截自动 $patch Pinia store（R10 解决）
- ✅ Standalone fallback：5s 内 WE 未注入则 armStandaloneFallback 推 properties
- ✅ weather/version vue-i18n：124 处 `i18n()` → `globalT()`
- ✅ utils/i18n.ts 删除：38 处迁移 + loadI18nData 改 vue-i18n 版本
- ✅ 19 个 SFC mount 测试 + 4 个 leaf content 测试 + 12 个 composable 测试（usePWCircle 6 + usePWLine 6）
- ✅ jsdom canvas stub 修复（Stage 5-B 暴露 — 见"实施经验" R14）

## 风险点（已应对 / 仍存在）

| 风险 | 状态 |
|---|---|
| R1：Vite IIFE 比 esbuild 大 50-100KB | ✅ 通过 `__VUE_OPTIONS_API__: false` 等 define flags 控制在 445 KB |
| R2：vue-i18n 替换自写 i18n.ts 净 +5KB | ✅ 已替换（utils/i18n.ts 暂未删除） |
| R5：vue-tsc 对 TypeScript 6.0 兼容性 | ✅ 验证通过（TypeScript 6.0.2 + vue-tsc 2.2.12） |
| R7：project.json fetch 失败时降级 | ✅ useProjectJsonDefaults 已实现 try/catch 降级到 BUILTIN_DEFAULTS |
| R8：三层回退合并必须保持 `value` 嵌套结构 | ✅ Pinia store 三个 apply 方法都接受 `Record<string, { value: unknown }>` |
| R9：project.json 的 properties 键名与 WallpaperProperties 字段名 1:1 映射 | ✅ 已通过 vue-tsc 类型检查验证 |
| **新增风险 R10**：Pinia store 与 config 单例双状态不同步 | ✅ **已解决**（ConfigStoreBridge 拦截 setter 自动 $patch） |
| **新增风险 R11**：Vue 薄壳与旧 .ts 双重启动可能导致 RAF 冲突 | ⚠️ 当前通过 propertyHandler 按需触发规避，需 Stage 5 全 6 个组件 wrapper 后统一解决 |
| **新增风险 R12**：独立模式浏览器无 WE 注入时 14 个 handler 不触发 | ✅ **已解决**（useStandaloneProperties 5s 后推 properties，handler 收到后正常初始化 DOM） |
| **新增风险 R13**：vue-i18n 9 useI18n 依赖 inject 上下文，.ts 模块顶层调会抛错 | ✅ **已解决**（globalT() 函数绕过 inject 限制） |
| **新增风险 R14**：jsdom 不实现 canvas 2D backend，PWCircle/PWLine 测试 mount 时 `getContext('2d')` 抛 `Not implemented` | ✅ **已解决**（在 components-smoke.test.ts beforeAll 中 stub prototype.getContext + 预创建 7 个 canvas 元素 — 详见"实施经验"） |
| **新增风险 R15**：jsdom read-only prototype 不接受 vi.spyOn | ✅ **已解决**（用 `Object.defineProperty` 替代 vi.spyOn 替换 getContext） |
| **新增风险 R16**：PWLine.ts 的 null guard 让 CTXLine 保持 null，下次 setCTXLine 访问 undefined 字段 | ✅ **已解决**（必须在测试 setup 中预创建 `#CanLine` canvas 元素，否则 null guard 返回早但下次访问崩） |
| **新增风险 R17**：`@/fluid` FluidEffect 类私有字段 nominal typing 与测试 mock 冲突 | ✅ **已解决**（useFluidEffect 内 `instance` ref 标 `unknown`，方法调用时 `as FluidEffect` cast） |
| **新增风险 R18**：WebGL 模块（sakura/fluid）在 jsdom 测试中 `getContext('webgl')` 抛错 | ✅ **已解决**（composable 不在 onMounted 自动 init，propertyHandler 仍负责 WebGL 启动；测试只 mock 公开 API） |
| **新增风险 R19**：`src/sakura/index.ts` 在模块加载时调 `initSakura()`（顶层副作用），重复注册会触发双重 init | ✅ **已解决**（useSakura 不在 onMounted 调 initSakura，依赖模块顶层副作用一次注册） |

## 历史会话参考（更新）
- `perfectwall.md`（/memories/repo/）—— 项目事实、API 契约、WE 集成约束
- `plan.md`（/memories/session/）—— 完整重构计划 8 Phase（含实施完成状态）
- `server-audit-2026-06-19.md`、`server-audit-round2-2026-06-19.md`、`standalone-mode-2026-06-20.md` —— 独立运行模式开发历史
- `perfectwall-encoding-issues.md`（user memory）—— CJK 编码坑
- `perfectwall-stack.md`（user memory）—— stack 关键事实
- **新增** `src/components/migration-status.md` —— Vue 迁移状态报告（Phase 7 推迟说明）

## 下次会话建议

### 高优先级（Stage 5 收尾）
1. **Stage 5-C**：wrap `PWParticles.ts` + `RGB.ts` + `sakura/*` + `fluid/*` → composable（同 5-A/5-B 模式）— **4 个组件比 5-A/5-B 更复杂**：
   - `PWParticles`：粒子系统 + RAF 主循环
   - `RGB.ts`：HSL 渐变 + 多个 canvas
   - `sakura/`：WebGL 着色器 + 樱花物理
   - `fluid/`：流体模拟 + WebGL
   
   ⚠️ **开始前必读**："实施经验教训"章节中关于 jsdom canvas stub + 7 个 canvas ID 预创建的要求，否则 mount 测试必崩。

2. **Stage 3.5**：删除 `src/utils/config.ts` + `src/utils/elementManager.ts`（须 Stage 5-C 后才能安全删除，因为 sakura/PWCircle/fluid 还写 `config.xxx`）

### 中优先级
3. **Stage 6 合并**：用户同意后 push vue-migration 分支 + `git checkout main && git merge vue-migration`
4. **Phase 7 批次 1**：删除 4 个已深替换的叶子 .ts（time/date/countdown/hitokoto），从 `src/bundle.ts` 移除注释的 4 个 import
5. **Phase 7 批次 2**：重写 propertyHandler 14 个为 composable（音频/RGB/樱花/fluid/weather 5 个最复杂）

### 低优先级
6. **类型补强**：将 `src/stores/types.ts` 的 `optional` 字段收紧为具体类型
7. **性能优化**：观察 bundle size 是否还有压缩空间（当前 445 KB / 500 KB 限）

---

## 实施经验教训（项目认知蒸馏，2026-06-22）

这一节是给"未来会话 / 另一个 agent"的备忘 — 实施过程中发现的、可复用的关键认知。

### 1. Composable Wrapper Pattern（Stage 5-A/5-B 通用）

**目标**：将命令式的 Canvas/WebGL 旧 .ts 包裹成 Vue 3 composable，不重写绘制逻辑（单源真理），只在生命周期钩子处桥接。

**模式模板**（以 usePWCircle 为例）：

```typescript
// src/composables/usePWCircle.ts
import { onMounted, onBeforeUnmount, ref } from 'vue'
import PWCircle from '@/PWCircle'  // 旧 .ts 单例

export function usePWCircle(canvasRef: Ref<HTMLCanvasElement | null>) {
  const isReady = ref(false)
  
  onMounted(() => {
    if (canvasRef.value) {
      PWCircle.bindCanvas(canvasRef.value)  // 绑定 canvas 元素
      PWCircle.start()                        // 启动 RAF
      isReady.value = true
    }
  })
  
  onBeforeUnmount(() => {
    PWCircle.stop()   // 停止 RAF + 释放资源
  })
  
  return { isReady }
}
```

```vue
<!-- src/components/PWCircle.vue -->
<template>
  <canvas ref="canvasRef" id="can" />
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { usePWCircle } from '@/composables/usePWCircle'
const canvasRef = ref<HTMLCanvasElement | null>(null)
usePWCircle(canvasRef)
</script>
```

**关键约束**：
- ❌ **不要**把旧 .ts 的绘制代码搬进 .vue / composable（破坏单源真理，且 RAF 共享状态会冲突）
- ❌ **不要**在 composable 内部调 `useI18n()`（抛出 inject 错误）— 用 `globalT()` 替代
- ✅ 旧 .ts 暴露 `bindCanvas / start / stop / setX` 几个方法，composable 只做生命周期桥接
- ✅ composable 自己写测试（不依赖 .vue mount），6 个测试覆盖 bind/start/stop 状态机

### 2. jsdom Canvas Stub（Stage 5 必读）

jsdom 不实现 canvas 2D backend，`HTMLCanvasElement.prototype.getContext('2d')` 抛 `Error: Not implemented`。**Stage 5 任何 wrapper 测试都会撞上**。

**修复模板**（放在 `tests/components/components-smoke.test.ts` 的 beforeAll）：

```typescript
beforeAll(() => {
  // 1. Stub getContext
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: function () {
      return new Proxy({}, {
        get: (_, prop) => {
          if (prop === 'canvas') return null
          if (prop === 'measureText') return () => ({ width: 0 })
          // 返回一个 no-op function for any method
          return () => undefined
        },
        set: () => true,
      })
    },
  })
  
  // 2. 预创建 7 个 canvas 元素（与 dist/index.html 保持一致）
  const canvasIds = ['can', 'CanLine', 'canvas-particles', 'canvas-audio', 'RGBuse', 'sakura', 'sakurashow']
  canvasIds.forEach(id => {
    if (!document.getElementById(id)) {
      const el = document.createElement('canvas')
      el.id = id
      document.body.appendChild(el)
    }
  })
})
```

**关键约束**：
- ❌ **不要**用 `vi.spyOn(HTMLCanvasElement.prototype, 'getContext')` — jsdom 的 prototype 是 read-only，spyOn 抛 `Cannot redefine property`
- ❌ **不要**在 querySelector 之前忘记预创建 canvas — PWLine 的 `if (!canvasEl) return` null guard 会让 CTXLine 保持 null，下次 setCTXLine 访问 undefined 字段崩
- ✅ 用 `Object.defineProperty` + `configurable: true` 替换 prototype 方法
- ✅ 7 个 canvas ID 与 dist/index.html 一一对应（不要漏 `#sakurashow`，它是独立显示层）

### 3. vi.hoisted() Pattern（Mock Factory 共享状态）

**问题**：`vi.mock('@/module', factory)` 的 factory 在 hoist 时无法访问 test 文件顶部的 const 变量。

**解决**：

```typescript
// tests/composables/useFoo.test.ts
const { mockState, mockFoo } = vi.hoisted(() => ({
  mockState: { count: 0 },
  mockFoo: vi.fn(() => mockState),
}))

vi.mock('@/foo', () => ({
  default: { bar: mockFoo },
}))

import { useFoo } from '@/composables/useFoo'

test('count increments', () => {
  mockState.count = 5
  // ...
})
```

**为什么需要**：factory 在模块提升时执行，比 `const` 声明早。`vi.hoisted` 是 Vitest 提供的延迟初始化机制。

### 4. Pinia Bridge Pattern（双状态同步）

**问题**：旧 .ts 写 `config.xxx = ...`，Vue 组件用 `useConfigStore().xxx`，两套不互通。

**解决**：`src/stores/configBridge.ts` 用 `Object.defineProperty` 拦截 AppConfig prototype 的 setter：

```typescript
const configProto = Object.getPrototypeOf(config)
const props = ['wallpaperMode', 'language', /* ... 100+ fields */]
for (const key of props) {
  const descriptor = Object.getOwnPropertyDescriptor(configProto, key)
  if (!descriptor?.set) continue
  const originalSet = descriptor.set
  Object.defineProperty(configProto, key, {
    get: descriptor.get,
    set(value) {
      originalSet.call(this, value)
      configStore.$patch({ [key]: value })  // 镜像到 Pinia
    },
    configurable: true,
  })
}
```

**关键约束**：
- ✅ 拦截 prototype 而非实例 — 因为 `config` 是单例
- ✅ `$patch` 而非直接赋值 — 保持 Vue 响应式
- ❌ 不要拦截 getter（Vue 组件应该用 Pinia 的响应式 getter，而不是访问旧的 `config.xxx`）

### 5. vue-i18n Hybrid Pattern

**问题**：`useI18n()` 依赖 inject context，.ts 模块顶层调用抛 `inject() can only be used inside setup()`。

**解决**：`src/i18n/index.ts` 导出 `globalT`：

```typescript
import { createI18n } from 'vue-i18n'

const i18n = createI18n({ /* ... */ })

export function useGlobalI18n() {
  return i18n
}

export const globalT = (key: string, ...args: unknown[]) => 
  i18n.global.t(key, ...args)
```

**使用规则**：
- `.vue` 文件的 `<script setup>` 内：用 `useI18n()` 拿响应式 t
- `.ts` 模块顶层（包括 composable 内部、propertyHandler、旧 .ts 改造后）：用 `globalT()`
- 永远不要在 .ts 顶层调 `useI18n()`

### 6. 三层回退顺序（不可调换）

```
1. project.json fetch → useProjectJsonDefaults  (build-time defaults)
2. localStorage → useStoredProperties          (user persisted)
3. wallpaperPropertyListener.applyUserProperties → useWallpaperProperties  (WE runtime, highest)
4. BUILTIN_DEFAULTS in src/stores/config.ts     (last-resort fallback)
```

**回退方向**：高优先级覆盖低优先级。WE 推过来时 `mergeDeep(projectJsonDefaults, stored, wePush)`。

**关键约束**：
- ✅ WE 推的 patch **必须**带 `{ value: T }` 嵌套结构（旧 .ts 习惯），不能拍平
- ❌ 不要把 BUILTIN_DEFAULTS 放在第 1 位 — 那样会覆盖 WE 注入
- ✅ `BUILTIN_DEFAULTS` 只在三层都失败时（独立模式 + 无 localStorage + fetch 失败）兜底

### 7. 本地工具链习惯

- **node_modules\.bin\** 用 `node_modules\.bin\vitest.cmd` / `node_modules\.bin\vue-tsc.cmd` — **不要用 pnpm**（此机器 corepack 下载有问题，会卡在 `pnpm/pnpm` 下载元数据）
- **eslint 输出在 stderr**，CI 解析需 `2>&1 | tee`
- **vue-tsc 比 tsc 慢 3x**，但必须用 — 它解析 .vue 文件的 `<script setup lang="ts">`
- **Vite 5 + TypeScript 6.0.2** 组合稳定，vue-tsc 2.2.12 兼容

### 8. Canvas/WebGL 组件 Stage 5-C 预登记表

| 旧 .ts 路径 | 行数 | Vue 入口 | 测试 mount ID | 复杂度 |
|---|---|---|---|---|
| `src/PWParticles.ts` | ~400 | `src/components/PWParticles.vue` | `#canvas-particles` | 中（粒子 RAF） |
| `src/RGB.ts` | ~250 | `src/components/RgbEffect.vue` | `#RGBuse` | 低（HSL 渐变） |
| `src/sakura/` (10 文件) | ~1500 | `src/components/Sakura.vue` | `#sakura` + `#sakurashow` | **高**（WebGL 着色器） |
| `src/fluid/` (3 文件) | ~800 | `src/components/FluidEffect.vue` | （无独立 canvas，挂到 background） | **高**（WebGL 流体） |
| `src/audioVisualizer.ts` | ~600 | `src/components/PlayerControl.vue` | `#canvas-audio` | 中（FFT） |

**Stage 5-C 顺序建议**：RGB.ts（最简单）→ PWParticles → audioVisualizer → sakura → fluid（最复杂）。

### 9. 启动顺序与状态传播

`src/main.ts` 的 `bootstrap()` 顺序（不可改）：

```typescript
1. createPinia() + app.use(pinia)
2. createI18n() + app.use(i18n)
3. armStandaloneFallback(5000)         // 5s 计时器
4. useProjectJsonDefaults(configStore) // 读 project.json → patch
5. useStoredProperties(configStore)    // 读 localStorage → patch
6. useWallpaperProperties(configStore) // 注册 WE listener（高优先级会覆盖）
7. app.mount('#app')                   // 触发 19 个 SFC mount
8. RAF 循环开始（time/date/Canvas/WebGL）
```

**为什么 4 → 5 → 6 而非反过来**：低优先级先建立 baseline，WE push 是覆盖。如果颠倒，WE 注入前 localStorage 数据会"被冲掉"。

### 10. 关键 Commit Hash 速查

| Commit | 用途 |
|---|---|
| `eab1475` | Phase 0+1 脚手架 + 4 个叶子 |
| `507c583` | Phase 2 5 个中等组件 |
| `6682b31` | Phase 3-5 10 个薄壳 |
| `a1ae343` | Phase 6 三层回退 |
| `f124a73` | Phase 7 推迟报告 |
| `5e964e0` | **Stage 1** ConfigStoreBridge |
| `94fa0bc` | **Stage 1.x** Standalone fallback |
| `ea97fcc` | **Stage 2** vue-i18n 迁移 |
| `fee653d` | **Stage 3** 删 i18n.ts |
| `653b5d0` | **Stage 4** 重建 26 测试 |
| `fdcc19d` | **Docs** 更新 plan 到 11 commits |
| `0c23007` | **Stage 5-A** PWCircle composable |
| `8c211ce` | **Stage 5-B** PWLine composable + jsdom stub |

如果 git log 找不到上述 hash，说明分支被 reset 过 — 检查 `git reflog` 恢复。

## 当前 git 状态（2026-06-22）

vue-migration 分支（领先 main 13 个 commit，全部未推送，遵守 plan.md 用户约定"push only when user says so"）：

```
eab1475  feat(vue-migration): Phase 0 + Phase 1 — Vite 脚手架 + 4 个叶子组件迁移
507c583  feat(vue-migration): Phase 2 — 5 个中等组件薄壳 (Weather/SysMon/DockBar/Player/PictureInfo)
6682b31  feat(vue-migration): Phase 3-5 — 10 个薄壳 SFC (Canvas/WebGL/弹窗/全屏/背景)
a1ae343  feat(vue-migration): Phase 6 — useWallpaperProperties + useStoredProperties + 三层回退顺序接入
f124a73  docs(vue-migration): Phase 7 推迟 + Phase 8 验证 — migration-status 报告 + lint 0 errors
5e964e0  feat(stage1): ConfigStoreBridge — config.xxx setter 自动镜像到 Pinia (R10 解决)
94fa0bc  feat(stage1.x): standalone mode fallback — 5s 内 WE 未注入则推一次完整 properties
ea97fcc  feat(stage2): migrate weather/version to vue-i18n (124 call sites)
fee653d  feat(stage3): delete src/utils/i18n.ts (migrate 38 callers to globalT)
653b5d0  feat(stage4): rebuild 26 SFC mount tests (304 tests pass total)
fdcc19d  docs: update plan.md and plan-ex.md with Stage 1-5 progress (11 commits)
0c23007  feat(stage5-A): wrap PWCircle.ts in usePWCircle composable
8c211ce  feat(stage5-B): wrap PWLine.ts in usePWLine composable + jsdom canvas stub fix
```

main 分支状态：`b6e8534 refactor(systemMonitor): sort imports/exports and apply consistent formatting`

合并步骤：
```bash
git push origin vue-migration   # 需用户确认
git checkout main
git merge vue-migration --no-ff -m "Merge vue-migration: Vue 3 + Vite + Pinia migration"
```
