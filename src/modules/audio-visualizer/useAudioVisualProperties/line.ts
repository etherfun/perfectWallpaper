/**
 * useAudioVisualProperties 拆分 — PWLine 参数
 */

import type { WallpaperProperties } from '../../../types/types';
import type { LineParam } from './types';

/**
 * 应用 PWLine 相关属性（位置/样式/方向/密度/颜色/渐变等）
 */
export function applyLineProperties(
    properties: WallpaperProperties,
    PWLineParam: LineParam | null,
    CTXLine: CanvasRenderingContext2D | null,
    patch: Record<string, unknown>
): void {
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
}
