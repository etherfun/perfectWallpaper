import { computed, watch } from 'vue';

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { changeBackground } from '..';

/**
 * 背景响应式驱动：wallpaper_mode / custom / background_route / customdirectory 变化时
 * 自动触发 changeBackground，替代 propertyHandler 的命令式 shouldShow() 散落调用。
 * 首次挂载由 Background.vue 触发。
 */
export function useBackground() {
    const cfg = useConfigStore();
    const rt = useRuntimeStore();

    const wallpaperMode = computed(() => cfg.wallpaper_mode);
    const custom = computed(() => cfg.custom);
    const backgroundRoute = computed(() => cfg.background_route);
    const customDirectory = computed(() => cfg.customdirectory);
    const currentImg = computed(() => rt.photo.currentImg);

    watch([wallpaperMode, custom, backgroundRoute, customDirectory], () => {
        changeBackground();
    });

    return { wallpaperMode, currentImg, changeBackground };
}
