/**
 * useAudioVisualProperties 拆分 — PWCircle 参数（PolygonAngle + 圆圈参数块）
 */

import { useRuntimeStore } from '@/stores/runtime';

import type { WallpaperProperties } from '../../../types/types';
import type { CircleParam } from './types';

/** Runtime store 实例类型 */
type RuntimeStore = ReturnType<typeof useRuntimeStore>;

/**
 * 应用 PWCircle 相关属性（角度/样式/尺寸/颜色/渐变/旋转等）
 */
export function applyCircleProperties(
    properties: WallpaperProperties,
    param: CircleParam | null,
    ctx: CanvasRenderingContext2D | null,
    runtimeStore: RuntimeStore,
    patch: Record<string, unknown>
): void {
    if (properties.PolygonAngle && param) {
        const mode = properties.PolygonAngle.value;
        patch.polygon_angle = mode;
        switch (mode) {
            case 1:
                runtimeStore.param.PolygonAngle = 1;
                runtimeStore.param.Polygon = 295;
                break;
            case 2:
                runtimeStore.param.PolygonAngle = 2;
                runtimeStore.param.Polygon = 270;
                break;
            case 3:
                runtimeStore.param.PolygonAngle = 4;
                runtimeStore.param.Polygon = 245;
                break;
            case 4:
                runtimeStore.param.PolygonAngle = 5;
                runtimeStore.param.Polygon = 220;
                break;
            case 5:
                runtimeStore.param.PolygonAngle = 7;
                runtimeStore.param.Polygon = 195;
                break;
            case 6:
                runtimeStore.param.PolygonAngle = 9;
                runtimeStore.param.Polygon = 170;
                break;
            case 7:
                runtimeStore.param.PolygonAngle = 10;
                runtimeStore.param.Polygon = 145;
                break;
            case 8:
                runtimeStore.param.PolygonAngle = 12;
                runtimeStore.param.Polygon = 120;
                break;
            case 9:
                runtimeStore.param.PolygonAngle = 30;
                runtimeStore.param.Polygon = 95;
                break;
            case 10:
                runtimeStore.param.PolygonAngle = 60;
                runtimeStore.param.Polygon = 70;
                break;
            case 11:
                runtimeStore.param.PolygonAngle = 90;
                runtimeStore.param.Polygon = 45;
                break;
            case 12:
                runtimeStore.param.PolygonAngle = 180;
                runtimeStore.param.Polygon = 20;
                break;
            default:
        }
    }

    if (properties.style && param) {
        param.style = properties.style.value;
        patch.pw_circle_style = properties.style.value;
    }

    if (properties.radius && param) {
        param.r = properties.radius.value / 100;
        patch.pw_circle_radius = properties.radius.value;
    }

    if (properties.range && param) {
        param.range = properties.range.value / 5;
        patch.pw_circle_range = properties.range.value;
    }

    if (properties.color && ctx && param) {
        const c = properties.color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        ctx.strokeStyle = param.color = 'rgba(' + c + ',0.8)';
        patch.pw_circle_color = c as [number, number, number];
    }

    if (properties.blurColor && ctx && param) {
        const c = properties.blurColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        ctx.shadowColor = param.blurColor = 'rgb(' + c + ')';
        patch.pw_circle_blur_color = c as [number, number, number];
    }

    if (properties.cX && param) {
        param.cX = properties.cX.value * 0.01;
        patch.pw_circle_x = properties.cX.value;
    }

    if (properties.cY && param) {
        param.cY = properties.cY.value * 0.01;
        patch.pw_circle_y = properties.cY.value;
    }

    if (properties.ColorMode && param) {
        param.ColorMode = properties.ColorMode.value;
        patch.pw_circle_color_mode = properties.ColorMode.value;
    }

    if (properties.SolidColorGradient && param) {
        param.SolidColorGradient = properties.SolidColorGradient.value;
        patch.pw_circle_solid_color_gradient = properties.SolidColorGradient.value;
        if (!properties.SolidColorGradient.value && ctx) {
            ctx.strokeStyle = param.color;
        }
    }

    if (properties.BlurColorGradient && param) {
        param.BlurColorGradient = properties.BlurColorGradient.value;
        patch.pw_circle_blur_color_gradient = properties.BlurColorGradient.value;
    }

    if (properties.ColorRhythm && param) {
        param.ColorRhythm = properties.ColorRhythm.value;
        patch.pw_circle_color_rhythm = properties.ColorRhythm.value;
    }

    if (properties.GradientRate && param) {
        param.GradientRate = properties.GradientRate.value / 10;
        patch.pw_circle_gradient_rate = properties.GradientRate.value;
    }

    if (properties.lineWidth && ctx && param) {
        ctx.lineWidth = param.lineWidth = properties.lineWidth.value;
        patch.pw_circle_line_width = properties.lineWidth.value;
    }

    if (properties.rotation && param) {
        param.rotation = properties.rotation.value;
        runtimeStore.param.rotationcopy = param.rotation;
        patch.pw_circle_rotation = properties.rotation.value;
    }

    if (properties.direction && param) {
        param.direction = properties.direction.value;
        patch.pw_circle_direction = properties.direction.value;
    }

    if (properties.wavetransparency && ctx && param) {
        param.wavetransparency = properties.wavetransparency.value / 100;
        ctx.globalAlpha = param.wavetransparency;
        patch.pw_circle_wavetransparency = properties.wavetransparency.value;
    }

    if (properties.showSemiCircle && param) {
        param.showSemiCircle = properties.showSemiCircle.value;
        patch.pw_circle_show_semi_circle = properties.showSemiCircle.value;
        if (properties.showSemiCircle.value) {
            runtimeStore.param.rotationcopy = param.rotation;
            param.rotation = 0;
            param.offsetAngle = 0;
        } else {
            param.rotation = runtimeStore.param.rotationcopy;
        }
    }

    if (properties.SemiCircledirection && param) {
        param.SemiCircledirection = properties.SemiCircledirection.value;
        patch.pw_circle_semicircle_direction = properties.SemiCircledirection.value;
    }
}
