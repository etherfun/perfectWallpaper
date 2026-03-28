/**
 * 天气模块入口文件
 * 整合所有天气相关的API、工具函数和UI
 */

export { weather_unit_choose } from './units';
export { getWeatherTips } from './tips';

import type { WeatherData, WeatherAddress, SevenHourlyData } from './types';
import type { WeatherAPIHandler } from './api/base';
import { wunit } from './units';
import { i18n } from '../utils/i18n';
import { fetch_with_retry } from '../utils/tool';
import { config } from '../utils/config';
import { timerManager } from '../utils/timer';
import { elements } from '../utils/elementManager';
import { formatTime } from './utils';
import { getWeatherTips } from './tips';

// 导出类型
export type { WeatherData, WeatherAddress, SevenHourlyData }

// 全局天气变量
export let weather_address: WeatherAddress = {
    checkcity: "",
    cityname: "",
    citynumber: "",
    latitude: "",
    longitude: ""
};

export let weather_data: WeatherData = createEmptyWeatherData();

export let weather_daliy_tip: string;

export let showTemperatureInsteadOfPrecip = false;
export let precipTemperatureToggleTimer: number | null = null;
export let isAnimatingPrecipToggle = false;

// 创建空天气数据
function createEmptyWeatherData(): WeatherData {
    return {
        updateTime: "",
        icon: "",
        temperature: "",
        feels: "",
        weathernow: "",
        windSpeed: "",
        humidity: "",
        temperature_max: "",
        temperature_min: "",
        feels_max: "",
        feels_min: "",
        wind: "",
        precip: "",
        precipcover: "",
        precipprob: "",
        snow: "",
        snowdepth: "",
        preciptype: "",
        windgust: "",
        visibility: "",
        solarradiation: "",
        uvindex: "",
        sunrise: "",
        sunset: "",
        moonphase: "",
        cloud: "",
        vis: "",
        dew: "",
        pressure: "",
        rangefeelstemperature: "",
        rangetemperature: "",
        obstime: "",
        windLv: "",
        air: "",
        weatherAlert: [],
        weatherAlertColor: "",
        sevenHourlyData: {
            updateTime: "",
            Times: ["--:--", "--:--", "--:--", "--:--", "--:--", "--:--", "--:--"],
            Pops: ["——", "——", "——", "——", "——", "——", "——"],
            Temps: [],
            Icons: [],
            Texts: [],
            Wind360s: [],
            Winds: [],
            WindLvs: [],
            WindSpeeds: [],
            Humidities: [],
            Precips: [],
            Pressures: [],
            Clouds: [],
            Dews: [],
            preciptype: []
        }
    };
}

// 显示天气加载状态
export function showWeatherLoading(): void {
    const leftContainer = elements.weather.leftContainer;
    const rightContainer = elements.weather.rightContainer;
    if (!leftContainer || !rightContainer) return;

    leftContainer.style.flex = '1';
    leftContainer.style.minWidth = 'auto';
    leftContainer.style.textAlign = 'center';
    leftContainer.style.display = 'flex';
    leftContainer.style.flexDirection = 'column';
    leftContainer.style.justifyContent = 'center';
    leftContainer.style.alignItems = 'center';
    rightContainer.style.display = 'none';

    leftContainer.innerHTML = `<div>${i18n('weather_loading')}</div>`;
}

// 隐藏天气加载状态
export function hideWeatherLoading(): void {
    const leftContainer = elements.weather.leftContainer;
    const rightContainer = elements.weather.rightContainer;
    if (!leftContainer || !rightContainer) return;

    leftContainer.style.flex = '';
    leftContainer.style.minWidth = '';
    leftContainer.style.textAlign = '';
    leftContainer.style.display = '';
    leftContainer.style.flexDirection = '';
    leftContainer.style.justifyContent = '';
    leftContainer.style.alignItems = '';
    rightContainer.style.display = '';
}

