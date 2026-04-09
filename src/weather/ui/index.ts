/**
 * UI 模块统一导出
 */

export { generateWeatherTable } from './generateWeatherTable';
export {
    clearPrecipTemperatureToggleTimer,
    startPrecipTemperatureToggleTimer,
    togglePrecipTemperatureDisplay,
} from './precipToggle';
export { hideWeatherLoading, showWeatherError, showWeatherLoading } from './states';
export {
    updateAirQualityAndAlerts,
    updateMainWeatherDisplay,
    updatePrecipContainer,
    updateTipDisplay,
    updateWeatherDetails,
    updateWeatherExtendedInfo,
} from './updaters';
