import type { SevenHourlyData } from '../types';

/**
 * 城市查找响应 (和风天气)
 */
export interface QWeatherCityResponse {
    location: Array<{
        id: string;
        name: string;
        lat: string;
        lon: string;
    }>;
}

/**
 * 和风天气 - 实时天气响应
 */
export interface QWeatherNowResponse {
    updateTime: string;
    now: {
        temp: string;
        feelsLike: string;
        text: string;
        windDir: string;
        windScale: string;
        windSpeed: string;
        humidity: string;
        precip: string;
        cloud: string;
        vis: string;
        dew: string;
        pressure: string;
        icon: string;
    };
}

/**
 * 和风天气 - 24小时预报响应
 */
export interface QWeather24hResponse {
    updateTime: string;
    hourly: Array<{
        fxTime: string;
        temp: string;
        icon: string;
        text: string;
        wind360: string;
        windDir: string;
        windScale: string;
        windSpeed: string;
        humidity: string;
        precip: string;
        pressure: string;
        cloud: string;
        dew: string;
        pop?: string;
    }>;
}

/**
 * 和风天气 - 3天预报响应
 */
export interface QWeather3dResponse {
    daily: Array<{
        tempMax: string;
        tempMin: string;
        feelsLikeMax?: string;
        feelsLikeMin?: string;
        sunrise: string;
        sunset: string;
        moonPhase: string;
        uvIndex: string;
    }>;
}

/**
 * 和风天气 - 空气质量响应
 */
export interface QWeatherAirResponse {
    days?: Array<{
        indexes?: Array<{
            name?: string;
            code?: string;
            aqi?: string | number;
            aqiDisplay?: string;
        }>;
    }>;
    metadata?: {
        attributions?: Array<{ name?: string }>;
    };
}

/**
 * 和风天气 - 预警响应
 */
export interface QWeatherAlertResponse {
    alerts?: Array<{
        id: string;
        eventType?: { name?: string };
        headline?: string;
        onsetTime?: string;
        expireTime?: string;
        severity?: string;
        urgency?: string;
        color?: { red: number; green: number; blue: number };
        senderName?: string;
        description?: string;
        instruction?: string;
        criteria?: string;
        icon?: string;
        messageType?: { code?: string };
    }>;
    metadata?: {
        attributions?: Array<{ name?: string; source?: string }>;
    };
}

/**
 * 初始化七小时数据结构
 */
export function initSevenHourlyData(): SevenHourlyData {
    return {
        updateTime: '',
        Times: ['--:--', '--:--', '--:--', '--:--', '--:--', '--:--', '--:--'],
        Pops: ['——', '——', '——', '——', '——', '——', '——'],
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
        preciptype: [],
    };
}
