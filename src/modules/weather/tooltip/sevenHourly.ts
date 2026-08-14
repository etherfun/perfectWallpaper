/**
 * 七小时预报 Tooltip
 * 职责：绑定七小时预报悬停提示
 */

import { globalT } from '@/utils/i18n';

import { EMPTY_ICON_CODE, TOOLTIP_HIDE_DELAY_MS } from '../constants';
import { getIconSvg, iconSvgPath } from '../index';
import { weather_data } from '../weatherState';
import { hideTooltipAfter, positionTooltip } from './position';

/**
 * 绑定七小时预报悬停提示
 */
export function attachSevenHourlyTooltip(element: HTMLElement, hourIndex: number): void {
    const tooltip = document.querySelector('#weatherHourlyTooltip') as HTMLElement | null;
    const card = tooltip?.querySelector('.popup-main') as HTMLElement | null;
    if (!tooltip || !card) return;

    element.addEventListener('mouseenter', () => {
        const i = hourIndex;
        const pop = weather_data.sevenHourlyData.Pops[i] ?? '--';
        const temp = weather_data.sevenHourlyData.Temps[i] ?? '--';
        const icon = weather_data.sevenHourlyData.Icons[i] ?? EMPTY_ICON_CODE;
        const text = weather_data.sevenHourlyData.Texts[i] ?? '--';
        const wind = weather_data.sevenHourlyData.Winds[i] ?? '--';
        const wind360 = weather_data.sevenHourlyData.Wind360s[i] ?? '--';
        const windLv = weather_data.sevenHourlyData.WindLvs[i] ?? '--';
        const windSp = weather_data.sevenHourlyData.WindSpeeds[i] ?? '--';
        const hum = weather_data.sevenHourlyData.Humidities[i] ?? '--';
        const precip = weather_data.sevenHourlyData.Precips[i] ?? '--';
        const pres = weather_data.sevenHourlyData.Pressures[i] ?? '--';
        const clouds = weather_data.sevenHourlyData.Clouds[i] ?? '--';
        const dew = weather_data.sevenHourlyData.Dews[i] ?? '--';

        const pTemp = card.querySelector('#pTemp');
        const pText = card.querySelector('#pText');
        const pHumidity = card.querySelector('#pHumidity');
        const pPrecip = card.querySelector('#pPrecip');
        const pPressure = card.querySelector('#pPressure');
        const pClouds = card.querySelector('#pClouds');
        const pDew = card.querySelector('#pDew');
        const pWindDir = card.querySelector('#pWindDir');
        const pWindLv = card.querySelector('#pWindLv');
        const pWindSpeed = card.querySelector('#pWindSpeed');
        const pIconImg = card.querySelector('#pIconImg');

        if (pTemp) pTemp.textContent = `${temp}${globalT('weather_tooltip_unit_degree')}`;
        if (pText) pText.textContent = text;
        if (pHumidity) pHumidity.textContent = `${hum}${globalT('weather_tooltip_unit_percent')}`;
        if (pPrecip) pPrecip.textContent = `${pop} / ${precip}${globalT('weather_tooltip_unit_mm')}`;
        if (pPressure) pPressure.textContent = `${pres}${globalT('weather_tooltip_unit_hpa')}`;
        if (pClouds) pClouds.textContent = `${clouds}${globalT('weather_tooltip_unit_percent')}`;
        if (pDew) pDew.textContent = `${dew}${globalT('weather_tooltip_unit_degree')}`;
        if (pWindDir)
            pWindDir.textContent = `${wind} / ${wind360}${globalT('weather_tooltip_unit_degree')}`;
        if (pWindLv) pWindLv.textContent = windLv;
        if (pWindSpeed) pWindSpeed.textContent = `${windSp} ${globalT('weather_tooltip_unit_ms')}`;

        getIconSvg(iconSvgPath(icon, true)).then(svg => {
            if (pIconImg) pIconImg.innerHTML = svg;
        });

        tooltip.style.display = 'block';
        tooltip.classList.add('show');
    });

    element.addEventListener('mousemove', e => {
        positionTooltip(tooltip, e as MouseEvent);
    });

    element.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
        hideTooltipAfter(tooltip, TOOLTIP_HIDE_DELAY_MS);
    });
}
