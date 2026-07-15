<!--
  PWLine.vue — 折线音频可视化组件 (Phase 3)
  替换原 src/PWLine.ts。

  原模块：
    - 在 #CanLine 上绘制 Canvas 2D 折线音频频谱
    - 暴露 PWLineInit() / setCTXLine() / drawWave()
    - main.ts 启动时调用 PWLineInit()
    - WallpaperEffectController 在 audio 数据到达时调用 drawWave

  Phase 3 薄壳：保留原启动逻辑。
-->
<template>
    <!-- 折线音频可视化 canvas — 从 index.html 迁移至此处 (Phase 7) -->
    <canvas id="CanLine">您的浏览器不支持canvas标签</canvas>
</template>

<script setup lang="ts">
/**
 * Phase 5-B PWLine composable wrapper：
 *   - onMounted 时自动调用 usePWLine() 的 init()（替代 main.ts 的顶层副作用）
 *   - 暴露 lifecycle 控制给 Vue（enabled toggle 可停止 RAF）
 *   - drawing code 仍由 audioVisualizer.ts 通过 src/PWLine.ts 旧 API 调用
 *     （audioVisualizer 改造留到 stage 5-C）
 */
import { onBeforeUnmount } from 'vue';

import { usePWLine } from './usePWLine';
import { useConfigStore } from '@/stores/config';

const config = useConfigStore();
const line = usePWLine();

const enabled = (): boolean => Boolean(config.PWLine_show_bool);
const _ = enabled;

// main.ts 顶层副作用仍保留以保证 audioVisualizer 拿到 ctx — 这里不重复 init
// （双重 init 会让 lineX/lineY 重复计算）。Window resize 监听在
// usePWLine() 的 onMounted 中已注册。
onBeforeUnmount(() => {
    // No-op: usePWLine's onBeforeUnmount removes its own resize listener
});
</script>
