/**
 * DOM 元素集合 — 按域分文件组织，统一从本文件导出
 *
 * 域拆分：
 * - core       主体、视频、音频、页面标题
 * - time       时钟、日期、一言、倒计时
 * - background 幻灯片、背景层
 * - weather    天气
 * - player     播放器
 * - sakura     樱花
 * - ui         版本弹窗、调试面板
 *
 * 使用 Object.defineProperties 合并各子模块，保留惰性 getter 定义
 * 不被 spread 运算符展开。各子模块的 getter 在元素首次访问时才执行。 
 */

import { backgroundElements } from './elements/background';
import { coreElements } from './elements/core';
import { playerElements } from './elements/player';
import { sakuraElements } from './elements/sakura';
import { timeElements } from './elements/time';
import { uiElements } from './elements/ui';
import { weatherElements } from './elements/weather';

// 用 defineProperties 逐个合并模块，保留 getter 而非读取其值
const combined: Record<string, unknown> = {};

for (const module of [
    coreElements as unknown as Record<string, unknown>,
    timeElements as unknown as Record<string, unknown>,
    backgroundElements as unknown as Record<string, unknown>,
    playerElements as unknown as Record<string, unknown>,
    sakuraElements as unknown as Record<string, unknown>,
    uiElements as unknown as Record<string, unknown>,
]) {
    Object.defineProperties(combined, Object.getOwnPropertyDescriptors(module));
}

// weather 是嵌套对象，直接赋值
Object.defineProperty(combined, 'weather', {
    enumerable: true,
    configurable: true,
    writable: false,
    value: weatherElements,
});

export const elements = combined as unknown as typeof coreElements &
    typeof timeElements &
    typeof backgroundElements &
    typeof playerElements &
    typeof sakuraElements &
    typeof uiElements & { weather: typeof weatherElements };