// 显示天气错误信息
export function showWeatherError(message: string): void {
    const leftContainer = elements.weather.leftContainer;
    const rightContainer = elements.weather.rightContainer;
    if (!leftContainer || !rightContainer) return;

    leftContainer.style.flex = '1';
    leftContainer.style.minWidth = 'auto';
    leftContainer.style.textAlign = 'center';
    leftContainer.style.display = 'flex';
    leftContainer.style.flexDirection = 'column';
    leftContainer.style.justifyContent = 'center';
    leftContainer.style.alignItems = 'center';
    rightContainer.style.display = 'none';

    leftContainer.innerHTML = `<div class="weather-error" style="color: #ff6b6b;">${message}</div>`;
}

// API选择器映射 - 使用动态导入实现懒加载
const apiHandlers: { [key: number]: () => Promise<WeatherAPIHandler> } = {
    1: () => import('./api/qweather').then(m => m.qweather),
    2: () => import('./api/icufree').then(m => m.icufree),
    3: () => import('./api/yiketianqi').then(m => m.yiketianqi),
    4: () => import('./api/visualcrossing').then(m => m.visualcrossing),
    5: () => import('./api/openmeteo').then(m => m.openmeteo)
};

// 天气初始化
export async function weather_init(): Promise<void> {
    showWeatherLoading();

    if (weather_address.cityname === "") {
        try {
            const citydata = await fetch_with_retry("http://i.tianqi.com/index.php?c=code&id=11", {});
            const text = await citydata.text();
            weather_address.cityname = text.split("</strong>")[1].split(" ")[0];
        } catch (e) {
            console.error("Failed to get city:", e);
        }
    }

    const handlerFactory = apiHandlers[config.weatherApiChoose];
    if (handlerFactory) {
        try {
            const handler = await handlerFactory();
            await handler(weather_address, weather_data);
            await generateWeatherTable();
        } catch (error) {
            console.error("Weather fetch error:", error);
            showWeatherError(i18n('weather_error_loading'));
        }
    }
}

// 自动更新天气
export function autoWeather(): void {
    weather_init();
    const intervals: { [key: number]: number } = {
        1: 900000,
        2: 1200000,
        3: 1800000,
        4: 2700000,
        5: 3600000
    };
    timerManager.create(autoWeather, intervals[config.weatherUpdate] || 900000, 'updataWeather');
}

export function getAirQualityText(airValue: string | number): string {
    if (!airValue || airValue === "") return "";

    let airNum = typeof airValue === 'string' ? parseFloat(airValue) : airValue;
    if (isNaN(airNum)) {
        return String(airValue);
    }

    if (airNum <= 50) return `${i18n('weather_air_quality_excellent')} (${airNum})`;
    if (airNum <= 100) return `${i18n('weather_air_quality_good')} (${airNum})`;
    if (airNum <= 150) return `${i18n('weather_air_quality_light_pollution')} (${airNum})`;
    if (airNum <= 200) return `${i18n('weather_air_quality_moderate_pollution')} (${airNum})`;
    if (airNum <= 300) return `${i18n('weather_air_quality_heavy_pollution')} (${airNum})`;
    return `${i18n('weather_air_quality_severe_pollution')} (${airNum})`;
}

// 生成天气预警HTML
export function generateAlertHTML(): string {
    if (!weather_data.weatherAlert || !Array.isArray(weather_data.weatherAlert) || weather_data.weatherAlert.length === 0) {
        return '';
    }

    const severityLevel: { [key: string]: number } = {
        extreme: 5,
        severe: 4,
        moderate: 3,
        minor: 2,
        unknown: 1
    };

    const sorted = [...weather_data.weatherAlert].sort((a, b) =>
        severityLevel[b.level] - severityLevel[a.level]
    );

    const alertMap: { [key: string]: typeof sorted[0] & { ids: string[] } } = {};
    sorted.forEach(alert => {
        if (!alertMap[alert.alert]) {
            alertMap[alert.alert] = { ...alert, ids: [alert.id] };
        } else {
            alertMap[alert.alert].ids.push(alert.id);
            if (severityLevel[alert.level] > severityLevel[alertMap[alert.alert].level]) {
                alertMap[alert.alert].level = alert.level;
                alertMap[alert.alert].color = alert.color;
            }
        }
    });

    let html = "";
    Object.values(alertMap).forEach(a => {
        const idsString = a.ids.join(',');
        html += `<span class="weather-alert-item" style="color: rgb(${a.color}); font-weight: bold; margin-right: 10px;" data-id="${idsString}">${a.alert}</span>`;
    });

    return html;
}

