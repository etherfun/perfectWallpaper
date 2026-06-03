export const weatherDefaults = {
    weather_api_choose: null as number | null,
    citynumber: '',
    weather_updata: 3,
    weather_unit: 'metric',
    weather_lang: 'en',
    qweather_api_paymode: false,

    city_key: '',
    api_host: '',
    visual_crossing_key: '',
    weather_app_id: '',
    weather_app_secret: '',

    weather_color: [255, 255, 255] as [number, number, number],
    weather_blurcolor_show: false,
    weather_blurcolor: [255, 255, 255] as [number, number, number],
    weather_yakeli_show: false,
    weather_yakelic_color: [255, 255, 255] as [number, number, number],
    weather_yakeli: 0,
    weather_bluryakeli: 10,
    weather_daily_tip: false,

    weather_latitude: '',
    weather_longitude: '',
    weather_city_text: '',
    weather_timetransparency: 80,
    weather_roundedcorners: 10,
    weather_size: 100,
    weather_showwidth: 0,
    weather_x: 50,
    weather_y: 50,
};

export type WeatherDefaults = typeof weatherDefaults;
