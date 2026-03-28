/**
 * Weather API Base Interface
 * Common interface for all weather API implementations
 */

import type { WeatherAddress, WeatherData } from '../types';

/**
 * Weather API handler interface
 * All weather API implementations should conform to this interface
 */
export interface WeatherAPIHandler {
    /**
     * Fetch weather data and populate the weather_data object
     * @param weather_address - Object containing city/location information
     * @param weather_data - Object to populate with weather information
     */
    (weather_address: WeatherAddress, weather_data: WeatherData): Promise<void>;
}

/**
 * Check if an API supports hourly forecast data
 */
export function supportsHourlyForecast(apiNumber: number): boolean {
    return [1, 4, 5].includes(apiNumber);
}

/**
 * Check if an API supports air quality data
 */
export function supportsAirQuality(apiNumber: number): boolean {
    return [1, 3].includes(apiNumber);
}