// 生成天气表格UI
export async function generateWeatherTable(): Promise<void> {
    if (weather_data.temperature === "" && weather_data.weathernow === "") {
        showWeatherLoading();
        return;
    }

    hideWeatherLoading();

    // 左侧主天气信息
    let leftHTML = `<div class="weather-left">`;

    if ([1, 4, 5].includes(config.weatherApiChoose)) {
        try {
            const iconRes = await fetch_with_retry(`src/source/QWeather-Icons/icons/${weather_data.icon}-fill.svg`);
            const iconSvg = await iconRes.text();
            leftHTML += `<div class="weather-icon">${iconSvg}</div>`;
        } catch (e) {
            const iconRes = await fetch_with_retry(`src/source/QWeather-Icons/icons/999-fill.svg`);
            const iconSvg = await iconRes.text();
            leftHTML += `<div class="weather-icon">${iconSvg}</div>`;
        }
    }

    leftHTML += `
        <div class="weather-temp">${weather_data.temperature}${wunit?.temp || "℃"}</div>
        <div class="weather-text">${weather_data.weathernow || ""}</div>
    `;

    if ([1, 3, 4, 5].includes(config.weatherApiChoose)) {
        leftHTML += `<div class="weather-feels">${i18n('weather_feels_label')} ${weather_data.feels}${wunit?.temp || "℃"}</div>`;
    }

    if ([1, 2, 3, 4].includes(config.weatherApiChoose)) {
        leftHTML += `<div class="weather-city">${weather_address.cityname}</div>`;
    }

    leftHTML += `</div>`;

    // 右侧详细信息
    let rightHTML = `<div class="weather-right-content">`;

    // 主信息行
    rightHTML += `<div class="weather-main-row">`;
    rightHTML += `<div class="weather-info-item temp-range">${weather_data.temperature_max} ~ ${weather_data.temperature_min}℃</div>`;

    if ([1, 3, 4, 5].includes(config.weatherApiChoose)) {
        rightHTML += `<div class="weather-info-item humidity">${i18n('weather_humidity_label')}${weather_data.humidity}%</div>`;
    }

    rightHTML += `<div class="weather-info-item wind-direction">${weather_data.wind}</div>`;

    if ([1, 2].includes(config.weatherApiChoose)) {
        rightHTML += `<div class="weather-info-item wind-level">${weather_data.windLv}${i18n('weather_wind_level_label')}</div>`;
    }

    if ([1, 3, 4, 5].includes(config.weatherApiChoose)) {
        rightHTML += `<div class="weather-info-item wind-speed">${weather_data.windSpeed}${wunit?.wind || "km/h"}</div>`;
    }

    if ([1].includes(config.weatherApiChoose)) {
        rightHTML += `<div class="weather-info-item visibility">${i18n('weather_visibility_label')}${weather_data.vis}${wunit?.vis || "km"}</div>`;
    }

    rightHTML += `</div>`;

    // 第二行：详细信息（UV指数、日出日落、月相）
    if ([1, 3, 4, 5].includes(config.weatherApiChoose)) {
        rightHTML += `<div class="weather-detail-row">`;
        rightHTML += `<div class="weather-detail-item uv-index">${i18n('weather_uv_label')}${weather_data.uvindex}</div>`;

        if ([1, 4, 5].includes(config.weatherApiChoose)) {
            rightHTML += `<div class="weather-info-item cloud">${i18n('weather_cloud_label')}${weather_data.cloud}%</div>`;
        }
        rightHTML += `<div class="weather-detail-item sunrise">${i18n('weather_sunrise_label')}${formatTime(weather_data.sunrise)}</div>`;
        rightHTML += `<div class="weather-detail-item sunset">${i18n('weather_sunset_label')}${formatTime(weather_data.sunset)}</div>`;
        if ([1, 4].includes(config.weatherApiChoose)) {
            rightHTML += `<div class="weather-detail-item moonphase">${weather_data.moonphase}</div>`;
        }
        rightHTML += `</div>`;

        if ([1].includes(config.weatherApiChoose)) {
            rightHTML += `<div class="weather-air-row">`;

            rightHTML += `<div class="weather-air-item air-quality">${i18n('weather_air_quality_label')}</div>`;
            rightHTML += `<div class="weather-air-item air-value">${getAirQualityText(weather_data.air)}</div>`;
            
            const alertsHTML = generateAlertHTML();
            if (alertsHTML) {
                rightHTML += `<div class="weather-alert-container">${i18n('weather_alert_label')}<div class="weather-alert-items-warp"><div class="weather-alert-items">${alertsHTML}</div></div></div>`;
            }

            rightHTML += `</div>`;
        }

    } else if ([2].includes(config.weatherApiChoose)) {
    } else if ([3].includes(config.weatherApiChoose)) {
        rightHTML += `<div class="weather-air-row">`;
        const alertsHTML = generateAlertHTML();
        if (alertsHTML) {
            rightHTML += `<div class="weather-alert-container">${i18n('weather_alert_label')}<div class="weather-alert-items-warp"><div class="weather-alert-items">${alertsHTML}</div></div></div>`;
        }
        rightHTML += `</div>`;
    }

    // 降水概率行（动态显示）
    if ([1, 4, 5].includes(config.weatherApiChoose)) {
        const showTemp = showTemperatureInsteadOfPrecip;
        const label = showTemp ? i18n('weather_show_temperature') : i18n('weather_show_precipprob');
        const dataValues = showTemp ? weather_data.sevenHourlyData.Temps : weather_data.sevenHourlyData.Pops;
        const unit = showTemp ? (wunit?.temp || "℃") : "";

        rightHTML += `<div class="weather-precip-container">`;
        rightHTML += `<div class="precip-label" data-display-type="${showTemp ? 'temperature' : 'precipitation'}" data-i18n="${showTemp ? 'weather_show_temperature' : 'weather_show_precipprob'}">${label}</div>`;
        rightHTML += `<div class="precip-content">`;
        rightHTML += `<div class="precip-times">`;
        for (let i = 0; i < 7; i++) {
            rightHTML += `<span class="precip-time-cell">${weather_data.sevenHourlyData.Times[i] || "--:--"}</span>`;
        }
        rightHTML += `</div>`;
        rightHTML += `<div class="precip-values">`;
        for (let i = 0; i < 7; i++) {
            rightHTML += `<span class="precip-prob-cell" data-hour-index="${i}">${dataValues[i] || "--"}${unit}</span>`;
        }
        rightHTML += `</div>`;
        rightHTML += `</div>`;
        rightHTML += `</div>`;
    }

    // 提示信息行
    weather_daliy_tip = getWeatherTips(weather_data);
    if (weather_daliy_tip) {
        rightHTML += `<div class="weather-row weather-tip">${weather_daliy_tip}</div>`;
    }

    rightHTML += `</div>`;

    const weatherEl = elements.weather.container;
    if (weatherEl) {
        weatherEl.innerHTML = leftHTML + rightHTML;
    }

    tooltip();

    startPrecipTemperatureToggleTimer();
}

