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
    weatherAlert: any[];
    weatherAlertColor: string;
    sevenHourlyData: SevenHourlyData;
    hourlyData?: any;
    dailyData?: any;
}

export interface WeatherUnit {
    temp?: string;
    wind?: string;
    vis?: string;
    precip?: string;
    precip_1?: string;
    snow?: string;
    snow_1?: string;
    pressure?: string;
    solarradiation?: string;
    temperature_code?: string;
    wind_speed_code?: string;
    precipitation_code?: string;
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