import { config } from '@/utils/config';
import { WallpaperProperties } from './types';
import { debugLogger } from '@/utils/logger';

/**
 * 获取圆圈可视化canvas的2D上下文
 */
function getCircleCtx(): CanvasRenderingContext2D | null {
    const can = document.querySelector("#can") as HTMLCanvasElement | null;
    return can?.getContext("2d") ?? null;
}

/**
 * 获取直线可视化canvas的2D上下文
 */
function getLineCtx(): CanvasRenderingContext2D | null {
    const canLine = document.querySelector("#CanLine") as HTMLCanvasElement | null;
    return canLine?.getContext("2d") ?? null;
}

/**
 * 处理音频可视化相关属性
 * @param properties 属性对象
 * @param FirstLoad 是否首次加载
 * @returns 处理结果
 */
export function handleAudioVisualProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
) {
    const result = {};

    const ctx = getCircleCtx();
    const CTXLine = getLineCtx();
    const param = config.runtime.param;
    const PWLineParam = config.runtime.PWLineParam;
    const wallpaper = config.runtime.wallpaper;

    // ========== 音频可视化模式控制 ==========

    if (properties.visual_audio_model) {
        const model = properties.visual_audio_model.value;
        config.visualAudioModel = model;

        // 根据模式控制显示
        switch (model) {
            case 0: // 无
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 1: // 完美圆圈
                if (param) param.showCircle = config.pwCircleShowBool;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 2: // 完美直线
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = config.pwLineShowBool;
                break;
            case 3: // come soon
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
        config.pwCircleShowBool = show;
        // 如果当前是模式1，也要更新showCircle
        if (param && config.visualAudioModel === 1) {
            param.showCircle = show;
        }
    }

    if (properties.PWLine_show_bool) {
        const show = properties.PWLine_show_bool.value;
        config.pwLineShowBool = show;
        // 如果当前是模式2，也要更新showLine
        if (PWLineParam && config.visualAudioModel === 2) {
            PWLineParam.showLine = show;
        }
    }

    // 多边形变换
    if (properties.PolygonAngle && param) {
        const mode = properties.PolygonAngle.value;
        // 根据模式设置 PolygonAngle 和 Polygon 值 (与原始JS版本一致)
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

    // ========== 圆圈可视化参数 ==========

    // 样式
    if (properties.style && param) {
        param.style = properties.style.value;
        config.pwCircleStyle = properties.style.value;
    }

    // 半径
    if (properties.radius && param) {
        param.r = properties.radius.value / 100;
        config.pwCircleRadius = properties.radius.value;
    }

    // 幅度
    if (properties.range && param) {
        param.range = properties.range.value / 5;
        config.pwCircleRange = properties.range.value;
    }

    // 颜色
    if (properties.color && ctx && param) {
        const c = properties.color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        ctx.strokeStyle = param.color = 'rgba(' + c + ',0.8)';
        config.pwCircleColor = c;
    }

    // 模糊颜色
    if (properties.blurColor && ctx && param) {
        const c = properties.blurColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        ctx.shadowColor = param.blurColor = 'rgb(' + c + ')';
        config.pwCircleBlurColor = c;
    }

    // 圆的位置
    if (properties.cX && param) {
        param.cX = properties.cX.value * 0.01;
        config.pwCircleX = properties.cX.value;
    }

    if (properties.cY && param) {
        param.cY = properties.cY.value * 0.01;
        config.pwCircleY = properties.cY.value;
    }

    // 色彩模式
    if (properties.ColorMode && param) {
        param.ColorMode = properties.ColorMode.value;
        config.pwCircleColorMode = properties.ColorMode.value;
    }

    // 纯色渐变
    if (properties.SolidColorGradient && param) {
        param.SolidColorGradient = properties.SolidColorGradient.value;
        config.pwCircleSolidColorGradient = properties.SolidColorGradient.value;
        if (!properties.SolidColorGradient.value && ctx) {
            ctx.strokeStyle = param.color;
        }
    }

    // 模糊色渐变
    if (properties.BlurColorGradient && param) {
        param.BlurColorGradient = properties.BlurColorGradient.value;
        config.pwCircleBlurColorGradient = properties.BlurColorGradient.value;
    }

    // 彩虹律动
    if (properties.ColorRhythm && param) {
        param.ColorRhythm = properties.ColorRhythm.value;
        config.pwCircleColorRhythm = properties.ColorRhythm.value;
    }

    // 渐变速率
    if (properties.GradientRate && param) {
        param.GradientRate = properties.GradientRate.value / 10;
        config.pwCircleGradientRate = properties.GradientRate.value;
    }

    // 线宽
    if (properties.lineWidth && ctx && param) {
        ctx.lineWidth = param.lineWidth = properties.lineWidth.value;
        config.pwCircleLineWidth = properties.lineWidth.value;
    }

    // 是否旋转
    if (properties.rotation && param) {
        param.rotation = properties.rotation.value;
        config.runtime.param.rotationcopy = param.rotation;
        config.pwCircleRotation = properties.rotation.value;
    }

    // 方向
    if (properties.direction && param) {
        param.direction = properties.direction.value;
        config.pwCircleDirection = properties.direction.value;
    }

    // ========== 波浪可视化参数 ==========

    // 可视化音频透明度
    if (properties.wavetransparency && ctx && param) {
        param.wavetransparency = properties.wavetransparency.value / 100;
        ctx.globalAlpha = param.wavetransparency;
        config.pwCircleWavetransparency = properties.wavetransparency.value;
    }

    // 显示为半圆
    if (properties.showSemiCircle && param) {
        param.showSemiCircle = properties.showSemiCircle.value;
        config.pwCircleShowSemiCircle = properties.showSemiCircle.value;
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
        config.pwCircleSemiCircledirection = properties.SemiCircledirection.value;
    }

    // ========== PWLine参数 ==========

    // 直线位置
    if (properties.PWLinePosition && PWLineParam) {
        PWLineParam.LinePosition = properties.PWLinePosition.value;
        config.pwLinePosition = properties.PWLinePosition.value;
    }

    // 样式
    if (properties.PWLineStyle && PWLineParam) {
        PWLineParam.style = properties.PWLineStyle.value;
        config.pwLineStyle = properties.PWLineStyle.value;
    }

    // 方向
    if (properties.PWLineDirection && PWLineParam) {
        PWLineParam.Direction = properties.PWLineDirection.value;
        config.pwLineDirection = properties.PWLineDirection.value;
    }

    // 线宽
    if (properties.PWLineWidth && CTXLine && PWLineParam) {
        CTXLine.lineWidth = PWLineParam.lineWidth = properties.PWLineWidth.value;
        config.pwLineWidth = properties.PWLineWidth.value;
    }

    // 间距
    if (properties.PWLineSpacing && PWLineParam) {
        PWLineParam.sw = properties.PWLineSpacing.value / 10;
        config.pwLineSpacing = properties.PWLineSpacing.value;
    }

    // 疏密
    if (properties.PWLineDensity && PWLineParam) {
        PWLineParam.LineDensity = properties.PWLineDensity.value * 10;
        config.pwLineDensity = properties.PWLineDensity.value;
    }

    // 幅度
    if (properties.PWLineRange && PWLineParam) {
        PWLineParam.range = properties.PWLineRange.value / 5;
        config.pwLineRange = properties.PWLineRange.value;
    }

    // 可视化音频透明度
    if (properties.PWLineTransparency && CTXLine && PWLineParam) {
        PWLineParam.LineTransparency = properties.PWLineTransparency.value / 100;
        CTXLine.globalAlpha = PWLineParam.LineTransparency;
        config.pwLineTransparency = properties.PWLineTransparency.value;
    }

    // 颜色
    if (properties.PWLineColor && CTXLine && PWLineParam) {
        const c = properties.PWLineColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        CTXLine.strokeStyle = PWLineParam.color = 'rgba(' + c + ',0.8)';
        config.pwLineColor = c;
    }

    // 模糊颜色
    if (properties.PWLineBlurColor && CTXLine && PWLineParam) {
        const c = properties.PWLineBlurColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        CTXLine.shadowColor = PWLineParam.blurColor = 'rgb(' + c + ')';
        config.pwLineBlurColor = c;
    }

    // 圆的位置
    if (properties.PWLineX && PWLineParam) {
        PWLineParam.LineX = properties.PWLineX.value / 100.0;
        config.pwLineX = properties.PWLineX.value;
    }

    if (properties.PWLineY && PWLineParam) {
        PWLineParam.LineY = properties.PWLineY.value / 100.0;
        config.pwLineY = properties.PWLineY.value;
    }

    // 中间线
    if (properties.PWMiddleLine && PWLineParam) {
        PWLineParam.MiddleLine = properties.PWMiddleLine.value;
        config.pwLineMiddleLine = properties.PWMiddleLine.value;
    }

    // 色彩模式
    if (properties.PWLineColorMode && PWLineParam) {
        PWLineParam.ColorMode = properties.PWLineColorMode.value;
        config.pwLineColorMode = properties.PWLineColorMode.value;
    }

    // 纯色渐变
    if (properties.PWLineSolidColorGradient && CTXLine && PWLineParam) {
        PWLineParam.SolidColorGradient = properties.PWLineSolidColorGradient.value;
        config.pwLineSolidColorGradient = properties.PWLineSolidColorGradient.value;
        if (!properties.PWLineSolidColorGradient.value) {
            CTXLine.strokeStyle = PWLineParam.color;
        }
    }

    // 模糊色渐变
    if (properties.PWLineBlurColorGradient && PWLineParam) {
        PWLineParam.BlurColorGradient = properties.PWLineBlurColorGradient.value;
        config.pwLineBlurColorGradient = properties.PWLineBlurColorGradient.value;
    }

    // 彩虹律动
    if (properties.PWLineColorRhythm && PWLineParam) {
        PWLineParam.ColorRhythm = properties.PWLineColorRhythm.value;
        config.pwLineColorRhythm = properties.PWLineColorRhythm.value;
    }

    // 渐变速率
    if (properties.PWLineGradientRate && PWLineParam) {
        PWLineParam.GradientRate = properties.PWLineGradientRate.value / 10;
        config.pwLineGradientRate = properties.PWLineGradientRate.value;
    }

    // ========== 音频参数(wallpaper.audiovisualizer) ==========

    // 音频振幅
    if (properties.audio_amplitude) {
        config.audioAmplitude = properties.audio_amplitude.value;
        if (wallpaper) {
            wallpaper.audiovisualizer('set', 'amplitude', properties.audio_amplitude.value);
        }
    }

    // 音频衰弱
    if (properties.audio_decline) {
        config.audioDecline = properties.audio_decline.value;
        wallpaper?.audiovisualizer('set', 'decline', properties.audio_decline.value / 100);
    }

    // 显示圆环
    if (properties.audio_isRing) {
        config.audioIsRing = properties.audio_isRing.value;
        if (properties.audio_isRing.value) {
            wallpaper?.audiovisualizer('set', 'isRing', true);
        } else {
            wallpaper?.audiovisualizer('set', 'isRing', false);
        }
    }

    // 显示静态环
    if (properties.audio_isStaticRing) {
        config.audioIsStaticRing = properties.audio_isStaticRing.value;
        if (properties.audio_isStaticRing.value) {
            wallpaper?.audiovisualizer('set', 'isStaticRing', true);
        } else {
            wallpaper?.audiovisualizer('set', 'isStaticRing', false);
        }
    }

    // 显示内环
    if (properties.audio_isInnerRing) {
        config.audioIsInnerRing = properties.audio_isInnerRing.value;
        if (properties.audio_isInnerRing.value) {
            wallpaper?.audiovisualizer('set', 'isInnerRing', true);
        } else {
            wallpaper?.audiovisualizer('set', 'isInnerRing', false);
        }
    }

    // 显示外环
    if (properties.audio_isOuterRing) {
        config.audioIsOuterRing = properties.audio_isOuterRing.value;
        if (properties.audio_isOuterRing.value) {
            wallpaper?.audiovisualizer('set', 'isOuterRing', true);
        } else {
            wallpaper?.audiovisualizer('set', 'isOuterRing', false);
        }
    }

    // 圆环半径
    if (properties.audio_radius) {
        config.audioRadius = properties.audio_radius.value;
        wallpaper?.audiovisualizer('set', 'radius', properties.audio_radius.value / 10);
    }

    // 圆环旋转
    if (properties.audio_ringRotation) {
        config.audioRingRotation = properties.audio_ringRotation.value;
        wallpaper?.audiovisualizer('set', 'ringRotation', properties.audio_ringRotation.value);
    }

    // 不透明度
    if (properties.audio_opacity) {
        config.audioOpacity = properties.audio_opacity.value;
        wallpaper?.audiovisualizer('set', 'opacity', properties.audio_opacity.value / 100);
    }

    // 颜色
    if (properties.audio_color) {
        const c = properties.audio_color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.audioColor = c;
        wallpaper?.audiovisualizer('set', 'color', c);
    }

    // 模糊颜色
    if (properties.audio_shadowColor) {
        const c = properties.audio_shadowColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        config.audioShadowColor = c;
        wallpaper?.audiovisualizer('set', 'shadowColor', c);
    }

    // 模糊大小
    if (properties.audio_shadowBlur) {
        config.audioShadowBlur = properties.audio_shadowBlur.value;
        wallpaper?.audiovisualizer('set', 'shadowBlur', properties.audio_shadowBlur.value);
    }

    // X轴偏移
    if (properties.audio_offsetX) {
        config.audioOffsetX = properties.audio_offsetX.value;
        wallpaper?.audiovisualizer('set', 'offsetX', properties.audio_offsetX.value / 100);
    }

    // Y轴偏移
    if (properties.audio_offsetY) {
        config.audioOffsetY = properties.audio_offsetY.value;
        wallpaper?.audiovisualizer('set', 'offsetY', properties.audio_offsetY.value / 100);
    }

    // 鼠标坐标偏移
    if (properties.audio_isClickOffset) {
        config.audioIsClickOffset = properties.audio_isClickOffset.value;
        wallpaper?.audiovisualizer('set', 'isClickOffset', properties.audio_isClickOffset.value);
    }

    // 是否连线
    if (properties.audio_isLineTo) {
        config.audioIsLineTo = properties.audio_isLineTo.value;
        wallpaper?.audiovisualizer('set', 'isLineTo', properties.audio_isLineTo.value);
    }

    // 第一点
    if (properties.audio_firstPoint) {
        config.audioFirstPoint = properties.audio_firstPoint.value;
        wallpaper?.audiovisualizer('set', 'firstPoint', properties.audio_firstPoint.value);
    }

    // 第二点
    if (properties.audio_secondPoint) {
        config.audioSecondPoint = properties.audio_secondPoint.value;
        wallpaper?.audiovisualizer('set', 'secondPoint', properties.audio_secondPoint.value);
    }

    // 圆环点数
    if (properties.audio_pointNum) {
        config.audioPointNum = properties.audio_pointNum.value;
        wallpaper?.audiovisualizer('set', 'pointNum', properties.audio_pointNum.value);
    }

    // 内外环距离
    if (properties.audio_distance) {
        config.audioDistance = properties.audio_distance.value;
        wallpaper?.audiovisualizer('set', 'distance', properties.audio_distance.value);
    }

    // 线条粗细
    if (properties.audio_lineWidth) {
        config.audioLineWidth = properties.audio_lineWidth.value;
        wallpaper?.audiovisualizer('set', 'lineWidth', properties.audio_lineWidth.value);
    }

    // 显示小球
    if (properties.audio_isBall) {
        config.audioIsBall = properties.audio_isBall.value;
        wallpaper?.audiovisualizer('set', 'isBall', properties.audio_isBall.value);
    }

    // 小球间隔
    if (properties.audio_ballSpacer) {
        config.audioBallSpacer = properties.audio_ballSpacer.value;
        wallpaper?.audiovisualizer('set', 'ballSpacer', properties.audio_ballSpacer.value);
    }

    // 小球大小
    if (properties.audio_ballSize) {
        config.audioBallSize = properties.audio_ballSize.value;
        wallpaper?.audiovisualizer('set', 'ballSize', properties.audio_ballSize.value);
    }

    // 小球旋转
    if (properties.audio_ballRotation) {
        config.audioBallRotation = properties.audio_ballRotation.value;
        wallpaper?.audiovisualizer('set', 'ballRotation', properties.audio_ballRotation.value);
    }

    // 启用平滑效果
    if (properties.audioSmoothEnabled) {
        config.audioSmoothEnabled = properties.audioSmoothEnabled.value;
    }

    // 平滑强度
    if (properties.audioSmoothFactor) {
        config.audioSmoothFactor = properties.audioSmoothFactor.value;
    }

    // 空间窗口大小
    if (properties.audioSpatialWindow) {
        const windowValue = properties.audioSpatialWindow.value;
        // 确保窗口大小为奇数
        config.audioSpatialWindow = windowValue % 2 === 0 ? windowValue + 1 : windowValue;
    }

    if (FirstLoad) {
        debugLogger.info('[audioVisualizer] 可视化音频参数初始化完成');
    }
}