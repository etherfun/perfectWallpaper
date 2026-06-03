/**
 * 播放器底部的音频可视化（条形 / 折线两种模式）。
 *
 * 每次调用 `pc_aubar()` 会重置 canvas 尺寸并启动一个
 * requestAnimationFrame 循环；当 `aubarstop` 被置 true、
 * 或可视化被关闭、或播放器停止时自动退出。
 */
import { config } from '@/utils/config';
import { elements } from '@/utils/elementManager';

import { AUDIO_BAR_COUNT } from './constants';
import { PLAYER_STATE } from './types';

/** 线性插值 */
function lerp(start: number, end: number, amount: number): number {
    return (1 - amount) * start + amount * end;
}

/**
 * 渲染循环是否应当继续。
 * （停止标志位、配置项、播放状态任意一个失效都退出。）
 */
function shouldContinueDrawing(): boolean {
    return (
        !config.runtime.playerInfo.aubarstop &&
        Boolean(config.player_control_visualaudiobar) &&
        config.runtime.playerInfo.playerState !== PLAYER_STATE.STOPPED
    );
}

/**
 * 启动音频可视化（柱状图或折线）。
 */
export function pc_aubar(): void {
    const full = elements.playerControl.thumbnailWrap;
    const usage = elements.playerControl.info;
    const aubar = elements.playerControl.aubar;
    if (!aubar || !full || !usage) return;

    const rgbbg = aubar.getContext('2d');
    if (!rgbbg) return;

    const height = full.clientHeight - usage.clientHeight;
    const width = usage.clientWidth;

    aubar.width = width;
    aubar.height = height;
    aubar.style.width = `${width}px`;
    aubar.style.height = `${height}px`;

    config.runtime.playerInfo.aubarstop = false;

    const previousHeights = new Array(AUDIO_BAR_COUNT).fill(aubar.height);
    const barHeights = new Array(AUDIO_BAR_COUNT).fill(0);

    const draw = (): void => {
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        const barWidth = aubar.width / AUDIO_BAR_COUNT;
        rgbbg.fillStyle = 'rgb(' + config.runtime.playerInfo.fontcolor + ')';

        const currentAudioArr = config.runtime.playerInfo.audioArray;

        for (let i = 0, l = AUDIO_BAR_COUNT; i < AUDIO_BAR_COUNT; ++i, ++l) {
            const bar = (currentAudioArr[i] + currentAudioArr[l]) / 2;
            const targetHeight =
                aubar.height * Math.min(bar, 1) * config.player_control_scalefactor;
            const actualHeight = Math.min(targetHeight, aubar.height);

            barHeights[i] = lerp(barHeights[i], actualHeight, config.player_control_hdong);

            rgbbg.fillRect(barWidth * i, aubar.height - barHeights[i], barWidth, barHeights[i]);
        }

        if (shouldContinueDrawing()) {
            requestAnimationFrame(draw);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    };

    const drawline = (): void => {
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        rgbbg.lineWidth = 2;
        rgbbg.strokeStyle = 'rgb(' + config.runtime.playerInfo.fontcolor + ')';
        const spacing = aubar.width / AUDIO_BAR_COUNT;

        const currentAudioArr = config.runtime.playerInfo.audioArray;

        rgbbg.beginPath();

        const heights: number[] = [];
        for (let i = 0, l = AUDIO_BAR_COUNT; i < AUDIO_BAR_COUNT; ++i, ++l) {
            const amplitude = (currentAudioArr[i] + currentAudioArr[l]) / 2;
            let targetHeight =
                aubar.height -
                aubar.height * Math.min(amplitude, 1) * config.player_control_scalefactor;
            targetHeight = Math.max(0, Math.min(targetHeight, aubar.height));
            previousHeights[i] = lerp(
                previousHeights[i],
                targetHeight,
                config.player_control_hdong
            );
            heights[i] = previousHeights[i];
        }

        if (heights.length < 2) {
            if (shouldContinueDrawing()) {
                requestAnimationFrame(drawline);
            }
            return;
        }

        rgbbg.moveTo(0, heights[0]);

        // 用 Catmull-Rom → 三次贝塞尔 转换实现平滑折线
        for (let i = 0; i < heights.length - 1; i++) {
            const x0 = i > 0 ? spacing * (i - 1) : 0;
            const y0 = heights[i - 1] ?? heights[0];
            const x1 = spacing * i;
            const y1 = heights[i];
            const x2 = spacing * (i + 1);
            const y2 = heights[i + 1];
            const x3 = i < heights.length - 2 ? spacing * (i + 2) : x2;
            const y3 = heights[i + 2] ?? y2;

            const cp1x = x1 + (x2 - x0) / 6;
            const cp1y = y1 + (y2 - y0) / 6;
            const cp2x = x2 - (x3 - x1) / 6;
            const cp2y = y2 - (y3 - y1) / 6;

            rgbbg.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
        }

        rgbbg.stroke();

        if (shouldContinueDrawing()) {
            requestAnimationFrame(drawline);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    };

    const playerControlBarline = config.player_control_barline;
    const playerControlVisualaudiobar = config.player_control_visualaudiobar;

    if (playerControlVisualaudiobar && playerControlBarline == 2) {
        drawline();
    } else if (playerControlVisualaudiobar && playerControlBarline == 1) {
        draw();
    }
}
