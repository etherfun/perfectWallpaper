/**
 * 从封面图片提取颜色，生成 4 组 RGB 配色：
 *   1. Wallpaper Engine 事件颜色 / 自定义封面回退
 *   2. colorthief 主色 + 调色板
 *   3. 用户配置的亚克力色
 *   4. 用户配置的字体色
 *
 * 同时把封面送给流体效果做背景。
 */
import { getColor, getPalette } from 'colorthief';

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

const config = useConfigStore();
const runtimeStore = useRuntimeStore();
import { elements } from '@/utils/elementManager';
import { debugLogger } from '@/utils/logger';
import { hasPlaybackContent } from '@/utils/playback';

import { colorToRgb, hexToRgb } from './colorUtils';
import { player_control_thumbnail } from './domRefs';
import type { RgbTuple } from './types';

/**
 * 从封面图片提取颜色（供外部调用）
 */
export async function extractColorsFromThumbnail(event: MediaThumbnailEvent | null): Promise<void> {
    const img = elements.playerControl.thumbnail;
    if (!img || !img.complete || !img.naturalWidth) return;

    const playerControlYakelicColor = config.player_control_yakelic_color ?? [255, 255, 255];
    const playerControlColor = config.player_control_color ?? [255, 255, 255];

    let palette: Awaited<ReturnType<typeof getPalette>> | null = null;
    let dominantColor: Awaited<ReturnType<typeof getColor>> | null = null;

    try {
        const [paletteResult, dominantResult] = await Promise.all([
            getPalette(player_control_thumbnail, { colorCount: 3 }),
            getColor(player_control_thumbnail),
        ]);
        palette = paletteResult;
        dominantColor = dominantResult;
    } catch (e) {
        debugLogger.warn('[Player] Color extraction failed', { error: e });
    }

    runtimeStore.updatePlayerInfo({ colorGroup: event
        ? buildEventColorGroup(
              event,
              dominantColor,
              palette,
              playerControlYakelicColor,
              playerControlColor
          )
        : buildCustomColorGroup(
              dominantColor,
              palette,
              playerControlYakelicColor,
              playerControlColor
          ),
    });

    updateFluidEffectSource(event);
}

function buildEventColorGroup(
    event: MediaThumbnailEvent,
    dominantColor: Awaited<ReturnType<typeof getColor>> | null,
    palette: Awaited<ReturnType<typeof getPalette>> | null,
    yakelicColor: RgbTuple,
    fontColor: RgbTuple
) {
    return [
        [
            hexToRgb(event.primaryColor),
            hexToRgb(event.secondaryColor),
            hexToRgb(event.tertiaryColor),
            hexToRgb(event.highContrastColor),
        ],
        [
            colorToRgb(dominantColor),
            colorToRgb(palette?.[0]),
            colorToRgb(palette?.[1]),
            colorToRgb(palette?.[2]),
        ],
        [yakelicColor],
        [fontColor],
    ];
}

function buildCustomColorGroup(
    dominantColor: Awaited<ReturnType<typeof getColor>> | null,
    palette: Awaited<ReturnType<typeof getPalette>> | null,
    yakelicColor: RgbTuple,
    fontColor: RgbTuple
) {
    // 颜色提取失败时用用户配置的亚克力色代替纯黑，避免背景变黑
    const extracted: RgbTuple[] = [
        colorToRgb(dominantColor) || yakelicColor,
        colorToRgb(palette?.[0]) || yakelicColor,
        colorToRgb(palette?.[1]) || yakelicColor,
        colorToRgb(palette?.[2]) || yakelicColor,
    ];

    return [extracted, [...extracted], [yakelicColor], [fontColor]];
}

function updateFluidEffectSource(event: MediaThumbnailEvent | null): void {
     
    const fe = runtimeStore.FluidEffect as any;
    if (fe?.enabled) {
        const hasContent = hasPlaybackContent();
        if (hasContent) {
            fe?.initNormalEffect();
            const existingEffect = fe?.normalEffect;
            if (existingEffect && event?.thumbnail) {
                const img = elements.playerControl.thumbnail;
                if (img?.complete && img?.naturalWidth) {
                    existingEffect.setSourceFromImage(img);
                    const wrapper = document.querySelector(
                        '.fluid-effect-wrapper'
                    ) as HTMLElement | null;
                    if (wrapper && img.src) {
                        wrapper.style.backgroundImage = `url('${img.src}')`;
                    }
                }
            }
        }
    }

    if (fe?.fullscreenEnabled && hasPlaybackContent()) {
        fe?.updateFullscreenSource();
    }
}