// 切换降水/温度显示
export function togglePrecipTemperatureDisplay(): void {
    // 检查数据是否可用
    if (!weather_data.sevenHourlyData) return;

    // 防止动画期间重复切换
    if (isAnimatingPrecipToggle) return;
    isAnimatingPrecipToggle = true;

    // 切换显示状态
    showTemperatureInsteadOfPrecip = !showTemperatureInsteadOfPrecip;

    // 更新标签（带动画）
    const labelElement = document.querySelector('.precip-label');
    if (labelElement) {
        const label = showTemperatureInsteadOfPrecip ? i18n('weather_show_temperature') : i18n('weather_show_precipprob');

        // 添加动画类
        labelElement.classList.add('animate');

        // 更新标签内容
        labelElement.textContent = label;
        labelElement.setAttribute('data-display-type', showTemperatureInsteadOfPrecip ? 'temperature' : 'precipitation');

        // 移除动画类
        setTimeout(() => {
            labelElement.classList.remove('animate');
        }, 300);
    }

    // 更新数值（带动画）
    const valueCells = document.querySelectorAll('.precip-prob-cell');
    if (valueCells.length === 7) {
        const dataValues = showTemperatureInsteadOfPrecip ? weather_data.sevenHourlyData.Temps : weather_data.sevenHourlyData.Pops;
        const unit = showTemperatureInsteadOfPrecip ? (wunit?.temp || "℃") : "";

        // 第一步：为所有单元格添加淡出动画
        valueCells.forEach(cell => {
            cell.classList.add('fade-out');
        });

        // 第二步：等待淡出动画完成后更新内容并添加淡入动画
        setTimeout(() => {
            valueCells.forEach((cell, index) => {
                const value = dataValues[index] || "--";
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
                isAnimatingPrecipToggle = false;
            }, 350);
        }, 150); // 等待淡出动画的一半时间
    } else {
        // 如果没有找到单元格，也重置标志
        setTimeout(() => {
            isAnimatingPrecipToggle = false;
        }, 100);
    }
}

