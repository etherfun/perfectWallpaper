/**
 * useAudioVisualProperties — 音频可视化属性应用（主入口）
 *
 * 拆分说明：按参数领域拆分为 model/circle/line/audio 子模块，
 * 主函数保留编排逻辑（patch 收集 + $patch 统一提交），对外 API 不变。
 */

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { WallpaperProperties } from '../../../types/types';
import { logInitComplete } from '../../../utils/helpers';
import { applyAudioProperties } from './audio';
import { applyCircleProperties } from './circle';
import { getCircleCtx, getLineCtx } from './helpers';
import { applyLineProperties } from './line';
import { applyModelProperties } from './model';

export function useAudioVisualProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const runtimeStore = useRuntimeStore();
    const config = useConfigStore();
    const ctx = getCircleCtx();
    const CTXLine = getLineCtx();
    const param = runtimeStore.param;
    const PWLineParam = runtimeStore.PWLineParam;

    const w = runtimeStore.wallpaper as any;
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    applyModelProperties(properties, param, PWLineParam, store, patch);

    applyCircleProperties(properties, param, ctx, runtimeStore, patch);

    applyLineProperties(properties, PWLineParam, CTXLine, patch);

    applyAudioProperties(properties, w, config, patch);

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[audioVisualizer]', '音频可视化', FirstLoad);
    }
}
