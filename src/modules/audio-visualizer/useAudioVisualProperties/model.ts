/**
 * useAudioVisualProperties 拆分 — 可视化模式切换（visual_audio_model / show 开关）
 */

import type { WallpaperProperties } from '../../../types/types';
import type { CircleParam, ConfigStore, LineParam } from './types';

/**
 * 应用可视化模型与显隐开关属性
 */
export function applyModelProperties(
    properties: WallpaperProperties,
    param: CircleParam | null,
    PWLineParam: LineParam | null,
    store: ConfigStore,
    patch: Record<string, unknown>
): void {
    if (properties.visual_audio_model) {
        const model = properties.visual_audio_model.value;
        patch.visual_audio_model = model;
        store.visual_audio_model = model; // sync

        switch (model) {
            case 0:
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 1:
                if (param) param.showCircle = store.pw_circle_show_bool ?? true;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 2:
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = store.pw_line_show_bool ?? true;
                break;
            case 3:
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 4:
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
        }
    }

    if (properties.PWCircle_show_bool) {
        const show = properties.PWCircle_show_bool.value;
        patch.pw_circle_show_bool = show;
        if (param && store.visual_audio_model === 1) {
            param.showCircle = show;
        }
    }

    if (properties.PWLine_show_bool) {
        const show = properties.PWLine_show_bool.value;
        patch.pw_line_show_bool = show;
        if (PWLineParam && store.visual_audio_model === 2) {
            PWLineParam.showLine = show;
        }
    }
}
