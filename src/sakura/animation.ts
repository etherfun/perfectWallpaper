/**
 * 动画主循环 + 启停控制
 *
 * animate() 由 requestAnimationFrame 驱动，每帧：
 *   1. 推进 timeInfo（elapsed/delta）
 *   2. 调用 renderScene
 *   3. 把 WebGL 画布内容 drawImage 到 2D 画布（#sakurashow）做最终显示
 *
 * 暴露 stepAnimation 用于樱花关闭时按需启动一帧。
 */

import { useConfigStore } from '@/stores/config';

const config = useConfigStore();

import { renderScene } from './scene';
import { getAnimating, getRafRunning, setAnimating, setRafRunning, timeInfo } from './state';

/** 把 WebGL 画布当前内容绘制到 2D 显示画布 */
function copyCanvasTo2D(): void {
    const raw = document.getElementById('sakura') as HTMLCanvasElement | null;
    const showCanvas = document.getElementById('sakurashow') as HTMLCanvasElement | null;
    const ctx = showCanvas?.getContext('2d') ?? null;
    if (ctx && raw && raw.width > 0 && config.showSakura) {
        ctx.drawImage(
            raw,
            0,
            0,
            window.innerWidth,
            window.innerHeight,
            0,
            0,
            window.innerWidth,
            window.innerHeight
        );
    }
}

/** 单帧入口 */
function render(): void {
    renderScene();
    copyCanvasTo2D();
}

/** 如果动画未运行则启动（樱花隐藏期间被外部 setter 关闭后可重新激活） */
export function stepAnimation(): void {
    if (!getAnimating()) animate();
}

/** 启动 RAF 循环（防重入：同一时刻只有一个 RAF 循环在运行） */
export function animate(): void {
    if (getRafRunning()) return;
    setRafRunning(true);

    const curdate = new Date();
    timeInfo.elapsed = (curdate.getTime() - timeInfo.start.getTime()) / 1000.0;
    timeInfo.delta = (curdate.getTime() - timeInfo.prev.getTime()) / 1000.0;
    timeInfo.prev = curdate;

    render();

    if (getAnimating()) {
        requestAnimationFrame(function tick() {
            const now = new Date();
            timeInfo.elapsed = (now.getTime() - timeInfo.start.getTime()) / 1000.0;
            timeInfo.delta = (now.getTime() - timeInfo.prev.getTime()) / 1000.0;
            timeInfo.prev = now;

            render();

            if (getAnimating()) {
                requestAnimationFrame(tick);
            } else {
                setRafRunning(false);
            }
        });
    } else {
        setRafRunning(false);
    }
}

export { getAnimating, setAnimating };

/** 切换动画状态：开启时启动一帧；可选更新元素文本（"Start"/"Stop"） */
export function toggleAnimation(elm?: HTMLElement): void {
    setAnimating(!getAnimating());
    if (getAnimating()) animate();
    if (elm) {
        elm.innerHTML = getAnimating() ? 'Stop' : 'Start';
    }
}