// 启动降水/温度轮换定时器
export function startPrecipTemperatureToggleTimer(): void {
    // 清除已有定时器
    if (precipTemperatureToggleTimer) {
        clearInterval(precipTemperatureToggleTimer);
        precipTemperatureToggleTimer = null;
    }

    // 仅当有降水行时启动定时器（weather_api_choose 为 1, 4, 5）
    if ([1, 4, 5].includes(config.weatherApiChoose)) {
        // 每30秒切换一次显示
        precipTemperatureToggleTimer = window.setInterval(togglePrecipTemperatureDisplay, 20000);
    }
}

// 绑定七小时预报悬停提示
function attachSevenHourlyTooltip(element: HTMLElement, hourIndex: number): void {
    const tooltip = document.querySelector("#weatherHourlyTooltip") as HTMLElement | null;
    const card = tooltip?.querySelector(".popup-main") as HTMLElement | null;
    if (!tooltip || !card) return;

    element.addEventListener("mouseenter", () => {
        const i = hourIndex;
        const pop = weather_data.sevenHourlyData.Pops[i] ?? "--";
        const temp = weather_data.sevenHourlyData.Temps[i] ?? "--";
        const icon = weather_data.sevenHourlyData.Icons[i] ?? "999";
        const text = weather_data.sevenHourlyData.Texts[i] ?? "--";
        const wind = weather_data.sevenHourlyData.Winds[i] ?? "--";
        const wind360 = weather_data.sevenHourlyData.Wind360s[i] ?? "--";
        const windLv = weather_data.sevenHourlyData.WindLvs[i] ?? "--";
        const windSp = weather_data.sevenHourlyData.WindSpeeds[i] ?? "--";
        const hum = weather_data.sevenHourlyData.Humidities[i] ?? "--";
        const precip = weather_data.sevenHourlyData.Precips[i] ?? "--";
        const pres = weather_data.sevenHourlyData.Pressures[i] ?? "--";
        const clouds = weather_data.sevenHourlyData.Clouds[i] ?? "--";
        const dew = weather_data.sevenHourlyData.Dews[i] ?? "--";

        const pTemp = card.querySelector("#pTemp");
        const pText = card.querySelector("#pText");
        const pHumidity = card.querySelector("#pHumidity");
        const pPrecip = card.querySelector("#pPrecip");
        const pPressure = card.querySelector("#pPressure");
        const pClouds = card.querySelector("#pClouds");
        const pDew = card.querySelector("#pDew");
        const pWindDir = card.querySelector("#pWindDir");
        const pWindLv = card.querySelector("#pWindLv");
        const pWindSpeed = card.querySelector("#pWindSpeed");
        const pIconImg = card.querySelector("#pIconImg");

        if (pTemp) pTemp.textContent = `${temp}${i18n('weather_tooltip_unit_degree')}`;
        if (pText) pText.innerHTML = text;
        if (pHumidity) pHumidity.textContent = `${hum}${i18n('weather_tooltip_unit_percent')}`;
        if (pPrecip) pPrecip.textContent = `${pop} / ${precip}${i18n('weather_tooltip_unit_mm')}`;
        if (pPressure) pPressure.textContent = `${pres}${i18n('weather_tooltip_unit_hpa')}`;
        if (pClouds) pClouds.textContent = `${clouds}${i18n('weather_tooltip_unit_percent')}`;
        if (pDew) pDew.textContent = `${dew}${i18n('weather_tooltip_unit_degree')}`;
        if (pWindDir) pWindDir.textContent = `${wind} / ${wind360}${i18n('weather_tooltip_unit_degree')}`;
        if (pWindLv) pWindLv.textContent = windLv;
        if (pWindSpeed) pWindSpeed.textContent = `${windSp} ${i18n('weather_tooltip_unit_ms')}`;

        fetch_with_retry(`src/source/QWeather-Icons/icons/${icon}-fill.svg`)
            .then(res => res.text())
            .then(svg => {
                if (pIconImg) pIconImg.innerHTML = svg;
            });

        tooltip.style.display = "block";
        tooltip.classList.add("show");
    });

    element.addEventListener("mousemove", (e) => {
        const mouseEvent = e as MouseEvent;
        const tipWidth = tooltip.offsetWidth;
        const tipHeight = tooltip.offsetHeight;

        let left = mouseEvent.clientX + 20;
        let top = mouseEvent.clientY + 20;

        if (left + tipWidth > window.innerWidth - 20) left = mouseEvent.clientX - tipWidth - 20;
        if (top + tipHeight > window.innerHeight - 20) top = mouseEvent.clientY - tipHeight - 20;

        if (left < 20) left = 20;
        if (top < 20) top = 20;

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
    });

    element.addEventListener("mouseleave", () => {
        tooltip.classList.remove("show");
        setTimeout(() => {
            if (!tooltip.classList.contains("show")) {
                tooltip.style.display = "none";
            }
        }, 200);
    });
}

