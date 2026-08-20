<!-- Background — 真 Vue 化：响应式驱动 changeBackground，模板持有四层容器 -->
<template>
    <div id="background-container">
        <div id="background-blur-layer1" class="background-blur-layer"></div>
        <div id="background-blur-layer2" class="background-blur-layer"></div>
        <div
            id="background-layer1"
            class="background-layer"
            :style="layer1Style"
            style="background-image: url('./src/source/imgs/1.jpg');"
        ></div>
        <div id="background-layer2" class="background-layer"></div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';

import { useConfigStore } from '@/stores/config';

import { changeBackground } from './index';

const cfg = useConfigStore();

// 必须与重构前薄壳一致：模板硬编码兜底默认图，避免首帧黑屏
const FALLBACK_STYLE = "background-image: url('./src/source/imgs/1.jpg');";

const layer1Style = computed(() => {
    const mode = cfg.wallpaper_mode;
    if (mode != null && mode !== 1) return undefined;
    const url = cfg.custom ? `file:///${cfg.custom}` : (cfg.background_route ?? './src/source/imgs/1.jpg');
    return { backgroundImage: `url('${url}')` };
});

onMounted(() => {
    changeBackground();
    requestAnimationFrame(() => {
        const layer1 = document.querySelector('#background-layer1') as HTMLElement | null;
        const hasBg = Boolean(layer1?.style.backgroundImage);
        if (!hasBg && layer1) {
            const fallback = cfg.custom ? `file:///${cfg.custom}` : (cfg.background_route ?? './src/source/imgs/1.jpg');
            layer1.style.backgroundImage = `url('${fallback}')`;
            layer1.style.opacity = '1';
            const container = document.querySelector('#background-container') as HTMLElement | null;
            if (container) container.style.display = 'block';
        }
    });
    if (cfg.wallpaper_mode == null) {
        setTimeout(() => { if (cfg.wallpaper_mode == null) changeBackground(); }, 200);
    }
});
</script>
