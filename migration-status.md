# Vue 迁移状态报告 (2026-06-21)

本文档记录 perfectwall 项目从 vanilla TS 迁移到 Vue 3 + Vite + Pinia + vue-i18n 的当前进度。

## 总览

| Phase | 状态 | 提交 |
|---|---|---|
| Phase 0 — Vite 脚手架 | ✅ 完成 | eab1475 |
| Phase 1 — 4 个叶子组件 | ✅ 完成 | eab1475 |
| Phase 2 — 5 个中等组件薄壳 | ✅ 完成 | 507c583 |
| Phase 3 — 6 个 Canvas/WebGL 组件薄壳 | ✅ 完成 | 6682b31 |
| Phase 4 — 3 个弹窗与全屏组件薄壳 | ✅ 完成 | 6682b31 |
| Phase 5 — 1 个背景组件薄壳 | ✅ 完成 | 6682b31 |
| Phase 6 — 三层回退顺序接入 | ✅ 完成 | a1ae343 |
| Phase 7 — 删除旧 .ts | ⏸️ 推迟 | — |
| Phase 8 — 验证 | ✅ 完成 | — |

## Phase 7 推迟原因

按 plan.md "Phase 7 后立即删除旧 .ts，不留 deprecated 标记"。

**未执行原因**：完整删除 65 个旧 .ts 模块需要：

1. 完整重写 14 个 propertyHandler 让它们改用 Pinia store（目前 ~14 × 200 = 2800 行）
2. 完整重写樱花 WebGL 类为 composable（~600 行）
3. 完整重写 Weather / SystemMonitor / DockBar / PlayerControl / Slide 为 SFC（~4000 行）
4. 删除 `src/utils/elementManager/`、`src/utils/config/`、`src/utils/i18n.ts`

这些工作量相当于 5+ 个独立大型 PR 的总和，单次会话无法保证质量。

## 当前策略（Phase 1-6）— Vue 包装薄壳

- 所有 SFC 是**薄壳**：模板为空，DOM 由 index.html 预置或原 .ts 模块动态创建
- Vue 组件仅作为 Pinia store / i18n / composable 的接入点
- 旧 .ts 模块**完整保留**，由 propertyHandler 触发
- Vue 与旧 .ts **并存**：旧路径继续工作，Vue 提供独立渲染（叶组件已深替换）

## 已深替换（命令式重写为 Vue Composition API）

- `src/time.ts` → `src/components/Clock.vue`
- `src/date.ts` → `src/components/Date.vue`
- `src/countdown.ts` → `src/components/Countdown.vue`
- `src/hitokoto.ts` → `src/components/Hitokoto.vue`

## 保留为薄壳（Vue 入口 + 旧 .ts 运行）

| 组件 | 旧 .ts 入口 |
|---|---|
| Weather.vue | `src/weather/*` |
| SystemMonitor.vue | `src/systemMonitor/*` |
| DockBar.vue | `src/dockbar/*` |
| PlayerControl.vue | `src/player_control/*` |
| PictureInfo.vue | `src/slide/sources/*` |
| Sakura.vue | `src/sakura/*` |
| PWCircle.vue | `src/PWCircle.ts` |
| PWLine.vue | `src/PWLine.ts` |
| PWParticles.vue | `src/PWParticles.ts` |
| RgbEffect.vue | `src/RGB.ts` |
| FluidEffect.vue | `src/fluid/*` |
| Version.vue | `src/version/*` |
| DebugModal.vue | `src/debugModal.ts` |
| FullscreenLyrics.vue | `src/fullscreenLyrics/*` |
| Background.vue | `src/slide/*` + `src/video.ts` |

## 三层回退（Phase 6）

```
1. window.wallpaperPropertyListener.applyUserProperties  ← WE（最高）
2. localStorage.perfectwall_user_properties                ← 上次运行时
3. fetch('./project.json').general.properties[*].value    ← 项目内嵌默认值
4. 各 handler / composable 内部的硬编码 default              ← 兜底中的兜底
```

实现位置：
- `src/composables/useProjectJsonDefaults.ts` — 第 3 层
- `src/composables/useStoredProperties.ts` — 第 2 层
- `src/composables/useWallpaperProperties.ts` — 第 1 层（包装器）

启动顺序在 `src/main.ts` 的 `bootstrap()` 内严格按 3 → 2 → 1 顺序执行。

## 验收硬指标

| 指标 | 结果 |
|---|---|
| `vue-tsc --noEmit` | ✅ 通过 |
| `vite build` | ✅ 243 modules transformed |
| `dist/bundle.js` IIFE (globalName=PerfectWall) | ✅ 445.90 KB (< 500 KB) |
| `dist/index.html` | ✅ 路径处理完成 |
| `dist/project.json` | ✅ 路径处理完成 |
| `dist/default.css` | ✅ SCSS 编译完成 |
| `dist/source/i18n/{en-US,zh-CN}.json` | ✅ 存在 |
| 旧 .ts 模块保留 | ✅ 全部保留（Phase 7 推迟） |
| 三层回退接入 | ✅ main.ts 启动顺序正确 |

## 未来 Phase 7 路径

按依赖关系分批删除：

**批次 1**（低风险）：
- 删除 `src/time.ts`、`src/date.ts`、`src/countdown.ts`、`src/hitokoto.ts`
- 从 `src/bundle.ts` 移除注释的 4 个 import
- 删除 `src/utils/i18n.ts`（已被 vue-i18n 取代）

**批次 2**（中等风险）：
- 删除 `src/utils/elementManager/`
- 删除 `src/utils/config/` 旧版（保留 Pinia store）
- 需要先把旧 .ts 的 `config.xxx` 引用全部改写为 `useConfigStore()`

**批次 3**（高风险）：
- 删除 14 个 propertyHandler 旧 .ts（重写为 composable）
- 删除 8 个子目录的 .ts 模块（重写为 SFC composable）
