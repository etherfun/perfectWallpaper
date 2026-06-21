/**
 * 降水/温度切换逻辑
 * 职责：处理降水概率和温度显示的定时切换及动画
 */

import { globalT } from '@/i18n';

import { config } from '../../utils/config';
import { getWeatherUnit } from '../weatherState';
import {
    clearPrecipTimer,
    isAnimatingPrecipToggle,
    setIsAnimatingPrecipToggle,
    setPrecipTemperatureToggleTimer,
    showTemperatureInsteadOfPrecip,
    toggleShowTemperatureInsteadOfPrecip,
    weather_data,
} from '../weatherState';

/**
 * 切换降水/温度显示
 */
export function togglePrecipTemperatureDisplay(): void {
    // 检查数据是否可用
    if (!weather_data.sevenHourlyData) return;

    // 防止动画期间重复切换
    if (isAnimatingPrecipToggle) return;
    setIsAnimatingPrecipToggle(true);

    // 切换显示状态
    toggleShowTemperatureInsteadOfPrecip();

    // 更新标签（带动画）
    const labelElement = document.querySelector('.precip-label');
    if (labelElement) {
        const label = showTemperatureInsteadOfPrecip
            ? globalT('weather_show_temperature')
            : globalT('weather_show_precipprob');

        // 添加动画类
        labelElement.classList.add('animate');

        // 更新标签内容
        labelElement.textContent = label;
        labelElement.setAttribute(
            'data-display-type',
            showTemperatureInsteadOfPrecip ? 'temperature' : 'precipitation'
        );

        // 移除动画类
        setTimeout(() => {
            labelElement.classList.remove('animate');
        }, 300);
    }

    // 更新数值（带动画）
    const valueCells = document.querySelectorAll('.precip-prob-cell');
    if (valueCells.length === 7) {
        const dataValues = showTemperatureInsteadOfPrecip
            ? weather_data.sevenHourlyData.Temps
            : weather_data.sevenHourlyData.Pops;
        const unit = showTemperatureInsteadOfPrecip ? getWeatherUnit().temp || '℃' : '';

        // 第一步：为所有单元格添加淡出动画
        valueCells.forEach(cell => {
            cell.classList.add('fade-out');
        });

        // 第二步：等待淡出动画完成后更新内容并添加淡入动画
        setTimeout(() => {
            valueCells.forEach((cell, index) => {
                const value = dataValues[index] || '--';
                cell.textContent = `${value}${unit}`;

                // 移除淡出类，添加淡入类
                cell.classList.remove('fade-out');
                cell.classList.add('fade-in');

                // 淡入动画完成后移除淡入类
                setTimeout(() => {
                    cell.classList.remove('fade-in');
                }, 300);
            });

            // 动画完成后重置标志
            setTimeout(() => {
                setIsAnimatingPrecipToggle(false);
            }, 350);
        }, 150); // 等待淡出动画的一半时间
    } else {
        // 如果没有找到单元格，也重置标志
        setTimeout(() => {
            setIsAnimatingPrecipToggle(false);
        }, 100);
    }
}

/**
 * 启动降水/温度轮换定时器
 */
export function startPrecipTemperatureToggleTimer(): void {
    // 清除已有定时器
    clearPrecipTimer();

    // 仅当有降水行时启动定时器（weather_api_choose 为 1, 4, 5）
    if ([1, 4, 5].includes(config.weather_api_choose ?? 0)) {
        // 每30秒切换一次显示
        setPrecipTemperatureToggleTimer(window.setInterval(togglePrecipTemperatureDisplay, 20000));
    }
}

/**
 * 清除降水/温度轮换定时器
 */
export function clearPrecipTemperatureToggleTimer(): void {
    clearPrecipTimer();
}
