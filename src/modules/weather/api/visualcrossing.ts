import type { WeatherAddress, WeatherData } from '../../../../types/weather';
import { fetch_with_retry, isNightTime, getQWeatherIcon } from '../../../utils/tool';
import { i18n } from '../../../utils/i18n';
import { appConfig } from '../../../utils/config';

interface VisualCrossingHour {
  datetime: string;
  temp: string;
  feelslike: string;
  humidity: string;
  dew: string;
  precip: string;
  precipprob: string;
  preciptype: string | string[];
  pressure: string;
  winddir: number;
  windspeed: string;
  windgust: string;
  cloudcover: string;
  conditions: string;
  icon: string;
}

interface VisualCrossingDay {
  tempmax: string;
  tempmin: string;
  feelslikemax: string;
  feelslikemin: string;
  sunrise: string;
  sunset: string;
  moonphase: number;
  cloudcover: number;
  hours: VisualCrossingHour[];
}

interface VisualCrossingCurrentConditions {
  datetime: string;
  temp: string;
  feelslike: string;
  humidity: string;
  dew: string;
  precip: string;
  precipcover: string;
  precipprob: string;
  preciptype: string | string[];
  pressure: string;
  winddir: number;
  windspeed: string;
  windgust: string;
  visibility: string;
  solarradiation: string;
  uvindex: string;
  conditions: string;
  icon: string;
  snow?: string;
  snowdepth?: string;
}

interface VisualCrossingResponse {
  resolvedAddress: string;
  currentConditions: VisualCrossingCurrentConditions;
  days: VisualCrossingDay[];
}

const DIRECTIONS = [
  "weather_wind_north",
  "weather_wind_northeast",
  "weather_wind_east",
  "weather_wind_southeast",
  "weather_wind_south",
  "weather_wind_southwest",
  "weather_wind_west",
  "weather_wind_northwest"
];

const MOON_PHASE_KEYS = [
  "weather_moonphase_new_moon",
  "weather_moonphase_waxing_crescent",
  "weather_moonphase_first_quarter",
  "weather_moonphase_waxing_gibbous",
  "weather_moonphase_full_moon",
  "weather_moonphase_waning_gibbous",
  "weather_moonphase_last_quarter",
  "weather_moonphase_waning_crescent"
];

/**
 * 获取接下来7小时的数据
 */
function getNext7Hours(res: VisualCrossingResponse): VisualCrossingHour[] {
  const now = new Date();
  const endTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  const allHours: VisualCrossingHour[] = [
    ...res.days[0].hours,
    ...(res.days[1]?.hours || [])
  ];

  return allHours.filter(h => {
    const [hh, mm, ss] = h.datetime.split(":").map(Number);

    const hourDate = new Date(now);
    hourDate.setHours(hh, mm, ss || 0, 0);

    if (hourDate < now) {
      hourDate.setDate(hourDate.getDate() + 1);
    }

    return hourDate > now && hourDate <= endTime;
  });
}

/**
 * Visual Crossing API 实现
 * Case 4: Visual Crossing
 */
