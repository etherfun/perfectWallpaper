/**
 * 闄嶆按/娓╁害鍒囨崲閫昏緫
 * 鑱岃矗锛氬鐞嗛檷姘存鐜囧拰娓╁害鏄剧ず鐨勫畾鏃跺垏鎹㈠強鍔ㄧ敾
 */

import { useConfigStore } from '@/stores/config';
import { globalT } from '@/utils/i18n';

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

const config = useConfigStore();

/**
 * 鍒囨崲闄嶆按/娓╁害鏄剧ず
 */
export function togglePrecipTemperatureDisplay(): void {
    // 妫€鏌ユ暟鎹槸鍚﹀彲鐢?
    if (!weather_data.sevenHourlyData) return;

    // 闃叉鍔ㄧ敾鏈熼棿閲嶅鍒囨崲
    if (isAnimatingPrecipToggle) return;
    setIsAnimatingPrecipToggle(true);

    // 鍒囨崲鏄剧ず鐘舵€?
    toggleShowTemperatureInsteadOfPrecip();

    // 鏇存柊鏍囩锛堝甫鍔ㄧ敾锛?
    const labelElement = document.querySelector('.precip-label');
    if (labelElement) {
        const label = showTemperatureInsteadOfPrecip
            ? globalT('weather_show_temperature')
            : globalT('weather_show_precipprob');

        // 娣诲姞鍔ㄧ敾绫?
        labelElement.classList.add('animate');

        // 鏇存柊鏍囩鍐呭
        labelElement.textContent = label;
        labelElement.setAttribute(
            'data-display-type',
            showTemperatureInsteadOfPrecip ? 'temperature' : 'precipitation'
        );

        // 绉婚櫎鍔ㄧ敾绫?
        setTimeout(() => {
            labelElement.classList.remove('animate');
        }, 300);
    }

    // 鏇存柊鏁板€硷紙甯﹀姩鐢伙級
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

        // 绗簩姝ワ細绛夊緟娣″嚭鍔ㄧ敾瀹屾垚鍚庢洿鏂板唴瀹瑰苟娣诲姞娣″叆鍔ㄧ敾
        setTimeout(() => {
            valueCells.forEach((cell, index) => {
                const value = dataValues[index] || '--';
                cell.textContent = `${value}${unit}`;

                // 绉婚櫎娣″嚭绫伙紝娣诲姞娣″叆绫?
                cell.classList.remove('fade-out');
                cell.classList.add('fade-in');

                // 娣″叆鍔ㄧ敾瀹屾垚鍚庣Щ闄ゆ贰鍏ョ被
                setTimeout(() => {
                    cell.classList.remove('fade-in');
                }, 300);
            });

            // 鍔ㄧ敾瀹屾垚鍚庨噸缃爣蹇?
            setTimeout(() => {
                setIsAnimatingPrecipToggle(false);
            }, 350);
        }, 150); // 绛夊緟娣″嚭鍔ㄧ敾鐨勪竴鍗婃椂闂?
    } else {
        // 濡傛灉娌℃湁鎵惧埌鍗曞厓鏍硷紝涔熼噸缃爣蹇?
        setTimeout(() => {
            setIsAnimatingPrecipToggle(false);
        }, 100);
    }
}

/**
 * 鍚姩闄嶆按/娓╁害杞崲瀹氭椂鍣?
 */
export function startPrecipTemperatureToggleTimer(): void {
    // 娓呴櫎宸叉湁瀹氭椂鍣?
    clearPrecipTimer();

    // 浠呭綋鏈夐檷姘磋鏃跺惎鍔ㄥ畾鏃跺櫒锛坵eather_api_choose 涓?1, 4, 5锛?
    if ([1, 4, 5].includes(config.weather_api_choose ?? 0)) {
        // 姣?0绉掑垏鎹竴娆℃樉绀?
        setPrecipTemperatureToggleTimer(window.setInterval(togglePrecipTemperatureDisplay, 20000));
    }
}

/**
 * 娓呴櫎闄嶆按/娓╁害杞崲瀹氭椂鍣?
 */
export function clearPrecipTemperatureToggleTimer(): void {
    clearPrecipTimer();
}
