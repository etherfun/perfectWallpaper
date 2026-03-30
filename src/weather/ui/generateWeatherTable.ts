/**
 * 天气表格 UI 生成
 * 职责：协调所有 UI 更新函数
 */

import { weather_data } from '../weatherState';
import { showWeatherLoading, hideWeatherLoading } from './states';
import {
    updateMainWeatherDisplay,
    updateWeatherDetails,
    updateWeatherExtendedInfo,
    updateAirQualityAndAlerts,
    updatePrecipContainer,
    updateTipDisplay,
} from './updaters';
import { startPrecipTemperatureToggleTimer } from './precipToggle';
import { tooltip } from '../tooltip';

/**
 * 生成天气表格UI
 */
export async function generateWeatherTable(): Promise<void> {
    if (weather_data.temperature === "" && weather_data.weathernow === "") {
        showWeatherLoading();
        return;
    }

    hideWeatherLoading();
    await updateMainWeatherDisplay();
    updateWeatherDetails();
    updateWeatherExtendedInfo();
    updateAirQualityAndAlerts();
    updatePrecipContainer();
    updateTipDisplay();
    tooltip();
    startPrecipTemperatureToggleTimer();
}
