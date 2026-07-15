/**
 * useAudioVisualProperties — Vue 3 composable wrapper for audio visualizer
 * properties (PWCircle, PWLine, audio ring/ball/point, smoothing).
 *
 * Stage 3-3 (Phase 7 批次 3-3): wrap src/propertyHandlers/audioVisualPropertyHandler.ts
 * as a composable. Pure Pinia-side batched patch + imperative calls into
 * runtime.param / runtime.PWLineParam / runtime.w.getAudioVisualizer().
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const runtimeStore = useRuntimeStore();

import { logInitComplete } from '../propertyHandlers/_helpers';
import { WallpaperProperties } from '../propertyHandlers/types';

const config = useConfigStore();

function getCircleCtx(): CanvasRenderingContext2D | null {
    const can = document.querySelector('#can') as HTMLCanvasElement | null;
    return can?.getContext('2d') ?? null;
}

function getLineCtx(): CanvasRenderingContext2D | null {
    const canLine = document.querySelector('#CanLine') as HTMLCanvasElement | null;
    return canLine?.getContext('2d') ?? null;
}

export function useAudioVisualProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const ctx = getCircleCtx();
    const CTXLine = getLineCtx();
    const param = runtimeStore.param;
    const PWLineParam = runtimeStore.PWLineParam;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = runtimeStore.wallpaper as any;
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.visual_audio_model) {
        const model = properties.visual_audio_model.value;
        patch.visual_audio_model = model;
        config.visual_audio_model = model; // sync

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

    if (properties.PWLinePosition && PWLineParam) {
        PWLineParam.LinePosition = properties.PWLinePosition.value;
        patch.pw_line_position = properties.PWLinePosition.value;
    }

    if (properties.PWLineStyle && PWLineParam) {
        PWLineParam.style = properties.PWLineStyle.value;
        patch.pw_line_style = properties.PWLineStyle.value;
    }

    if (properties.PWLineDirection && PWLineParam) {
        PWLineParam.Direction = properties.PWLineDirection.value;
        patch.pw_line_direction = properties.PWLineDirection.value;
    }

    if (properties.PWLineWidth && CTXLine && PWLineParam) {
        CTXLine.lineWidth = PWLineParam.lineWidth = properties.PWLineWidth.value;
        patch.pw_line_width = properties.PWLineWidth.value;
    }

    if (properties.PWLineSpacing && PWLineParam) {
        PWLineParam.sw = properties.PWLineSpacing.value / 10;
        patch.pw_line_spacing = properties.PWLineSpacing.value;
    }

    if (properties.PWLineDensity && PWLineParam) {
        PWLineParam.LineDensity = properties.PWLineDensity.value * 10;
        patch.pw_line_density = properties.PWLineDensity.value;
    }

    if (properties.PWLineRange && PWLineParam) {
        PWLineParam.range = properties.PWLineRange.value / 5;
        patch.pw_line_range = properties.PWLineRange.value;
    }

    if (properties.PWLineTransparency && CTXLine && PWLineParam) {
        PWLineParam.LineTransparency = properties.PWLineTransparency.value / 100;
        CTXLine.globalAlpha = PWLineParam.LineTransparency;
        patch.pw_line_transparency = properties.PWLineTransparency.value;
    }

    if (properties.PWLineColor && CTXLine && PWLineParam) {
        const c = properties.PWLineColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        CTXLine.strokeStyle = PWLineParam.color = 'rgba(' + c + ',0.8)';
        patch.pw_line_color = c as [number, number, number];
    }

    if (properties.PWLineBlurColor && CTXLine && PWLineParam) {
        const c = properties.PWLineBlurColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        CTXLine.shadowColor = PWLineParam.blurColor = 'rgb(' + c + ')';
        patch.pw_line_blur_color = c as [number, number, number];
    }

    if (properties.PWLineX && PWLineParam) {
        PWLineParam.LineX = properties.PWLineX.value / 100.0;
        patch.pw_line_x = properties.PWLineX.value;
    }

    if (properties.PWLineY && PWLineParam) {
        PWLineParam.LineY = properties.PWLineY.value / 100.0;
        patch.pw_line_y = properties.PWLineY.value;
    }

    if (properties.PWMiddleLine && PWLineParam) {
        PWLineParam.MiddleLine = properties.PWMiddleLine.value;
        patch.pw_line_middle_line = properties.PWMiddleLine.value;
    }

    if (properties.PWLineColorMode && PWLineParam) {
        PWLineParam.ColorMode = properties.PWLineColorMode.value;
        patch.pw_line_color_mode = properties.PWLineColorMode.value;
    }

    if (properties.PWLineSolidColorGradient && CTXLine && PWLineParam) {
        PWLineParam.SolidColorGradient = properties.PWLineSolidColorGradient.value;
        patch.pw_line_solid_color_gradient = properties.PWLineSolidColorGradient.value;
        if (!properties.PWLineSolidColorGradient.value) {
            CTXLine.strokeStyle = PWLineParam.color;
        }
    }

    if (properties.PWLineBlurColorGradient && PWLineParam) {
        PWLineParam.BlurColorGradient = properties.PWLineBlurColorGradient.value;
        patch.pw_line_blur_color_gradient = properties.PWLineBlurColorGradient.value;
    }

    if (properties.PWLineColorRhythm && PWLineParam) {
        PWLineParam.ColorRhythm = properties.PWLineColorRhythm.value;
        patch.pw_line_color_rhythm = properties.PWLineColorRhythm.value;
    }

    if (properties.PWLineGradientRate && PWLineParam) {
        PWLineParam.GradientRate = properties.PWLineGradientRate.value / 10;
        patch.pw_line_gradient_rate = properties.PWLineGradientRate.value;
    }

    if (properties.audio_amplitude) {
        patch.audio_amplitude = properties.audio_amplitude.value;
        w?.getAudioVisualizer()?.set('amplitude', properties.audio_amplitude.value);
    }

    if (properties.audio_decline) {
        patch.audio_decline = properties.audio_decline.value;
        w?.getAudioVisualizer()?.set('decline', properties.audio_decline.value / 100);
    }

    if (properties.audio_isRing) {
        patch.audio_is_ring = properties.audio_isRing.value;
        w?.getAudioVisualizer()?.set('isRing', properties.audio_isRing.value);
    }

    if (properties.audio_isStaticRing) {
        patch.audio_is_static_ring = properties.audio_isStaticRing.value;
        w?.getAudioVisualizer()?.set('isStaticRing', properties.audio_isStaticRing.value);
    }

    if (properties.audio_isInnerRing) {
        patch.audio_is_inner_ring = properties.audio_isInnerRing.value;
        w?.getAudioVisualizer()?.set('isInnerRing', properties.audio_isInnerRing.value);
    }

    if (properties.audio_isOuterRing) {
        patch.audio_is_outer_ring = properties.audio_isOuterRing.value;
        w?.getAudioVisualizer()?.set('isOuterRing', properties.audio_isOuterRing.value);
    }

    if (properties.audio_radius) {
        patch.audio_radius = properties.audio_radius.value;
        w?.getAudioVisualizer()?.set('radius', properties.audio_radius.value / 10);
    }

    if (properties.audio_ringRotation) {
        patch.audio_ring_rotation = properties.audio_ringRotation.value;
        w?.getAudioVisualizer()?.set('ringRotation', properties.audio_ringRotation.value);
    }

    if (properties.audio_opacity) {
        patch.audio_opacity = properties.audio_opacity.value;
        w?.getAudioVisualizer()?.set('opacity', properties.audio_opacity.value / 100);
    }

    if (properties.audio_color) {
        const c = properties.audio_color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.audio_color = c as [number, number, number];
        w?.getAudioVisualizer()?.set('color', c);
    }

    if (properties.audio_shadowColor) {
        const c = properties.audio_shadowColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.audio_shadow_color = c as [number, number, number];
        w?.getAudioVisualizer()?.set('shadowColor', c);
    }

    if (properties.audio_shadowBlur) {
        patch.audio_shadow_blur = properties.audio_shadowBlur.value;
        w?.getAudioVisualizer()?.set('shadowBlur', properties.audio_shadowBlur.value);
    }

    if (properties.audio_offsetX) {
        patch.audio_offset_x = properties.audio_offsetX.value;
        w?.getAudioVisualizer()?.set('offsetX', properties.audio_offsetX.value / 100);
    }

    if (properties.audio_offsetY) {
        patch.audio_offset_y = properties.audio_offsetY.value;
        w?.getAudioVisualizer()?.set('offsetY', properties.audio_offsetY.value / 100);
    }

    if (properties.audio_isClickOffset) {
        patch.audio_is_click_offset = properties.audio_isClickOffset.value;
        w?.getAudioVisualizer()?.set('isClickOffset', properties.audio_isClickOffset.value);
    }

    if (properties.audio_isLineTo) {
        patch.audio_is_line_to = properties.audio_isLineTo.value;
        w?.getAudioVisualizer()?.set('isLineTo', properties.audio_isLineTo.value);
    }

    if (properties.audio_firstPoint) {
        patch.audio_first_point = properties.audio_firstPoint.value;
        w?.getAudioVisualizer()?.set('firstPoint', properties.audio_firstPoint.value);
    }

    if (properties.audio_secondPoint) {
        patch.audio_second_point = properties.audio_secondPoint.value;
        w?.getAudioVisualizer()?.set('secondPoint', properties.audio_secondPoint.value);
    }

    if (properties.audio_pointNum) {
        patch.audio_point_num = properties.audio_pointNum.value;
        w?.getAudioVisualizer()?.set('pointNum', properties.audio_pointNum.value);
    }

    if (properties.audio_distance) {
        patch.audio_distance = properties.audio_distance.value;
        w?.getAudioVisualizer()?.set('distance', properties.audio_distance.value);
    }

    if (properties.audio_lineWidth) {
        patch.audio_line_width = properties.audio_lineWidth.value;
        w?.getAudioVisualizer()?.set('lineWidth', properties.audio_lineWidth.value);
    }

    if (properties.audio_isBall) {
        patch.audio_is_ball = properties.audio_isBall.value;
        w?.getAudioVisualizer()?.set('isBall', properties.audio_isBall.value);
    }

    if (properties.audio_ballSpacer) {
        patch.audio_ball_spacer = properties.audio_ballSpacer.value;
        w?.getAudioVisualizer()?.set('ballSpacer', properties.audio_ballSpacer.value);
    }

    if (properties.audio_ballSize) {
        patch.audio_ball_size = properties.audio_ballSize.value;
        w?.getAudioVisualizer()?.set('ballSize', properties.audio_ballSize.value);
    }

    if (properties.audio_ballRotation) {
        patch.audio_ball_rotation = properties.audio_ballRotation.value;
        w?.getAudioVisualizer()?.set('ballRotation', properties.audio_ballRotation.value);
    }

    if (properties.audioSmoothEnabled) {
        const v = properties.audioSmoothEnabled.value;
        patch.audio_smooth_enabled = v;
        config.audio_smooth_enabled = v; // 同步到旧 config（audioVisualizer.ts 读取）
    }

    if (properties.audioSmoothFactor) {
        const v = properties.audioSmoothFactor.value;
        patch.audio_smooth_factor = v;
        config.audio_smooth_factor = v; // 同步到旧 config
    }

    if (properties.audioSpatialWindow) {
        let windowValue = properties.audioSpatialWindow.value;
        windowValue = windowValue % 2 === 0 ? windowValue + 1 : windowValue;
        patch.audio_spatial_window = windowValue;
        config.audio_spatial_window = windowValue; // 同步到旧 config
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[audioVisualizer]', '可视化音频', FirstLoad);
    }
}
