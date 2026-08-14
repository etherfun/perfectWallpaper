/**
 * useAudioVisualProperties 拆分 — 音频参数（audio_* + 音频平滑）
 */

import type { WallpaperProperties } from '../../../types/types';
import type { ConfigStore } from './types';

/**
 * 应用音频可视化参数（通过 wallpaper.getAudioVisualizer() 下发）
 */
export function applyAudioProperties(
    properties: WallpaperProperties,
    w: any,
    config: ConfigStore,
    patch: Record<string, unknown>
): void {
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
        config.audio_smooth_enabled = v; // 鍚屾鍒版棫 config锛坅udioVisualizer.ts 璇诲彇锛?
    }

    if (properties.audioSmoothFactor) {
        const v = properties.audioSmoothFactor.value;
        patch.audio_smooth_factor = v;
        config.audio_smooth_factor = v; // 鍚屾鍒版棫 config
    }

    if (properties.audioSpatialWindow) {
        let windowValue = properties.audioSpatialWindow.value;
        windowValue = windowValue % 2 === 0 ? windowValue + 1 : windowValue;
        patch.audio_spatial_window = windowValue;
        config.audio_spatial_window = windowValue; // 鍚屾鍒版棫 config
    }
}
