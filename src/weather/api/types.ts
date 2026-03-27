import type { WeatherAddress, WeatherData, SevenHourlyData } from '../../types/weather';

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
 * Open-Meteo 天气代码到和风天气图标的映射
 */
export const OPEN_METEO_TO_QWEATHER: { [key: number]: { day: number; night: number } } = {
    // 晴 (0)
    0: { day: 100, night: 150 },

    // 多云 (1, 2, 3)
    1: { day: 101, night: 151 },
    2: { day: 101, night: 151 },
    3: { day: 101, night: 151 },

    // 雾 (45, 48)
    45: { day: 501, night: 501 },
    48: { day: 501, night: 501 },

    // 毛毛雨 (51, 53, 55)
    51: { day: 300, night: 350 },
    53: { day: 300, night: 350 },
    55: { day: 300, night: 350 },

    // 冰冻毛毛雨 (56, 57)
    56: { day: 399, night: 399 },
    57: { day: 399, night: 399 },

    // 雨 (61, 63, 65)
    61: { day: 302, night: 302 },
    63: { day: 302, night: 302 },
    65: { day: 302, night: 302 },

    // 冻雨 (67)
    67: { day: 399, night: 399 },

    // 雪 (71, 73, 75)
    71: { day: 407, night: 457 },
    73: { day: 407, night: 457 },
    75: { day: 407, night: 457 },

    // 冰雹 (77)
    77: { day: 499, night: 499 },

    // 阵雨 (80, 81, 82)
    80: { day: 302, night: 302 },
    81: { day: 302, night: 302 },
    82: { day: 302, night: 302 },

    // 阵雪 (85, 86)
    85: { day: 407, night: 457 },
    86: { day: 407, night: 457 },

    // 雷暴 (95, 96, 99)
    95: { day: 302, night: 302 },
    96: { day: 302, night: 302 },
    99: { day: 302, night: 302 }
};

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
        preciptype: []
    };
}
