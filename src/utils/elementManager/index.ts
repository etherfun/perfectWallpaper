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
 */

import { backgroundElements } from './elements/background';
import { coreElements } from './elements/core';
import { playerElements } from './elements/player';
import { sakuraElements } from './elements/sakura';
import { timeElements } from './elements/time';
import { uiElements } from './elements/ui';
import { weatherElements } from './elements/weather';

export const elements = {
    ...coreElements,
    ...timeElements,
    ...backgroundElements,
    weather: weatherElements,
    ...playerElements,
    ...sakuraElements,
    ...uiElements,
} as const;
