// 扩展全局 weather_data 类型
export interface WeatherAddress {
    checkcity: string;
    cityname: string;
    citynumber: string;
    latitude: string;
    longitude: string;
}

export interface SevenHourlyData {
    updateTime: string;
    Times: string[];
    Pops: string[];
    Temps: string[];
    Icons: string[];
    Texts: string[];
    Wind360s: string[];
    Winds: string[];
    WindLvs: string[];
    WindSpeeds: string[];
    Humidities: string[];
    Precips: string[];
    Pressures: string[];
    Clouds: string[];
    Dews: string[];
    preciptype: string[];
}

export interface WeatherAlert {
    alert: string;
    title: string;
    id: string;
    releaseTime: Date;
    startTime: Date;
    endTime: Date;
    level: string;
    urgency: string;
    color: string;
    sender: string;
    description: string;
    instruction: string;
    criteria: string;
    source: string;
    icon: string;
    status: string;
}

export interface WeatherData {
    cityname?: string;
    updateTime: string;
    icon: string;
    temperature: string;
    feels: string;
    weathernow: string;
    windSpeed: string;
    humidity: string;
    temperature_max: string;
    temperature_min: string;
    feels_max: string;
    feels_min: string;
    wind: string;
    precip: string;
    precipcover: string;
    precipprob: string;
    snow: string;
    snowdepth: string;
    preciptype: string;
    windgust: string;
    visibility: string;
    solarradiation: string;
    uvindex: string;
    sunrise: string;
    sunset: string;
    moonphase: string;
    cloud: string;
    vis: string;
    dew: string;
    pressure: string;
    rangefeelstemperature: string;
    rangetemperature: string;
    obstime: string;
    windLv: string;
    air: string;
    rain?: string;
    weatherAlert: WeatherAlert[];
    weatherAlertColor: string;
    sevenHourlyData: SevenHourlyData;
    hourlyData?: unknown;
    dailyData?: unknown;
}

export interface WeatherUnit {
    temp: string;
    precip: string;
    precip_1: string;
    snow: string;
    snow_1: string;
    wind: string;
    vis: string;
    pressure: string;
    solarradiation: string;
    temperature_code: string;
    wind_speed_code: string;
    precipitation_code: string;
}

export interface WeatherLang {
    datetime: string;
    humidity: string;
    rangetemperature: string;
    feelstemperature: string;
    rangefeelstemperature: string;
    precip: string;
    precipcover: string;
    precipprob: string;
    preciptype: string;
    snow: string;
    snowdepth: string;
    windgust: string;
    windSpeed: string;
    vis: string;
    solarradiation: string;
    uvindex: string;
    sunriseset: string;
    moonphase: string;
    cloud: string;
    dewtemperature: string;
    pressure: string;
}

export interface WeatherTip {
    priority: number;
    text: string;
}

// Visual Crossing icon → 和风天气 icon映射
export const VC_ICON_TO_QWEATHER: Record<string, { day: number; night: number }> = {
    // ===== 晴 / 多云 =====
    'clear-day': { day: 100, night: 150 },
    'clear-night': { day: 100, night: 150 },

    'partly-cloudy-day': { day: 101, night: 151 },
    'partly-cloudy-night': { day: 101, night: 151 },

    cloudy: { day: 101, night: 151 },

    // ===== 雨 =====
    rain: { day: 399, night: 399 },
    'showers-day': { day: 300, night: 350 },
    'showers-night': { day: 300, night: 350 },

    // ===== 雷雨 =====
    'thunder-rain': { day: 302, night: 302 },
    'thunder-showers-day': { day: 302, night: 302 },
    'thunder-showers-night': { day: 302, night: 302 },

    // ===== 雪 =====
    snow: { day: 499, night: 499 },
    'snow-showers-day': { day: 407, night: 457 },
    'snow-showers-night': { day: 407, night: 457 },

    // ===== 雾 =====
    fog: { day: 501, night: 501 },

    // ===== 风（无昼夜图标，兜底）=====
    wind: { day: 101, night: 151 },
};

// Open-Meteo 天气代码 → 和风天气 icon映射
export const OPEN_METEO_TO_QWEATHER: Record<number, { day: number; night: number }> = {
    0: { day: 100, night: 150 },
    1: { day: 101, night: 151 },
    2: { day: 101, night: 151 },
    3: { day: 101, night: 151 },
    45: { day: 501, night: 501 },
    48: { day: 501, night: 501 },
    51: { day: 300, night: 350 },
    53: { day: 300, night: 350 },
    55: { day: 300, night: 350 },
    56: { day: 399, night: 399 },
    57: { day: 399, night: 399 },
    61: { day: 302, night: 302 },
    63: { day: 302, night: 302 },
    65: { day: 302, night: 302 },
    67: { day: 399, night: 399 },
    71: { day: 407, night: 457 },
    73: { day: 407, night: 457 },
    75: { day: 407, night: 457 },
    77: { day: 499, night: 499 },
    80: { day: 302, night: 302 },
    81: { day: 302, night: 302 },
    82: { day: 302, night: 302 },
    85: { day: 407, night: 457 },
    86: { day: 407, night: 457 },
    95: { day: 302, night: 302 },
    96: { day: 302, night: 302 },
    99: { day: 302, night: 302 },
};
