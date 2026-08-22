/**
 * 播放器底部的音频可视化（条形 / 折线两种模式）。
 *
 * 每次调用 `pc_aubar()` 会重置 canvas 尺寸并启动一个
 * requestAnimationFrame 循环；当 `aubarstop` 被置 true、
 * 或可视化被关闭、或播放器停止时自动退出。
 */
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { elements } from '@/utils/elementManager';

const config = useConfigStore();
const runtimeStore = useRuntimeStore();

import { AUDIO_BAR_COUNT } from '../constants';
import { PLAYER_STATE } from '../types';

/**
 * 渲染循环是否应当继续。
 * （停止标志位、配置项、播放状态任意一个失效都退出。）
 */
function shouldContinueDrawing(): boolean {
    return (
        !runtimeStore.playerInfo.aubarstop &&
        Boolean(config.player_control_visualaudiobar) &&
        runtimeStore.playerInfo.playerState !== PLAYER_STATE.STOPPED
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

    // 沿用 main 分支的尺寸算法：让 CSS 把 .info 约束为 min-content（最长
    // 文本行宽），canvas 用 JS 显式 style.width 覆盖父级约束，从而：
    //   标题文字变长/变短 → .info 的 min-content 变化 →
    //   usage.clientWidth 变化 → canvas style.width 跟着变。
    const height = full.clientHeight - usage.clientHeight;
    const width = usage.clientWidth;
    if (height <= 0) {
        // 布局尚未完成，等下一帧再试
        requestAnimationFrame(pc_aubar);
        return;
    }

    aubar.width = width;
    aubar.height = height;
    aubar.style.width = `${width}px`;
    aubar.style.height = `${height}px`;

    runtimeStore.updatePlayerInfo({ aubarstop: false });

    function syncCanvasSize(): void {
        const newHeight = full.clientHeight - usage.clientHeight;
        const newWidth = usage.clientWidth;
        if (newHeight > 0 && newWidth > 0 && (newWidth !== aubar.width || newHeight !== aubar.height)) {
            aubar.width = newWidth;
            aubar.height = newHeight;
            aubar.style.width = `${newWidth}px`;
            aubar.style.height = `${newHeight}px`;
        }
    }

    const draw = (): void => {
        syncCanvasSize();
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        const barWidth = aubar.width / AUDIO_BAR_COUNT;
        rgbbg.fillStyle = 'rgb(' + runtimeStore.playerInfo.fontcolor + ')';

        const { audioLeft, audioRight } = runtimeStore.playerInfo;

        for (let i = 0; i < AUDIO_BAR_COUNT; ++i) {
            // 变化幅度/增益已在全局 DSP 链（audioVisualizer）应用，直接画目标高度
            const bar = ((audioLeft[i] ?? 0) + (audioRight[i] ?? 0)) / 2;
            const actualHeight = Math.min(
                aubar.height * Math.min(bar, 1),
                aubar.height
            );

            rgbbg.fillRect(
                barWidth * i,
                aubar.height - actualHeight,
                barWidth,
                actualHeight
            );
        }

        if (shouldContinueDrawing()) {
            requestAnimationFrame(draw);
        } else {
            rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        }
    };

    const drawline = (): void => {
        syncCanvasSize();
        rgbbg.clearRect(0, 0, aubar.width, aubar.height);
        rgbbg.lineWidth = 2;
        rgbbg.strokeStyle = 'rgb(' + runtimeStore.playerInfo.fontcolor + ')';
        const spacing = aubar.width / AUDIO_BAR_COUNT;

        const { audioLeft, audioRight } = runtimeStore.playerInfo;

        rgbbg.beginPath();

        const heights: number[] = [];
        for (let i = 0; i < AUDIO_BAR_COUNT; ++i) {
            // 变化幅度/增益已在全局 DSP 链应用，直接取目标高度
            const amplitude = ((audioLeft[i] ?? 0) + (audioRight[i] ?? 0)) / 2;
            const targetHeight =
                aubar.height - aubar.height * Math.min(amplitude, 1);
            heights.push(Math.max(0, Math.min(targetHeight, aubar.height)));
        }

        if (heights.length < 2) {
            if (shouldContinueDrawing()) {
                requestAnimationFrame(drawline);
            }
            return;
        }

        rgbbg.moveTo(0, heights[0] ?? 0);

        // 用 Catmull-Rom → 三次贝塞尔 转换实现平滑折线
        for (let i = 0; i < heights.length - 1; i++) {
            const x0 = i > 0 ? spacing * (i - 1) : 0;
            const y0 = heights[i - 1] ?? heights[0] ?? 0;
            const x1 = spacing * i;
            const y1 = heights[i] ?? 0;
            const x2 = spacing * (i + 1);
            const y2 = heights[i + 1] ?? 0;
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
