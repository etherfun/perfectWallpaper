/**
 * Audio Visual Property Handler
 * 处理音频可视化（圆圈、直线）相关的属性监听
 */

import { appConfig } from '@/utils/config';
import { WallpaperProperties } from './types';

export interface AudioVisualPropertyHandlerResult {
    // empty for now
}

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
): AudioVisualPropertyHandlerResult {
    const result: AudioVisualPropertyHandlerResult = {};

    const ctx = getCircleCtx();
    const CTXLine = getLineCtx();
    const param = appConfig.runtime.param;
    const PWLineParam = appConfig.runtime.PWLineParam;
    const wallpaper = appConfig.runtime.wallpaper;

    console.log('[AudioVisualPropertyHandler] Called with properties:', Object.keys(properties));
    console.log('[AudioVisualPropertyHandler] ctx:', ctx);
    console.log('[AudioVisualPropertyHandler] CTXLine:', CTXLine);
    console.log('[AudioVisualPropertyHandler] param:', param);
    console.log('[AudioVisualPropertyHandler] PWLineParam:', PWLineParam);
    console.log('[AudioVisualPropertyHandler] wallpaper:', wallpaper);
    console.log('[AudioVisualPropertyHandler] appConfig.runtime.wallpaper:', appConfig.runtime.wallpaper);

    // ========== 音频可视化模式控制 ==========

    if (properties.visual_audio_model) {
        const model = properties.visual_audio_model.value;
        console.log('[AudioVisualPropertyHandler] visual_audio_model:', model);
        appConfig.setVisualAudioModel(model);

        // 根据模式控制显示
        switch (model) {
            case 0: // 无
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 1: // 完美圆圈
                if (param) param.showCircle = appConfig.getPwCircleShowBool();
                if (PWLineParam) PWLineParam.showLine = false;
                break;
            case 2: // 完美直线
                if (param) param.showCircle = false;
                if (PWLineParam) PWLineParam.showLine = appConfig.getPwLineShowBool();
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
        console.log('[AudioVisualPropertyHandler] PWCircle_show_bool:', show);
        appConfig.setPwCircleShowBool(show);
        // 如果当前是模式1，也要更新showCircle
        if (param && appConfig.getVisualAudioModel() === 1) {
            param.showCircle = show;
        }
    }

    if (properties.PWLine_show_bool) {
        const show = properties.PWLine_show_bool.value;
        console.log('[AudioVisualPropertyHandler] PWLine_show_bool:', show);
        appConfig.setPwLineShowBool(show);
        // 如果当前是模式2，也要更新showLine
        if (PWLineParam && appConfig.getVisualAudioModel() === 2) {
            PWLineParam.showLine = show;
        }
    }

    // 多边形变换
    if (properties.PolygonAngle && param) {
        const mode = properties.PolygonAngle.value;
        // 根据模式设置 PolygonAngle 和 Polygon 值 (与原始JS版本一致)
        switch (mode) {
            case 1:
                appConfig.runtime.param.PolygonAngle = 1;
                (window as any).Polygon = 295;
                break;
            case 2:
                appConfig.runtime.param.PolygonAngle = 2;
                (window as any).Polygon = 270;
                break;
            case 3:
                appConfig.runtime.param.PolygonAngle = 4;
                (window as any).Polygon = 245;
                break;
            case 4:
                appConfig.runtime.param.PolygonAngle = 5;
                (window as any).Polygon = 220;
                break;
            case 5:
                appConfig.runtime.param.PolygonAngle = 7;
                (window as any).Polygon = 195;
                break;
            case 6:
                appConfig.runtime.param.PolygonAngle = 9;
                (window as any).Polygon = 170;
                break;
            case 7:
                appConfig.runtime.param.PolygonAngle = 10;
                (window as any).Polygon = 145;
                break;
            case 8:
                appConfig.runtime.param.PolygonAngle = 12;
                (window as any).Polygon = 120;
                break;
            case 9:
                appConfig.runtime.param.PolygonAngle = 30;
                (window as any).Polygon = 95;
                break;
            case 10:
                appConfig.runtime.param.PolygonAngle = 60;
                (window as any).Polygon = 70;
                break;
            case 11:
                appConfig.runtime.param.PolygonAngle = 90;
                (window as any).Polygon = 45;
                break;
            case 12:
                appConfig.runtime.param.PolygonAngle = 180;
                (window as any).Polygon = 20;
                break;
            default:
        }
    }

    // ========== 圆圈可视化参数 ==========

    // 样式
    if (properties.style && param) {
        param.style = properties.style.value;
        appConfig.setPwCircleStyle(properties.style.value);
    }

    // 半径
    if (properties.radius && param) {
        param.r = properties.radius.value / 100;
        appConfig.setPwCircleRadius(properties.radius.value);
    }

    // 幅度
    if (properties.range && param) {
        param.range = properties.range.value / 5;
        appConfig.setPwCircleRange(properties.range.value);
    }

    // 颜色
    if (properties.color && ctx && param) {
        const c = properties.color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        ctx.strokeStyle = param.color = 'rgba(' + c + ',0.8)';
        appConfig.setPwCircleColor(c);
    }

    // 模糊颜色
    if (properties.blurColor && ctx && param) {
        const c = properties.blurColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        ctx.shadowColor = param.blurColor = 'rgb(' + c + ')';
        appConfig.setPwCircleBlurColor(c);
    }

    // 圆的位置
    if (properties.cX && param) {
        param.cX = properties.cX.value * 0.01;
        appConfig.setPwCircleX(properties.cX.value);
    }

    if (properties.cY && param) {
        param.cY = properties.cY.value * 0.01;
        appConfig.setPwCircleY(properties.cY.value);
    }

    // 色彩模式
    if (properties.ColorMode && param) {
        param.ColorMode = properties.ColorMode.value;
        appConfig.setPwCircleColorMode(properties.ColorMode.value);
    }

    // 纯色渐变
    if (properties.SolidColorGradient && param) {
        param.SolidColorGradient = properties.SolidColorGradient.value;
        appConfig.setPwCircleSolidColorGradient(properties.SolidColorGradient.value);
        if (!properties.SolidColorGradient.value && ctx) {
            ctx.strokeStyle = param.color;
        }
    }

    // 模糊色渐变
    if (properties.BlurColorGradient && param) {
        param.BlurColorGradient = properties.BlurColorGradient.value;
        appConfig.setPwCircleBlurColorGradient(properties.BlurColorGradient.value);
    }

    // 彩虹律动
    if (properties.ColorRhythm && param) {
        param.ColorRhythm = properties.ColorRhythm.value;
        appConfig.setPwCircleColorRhythm(properties.ColorRhythm.value);
    }

    // 渐变速率
    if (properties.GradientRate && param) {
        param.GradientRate = properties.GradientRate.value / 10;
        appConfig.setPwCircleGradientRate(properties.GradientRate.value);
    }

    // 线宽
    if (properties.lineWidth && ctx && param) {
        ctx.lineWidth = param.lineWidth = properties.lineWidth.value;
        appConfig.setPwCircleLineWidth(properties.lineWidth.value);
    }

    // 是否旋转
    if (properties.rotation && param) {
        param.rotation = properties.rotation.value;
        (window as any).rotationcopy = param.rotation;
        appConfig.setPwCircleRotation(properties.rotation.value);
    }

    // 方向
    if (properties.direction && param) {
        param.direction = properties.direction.value;
        appConfig.setPwCircleDirection(properties.direction.value);
    }

    // ========== 波浪可视化参数 ==========

    // 可视化音频透明度
    if (properties.wavetransparency && ctx && param) {
        param.wavetransparency = properties.wavetransparency.value / 100;
        ctx.globalAlpha = param.wavetransparency;
        appConfig.setPwCircleWavetransparency(properties.wavetransparency.value);
    }

    // 显示为半圆
    if (properties.showSemiCircle && param) {
        param.showSemiCircle = properties.showSemiCircle.value;
        appConfig.setPwCircleShowSemiCircle(properties.showSemiCircle.value);
        if (properties.showSemiCircle.value) {
            (window as any).rotationcopy = param.rotation;
            param.rotation = 0;
            param.offsetAngle = 0;
        } else {
            param.rotation = (window as any).rotationcopy;
        }
    }

    // 半圆方向
    if (properties.SemiCircledirection && param) {
        param.SemiCircledirection = properties.SemiCircledirection.value;
        appConfig.setPwCircleSemiCircledirection(properties.SemiCircledirection.value);
    }

    // ========== PWLine参数 ==========

    // 直线位置
    if (properties.PWLinePosition && PWLineParam) {
        PWLineParam.LinePosition = properties.PWLinePosition.value;
        appConfig.setPwLinePosition(properties.PWLinePosition.value);
    }

    // 样式
    if (properties.PWLineStyle && PWLineParam) {
        PWLineParam.style = properties.PWLineStyle.value;
        appConfig.setPwLineStyle(properties.PWLineStyle.value);
    }

    // 方向
    if (properties.PWLineDirection && PWLineParam) {
        PWLineParam.Direction = properties.PWLineDirection.value;
        appConfig.setPwLineDirection(properties.PWLineDirection.value);
    }

    // 线宽
    if (properties.PWLineWidth && CTXLine && PWLineParam) {
        CTXLine.lineWidth = PWLineParam.lineWidth = properties.PWLineWidth.value;
        appConfig.setPwLineWidth(properties.PWLineWidth.value);
    }

    // 间距
    if (properties.PWLineSpacing && PWLineParam) {
        PWLineParam.sw = properties.PWLineSpacing.value / 10;
        appConfig.setPwLineSpacing(properties.PWLineSpacing.value);
    }

    // 疏密
    if (properties.PWLineDensity && PWLineParam) {
        PWLineParam.LineDensity = properties.PWLineDensity.value * 10;
        appConfig.setPwLineDensity(properties.PWLineDensity.value);
    }

    // 幅度
    if (properties.PWLineRange && PWLineParam) {
        PWLineParam.range = properties.PWLineRange.value / 5;
        appConfig.setPwLineRange(properties.PWLineRange.value);
    }

    // 可视化音频透明度
    if (properties.PWLineTransparency && CTXLine && PWLineParam) {
        PWLineParam.LineTransparency = properties.PWLineTransparency.value / 100;
        CTXLine.globalAlpha = PWLineParam.LineTransparency;
        appConfig.setPwLineTransparency(properties.PWLineTransparency.value);
    }

    // 颜色
    if (properties.PWLineColor && CTXLine && PWLineParam) {
        const c = properties.PWLineColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        CTXLine.strokeStyle = PWLineParam.color = 'rgba(' + c + ',0.8)';
        appConfig.setPwLineColor(c);
    }

    // 模糊颜色
    if (properties.PWLineBlurColor && CTXLine && PWLineParam) {
        const c = properties.PWLineBlurColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        CTXLine.shadowColor = PWLineParam.blurColor = 'rgb(' + c + ')';
        appConfig.setPwLineBlurColor(c);
    }

    // 圆的位置
    if (properties.PWLineX && PWLineParam) {
        PWLineParam.LineX = properties.PWLineX.value / 100.0;
        appConfig.setPwLineX(properties.PWLineX.value);
    }

    if (properties.PWLineY && PWLineParam) {
        PWLineParam.LineY = properties.PWLineY.value / 100.0;
        appConfig.setPwLineY(properties.PWLineY.value);
    }

    // 中间线
    if (properties.PWMiddleLine && PWLineParam) {
        PWLineParam.MiddleLine = properties.PWMiddleLine.value;
        appConfig.setPwLineMiddleLine(properties.PWMiddleLine.value);
    }

    // 色彩模式
    if (properties.PWLineColorMode && PWLineParam) {
        PWLineParam.ColorMode = properties.PWLineColorMode.value;
        appConfig.setPwLineColorMode(properties.PWLineColorMode.value);
    }

    // 纯色渐变
    if (properties.PWLineSolidColorGradient && CTXLine && PWLineParam) {
        PWLineParam.SolidColorGradient = properties.PWLineSolidColorGradient.value;
        appConfig.setPwLineSolidColorGradient(properties.PWLineSolidColorGradient.value);
        if (!properties.PWLineSolidColorGradient.value) {
            CTXLine.strokeStyle = PWLineParam.color;
        }
    }

    // 模糊色渐变
    if (properties.PWLineBlurColorGradient && PWLineParam) {
        PWLineParam.BlurColorGradient = properties.PWLineBlurColorGradient.value;
        appConfig.setPwLineBlurColorGradient(properties.PWLineBlurColorGradient.value);
    }

    // 彩虹律动
    if (properties.PWLineColorRhythm && PWLineParam) {
        PWLineParam.ColorRhythm = properties.PWLineColorRhythm.value;
        appConfig.setPwLineColorRhythm(properties.PWLineColorRhythm.value);
    }

    // 渐变速率
    if (properties.PWLineGradientRate && PWLineParam) {
        PWLineParam.GradientRate = properties.PWLineGradientRate.value / 10;
        appConfig.setPwLineGradientRate(properties.PWLineGradientRate.value);
    }

    // ========== 音频参数(wallpaper.audiovisualizer) ==========

    // 音频振幅
    if (properties.audio_amplitude) {
        console.log('[AudioVisualPropertyHandler] audio_amplitude:', properties.audio_amplitude.value);
        appConfig.setAudioAmplitude(properties.audio_amplitude.value);
        if (wallpaper) {
            wallpaper.audiovisualizer('set', 'amplitude', properties.audio_amplitude.value);
        } else {
            console.warn('[AudioVisualPropertyHandler] wallpaper is null, cannot call audiovisualizer');
        }
    }

    // 音频衰弱
    if (properties.audio_decline) {
        console.log('[AudioVisualPropertyHandler] audio_decline:', properties.audio_decline.value);
        appConfig.setAudioDecline(properties.audio_decline.value);
        wallpaper?.audiovisualizer('set', 'decline', properties.audio_decline.value / 100);
    }

    // 显示圆环
    if (properties.audio_isRing) {
        console.log('[AudioVisualPropertyHandler] audio_isRing:', properties.audio_isRing.value);
        appConfig.setAudioIsRing(properties.audio_isRing.value);
        if (properties.audio_isRing.value) {
            wallpaper?.audiovisualizer('set', 'isRing', true);
        } else {
            wallpaper?.audiovisualizer('set', 'isRing', false);
        }
    }

    // 显示静态环
    if (properties.audio_isStaticRing) {
        console.log('[AudioVisualPropertyHandler] audio_isStaticRing:', properties.audio_isStaticRing.value);
        appConfig.setAudioIsStaticRing(properties.audio_isStaticRing.value);
        if (properties.audio_isStaticRing.value) {
            wallpaper?.audiovisualizer('set', 'isStaticRing', true);
        } else {
            wallpaper?.audiovisualizer('set', 'isStaticRing', false);
        }
    }

    // 显示内环
    if (properties.audio_isInnerRing) {
        console.log('[AudioVisualPropertyHandler] audio_isInnerRing:', properties.audio_isInnerRing.value);
        appConfig.setAudioIsInnerRing(properties.audio_isInnerRing.value);
        if (properties.audio_isInnerRing.value) {
            wallpaper?.audiovisualizer('set', 'isInnerRing', true);
        } else {
            wallpaper?.audiovisualizer('set', 'isInnerRing', false);
        }
    }

    // 显示外环
    if (properties.audio_isOuterRing) {
        console.log('[AudioVisualPropertyHandler] audio_isOuterRing:', properties.audio_isOuterRing.value);
        appConfig.setAudioIsOuterRing(properties.audio_isOuterRing.value);
        if (properties.audio_isOuterRing.value) {
            wallpaper?.audiovisualizer('set', 'isOuterRing', true);
        } else {
            wallpaper?.audiovisualizer('set', 'isOuterRing', false);
        }
    }

    // 圆环半径
    if (properties.audio_radius) {
        console.log('[AudioVisualPropertyHandler] audio_radius:', properties.audio_radius.value);
        appConfig.setAudioRadius(properties.audio_radius.value);
        wallpaper?.audiovisualizer('set', 'radius', properties.audio_radius.value / 10);
    }

    // 圆环旋转
    if (properties.audio_ringRotation) {
        console.log('[AudioVisualPropertyHandler] audio_ringRotation:', properties.audio_ringRotation.value);
        appConfig.setAudioRingRotation(properties.audio_ringRotation.value);
        wallpaper?.audiovisualizer('set', 'ringRotation', properties.audio_ringRotation.value);
    }

    // 不透明度
    if (properties.audio_opacity) {
        console.log('[AudioVisualPropertyHandler] audio_opacity:', properties.audio_opacity.value);
        appConfig.setAudioOpacity(properties.audio_opacity.value);
        wallpaper?.audiovisualizer('set', 'opacity', properties.audio_opacity.value / 100);
    }

    // 颜色
    if (properties.audio_color) {
        console.log('[AudioVisualPropertyHandler] audio_color:', properties.audio_color.value);
        const c = properties.audio_color.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        appConfig.setAudioColor(c);
        wallpaper?.audiovisualizer('set', 'color', c);
    }

    // 模糊颜色
    if (properties.audio_shadowColor) {
        console.log('[AudioVisualPropertyHandler] audio_shadowColor:', properties.audio_shadowColor.value);
        const c = properties.audio_shadowColor.value.split(' ').map((c: string) => Math.ceil(parseFloat(c) * 255));
        appConfig.setAudioShadowColor(c);
        wallpaper?.audiovisualizer('set', 'shadowColor', c);
    }

    // 模糊大小
    if (properties.audio_shadowBlur) {
        console.log('[AudioVisualPropertyHandler] audio_shadowBlur:', properties.audio_shadowBlur.value);
        appConfig.setAudioShadowBlur(properties.audio_shadowBlur.value);
        wallpaper?.audiovisualizer('set', 'shadowBlur', properties.audio_shadowBlur.value);
    }

    // X轴偏移
    if (properties.audio_offsetX) {
        console.log('[AudioVisualPropertyHandler] audio_offsetX:', properties.audio_offsetX.value);
        appConfig.setAudioOffsetX(properties.audio_offsetX.value);
        wallpaper?.audiovisualizer('set', 'offsetX', properties.audio_offsetX.value / 100);
    }

    // Y轴偏移
    if (properties.audio_offsetY) {
        console.log('[AudioVisualPropertyHandler] audio_offsetY:', properties.audio_offsetY.value);
        appConfig.setAudioOffsetY(properties.audio_offsetY.value);
        wallpaper?.audiovisualizer('set', 'offsetY', properties.audio_offsetY.value / 100);
    }

    // 鼠标坐标偏移
    if (properties.audio_isClickOffset) {
        console.log('[AudioVisualPropertyHandler] audio_isClickOffset:', properties.audio_isClickOffset.value);
        appConfig.setAudioIsClickOffset(properties.audio_isClickOffset.value);
        wallpaper?.audiovisualizer('set', 'isClickOffset', properties.audio_isClickOffset.value);
    }

    // 是否连线
    if (properties.audio_isLineTo) {
        console.log('[AudioVisualPropertyHandler] audio_isLineTo:', properties.audio_isLineTo.value);
        appConfig.setAudioIsLineTo(properties.audio_isLineTo.value);
        wallpaper?.audiovisualizer('set', 'isLineTo', properties.audio_isLineTo.value);
    }

    // 第一点
    if (properties.audio_firstPoint) {
        console.log('[AudioVisualPropertyHandler] audio_firstPoint:', properties.audio_firstPoint.value);
        appConfig.setAudioFirstPoint(properties.audio_firstPoint.value);
        wallpaper?.audiovisualizer('set', 'firstPoint', properties.audio_firstPoint.value);
    }

    // 第二点
    if (properties.audio_secondPoint) {
        console.log('[AudioVisualPropertyHandler] audio_secondPoint:', properties.audio_secondPoint.value);
        appConfig.setAudioSecondPoint(properties.audio_secondPoint.value);
        wallpaper?.audiovisualizer('set', 'secondPoint', properties.audio_secondPoint.value);
    }

    // 圆环点数
    if (properties.audio_pointNum) {
        console.log('[AudioVisualPropertyHandler] audio_pointNum:', properties.audio_pointNum.value);
        appConfig.setAudioPointNum(properties.audio_pointNum.value);
        wallpaper?.audiovisualizer('set', 'pointNum', properties.audio_pointNum.value);
    }

    // 内外环距离
    if (properties.audio_distance) {
        console.log('[AudioVisualPropertyHandler] audio_distance:', properties.audio_distance.value);
        appConfig.setAudioDistance(properties.audio_distance.value);
        wallpaper?.audiovisualizer('set', 'distance', properties.audio_distance.value);
    }

    // 线条粗细
    if (properties.audio_lineWidth) {
        console.log('[AudioVisualPropertyHandler] audio_lineWidth:', properties.audio_lineWidth.value);
        appConfig.setAudioLineWidth(properties.audio_lineWidth.value);
        wallpaper?.audiovisualizer('set', 'lineWidth', properties.audio_lineWidth.value);
    }

    // 显示小球
    if (properties.audio_isBall) {
        console.log('[AudioVisualPropertyHandler] audio_isBall:', properties.audio_isBall.value);
        appConfig.setAudioIsBall(properties.audio_isBall.value);
        wallpaper?.audiovisualizer('set', 'isBall', properties.audio_isBall.value);
    }

    // 小球间隔
    if (properties.audio_ballSpacer) {
        console.log('[AudioVisualPropertyHandler] audio_ballSpacer:', properties.audio_ballSpacer.value);
        appConfig.setAudioBallSpacer(properties.audio_ballSpacer.value);
        wallpaper?.audiovisualizer('set', 'ballSpacer', properties.audio_ballSpacer.value);
    }

    // 小球大小
    if (properties.audio_ballSize) {
        console.log('[AudioVisualPropertyHandler] audio_ballSize:', properties.audio_ballSize.value);
        appConfig.setAudioBallSize(properties.audio_ballSize.value);
        wallpaper?.audiovisualizer('set', 'ballSize', properties.audio_ballSize.value);
    }

    // 小球旋转
    if (properties.audio_ballRotation) {
        console.log('[AudioVisualPropertyHandler] audio_ballRotation:', properties.audio_ballRotation.value);
        appConfig.setAudioBallRotation(properties.audio_ballRotation.value);
        wallpaper?.audiovisualizer('set', 'ballRotation', properties.audio_ballRotation.value);
    }

    return result;
}