export async function visualcrossing(
  weather_address: WeatherAddress,
  weather_data: WeatherData
): Promise<void> {
  const nowDate = Math.floor(Date.now() / 1000);
  const sevenDate = nowDate + 7 * 24 * 60 * 60;

  const response = await fetch_with_retry(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(weather_address.cityname)}/${nowDate}/${sevenDate}?unitGroup=${appConfig.getWeatherUnit()}&key=${appConfig.getVisualCrossingKey()}&contentType=json&lang=id`,
    {},
    3
  );
  const res: VisualCrossingResponse = await response.json();

  const resNow = res.currentConditions;
  const resHourly = getNext7Hours(res);
  const resDaily = res.days;

  weather_address.cityname = res.resolvedAddress.split(",")[0];

  weather_data.updateTime = resNow.datetime;
  weather_data.windSpeed = resNow.windspeed;
  weather_data.humidity = resNow.humidity;
  weather_data.temperature = resNow.temp;
  weather_data.temperature_max = resDaily[0].tempmax;
  weather_data.temperature_min = resDaily[0].tempmin;
  weather_data.feels = resNow.feelslike;
  weather_data.feels_max = resDaily[0].feelslikemax;
  weather_data.feels_min = resDaily[0].feelslikemin;
  weather_data.weathernow = resNow.conditions
    .split(",")
    .map(c => c.trim())
    .map(c => i18n(`weather_visualcrossing_${c}`))
    .join(" <br/> ");
  weather_data.preciptype = Array.isArray(resNow.preciptype) ? resNow.preciptype.join(",") : resNow.preciptype || "";
  weather_data.precipcover = resNow.precipcover;
  weather_data.precipprob = resNow.precipprob;
  weather_data.precip = resNow.precip;
  weather_data.snow = resNow.snow || "";
  weather_data.snowdepth = resNow.snowdepth || "";
  weather_data.windgust = resNow.windgust;
  weather_data.visibility = resNow.visibility;
  weather_data.solarradiation = resNow.solarradiation;
  weather_data.uvindex = resNow.uvindex;
  weather_data.sunrise = resDaily[0].sunrise;
  weather_data.sunset = resDaily[0].sunset;
  weather_data.cloud = resDaily[0].cloudcover.toString();
  weather_data.dew = resNow.dew;
  weather_data.pressure = resNow.pressure;
  weather_data.icon = getQWeatherIcon(
    resNow.icon,
    isNightTime(new Date().toTimeString().split(" ")[0], resDaily[0].sunrise, resDaily[0].sunset)
  ).toString();

  // 风向
  {
    const index = Math.floor((resNow.winddir + 22.5) / 45) % 8;
    weather_data.wind = i18n(DIRECTIONS[index] ?? "weather_no_data");
  }

  // 月相
  {
    const index = Math.floor((resDaily[0].moonphase + 0.0625) * 8) % 8;
    weather_data.moonphase = i18n(MOON_PHASE_KEYS[index] ?? "weather_no_data");
  }

  // 七小时预报
  weather_data.sevenHourlyData.Times = resHourly.map(hour => hour.datetime.slice(0, 5));
  weather_data.sevenHourlyData.Clouds = resHourly.map(hour => hour.cloudcover);
  weather_data.sevenHourlyData.Dews = resHourly.map(hour => hour.dew);
  weather_data.sevenHourlyData.Humidities = resHourly.map(hour => hour.humidity);
  weather_data.sevenHourlyData.Icons = resHourly.map(hour => {
    const isNight = isNightTime(hour.datetime, resDaily[0].sunrise, resDaily[0].sunset);
    return getQWeatherIcon(hour.icon, isNight).toString();
  });
  weather_data.sevenHourlyData.Pops = resHourly.map(hour => `${hour.precipprob}%`);
  weather_data.sevenHourlyData.Precips = resHourly.map(hour => hour.precip);
  weather_data.sevenHourlyData.Pressures = resHourly.map(hour => hour.pressure);
  weather_data.sevenHourlyData.Temps = resHourly.map(hour => hour.temp);
  weather_data.sevenHourlyData.Texts = resHourly.map(hour => {
    if (!hour.conditions) return "";
    return hour.conditions
      .split(",")
      .map(c => c.trim())
      .map(c => i18n(`weather_visualcrossing_${c}`))
      .join(" <br/> ");
  });
  weather_data.sevenHourlyData.Wind360s = resHourly.map(hour => hour.winddir.toString());
  weather_data.sevenHourlyData.WindSpeeds = resHourly.map(hour => hour.windspeed);
  weather_data.sevenHourlyData.Winds = resHourly.map(hour => {
    const index = Math.floor((hour.winddir + 22.5) / 45) % 8;
    return i18n(DIRECTIONS[index] ?? "weather_no_data");
  });
  weather_data.sevenHourlyData.preciptype = resHourly.map(hour => Array.isArray(hour.preciptype) ? hour.preciptype.join(",") : hour.preciptype || "");
  weather_data.sevenHourlyData.Times = resHourly.map(hour => hour.datetime.slice(0, 5));
  weather_data.sevenHourlyData.Wind360s = resHourly.map(hour => hour.winddir.toString());
  weather_data.sevenHourlyData.WindSpeeds = resHourly.map(hour => hour.windspeed);
  weather_data.sevenHourlyData.Winds = resHourly.map(hour => {
    const index = Math.floor((hour.winddir + 22.5) / 45) % 8;
    return i18n(DIRECTIONS[index] ?? "weather_no_data");
  });
  weather_data.sevenHourlyData.preciptype = resHourly.map(hour =>
    Array.isArray(hour.preciptype) ? hour.preciptype.join(",") : (hour.preciptype || "")
  );
}

export default visualcrossing;
