/**
 * 涓冨皬鏃堕鎶?Tooltip
 * 鑱岃矗锛氱粦瀹氫竷灏忔椂棰勬姤鎮仠鎻愮ず
 */

import { globalT } from '@/utils/i18n';

import { getIconSvg } from '../index';
import { weather_data } from '../weatherState';

/**
 * 缁戝畾涓冨皬鏃堕鎶ユ偓鍋滄彁绀?
 */
export function attachSevenHourlyTooltip(element: HTMLElement, hourIndex: number): void {
    const tooltip = document.querySelector('#weatherHourlyTooltip') as HTMLElement | null;
    const card = tooltip?.querySelector('.popup-main') as HTMLElement | null;
    if (!tooltip || !card) return;

    element.addEventListener('mouseenter', () => {
        const i = hourIndex;
        const pop = weather_data.sevenHourlyData.Pops[i] ?? '--';
        const temp = weather_data.sevenHourlyData.Temps[i] ?? '--';
        const icon = weather_data.sevenHourlyData.Icons[i] ?? '999';
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

        getIconSvg(`src/source/QWeather-Icons/icons/${icon}-fill.svg`).then(svg => {
            if (pIconImg) pIconImg.innerHTML = svg;
        });

        tooltip.style.display = 'block';
        tooltip.classList.add('show');
    });

    element.addEventListener('mousemove', e => {
        const mouseEvent = e as MouseEvent;
        const tipWidth = tooltip.offsetWidth;
        const tipHeight = tooltip.offsetHeight;

        let left = mouseEvent.clientX + 20;
        let top = mouseEvent.clientY + 20;

        if (left + tipWidth > window.innerWidth - 20) left = mouseEvent.clientX - tipWidth - 20;
        if (top + tipHeight > window.innerHeight - 20) top = mouseEvent.clientY - tipHeight - 20;

        if (left < 20) left = 20;
        if (top < 20) top = 20;

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    });

    element.addEventListener('mouseleave', () => {
        tooltip.classList.remove('show');
        setTimeout(() => {
            if (!tooltip.classList.contains('show')) {
                tooltip.style.display = 'none';
            }
        }, 200);
    });
}
