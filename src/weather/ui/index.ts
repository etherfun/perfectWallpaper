/**
 * UI 模块统一导出
 */

export { showWeatherLoading, hideWeatherLoading, showWeatherError } from './states';
export { togglePrecipTemperatureDisplay, startPrecipTemperatureToggleTimer, clearPrecipTemperatureToggleTimer } from './precipToggle';
export {
    updateMainWeatherDisplay,
    updateWeatherDetails,
    updateWeatherExtendedInfo,
    updateAirQualityAndAlerts,
    updatePrecipContainer,
    updateTipDisplay,
} from './updaters';

export { generateWeatherTable } from './generateWeatherTable';
