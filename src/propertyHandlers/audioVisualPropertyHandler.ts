import { useConfigStore } from '@/stores/config';
import { config } from '@/utils/config'; // config.runtime preserved for runtime.param / runtime.PWLineParam (Stage 3.5-B)

import { logInitComplete } from './_helpers';
import { WallpaperProperties } from './types';

/**
 * 获取圆圈可视化canvas�?D上下�?
 */
function getCircleCtx(): CanvasRenderingContext2D | null {
    const can = document.querySelector('#can') as HTMLCanvasElement | null;
    return can?.getContext('2d') ?? null;
}

/**
 * 获取直线可视化canvas�?D上下�?
 */
function getLineCtx(): CanvasRenderingContext2D | null {
    const canLine = document.querySelector('#CanLine') as HTMLCanvasElement | null;
    return canLine?.getContext('2d') ?? null;
}

/**
 * 处理音频可视化相关属�?
 * @param properties 属性对�?
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleAudioVisualProperties(properties: WallpaperProperties, FirstLoad: boolean) {
    const ctx = getCircleCtx();
    const CTXLine = getLineCtx();
    const param = config.runtime.param;
    const PWLineParam = config.runtime.PWLineParam;
    const wallpaper = config.runtime.wallpaper;
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.visual_audio_model) {
        const model = properties.visual_audio_model.value;
        patch.visual_audio_model = model;

        // 根据模式控制显示
        switch (model) {
            case 0: // �?
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 1: // 完美圆圈
                if (param) param.showCircle = config.pw_circle_show_bool;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 2: // 完美直线
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = config.pw_line_show_bool;
                break;
            case 3: // Alice Circle
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 4: // 完美直线
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
        }
    }

    if (properties.PWCircle_show_bool) {
        const show = properties.PWCircle_show_bool.value;
        patch.pw_circle_show_bool = show;
        // 如果当前是模�?，也要更新showCircle
        if (param && config.visual_audio_model === 1) {
            param.showCircle = show;
        }
    }

    if (properties.PWLine_show_bool) {
        const show = properties.PWLine_show_bool.value;
        patch.pw_line_show_bool = show;
        // 如果当前是模�?，也要更新showLine
        if (PWLineParam && config.visual_audio_model === 2) {
            PWLineParam.showLine = show;
        }
    }

    // 多边形变�?
    if (properties.PolygonAngle && param) {
        const mode = properties.PolygonAngle.value;
        patch.polygon_angle = mode;
        // 根据模式设置 PolygonAngle �?Polygon �?(与原始JS版本一�?
        switch (mode) {
            case 1:
                config.runtime.param.PolygonAngle = 1;
                config.runtime.param.Polygon = 295;
                break;
            case 2:
                config.runtime.param.PolygonAngle = 2;
                config.runtime.param.Polygon = 270;
                break;
            case 3:
                config.runtime.param.PolygonAngle = 4;
                config.runtime.param.Polygon = 245;
                break;
            case 4:
                config.runtime.param.PolygonAngle = 5;
                config.runtime.param.Polygon = 220;
                break;
            case 5:
                config.runtime.param.PolygonAngle = 7;
                config.runtime.param.Polygon = 195;
                break;
            case 6:
                config.runtime.param.PolygonAngle = 9;
                config.runtime.param.Polygon = 170;
                break;
            case 7:
                config.runtime.param.PolygonAngle = 10;
                config.runtime.param.Polygon = 145;
                break;
            case 8:
                config.runtime.param.PolygonAngle = 12;
                config.runtime.param.Polygon = 120;
                break;
            case 9:
                config.runtime.param.PolygonAngle = 30;
                config.runtime.param.Polygon = 95;
                break;
            case 10:
                config.runtime.param.PolygonAngle = 60;
                config.runtime.param.Polygon = 70;
                break;
            case 11:
                config.runtime.param.PolygonAngle = 90;
                config.runtime.param.Polygon = 45;
                break;
            case 12:
                config.runtime.param.PolygonAngle = 180;
                config.runtime.param.Polygon = 20;
                break;
            default:
        }
    }

    if (properties.style && param) {
        param.style = properties.style.value;
        patch.pw_circle_style = properties.style.value;
    }

    // 半径
    if (properties.radius && param) {
        param.r = properties.radius.value / 100;
        patch.pw_circle_radius = properties.radius.value;
    }

    // 幅度
    if (properties.range && param) {
        param.range = properties.range.value / 5;
        patch.pw_circle_range = properties.range.value;
    }

    // 颜色
    if (properties.color && ctx && param) {
        const c = properties.color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        ctx.strokeStyle = param.color = 'rgba(' + c + ',0.8)';
        patch.pw_circle_color = c as [number, number, number];
    }

    // 模糊颜色
    if (properties.blurColor && ctx && param) {
        const c = properties.blurColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        ctx.shadowColor = param.blurColor = 'rgb(' + c + ')';
        patch.pw_circle_blur_color = c as [number, number, number];
    }

    // 圆的位置
    if (properties.cX && param) {
        param.cX = properties.cX.value * 0.01;
        patch.pw_circle_x = properties.cX.value;
    }

    if (properties.cY && param) {
        param.cY = properties.cY.value * 0.01;
        patch.pw_circle_y = properties.cY.value;
    }

    // 色彩模式
    if (properties.ColorMode && param) {
        param.ColorMode = properties.ColorMode.value;
        patch.pw_circle_color_mode = properties.ColorMode.value;
    }

    // 纯色渐变
    if (properties.SolidColorGradient && param) {
        param.SolidColorGradient = properties.SolidColorGradient.value;
        patch.pw_circle_solid_color_gradient = properties.SolidColorGradient.value;
        if (!properties.SolidColorGradient.value && ctx) {
            ctx.strokeStyle = param.color;
        }
    }

    // 模糊色渐�?
    if (properties.BlurColorGradient && param) {
        param.BlurColorGradient = properties.BlurColorGradient.value;
        patch.pw_circle_blur_color_gradient = properties.BlurColorGradient.value;
    }

    // 彩虹律动
    if (properties.ColorRhythm && param) {
        param.ColorRhythm = properties.ColorRhythm.value;
        patch.pw_circle_color_rhythm = properties.ColorRhythm.value;
    }

    // 渐变速率
    if (properties.GradientRate && param) {
        param.GradientRate = properties.GradientRate.value / 10;
        patch.pw_circle_gradient_rate = properties.GradientRate.value;
    }

    // 线宽
    if (properties.lineWidth && ctx && param) {
        ctx.lineWidth = param.lineWidth = properties.lineWidth.value;
        patch.pw_circle_line_width = properties.lineWidth.value;
    }

    // 是否旋转
    if (properties.rotation && param) {
        param.rotation = properties.rotation.value;
        config.runtime.param.rotationcopy = param.rotation;
        patch.pw_circle_rotation = properties.rotation.value;
    }

    // 方向
    if (properties.direction && param) {
        param.direction = properties.direction.value;
        patch.pw_circle_direction = properties.direction.value;
    }

    if (properties.wavetransparency && ctx && param) {
        param.wavetransparency = properties.wavetransparency.value / 100;
        ctx.globalAlpha = param.wavetransparency;
        patch.pw_circle_wavetransparency = properties.wavetransparency.value;
    }

    // 显示为半�?
    if (properties.showSemiCircle && param) {
        param.showSemiCircle = properties.showSemiCircle.value;
        patch.pw_circle_show_semi_circle = properties.showSemiCircle.value;
        if (properties.showSemiCircle.value) {
            config.runtime.param.rotationcopy = param.rotation;
            param.rotation = 0;
            param.offsetAngle = 0;
        } else {
            param.rotation = config.runtime.param.rotationcopy;
        }
    }

    // 半圆方向
    if (properties.SemiCircledirection && param) {
        param.SemiCircledirection = properties.SemiCircledirection.value;
        patch.pw_circle_semicircle_direction = properties.SemiCircledirection.value;
    }

    if (properties.PWLinePosition && PWLineParam) {
        PWLineParam.LinePosition = properties.PWLinePosition.value;
        patch.pw_line_position = properties.PWLinePosition.value;
    }

    // 样式
    if (properties.PWLineStyle && PWLineParam) {
        PWLineParam.style = properties.PWLineStyle.value;
        patch.pw_line_style = properties.PWLineStyle.value;
    }

    // 方向
    if (properties.PWLineDirection && PWLineParam) {
        PWLineParam.Direction = properties.PWLineDirection.value;
        patch.pw_line_direction = properties.PWLineDirection.value;
    }

    // 线宽
    if (properties.PWLineWidth && CTXLine && PWLineParam) {
        CTXLine.lineWidth = PWLineParam.lineWidth = properties.PWLineWidth.value;
        patch.pw_line_width = properties.PWLineWidth.value;
    }

    // 间距
    if (properties.PWLineSpacing && PWLineParam) {
        PWLineParam.sw = properties.PWLineSpacing.value / 10;
        patch.pw_line_spacing = properties.PWLineSpacing.value;
    }

    // 疏密
    if (properties.PWLineDensity && PWLineParam) {
        PWLineParam.LineDensity = properties.PWLineDensity.value * 10;
        patch.pw_line_density = properties.PWLineDensity.value;
    }

    // 幅度
    if (properties.PWLineRange && PWLineParam) {
        PWLineParam.range = properties.PWLineRange.value / 5;
        patch.pw_line_range = properties.PWLineRange.value;
    }

    // 可视化音频透明�?
    if (properties.PWLineTransparency && CTXLine && PWLineParam) {
        PWLineParam.LineTransparency = properties.PWLineTransparency.value / 100;
        CTXLine.globalAlpha = PWLineParam.LineTransparency;
        patch.pw_line_transparency = properties.PWLineTransparency.value;
    }

    // 颜色
    if (properties.PWLineColor && CTXLine && PWLineParam) {
        const c = properties.PWLineColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        CTXLine.strokeStyle = PWLineParam.color = 'rgba(' + c + ',0.8)';
        patch.pw_line_color = c as [number, number, number];
    }

    // 模糊颜色
    if (properties.PWLineBlurColor && CTXLine && PWLineParam) {
        const c = properties.PWLineBlurColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        CTXLine.shadowColor = PWLineParam.blurColor = 'rgb(' + c + ')';
        patch.pw_line_blur_color = c as [number, number, number];
    }

    // 圆的位置
    if (properties.PWLineX && PWLineParam) {
        PWLineParam.LineX = properties.PWLineX.value / 100.0;
        patch.pw_line_x = properties.PWLineX.value;
    }

    if (properties.PWLineY && PWLineParam) {
        PWLineParam.LineY = properties.PWLineY.value / 100.0;
        patch.pw_line_y = properties.PWLineY.value;
    }

    // 中间�?
    if (properties.PWMiddleLine && PWLineParam) {
        PWLineParam.MiddleLine = properties.PWMiddleLine.value;
        patch.pw_line_middle_line = properties.PWMiddleLine.value;
    }

    // 色彩模式
    if (properties.PWLineColorMode && PWLineParam) {
        PWLineParam.ColorMode = properties.PWLineColorMode.value;
        patch.pw_line_color_mode = properties.PWLineColorMode.value;
    }

    // 纯色渐变
    if (properties.PWLineSolidColorGradient && CTXLine && PWLineParam) {
        PWLineParam.SolidColorGradient = properties.PWLineSolidColorGradient.value;
        patch.pw_line_solid_color_gradient = properties.PWLineSolidColorGradient.value;
        if (!properties.PWLineSolidColorGradient.value) {
            CTXLine.strokeStyle = PWLineParam.color;
        }
    }

    // 模糊色渐�?
    if (properties.PWLineBlurColorGradient && PWLineParam) {
        PWLineParam.BlurColorGradient = properties.PWLineBlurColorGradient.value;
        patch.pw_line_blur_color_gradient = properties.PWLineBlurColorGradient.value;
    }

    // 彩虹律动
    if (properties.PWLineColorRhythm && PWLineParam) {
        PWLineParam.ColorRhythm = properties.PWLineColorRhythm.value;
        patch.pw_line_color_rhythm = properties.PWLineColorRhythm.value;
    }

    // 渐变速率
    if (properties.PWLineGradientRate && PWLineParam) {
        PWLineParam.GradientRate = properties.PWLineGradientRate.value / 10;
        patch.pw_line_gradient_rate = properties.PWLineGradientRate.value;
    }

    if (properties.audio_amplitude) {
        patch.audio_amplitude = properties.audio_amplitude.value;
        wallpaper?.getAudioVisualizer()?.set('amplitude', properties.audio_amplitude.value);
    }

    // 音频衰弱
    if (properties.audio_decline) {
        patch.audio_decline = properties.audio_decline.value;
        wallpaper?.getAudioVisualizer()?.set('decline', properties.audio_decline.value / 100);
    }

    // 显示圆环
    if (properties.audio_isRing) {
        patch.audio_is_ring = properties.audio_isRing.value;
        wallpaper?.getAudioVisualizer()?.set('isRing', properties.audio_isRing.value);
    }

    // 显示静态环
    if (properties.audio_isStaticRing) {
        patch.audio_is_static_ring = properties.audio_isStaticRing.value;
        wallpaper?.getAudioVisualizer()?.set('isStaticRing', properties.audio_isStaticRing.value);
    }

    // 显示内环
    if (properties.audio_isInnerRing) {
        patch.audio_is_inner_ring = properties.audio_isInnerRing.value;
        wallpaper?.getAudioVisualizer()?.set('isInnerRing', properties.audio_isInnerRing.value);
    }

    // 显示外环
    if (properties.audio_isOuterRing) {
        patch.audio_is_outer_ring = properties.audio_isOuterRing.value;
        wallpaper?.getAudioVisualizer()?.set('isOuterRing', properties.audio_isOuterRing.value);
    }

    // 圆环半径
    if (properties.audio_radius) {
        patch.audio_radius = properties.audio_radius.value;
        wallpaper?.getAudioVisualizer()?.set('radius', properties.audio_radius.value / 10);
    }

    // 圆环旋转
    if (properties.audio_ringRotation) {
        patch.audio_ring_rotation = properties.audio_ringRotation.value;
        wallpaper?.getAudioVisualizer()?.set('ringRotation', properties.audio_ringRotation.value);
    }

    // 不透明�?
    if (properties.audio_opacity) {
        patch.audio_opacity = properties.audio_opacity.value;
        wallpaper?.getAudioVisualizer()?.set('opacity', properties.audio_opacity.value / 100);
    }

    // 颜色
    if (properties.audio_color) {
        const c = properties.audio_color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.audio_color = c as [number, number, number];
        wallpaper?.getAudioVisualizer()?.set('color', c);
    }

    // 模糊颜色
    if (properties.audio_shadowColor) {
        const c = properties.audio_shadowColor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.audio_shadow_color = c as [number, number, number];
        wallpaper?.getAudioVisualizer()?.set('shadowColor', c);
    }

    // 模糊大小
    if (properties.audio_shadowBlur) {
        patch.audio_shadow_blur = properties.audio_shadowBlur.value;
        wallpaper?.getAudioVisualizer()?.set('shadowBlur', properties.audio_shadowBlur.value);
    }

    // X轴偏�?
    if (properties.audio_offsetX) {
        patch.audio_offset_x = properties.audio_offsetX.value;
        wallpaper?.getAudioVisualizer()?.set('offsetX', properties.audio_offsetX.value / 100);
    }

    // Y轴偏�?
    if (properties.audio_offsetY) {
        patch.audio_offset_y = properties.audio_offsetY.value;
        wallpaper?.getAudioVisualizer()?.set('offsetY', properties.audio_offsetY.value / 100);
    }

    // 鼠标坐标偏移
    if (properties.audio_isClickOffset) {
        patch.audio_is_click_offset = properties.audio_isClickOffset.value;
        wallpaper?.getAudioVisualizer()?.set('isClickOffset', properties.audio_isClickOffset.value);
    }

    // 是否连线
    if (properties.audio_isLineTo) {
        patch.audio_is_line_to = properties.audio_isLineTo.value;
        wallpaper?.getAudioVisualizer()?.set('isLineTo', properties.audio_isLineTo.value);
    }

    // 第一�?
    if (properties.audio_firstPoint) {
        patch.audio_first_point = properties.audio_firstPoint.value;
        wallpaper?.getAudioVisualizer()?.set('firstPoint', properties.audio_firstPoint.value);
    }

    // 第二�?
    if (properties.audio_secondPoint) {
        patch.audio_second_point = properties.audio_secondPoint.value;
        wallpaper?.getAudioVisualizer()?.set('secondPoint', properties.audio_secondPoint.value);
    }

    // 圆环点数
    if (properties.audio_pointNum) {
        patch.audio_point_num = properties.audio_pointNum.value;
        wallpaper?.getAudioVisualizer()?.set('pointNum', properties.audio_pointNum.value);
    }

    // 内外环距�?
    if (properties.audio_distance) {
        patch.audio_distance = properties.audio_distance.value;
        wallpaper?.getAudioVisualizer()?.set('distance', properties.audio_distance.value);
    }

    // 线条粗细
    if (properties.audio_lineWidth) {
        patch.audio_line_width = properties.audio_lineWidth.value;
        wallpaper?.getAudioVisualizer()?.set('lineWidth', properties.audio_lineWidth.value);
    }

    // 显示小球
    if (properties.audio_isBall) {
        patch.audio_is_ball = properties.audio_isBall.value;
        wallpaper?.getAudioVisualizer()?.set('isBall', properties.audio_isBall.value);
    }

    // 小球间隔
    if (properties.audio_ballSpacer) {
        patch.audio_ball_spacer = properties.audio_ballSpacer.value;
        wallpaper?.getAudioVisualizer()?.set('ballSpacer', properties.audio_ballSpacer.value);
    }

    // 小球大小
    if (properties.audio_ballSize) {
        patch.audio_ball_size = properties.audio_ballSize.value;
        wallpaper?.getAudioVisualizer()?.set('ballSize', properties.audio_ballSize.value);
    }

    // 小球旋转
    if (properties.audio_ballRotation) {
        patch.audio_ball_rotation = properties.audio_ballRotation.value;
        wallpaper?.getAudioVisualizer()?.set('ballRotation', properties.audio_ballRotation.value);
    }

    // 启用平滑效果
    if (properties.audioSmoothEnabled) {
        patch.audio_smooth_enabled = properties.audioSmoothEnabled.value;
    }

    // 平滑强度
    if (properties.audioSmoothFactor) {
        patch.audio_smooth_factor = properties.audioSmoothFactor.value;
    }

    // 空间窗口大小
    if (properties.audioSpatialWindow) {
        const windowValue = properties.audioSpatialWindow.value;
        // 确保窗口大小为奇�?
        patch.audio_spatial_window = windowValue % 2 === 0 ? windowValue + 1 : windowValue;
    }

    if (FirstLoad) {
        logInitComplete('[audioVisualizer]', '可视化音频', FirstLoad);
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }
}