// 绑定天气预警悬停提示
function attachWeatherAlertTooltip(element: HTMLElement): void {
    const tooltip = document.querySelector("#weatherAlertTooltip") as HTMLElement | null;
    const cardsContainer = tooltip?.querySelector(".tooltip-cards-container") as HTMLElement | null;
    const cardTemplate = document.querySelector("#weatherAlerttooltipCardTemplate") as HTMLTemplateElement | null;
    const alertName = element.innerHTML;

    if (element.innerText === i18n('weather_alert_everything_ok')) return;

    element.addEventListener("mouseenter", () => {
        if (!cardsContainer || !cardTemplate) return;

        cardsContainer.innerHTML = "";

        const alerts = weather_data.weatherAlert.filter(item => item.alert === alertName);

        alerts.forEach(alert => {
            const cloned = cardTemplate.content.cloneNode(true) as DocumentFragment;
            const card = cloned.querySelector('.tooltip-card') as HTMLElement | null;
            if (!card) return;

            card.style.setProperty("--alert-color", alert.color);

            const tooltipTitle = card.querySelector(".tooltip-title");
            const sender = card.querySelector(".sender");
            const tooltipTimeText = card.querySelector(".tooltip-time .text");
            const tooltipTimeState = card.querySelector(".tooltip-time .state");
            const eventSeverity = card.querySelector(".event-severity .text");
            const eventTimingStart = card.querySelector(".event-timing .start .time");
            const eventTimingEnd = card.querySelector(".event-timing .end .time");
            const tooltipHeadline = card.querySelector(".tooltip-headline");
            const tooltipDescription = card.querySelector(".tooltip-description");
            const tooltipCriteria = card.querySelector(".tooltip-criteria");
            const tooltipInstructions = card.querySelector(".tooltip-instructions");
            const tooltipSource = card.querySelector(".tooltip-source");
            const tooltipIcon = card.querySelector(".tooltip-icon");

            if (tooltipTitle) tooltipTitle.textContent = alert.alert;
            if (sender) sender.textContent = alert.sender;
            if (tooltipTimeText) tooltipTimeText.textContent = getTime(alert.releaseTime, true);
            if (tooltipTimeState) tooltipTimeState.textContent = i18n(`weather_alert_${alert.status}`);
            const severityKey = `weather_alert_severity_${alert.level}`;
            const severityText = i18n(severityKey);
            if (eventSeverity) eventSeverity.textContent = severityText !== severityKey ? severityText : alert.level;
            if (eventTimingStart) eventTimingStart.textContent = getTime(alert.startTime, false);
            if (eventTimingEnd) eventTimingEnd.textContent = getTime(alert.endTime, false);
            if (tooltipHeadline) tooltipHeadline.textContent = alert.title;
            if (tooltipDescription) tooltipDescription.textContent = alert.description;
            if (tooltipCriteria) tooltipCriteria.textContent = alert.criteria;

            const instruction = alert.instruction?.split("\n").map(line => `<li>${line}</li>`).join("");
            if (instruction && tooltipInstructions) {
                const instructionsOl = tooltipInstructions.querySelector("ol") as HTMLElement | null;
                if (instructionsOl) {
                    instructionsOl.innerHTML = instruction;
                    (tooltipInstructions as HTMLElement).style.display = "block";
                }
            } else if (tooltipInstructions) {
                (tooltipInstructions as HTMLElement).style.display = "none";
            }

            if (tooltipSource) tooltipSource.textContent = alert.source;

            fetch_with_retry(`src/source/QWeather-Icons/icons/${alert.icon}.svg`)
                .then(res => res.text())
                .then(svg => {
                    if (tooltipIcon) tooltipIcon.innerHTML = svg;
                });

            if (tooltip) {
                tooltip.style.display = "block";
                tooltip.classList.add("show", "glow");
            }
            card.classList.add("glow");

            cardsContainer.appendChild(card);
        });
    });

    element.addEventListener("mousemove", (e) => {
        const mouseEvent = e as MouseEvent;
        if (!tooltip) return;
        const tipWidth = tooltip.offsetWidth;
        const tipHeight = tooltip.offsetHeight;

        let left = mouseEvent.clientX + 20;
        let top = mouseEvent.clientY + 20;

        if (left + tipWidth > window.innerWidth - 20) left = mouseEvent.clientX - tipWidth - 20;
        if (top + tipHeight > window.innerHeight - 20) top = mouseEvent.clientY - tipHeight - 20;

        if (left < 20) left = 20;
        if (top < 20) top = 20;

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
    });

    element.addEventListener("mouseleave", () => {
        tooltip?.classList.remove("show", "glow");
        setTimeout(() => {
            if (!tooltip?.classList.contains("show")) {
                if (tooltip) tooltip.style.display = "none";
                if (cardsContainer) cardsContainer.innerHTML = "";
            }
        }, 250);
    });
}

// 统一绑定所有tooltip事件
export function tooltip(): void {
    if ([1].includes(config.weatherApiChoose)) {
        document.querySelectorAll(".weather-alert-item").forEach(item => {
            attachWeatherAlertTooltip(item as HTMLElement);
        });
    }
    if ([1, 4, 5].includes(config.weatherApiChoose)) {
        document.querySelectorAll(".precip-time-cell").forEach((el, i) => {
            attachSevenHourlyTooltip(el as HTMLElement, i);
        });
    }
}

// 获取格式化时间
function getTime(date: Date | string, showDate: boolean): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    if (showDate) {
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    return `${hours}:${minutes}:${seconds}`;
}

