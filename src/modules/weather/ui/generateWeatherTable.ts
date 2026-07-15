/**
 * 天气表格 UI 生成
 * 职责：协调所有 UI 更新函数
 */

import { tooltip } from '../tooltip';
import { weather_data } from '../weatherState';
import { startPrecipTemperatureToggleTimer } from './precipToggle';
import { hideWeatherLoading, showWeatherLoading } from './states';
import {
    updateAirQualityAndAlerts,
    updateMainWeatherDisplay,
    updatePrecipContainer,
    updateTipDisplay,
    updateWeatherDetails,
    updateWeatherExtendedInfo,
} from './updaters';

/**
 * 生成天气表格UI
 */
export async function generateWeatherTable(): Promise<void> {
    if (weather_data.temperature === '' && weather_data.weathernow === '') {
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
