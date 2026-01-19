var weather = document.querySelector("#weather");

let wunit = {}
let wlang = {}
let weather_address = {
    checkcity: "",
    cityname: "",
    citynumber: "",
    latitude: "",
    longitude: ""
}

const weather_data = {
    updateTime: "",
    icon: "",
    temperature: "",
    feels: "",
    weathernow: "",
    windSpeed: "",
    humidity: "",
    temperature_max: "",
    temperature_min: "",
    feels_max: "",
    feels_min: "",
    wind: "",
    precip: "",
    precipcover: "",
    precipprob: "",
    snow: "",
    snowdepth: "",
    preciptype: "",
    windgust: "",
    visibility: "",
    solarradiation: "",
    uvindex: "",
    sunrise: "",
    sunset: "",
    moonphase: "",
    cloud: "",
    vis: "",
    dew: "",
    pressure: "",
    rangefeelstemperature: "",
    rangetemperature: "",
    obstime: "",
    windLv: "",
    air: "",
    weatherAlert: "",
    weatherAlertColor: "",
    sevenHourlyData: {
        updateTime: "",
        Times: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
        Pops: ["0%", "0%", "0%", "0%", "0%", "0%", "0%"],
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
    }
}

function weather_unit_choose() {
    switch (weather_unit) {
        case "metric":
            wunit = {
                temp: "℃",
                precip: "mm",
                precip_1: "mm/h",
                snow: "cm",
                snow_1: "cm/h",
                wind: "km/h",
                vis: "km",
                pressure: "hPa",
                solarradiation: "w/m²",
                temperature_code: "celsius",
                wind_speed_code: "kmh",
                precipitation_code: "mm"
            }
            break
        case "us":
            wunit = {
                temp: "℉",
                precip: "in",
                precip: "in/h",
                snow: "in",
                snow_1: "in/h",
                wind: "mi/h",
                vis: "mi",
                pressure: "mb",
                solarradiation: "w/m²",
                temperature_code: "fahrenheit",
                wind_speed_code: "mph",
                precipitation_code: "inch"
            }
            break
        case "uk":
            wunit = {
                temp: "℃",
                precip: "mm",
                precip_1: "mm/h",
                snow: "cm",
                snow_1: "cm/h",
                wind: "mi/h",
                vis: "mi",
                pressure: "mb",
                solarradiation: "w/m²",
                temperature_code: "celsius",
                wind_speed_code: "kmh",
                precipitation_code: "mm"
            }
            break
        case "base":
            wunit = {
                temp: "K",
                precip: "mm",
                precip_1: "mm/h",
                snow: "cm",
                snow_1: "cm/h",
                wind: "m/s",
                vis: "km",
                pressure: "mb",
                solarradiation: "w/m²"
            }
            break
    }
}
function weather_lang_choose() {
    // 使用i18n获取多语言文本
    wlang = {
        datetime: i18n('weather_datetime'),
        humidity: i18n('weather_humidity'),
        rangetemperature: i18n('weather_rangetemperature'),
        feelstemperature: i18n('weather_feelstemperature'),
        rangefeelstemperature: i18n('weather_rangefeelstemperature'),
        precip: i18n('weather_precip'),
        precipcover: i18n('weather_precipcover'),
        precipprob: i18n('weather_precipprob'),
        preciptype: i18n('weather_preciptype'),
        snow: i18n('weather_snow'),
        snowdepth: i18n('weather_snowdepth'),
        windgust: i18n('weather_windgust'),
        windSpeed: i18n('weather_windSpeed'),
        vis: i18n('weather_vis'),
        solarradiation: i18n('weather_solarradiation'),
        uvindex: i18n('weather_uvindex'),
        sunriseset: i18n('weather_sunriseset'),
        moonphase: i18n('weather_moonphase'),
        cloud: i18n('weather_cloud'),
        dewtemperature: i18n('weather_dewtemperature'),
        pressure: i18n('weather_pressure')
    }
}

async function weather_init() {
    if (weather_address.cityname == "") {
        $.get("http://i.tianqi.com/index.php?c=code&id=11", function (citydata) {

            weather_address.cityname = citydata.split("</strong>")[1].split(" ")[0];
        })
    }

    switch (weather_api_choose) {
        case 1://和风天气API
            if (!qweatherapi_paymode && weather_paymode()) {
                return;
            }

            if (weather_address.citynumber == "" || weather_address.cityname != weather_address.checkcity) {
                weather_address.checkcity = weather_address.cityname
                fetch_with_retry(`https://${APIHost}/geo//v2/city/lookup?location=${weather_address.cityname}`, {
                    method: 'GET',
                    headers: {
                        'X-QW-Api-Key': CityKey,
                    }
                },
                    3
                )
                    .then(response => {
                        return response.json();
                    })
                    .then(data => {
                        weather_address.citynumber = data.location[0].id
                        weather_address.cityname = data.location[0].name

                        weather_address.latitude = data.location[0].lat;
                        weather_address.longitude = data.location[0].lon;

                        getWeather_input_qweatherapi(weather_address.citynumber);
                    })
            } else {
                getWeather_input_qweatherapi(weather_address.citynumber);
            }
            break
        case 2://免费天气API
            fetch_with_retry("https://api.icufree.com/weather.php?cityname=" + weather_address.cityname, {}, 3)
                .then(response => response.json())
                .then(res => {
                    weather_address.cityname = res.cityname;
                    weather_data.temperature = res.feels;
                    weather_data.weathernow = res.weathernow;
                    weather_data.wind = res.wind;
                    weather_data.windLv = res.windLv;
                    weather_data.highDaliyTemp = res.high;
                    weather_data.lowDaliyTemp = res.low;
                });
            weather.innerHTML = await generateWeatherTable();
            FristLoadWeather = false;
            break
        case 3://一刻天气API
            fetch_with_retry("https://v1.yiketianqi.com/free/day?appid=" + appid + "&appsecret=" + appsecret + "&unescape=1&city=" + weather_address.cityname, {}, 3)
                .then(response => response.json())
                .then(res => {
                    weather_data.cityname = res.city;
                    weather_data.temperature = res.tem;
                    weather_data.weathernow = res.wea;
                    weather_data.wind = res.win;
                    weather_data.windLv = res.win_speed;
                    weather_data.windSpeed = res.win_meter
                    weather_data.highDaliyTemp = res.tem_day;
                    weather_data.lowDaliyTemp = res.tem_night;
                    weather_data.air = res.air;
                    weather_data.pressure = res.pressure;
                    weather_data.humidity = res.humidity;

                });
            weather.innerHTML = generateWeatherTable();
            FristLoadWeather = false
            break
        case 4://Visual Crossing API
            getWeather_input_VisualCrossingAPI()
            weather.innerHTML = await generateWeatherTable();
            FristLoadWeather = false
            break
        case 5://Open-Meteo API
            getWeather_input_open_meteo()
            FristLoadWeather = false
            break
    }
}

function autoWeather() {
    weather_init();
    switch (weather_updata) {
        case 1:
            timerManager.create( autoWeather, 900000, 'updataWeather');
            break
        case 2:
            timerManager.create( autoWeather, 1200000, 'updataWeather');
            break
        case 3:
            timerManager.create( autoWeather, 1800000, 'updataWeather');
            break
        case 4:
            timerManager.create( autoWeather, 2700000, 'updataWeather');
            break
        case 6:
            timerManager.create( autoWeather, 3600000, 'updataWeather');
            break
    }
}

async function getWeather_input_qweatherapi(citynumber) {
    if (!qweatherapi_paymode && weather_paymode()) {
        return Promise.reject(new Error(i18n("error_get_weather_data_over_usage"))); // 中断链
    }

    // 第一步：获取实时天气
    fetch_with_retry(`https://${APIHost}/v7/weather/now?location=${citynumber}`,
        {
            method: 'GET',
            headers: {
                'X-QW-Api-Key': `${CityKey}`,
            }
        }
    )
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(async res => {
            weather_data.updateTime = res.updateTime;

            weather_data.windSpeed = res.now.windSpeed;
            weather_data.humidity = res.now.humidity;
            weather_data.temperature = res.now.temp;
            weather_data.feels = res.now.feelsLike;
            weather_data.weathernow = res.now.text;
            weather_data.wind = res.now.windDir;
            weather_data.windLv = res.now.windScale;
            weather_data.precip = res.now.precip;
            weather_data.cloud = res.now.cloud;
            weather_data.vis = res.now.vis;
            weather_data.dew = res.now.dew;
            weather_data.pressure = res.now.pressure;
            weather_data.icon = res.now.icon;

            // 第二步：获取空气质量信息
            if (!qweatherapi_paymode && weather_paymode()) {
                return Promise.reject(new Error(i18n("error_get_weather_data_over_usage"))); // 中断链
            }
            return fetch_with_retry(`https://${APIHost}/airquality/v1/daily/${weather_address.latitude}/${weather_address.longitude}`,
                {
                    method: 'GET',
                    headers: {
                        'X-QW-Api-Key': `${CityKey}`,
                    }
                }
            );
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Air Quality API response was not ok');
            }
            return response.json();
        })
        .then(async airData => {
            if (airData && airData.days && airData.days.length > 0) {
                const day = airData.days[0];
                if (day.indexes && day.indexes.length > 0) {
                    // 尝试多种可能的空气质量指数名称
                    const aqiIndex = day.indexes.find(index =>
                        index.name === "AQI (CN)" ||
                        index.name === "cn-mee" ||
                        index.name === "QAQI" ||
                        index.name === "空气质量指数" ||
                        index.code === "aqi" ||
                        index.code === "cn_mee"
                    );

                    if (aqiIndex) {
                        weather_data.air = aqiIndex.aqi || aqiIndex.aqiDisplay || i18n("weather_no_data");
                    } else {
                        const firstIndex = day.indexes[0];
                        weather_data.air = firstIndex.aqi || firstIndex.aqiDisplay || i18n("weather_no_data");
                    }
                } else {
                    weather_data.air = i18n("weather_no_data");
                }
            } else {
                weather_data.air = i18n("weather_no_data");
            }

            // 第三步：获取天气预警
            if (!qweatherapi_paymode && weather_paymode()) {
                return Promise.reject(new Error(i18n("error_get_weather_data_over_usage"))); // 中断链
            }
            return fetch_with_retry(`https://${APIHost}/weatheralert/v1/current/${weather_address.latitude}/${weather_address.longitude}`,
                {
                    method: 'GET',
                    headers: {
                        'X-QW-Api-Key': `${CityKey}`,
                    }
                }
            );
        })

        .then(response => {
            if (!response.ok) {
                throw new Error('Weather Alert API response was not ok');
            }
            return response.json();
        })
        .then(async alertData => {
            if (alertData && alertData.alerts && alertData.alerts.length > 0) {
                // 有预警信息
                const alert = alertData.alerts;
                weather_data.weatherAlert = alert.map(alertList => {
                    return {
                        alert: alertList.eventType.name,
                        title: alertList.headline,
                        id: alertList.id,
                        releaseTime: date = new Date(
                            parseInt(alertList.id.substring(0, 4)),    // 年
                            parseInt(alertList.id.substring(4, 6)) - 1, // 月
                            parseInt(alertList.id.substring(6, 8)),    // 日
                            parseInt(alertList.id.substring(8, 10)),   // 时
                            parseInt(alertList.id.substring(10, 12)),  // 分
                            parseInt(alertList.id.substring(12, 14))   // 秒
                        ),
                        startTime: new Date(alertList.onsetTime),
                        endTime: new Date(alertList.expireTime),
                        level: alertList.severity,
                        urgency: alertList.urgency,
                        color: `${alertList.color.red}, ${alertList.color.green}, ${alertList.color.blue}`,
                        sender: alertList.senderName,
                        description: alertList.description,
                        instruction: alertList.instruction,
                        criteria: alertList.criteria,
                        source: alertData.metadata.attributions[0],
                        icon: alertList.icon,
                        status: alertList.messageType.supersedes
                    }
                }); // 预警事件类型名称
            }

            // 第四步：获取逐小时降水概率预报
            if (!qweatherapi_paymode && weather_paymode()) {
                return Promise.reject(new Error(i18n("error_get_weather_data_over_usage"))); // 中断链
            }
            return fetch_with_retry(`https://${APIHost}/v7/weather/24h?location=${citynumber}`,
                {
                    method: 'GET',
                    headers: {
                        'X-QW-Api-Key': `${CityKey}`,
                    }
                }
            );
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Hourly Forecast API response was not ok');
            }
            return response.json();
        })
        .then(async hourlyData => {

            // 保存完整的24小时数据用于温度计算
            weather_data.hourlyData = hourlyData;

            // 提取接下来7小时的降水概率
            if (hourlyData && hourlyData.hourly && hourlyData.hourly.length > 0) {
                const sevenHourlyData = hourlyData.hourly.slice(0, 7);

                weather_data.sevenHourlyData.updateTime = hourlyData.updateTime;
                // 提取时间和降水概率
                weather_data.sevenHourlyData.Times = sevenHourlyData.map(hour => {
                    const timeStr = hour.fxTime;
                    return timeStr.split('T')[1].split('+')[0].substring(0, 5);
                });
                // 处理降水概率，如果为空显示"——"
                weather_data.sevenHourlyData.Pops = sevenHourlyData.map(hour => {
                    return hour.pop !== undefined && hour.pop !== "" ? `${hour.pop}%` : "——";
                });
                // 温度
                weather_data.sevenHourlyData.Temps = sevenHourlyData.map(hour => {
                    return hour.temp;
                });
                // 图标
                weather_data.sevenHourlyData.Icons = sevenHourlyData.map(hour => {
                    return hour.icon;
                });
                // 文本
                weather_data.sevenHourlyData.Texts = sevenHourlyData.map(hour => {
                    return hour.text;
                });
                // 风向角度
                weather_data.sevenHourlyData.Wind360s = sevenHourlyData.map(hour => {
                    return hour.wind360;
                });
                // 风向
                weather_data.sevenHourlyData.Winds = sevenHourlyData.map(hour => {
                    return hour.windDir;
                });
                // 风力等级
                weather_data.sevenHourlyData.WindLvs = sevenHourlyData.map(hour => {
                    return hour.windScale;
                });
                // 风速
                weather_data.sevenHourlyData.WindSpeeds = sevenHourlyData.map(hour => {
                    return hour.windSpeed;
                });
                // 相对湿度
                weather_data.sevenHourlyData.Humidities = sevenHourlyData.map(hour => {
                    return hour.humidity;
                });
                // 降水量
                weather_data.sevenHourlyData.Precips = sevenHourlyData.map(hour => {
                    return hour.precip;
                });
                // 大气压强
                weather_data.sevenHourlyData.Pressures = sevenHourlyData.map(hour => {
                    return hour.pressure;
                });
                // 云量
                weather_data.sevenHourlyData.Clouds = sevenHourlyData.map(hour => {
                    return hour.cloud !== "" ? hour.cloud : "——";
                });
                // 露点温度
                weather_data.sevenHourlyData.Dews = sevenHourlyData.map(hour => {
                    return hour.dew;
                });
            }

            // 第五步：获取每日天气预报（3天）
            if (!qweatherapi_paymode && weather_paymode()) {
                return Promise.reject(new Error(i18n("error_get_weather_data_over_usage"))); // 中断链
            }
            return fetch_with_retry(`https://${APIHost}/v7/weather/3d?location=${citynumber}`,
                {
                    method: 'GET',
                    headers: {
                        'X-QW-Api-Key': `${CityKey}`,
                    }
                }
            );
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Daily Forecast API response was not ok');
            }
            return response.json();
        })
        .then(async dailyData => {
            // 处理每日天气预报数据
            if (dailyData && dailyData.daily && dailyData.daily.length > 0) {
                const today = dailyData.daily[0]; // 今天的数据

                // 填充每日天气数据
                weather_data.temperature_max = today.tempMax;
                weather_data.temperature_min = today.tempMin;
                // 和风天气每日预报可能没有体感温度字段，使用实际温度作为备用
                weather_data.feels_max = today.feelsLikeMax || today.tempMax;
                weather_data.feels_min = today.feelsLikeMin || today.tempMin;
                weather_data.sunrise = today.sunrise;
                weather_data.sunset = today.sunset;
                weather_data.moonphase = today.moonPhase;
                weather_data.uvindex = today.uvIndex;

                // 计算温度范围
                weather_data.rangetemperature = `${today.tempMin}~${today.tempMax}`;
                weather_data.rangefeelstemperature = `${today.feelsLikeMin || today.tempMin}~${today.feelsLikeMax || today.tempMax}`;

                // 保存完整的3天预报数据
                weather_data.dailyData = dailyData;
            }

            weather.innerHTML = await generateWeatherTable();
            tooltip();
        })
}

//Visual Crossing API
function getWeather_input_VisualCrossingAPI() {
    const nowDate = Math.floor(Date.now() / 1000);
    const sevenDate = nowDate + 7 * 24 * 60 * 60;
    fetch_with_retry(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(weather_address.cityname)}/${nowDate}/${sevenDate}?unitGroup=${weather_unit}&key=${VisualCrossing_Key}&contentType=json&lang=id`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(async res => {
            console.log(JSON.stringify(res));
            const resNow = res.currentConditions;
            const resHourly = getNext7Hours(res);
            const resdaliy = res.days;

            const directions = [
                "weather_wind_north",
                "weather_wind_northeast",
                "weather_wind_east",
                "weather_wind_southeast",
                "weather_wind_south",
                "weather_wind_southwest",
                "weather_wind_west",
                "weather_wind_northwest"
            ];

            weather_address.cityname = res.resolvedAddress.split(",")[0];

            weather_data.updateTime = resNow.datetime;
            weather_data.windSpeed = resNow.windspeed;
            weather_data.humidity = resNow.humidity;
            weather_data.temperature = resNow.temp;
            weather_data.temperature_max = resdaliy[0].tempmax;
            weather_data.temperature_min = resdaliy[0].tempmin;
            weather_data.feels = resNow.feelslike;
            weather_data.feels_max = resdaliy[0].feelslikemax;
            weather_data.feels_min = resdaliy[0].feelslikemin;
            weather_data.weathernow = resNow.conditions
                .split(",")
                .map(c => c.trim())
                .map(c => i18n(`weather_visualcrossing_${c}`))
                .join(" <br/> ");
            weather_data.preciptype = resNow.preciptype;
            weather_data.precipcover = resNow.precipcover;
            weather_data.precipprob = resNow.precipprob;
            weather_data.precip = resNow.precip;
            weather_data.snow = resNow.snow;
            weather_data.snowdepth = resNow.snowdepth;
            weather_data.windgust = resNow.windgust;
            weather_data.visibility = resNow.visibility;
            weather_data.solarradiation = resNow.solarradiation;
            weather_data.uvindex = resNow.uvindex;
            weather_data.sunrise = resdaliy[0].sunrise;
            weather_data.sunset = resdaliy[0].sunset;
            weather_data.cloud = resdaliy[0].cloudcover;
            weather_data.dew = resNow.dew;
            weather_data.pressure = resNow.pressure; weather_data.icon = getQWeatherIcon(resNow.icon, isNightTime(new Date().toTimeString().split(" ")[0], resdaliy[0].sunrise, resdaliy[0].sunset));
            {
                const index = Math.floor((resNow.winddir + 22.5) / 45) % 8;
                weather_data.wind = i18n(directions[index] ?? "weather_no_data");
            }
            {
                const moonPhaseKeys = [
                    "weather_moonphase_new_moon",
                    "weather_moonphase_waxing_crescent",
                    "weather_moonphase_first_quarter",
                    "weather_moonphase_waxing_gibbous",
                    "weather_moonphase_full_moon",
                    "weather_moonphase_waning_gibbous",
                    "weather_moonphase_last_quarter",
                    "weather_moonphase_waning_crescent"
                ];

                const index = Math.floor((resdaliy[0].moonphase + 0.0625) * 8) % 8;
                weather_data.moonphase = i18n(moonPhaseKeys[index] ?? nullweather);
            }

            weather_data.sevenHourlyData.Clouds = resHourly.map(hour => {
                return hour.cloudcover;
            });
            weather_data.sevenHourlyData.Dews = resHourly.map(hour => {
                return hour.dew;
            });
            weather_data.sevenHourlyData.Humidities = resHourly.map(hour => {
                return hour.humidity;
            });
            weather_data.sevenHourlyData.Icons = resHourly.map(hour => {
                const isNight = isNightTime(hour.datetime, resdaliy[0].sunrise, resdaliy[0].sunset);
                return getQWeatherIcon(hour.icon, isNight);
            });
            weather_data.sevenHourlyData.Pops = resHourly.map(hour => {
                return `${hour.precipprob}%`;
            });
            weather_data.sevenHourlyData.Precips = resHourly.map(hour => {
                return hour.precip;
            });
            weather_data.sevenHourlyData.Pressures = resHourly.map(hour => {
                return hour.pressure;
            });
            weather_data.sevenHourlyData.Temps = resHourly.map(hour => {
                return hour.temp;
            });
            weather_data.sevenHourlyData.Texts = resHourly.map(hour => {
                if (!hour.conditions) return "";

                return hour.conditions
                    .split(",")
                    .map(c => c.trim())
                    .map(c => i18n(`weather_visualcrossing_${c}`))
                    .join(" <br/> ");
            });
            weather_data.sevenHourlyData.Times = resHourly.map(hour => {
                return hour.datetime.slice(0, 5);
            });
            weather_data.sevenHourlyData.Wind360s = resHourly.map(hour => {
                return hour.winddir;
            });
            weather_data.sevenHourlyData.WindSpeeds = resHourly.map(hour => {
                return hour.windspeed;
            });
            weather_data.sevenHourlyData.Winds = resHourly.map(hour => {
                const index = Math.floor((hour.winddir + 22.5) / 45) % 8;
                return i18n(directions[index] ?? "weather_no_data");
            });
            weather_data.sevenHourlyData.preciptype = resHourly.map(hour => {
                return hour.preciptype;
            });

            weather.innerHTML = await generateWeatherTable();
            tooltip();

            function getNext7Hours(res) {
                const now = new Date();
                const endTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);

                // 合并今天 + 明天的小时数据（防止跨天）
                const allHours = [
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
        });
}

function getWeather_input_open_meteo() {
    fetch_with_retry("https://api.open-meteo.com/v1/forecast?latitude=" + weather_address.latitude + "&longitude=" + weather_address.longitude + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&daily=apparent_temperature_max,apparent_temperature_min,temperature_2m_min,sunrise,sunset,uv_index_max,temperature_2m_max&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation_probability,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover&timezone=auto&forecast_days=1&forecast_hours=12" + "&temperature_unit=" + wunit.temperature_code + "&wind_speed_unit=" + wunit.wind_speed_code + "&precipitation_unit=" + wunit.precipitation_code, {}, 3)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(async res => {

            // 更新天气数据到 weather_data 对象
            weather_data.updateTime = res.current.time;

            // 温度相关数据
            weather_data.temperature = res.current.temperature_2m;
            weather_data.temperature_max = res.daily.temperature_2m_max[0];
            weather_data.temperature_min = res.daily.temperature_2m_min[0];

            // 体感温度
            weather_data.feels = res.current.apparent_temperature;

            // 湿度
            weather_data.humidity = res.current.relative_humidity_2m;

            // 风速
            weather_data.windSpeed = res.current.wind_speed_10m;

            // 天气状况
            {
                // 直接使用天气代码构建国际化键名
                const i18nKey = `weather_openmeteo_${res.current.weather_code}`;
                weather_data.weathernow = i18n(i18nKey) || i18n("weather_no_data");
            }

            // 风向
            {
                const directions = [
                    "weather_wind_north",
                    "weather_wind_northeast",
                    "weather_wind_east",
                    "weather_wind_southeast",
                    "weather_wind_south",
                    "weather_wind_southwest",
                    "weather_wind_west",
                    "weather_wind_northwest"
                ];

                const index = Math.floor((res.current.wind_direction_10m + 22.5) / 45) % 8;
                weather_data.wind = i18n(directions[index] ?? "weather_no_data");
            }

            // 降水
            weather_data.precip = res.current.precipitation;

            // 阵风
            weather_data.windgust = res.current.wind_gusts_10m;

            // 日出日落
            weather_data.sunrise = res.daily.sunrise[0];
            weather_data.sunset = res.daily.sunset[0];

            // 云量
            weather_data.cloud = res.current.cloud_cover;

            // 气压
            weather_data.pressure = res.current.pressure_msl;

            // 观测时间
            weather_data.obstime = res.current.time.replace("T", " ");

            // 温度范围
            weather_data.rangetemperature = `${res.daily.temperature_2m_min[0]}~${res.daily.temperature_2m_max[0]}`;

            // UV指数
            weather_data.uvindex = res.daily.uv_index_max ? res.daily.uv_index_max[0] : nullweather;

            // 体感温度范围
            weather_data.rangefeelstemperature = `${res.daily.apparent_temperature_min ? res.daily.apparent_temperature_min[0] : res.daily.temperature_2m_min[0]}~${res.daily.apparent_temperature_max ? res.daily.apparent_temperature_max[0] : res.daily.temperature_2m_max[0]}`;

            // 降雨量（如果有）
            weather_data.rain = res.current.rain || 0;

            // 设置天气图标（需要创建 Open-Meteo 到和风天气图标的映射）
            weather_data.icon = getOpenMeteoIcon(res.current.weather_code, res.current.time);

            // 处理hourly数据用于七小时预报
            if (res.hourly && res.hourly.time && res.hourly.time.length > 0) {
                // 获取当前时间
                const now = new Date();
                const currentTime = now.toISOString().split('T')[0] + 'T' +
                    now.getHours().toString().padStart(2, '0') + ':00';

                // 找到当前时间在hourly数据中的索引
                let currentIndex = res.hourly.time.findIndex(time => time >= currentTime);
                if (currentIndex === -1) currentIndex = 0;

                // 获取接下来7小时的数据
                const next7Hours = Math.min(7, res.hourly.time.length - currentIndex);

                // 初始化sevenHourlyData
                weather_data.sevenHourlyData = {
                    updateTime: res.current.time,
                    Times: [],
                    Pops: [],
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

                for (let i = 0; i < next7Hours; i++) {
                    const idx = currentIndex + i;

                    // 时间
                    const timeStr = res.hourly.time[idx];
                    weather_data.sevenHourlyData.Times.push(timeStr.split('T')[1].substring(0, 5));

                    // 降水概率
                    const pop = res.hourly.precipitation_probability ? res.hourly.precipitation_probability[idx] : 0;
                    weather_data.sevenHourlyData.Pops.push(pop !== null ? `${pop}%` : "——");

                    // 温度
                    weather_data.sevenHourlyData.Temps.push(res.hourly.temperature_2m ? res.hourly.temperature_2m[idx] : "--");

                    // 天气图标和文本
                    const weatherCode = res.hourly.weather_code ? res.hourly.weather_code[idx] : res.current.weather_code;
                    // 根据时间判断白天/夜晚（6:00-18:00为白天）
                    const hour = parseInt(timeStr.split('T')[1].substring(0, 2));
                    const isDay = hour >= 6 && hour < 18;
                    weather_data.sevenHourlyData.Icons.push(getOpenMeteoIcon(weatherCode, timeStr));
                    weather_data.sevenHourlyData.Texts.push(i18n(`weather_openmeteo_${weatherCode}`) || i18n("weather_no_data"));

                    // 风向
                    const windDir = res.hourly.wind_direction_10m ? res.hourly.wind_direction_10m[idx] : res.current.wind_direction_10m;
                    const directions = [
                        "weather_wind_north",
                        "weather_wind_northeast",
                        "weather_wind_east",
                        "weather_wind_southeast",
                        "weather_wind_south",
                        "weather_wind_southwest",
                        "weather_wind_west",
                        "weather_wind_northwest"
                    ];
                    const dirIndex = Math.floor((windDir + 22.5) / 45) % 8;
                    weather_data.sevenHourlyData.Winds.push(i18n(directions[dirIndex] ?? "weather_no_data"));
                    weather_data.sevenHourlyData.Wind360s.push(windDir);

                    // 风速
                    weather_data.sevenHourlyData.WindSpeeds.push(res.hourly.wind_speed_10m ? res.hourly.wind_speed_10m[idx] : res.current.wind_speed_10m);

                    // 湿度
                    weather_data.sevenHourlyData.Humidities.push(res.hourly.relative_humidity_2m ? res.hourly.relative_humidity_2m[idx] : res.current.relative_humidity_2m);

                    // 降水量
                    weather_data.sevenHourlyData.Precips.push(res.hourly.precipitation ? res.hourly.precipitation[idx] : res.current.precipitation);

                    // 气压
                    weather_data.sevenHourlyData.Pressures.push(res.hourly.surface_pressure ? res.hourly.surface_pressure[idx] : res.current.surface_pressure);

                    // 云量
                    weather_data.sevenHourlyData.Clouds.push(res.hourly.cloud_cover ? res.hourly.cloud_cover[idx] : res.current.cloud_cover);

                    // 露点温度
                    weather_data.sevenHourlyData.Dews.push(res.hourly.dew_point_2m ? res.hourly.dew_point_2m[idx] : "--");

                    // 降水类型（Open-Meteo不直接提供，根据天气代码推断）
                    weather_data.sevenHourlyData.preciptype.push(getPrecipTypeFromCode(weatherCode));
                }

                // 如果不足7小时，用空值填充
                while (weather_data.sevenHourlyData.Times.length < 7) {
                    weather_data.sevenHourlyData.Times.push("--:--");
                    weather_data.sevenHourlyData.Pops.push("——");
                    weather_data.sevenHourlyData.Temps.push("--");
                    weather_data.sevenHourlyData.Icons.push("999");
                    weather_data.sevenHourlyData.Texts.push(i18n("weather_no_data"));
                    weather_data.sevenHourlyData.Winds.push("--");
                    weather_data.sevenHourlyData.Wind360s.push("--");
                    weather_data.sevenHourlyData.WindSpeeds.push("--");
                    weather_data.sevenHourlyData.Humidities.push("--");
                    weather_data.sevenHourlyData.Precips.push("--");
                    weather_data.sevenHourlyData.Pressures.push("--");
                    weather_data.sevenHourlyData.Clouds.push("--");
                    weather_data.sevenHourlyData.Dews.push("--");
                    weather_data.sevenHourlyData.preciptype.push("--");
                }
            }

            weather.innerHTML = await generateWeatherTable();
            tooltip();
        })
        .catch(error => {
            console.error('Error fetching Open-Meteo weather data:', error);
            weather.innerHTML = `<div class="weather-error">${i18n('weather_error_loading')}</div>`;
        });
}

// 问候语变更逻辑
function getGreetingText() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return i18n('weather_greeting_morning_formal');
    if (hour >= 12 && hour < 18) return i18n('weather_greeting_afternoon_formal');
    if (hour >= 18 && hour < 22) return i18n('weather_greeting_evening_formal');
    return i18n('weather_greeting_late_night_formal');
}

function getWeatherTips() {
    const tips = [];
    const hour = new Date().getHours();
    const isNight = hour >= 22 || hour < 5;

    // 判断天气状况
    const weatherText = weather_data.weathernow || "";
    const windScale = parseInt(weather_data.windLv) || 0;
    const airQuality = parseInt(weather_data.air) || 0;

    // 计算最高和最低温度 - 使用24小时预报数据
    let maxTemp = -100;
    let minTemp = 100;

    // 注意：这里需要确保hourlyData变量可用
    // 我们将在稍后的修改中确保这一点
    if (typeof weather_data.sevenHourlyData !== 'undefined') {
        weather_data.sevenHourlyData.Temps.forEach(hour => {
            const temp = parseInt(hour);
            if (!isNaN(temp)) {
                if (temp > maxTemp) maxTemp = temp;
                if (temp < minTemp) minTemp = temp;
            }
        });
    }

    // 如果无法从24小时数据获取温度，使用当前温度作为默认值
    if (maxTemp === -100 && weather_data.temperature && weather_data.temperature !== "") {
        const currentTemp = parseInt(weather_data.temperature);
        if (!isNaN(currentTemp)) {
            maxTemp = currentTemp;
            minTemp = currentTemp;
        }
    }

    // 优先级0: 天气晴朗，早上好、下午好、晚上好时
    const sunnyText = i18n('weather_condition_sunny');
    const cloudyText = i18n('weather_condition_cloudy');
    if ((weatherText.includes(sunnyText) || weatherText.includes(cloudyText)) && !isNight) {
        tips.push({ priority: 0, text: i18n('weather_tip_sunny_day') });
    }

    // 优先级1: 下雨
    const rainText = i18n('weather_condition_rain');
    if (weatherText.includes(rainText)) {
        tips.push({ priority: 1, text: i18n('weather_tip_rain') });
    }

    // 优先级2: 大风
    if (windScale >= 5) {
        tips.push({ priority: 2, text: i18n('weather_tip_windy') });
    }

    // 优先级3: 极端温度
    if (maxTemp >= 35) {
        tips.push({ priority: 3, text: i18n('weather_tip_hot') });
    } else if (minTemp <= -10) {
        tips.push({ priority: 3, text: i18n('weather_tip_cold') });
    }

    // 优先级4: 空气质量差
    if (airQuality > 100) {
        tips.push({ priority: 4, text: i18n('weather_tip_air_quality') });
    }

    // 优先级5: 下雪
    const snowText = i18n('weather_condition_snow');
    if (weatherText.includes(snowText)) {
        tips.push({ priority: 5, text: i18n('weather_tip_snow') });
    }

    // 优先级6: 天气晴朗，夜深了时
    if ((weatherText.includes(sunnyText) || weatherText.includes(cloudyText)) && isNight) {
        tips.push({ priority: 6, text: i18n('weather_tip_sunny_night') });
    }

    // 按优先级排序，取优先级最高的
    if (tips.length > 0) {
        tips.sort((a, b) => b.priority - a.priority);
        return tips[0].text;
    }

    return '';
}

async function generateWeatherTable() {
    // 检查数据是否已加载
    if (weather_data.temperature === "" && weather_data.weathernow === "") {
        return `
        <div class="weather-table-container" style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px;">
            <div style="color: white; text-align: center; font-size: 16px;">
                ${i18n('weather_loading')}
            </div>
        </div>
        `;
    }

    // 获取当前时间用于问候语
    const hour = new Date().getHours();
    if (hour < 6) greeting = i18n('weather_greeting_late_night');
    else if (hour < 12) greeting = i18n('weather_greeting_morning');
    else if (hour < 14) greeting = i18n('weather_greeting_noon');
    else if (hour < 18) greeting = i18n('weather_greeting_afternoon');
    else greeting = i18n('weather_greeting_evening');

    // 获取空气质量等级
    function getAirQualityText(airValue) {
        if (!airValue || airValue === "") return "";

        let airNum = parseFloat(airValue);
        if (isNaN(airNum)) {
            return airValue;
        }

        // 根据中国空气质量指数标准分级，使用i18n
        if (airNum <= 50) return `${i18n('weather_air_quality_excellent')} (${airNum})`;
        if (airNum <= 100) return `${i18n('weather_air_quality_good')} (${airNum})`;
        if (airNum <= 150) return `${i18n('weather_air_quality_light_pollution')} (${airNum})`;
        if (airNum <= 200) return `${i18n('weather_air_quality_moderate_pollution')} (${airNum})`;
        if (airNum <= 300) return `${i18n('weather_air_quality_heavy_pollution')} (${airNum})`;
        return `${i18n('weather_air_quality_severe_pollution')} (${airNum})`;
    }

    function getAlart() {
        // severity 和风天气预警等级映射
        const severityLevel = {
            extreme: 5,
            severe: 4,
            moderate: 3,
            minor: 2,
            unknown: 1
        };

        let alerts = [...(weather_data.weatherAlert || [])].sort((a, b) => {
            return severityLevel[b.level] - severityLevel[a.level];
        });

        const alertMap = {};
        alerts.forEach(alert => {
            if (!alertMap[alert.alert]) {
                alertMap[alert.alert] = {
                    ...alert,
                    ids: [alert.id],
                    level: alert.level,
                    color: alert.color
                };
            } else {
                alertMap[alert.alert].ids.push(alert.id);

                const currentSeverity = severityLevel[alert.level];
                const existingSeverity = severityLevel[alertMap[alert.alert].level];

                if (currentSeverity > existingSeverity) {
                    alertMap[alert.alert].level = alert.level;
                    alertMap[alert.alert].color = alert.color;
                }
            }
        });

        const mergedAlerts = Object.values(alertMap);
        let alertsHTML = "";
        mergedAlerts.forEach(a => {
            const idsString = a.ids.join(',');
            alertsHTML += `<span class="weather-alert-item" style="color: rgb(${a.color}); font-weight: bold; margin-right: 10px;" data-id="${idsString}">${a.alert}</span>`;
        });

        if ([1].includes(weather_api_choose)) {
            tableHTML += `<td class="weather-cell air-title-cell">${i18n('weather_air_quality_label')}</td>`;
            tableHTML += `<td class="weather-cell air-value-cell">${getAirQualityText(weather_data.air)}</td>`;
        }
        if (mergedAlerts.length > 0) {
            tableHTML += `<td class="weather-cell warning-cell" colspan="4">${i18n('weather_alert_label')}<div class="weather-alert-items-warp"><div class="weather-alert-items">${alertsHTML}</div><div></td>`;
        }
    }

    let weatherIconSVG = "";
    try {
        const res = await fetch_with_retry(`source/QWeather-Icons/icons/${weather_data.icon}-fill.svg`);
        weatherIconSVG = await res.text();
    } catch (e) {
        const res = await fetch_with_retry(`source/QWeather-Icons/icons/999-fill.svg`);
        weatherIconSVG = await res.text();
    }

    let leftHTML = `
        <div class="weather-left">
        `;

    leftHTML += `

            <div class="weather-icon">
                ${weatherIconSVG}
            </div>
            `;

    leftHTML += `
            <div class="weather-temp">
                ${weather_data.temperature}${wunit.temp || "℃"}
            </div>
        `;

    leftHTML += `
            <div class="weather-text">
                ${weather_data.weathernow || ""}
            </div>
        `;

    if ([1, 2, 3, 4].includes(weather_api_choose)) {
        leftHTML += `
            <div class="weather-city">
                ${weather_address.cityname}
            </div>
        `;
    }

    leftHTML += `
            <div class="weather-feels">
                ${i18n('weather_feels_label')} ${weather_data.feels}${wunit.temp || "℃"}
            </div>
        `;

    leftHTML += `
        </div>
        `;

    let tableHTML = `
        <table class="weather-table">
            <tr class="weather-row main-row">
    `;

    tableHTML += `<td class="weather-cell humidity-cell">${weather_data.temperature_max} - ${weather_data.temperature_min}℃</td>`;

    tableHTML += `<td class="weather-cell humidity-cell">${i18n('weather_humidity_label')}${weather_data.humidity}%</td>`;


    tableHTML += `<td class="weather-cell wind-cell">${weather_data.wind}</td>`;



    if ([1, 2].includes(weather_api_choose)) {
        tableHTML += `<td class="weather-cell wind-level-cell">${weather_data.windLv}${i18n('weather_wind_level_label')}</td>`;
    }

    tableHTML += `<td class="weather-cell wind-speed-cell">${weather_data.windSpeed}${wunit.wind || "km/h"}</td>`;

    if ([1, 2].includes(weather_api_choose)) {
        tableHTML += `<td class="weather-cell visibility-cell">${i18n('weather_visibility_label')}${weather_data.vis}${wunit.vis || "km"}</td>`;
    }

    tableHTML += `<td class="weather-cell cloud-cell">${i18n('weather_cloud_label')}${weather_data.cloud}%</td>`;

    tableHTML += `</tr><tr class="weather-row detail-row">`;

    tableHTML += `<td class="weather-cell uv-cell">${i18n('weather_uv_label')}${weather_data.uvindex}</td>`;

    tableHTML += `<td class="weather-cell sunrise-cell">${i18n('weather_sunrise_label')}${formatTime(weather_data.sunrise)}</td>`;

    tableHTML += `<td class="weather-cell sunset-cell">${i18n('weather_sunset_label')}${formatTime(weather_data.sunset)}</td>`;

    tableHTML += `<td class="weather-cell moonphase-cell">${weather_data.moonphase}</td>`;

    tableHTML += `</tr><tr class="weather-row air-row">`;

    // 第三行：空气质量
    getAlart();

    // 降水概率行（动态显示）
    if ([1, 4, 5].includes(weather_api_choose)) {
        tableHTML += `
        <tr class="weather-row precip-row">
            <td class="weather-cell precip-text"  rowspan="2" data-i18n="weather_show_precipprob">${i18n('weather_show_precipprob')}</td>
            <td class="weather-cell precip-times" colspan="5">
                <span class="precip-time-cell">${weather_data.sevenHourlyData.Times[0]}</span>
                <span class="precip-time-cell">${weather_data.sevenHourlyData.Times[1]}</span>
                <span class="precip-time-cell">${weather_data.sevenHourlyData.Times[2]}</span>
                <span class="precip-time-cell">${weather_data.sevenHourlyData.Times[3]}</span>
                <span class="precip-time-cell">${weather_data.sevenHourlyData.Times[4]}</span>
                <span class="precip-time-cell">${weather_data.sevenHourlyData.Times[5]}</span>
                <span class="precip-time-cell">${weather_data.sevenHourlyData.Times[6]}</span>
            </td>
        </tr>
        <tr class="weather-row precip-prob-row">
            <td class="weather-cell precip-probs" colspan="5">
                <span class="precip-prob-cell">${weather_data.sevenHourlyData.Pops[0]}</span>
                <span class="precip-prob-cell">${weather_data.sevenHourlyData.Pops[1]}</span>
                <span class="precip-prob-cell">${weather_data.sevenHourlyData.Pops[2]}</span>
                <span class="precip-prob-cell">${weather_data.sevenHourlyData.Pops[3]}</span>
                <span class="precip-prob-cell">${weather_data.sevenHourlyData.Pops[4]}</span>
                <span class="precip-prob-cell">${weather_data.sevenHourlyData.Pops[5]}</span>
                <span class="precip-prob-cell">${weather_data.sevenHourlyData.Pops[6]}</span>
            </td>
        </tr>
        `;
    }

    // 问候语行
    const greetingText = getGreetingText();
    const weatherTip = getWeatherTips();
    const fullGreeting = weatherTip ? `${greetingText} ${weatherTip}` : greetingText;

    tableHTML += `
        <tr class="weather-row greeting-row">
            <td class="weather-cell greeting-cell" colspan="6">${fullGreeting}</td>
        </tr>
        </table>
    `;

    return `
        <div class="weather-container">
            ${leftHTML}

            <div class="weather-right">
                ${tableHTML}
            </div>
        </div>
    `;

}

function attachSevenHourlyTooltip(element, hourIndex) {
    const tooltip = document.querySelector("#weatherHourlyTooltip");
    const card = tooltip.querySelector(".popup-main");

    element.addEventListener("mouseenter", (e) => {
        const i = hourIndex;
        const pop = weather_data.sevenHourlyData.Pops[i] ?? "--";
        const temp = weather_data.sevenHourlyData.Temps[i] ?? "--";
        const icon = weather_data.sevenHourlyData.Icons[i] ?? "999";
        const text = weather_data.sevenHourlyData.Texts[i] ?? "--";
        const wind = weather_data.sevenHourlyData.Winds[i] ?? "--";
        const wind360 = weather_data.sevenHourlyData.Wind360s[i] ?? "--";
        const windLv = weather_data.sevenHourlyData.WindLvs[i] ?? "--";
        const windSp = weather_data.sevenHourlyData.WindSpeeds[i] ?? "--";
        const hum = weather_data.sevenHourlyData.Humidities[i] ?? "--";
        const precip = weather_data.sevenHourlyData.Precips[i] ?? "--";
        const pres = weather_data.sevenHourlyData.Pressures[i] ?? "--";
        const clouds = weather_data.sevenHourlyData.Clouds[i] ?? "--";
        const dew = weather_data.sevenHourlyData.Dews[i] ?? "--";

        card.querySelector("#pTemp").textContent = `${temp}${i18n('weather_tooltip_unit_degree')}`;
        card.querySelector("#pText").innerHTML = text;
        card.querySelector("#pHumidity").textContent = `${hum}${i18n('weather_tooltip_unit_percent')}`;
        card.querySelector("#pPrecip").textContent = `${pop} / ${precip}${i18n('weather_tooltip_unit_mm')}`;
        card.querySelector("#pPressure").textContent = `${pres}${i18n('weather_tooltip_unit_hpa')}`;
        card.querySelector("#pClouds").textContent = `${clouds}${i18n('weather_tooltip_unit_percent')}`;
        card.querySelector("#pDew").textContent = `${dew}${i18n('weather_tooltip_unit_degree')}`;
        card.querySelector("#pWindDir").textContent = `${wind} / ${wind360}${i18n('weather_tooltip_unit_degree')}`;
        card.querySelector("#pWindLv").textContent = windLv;
        card.querySelector("#pWindSpeed").textContent = windSp + ` ${i18n('weather_tooltip_unit_ms')}`;

        fetch_with_retry(`source/QWeather-Icons/icons/${icon}-fill.svg`)
            .then(res => res.text())
            .then(svg => {
                card.querySelector("#pIconImg").innerHTML = svg;
            })

        tooltip.style.display = "block";
        tooltip.classList.add("show");
    });

    element.addEventListener("mousemove", (e) => {
        const tipWidth = tooltip.offsetWidth;
        const tipHeight = tooltip.offsetHeight;

        let left = e.clientX + 20;
        let top = e.clientY + 20;

        if (left + tipWidth > window.innerWidth - 20) left = e.clientX - tipWidth - 20;
        if (top + tipHeight > window.innerHeight - 20) top = e.clientY - tipHeight - 20;

        if (left < 20) left = 20;
        if (top < 20) top = 20;

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
    });

    element.addEventListener("mouseleave", () => {
        tooltip.classList.remove("show");
        setTimeout(() => {
            if (!tooltip.classList.contains("show")) {
                tooltip.style.display = "none";
            }
        }, 200);
    });
}

function attachWeatherAlertTooltip(element) {
    const tooltip = document.querySelector("#weatherAlertTooltip");
    const cardsContainer = tooltip.querySelector(".tooltip-cards-container");
    const cardTemplate = document.querySelector("#weatherAlerttooltipCardTemplate");
    const alertName = element.innerText;

    if (element.innerText == i18n('weather_alert_everything_ok')) return;

    element.addEventListener("mouseenter", (e) => {

        cardsContainer.innerHTML = "";

        const alerts = weather_data.weatherAlert.filter(item => item.alert === alertName);

        alerts.forEach(alert => {
            const card = cardTemplate.content.cloneNode(true).querySelector('.tooltip-card');

            card.style.setProperty("--alert-color", alert.color);

            card.querySelector(".tooltip-title").textContent = alert.alert;
            card.querySelector(".sender").textContent = alert.sender;
            card.querySelector(".tooltip-time .text").textContent = getTime(alert.releaseTime, true);
            card.querySelector(".tooltip-time .state").textContent = alert.status;
            card.querySelector(".event-severity .text").textContent = alert.level;
            card.querySelector(".event-timing .start .time").textContent = getTime(alert.startTime, false);
            card.querySelector(".event-timing .end .time").textContent = getTime(alert.endTime, false);
            card.querySelector(".tooltip-headline").textContent = alert.title;
            card.querySelector(".tooltip-description").textContent = alert.description;
            card.querySelector(".tooltip-criteria").textContent = alert.criteria;

            const instruction = alert.instruction?.split(" ").map(line => `<li>${line}</li>`).join("");
            if (instruction) {
                const instructionsDiv = card.querySelector(".tooltip-instructions");
                instructionsDiv.style.display = "block";
                instructionsDiv.querySelector("ol").innerHTML = instruction;
            } else {
                card.querySelector(".tooltip-instructions").style.display = "none";
            }

            card.querySelector(".tooltip-source").textContent = alert.source;

            fetch_with_retry(`source/QWeather-Icons/icons/${alert.icon}.svg`)
                .then(res => res.text())
                .then(svg => {
                    card.querySelector(".tooltip-icon").innerHTML = svg;
                })

            tooltip.style.display = "block";
            card.classList.add("glow");
            tooltip.classList.add("show", "glow");

            cardsContainer.appendChild(card);
        });
    });

    element.addEventListener("mousemove", (e) => {

        const tipWidth = tooltip.offsetWidth;
        const tipHeight = tooltip.offsetHeight;

        let left = e.clientX + 20;
        let top = e.clientY + 20;

        if (left + tipWidth > window.innerWidth - 20) left = e.clientX - tipWidth - 20;
        if (top + tipHeight > window.innerHeight - 20) top = e.clientY - tipHeight - 20;

        if (left < 20) {
            left = 20;
        }
        if (top < 20) {
            top = 20;
        }

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
    });

    element.addEventListener("mouseleave", () => {
        tooltip.classList.remove("show", "glow");
        setTimeout(() => {
            if (!tooltip.classList.contains("show")) {
                tooltip.style.display = "none";
                cardsContainer.innerHTML = "";
            }
        }, 250);
    });
}

function tooltip() {
    if ([1].includes(weather_api_choose)) {
        document.querySelectorAll(".weather-alert-item").forEach(item => {
            attachWeatherAlertTooltip(item);
        });
    }
    if ([1, 4, 5].includes(weather_api_choose)) {
        document.querySelectorAll(".precip-time-cell").forEach((el, i) => {
            attachSevenHourlyTooltip(el, i);
        });
    }
}

// VisualCrossing icon → 和风天气 icon映射
const VC_ICON_TO_QWEATHER = {
    // ===== 晴 / 多云 =====
    "clear-day": { day: 100, night: 150 },
    "clear-night": { day: 100, night: 150 },

    "partly-cloudy-day": { day: 101, night: 151 },
    "partly-cloudy-night": { day: 101, night: 151 },

    "cloudy": { day: 101, night: 151 },

    // ===== 雨 =====
    "rain": { day: 399, night: 399 },
    "showers-day": { day: 300, night: 350 },
    "showers-night": { day: 300, night: 350 },

    // ===== 雷雨 =====
    "thunder-rain": { day: 302, night: 302 },
    "thunder-showers-day": { day: 302, night: 302 },
    "thunder-showers-night": { day: 302, night: 302 },

    // ===== 雪 =====
    "snow": { day: 499, night: 499 },
    "snow-showers-day": { day: 407, night: 457 },
    "snow-showers-night": { day: 407, night: 457 },

    // ===== 雾 =====
    "fog": { day: 501, night: 501 },

    // ===== 风（无昼夜图标，兜底）=====
    "wind": { day: 101, night: 151 }
};

// Open-Meteo 天气代码 → 和风天气 icon映射
const OPEN_METEO_TO_QWEATHER = {
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

// 获取 Open-Meteo 天气代码对应的和风天气图标
function getOpenMeteoIcon(weatherCode, timeString) {
    const defaultIcon = { day: 100, night: 150 };

    const iconMapping = OPEN_METEO_TO_QWEATHER[weatherCode] || defaultIcon;

    let isNight = false;
    if (timeString) {
        const time = new Date(timeString);
        const hour = time.getHours();
        isNight = hour >= 18 || hour < 6;
    }

    // 返回对应的图标编号
    return isNight ? iconMapping.night : iconMapping.day;
}

// 根据Open-Meteo天气代码推断降水类型
function getPrecipTypeFromCode(weatherCode) {
    // 雨相关代码
    const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];

    // 雪相关代码
    const snowCodes = [71, 73, 75, 77, 85, 86];

    // 冻雨相关代码
    const freezingRainCodes = [56, 57, 66, 67];

    // 冰雹相关代码
    const hailCodes = [77];

    if (rainCodes.includes(weatherCode)) {
        if (freezingRainCodes.includes(weatherCode)) {
            return i18n('weather_precip_type_freezing_rain');
        } else if (hailCodes.includes(weatherCode)) {
            return i18n('weather_precip_type_hail');
        }
        return i18n('weather_precip_type_rain');
    } else if (snowCodes.includes(weatherCode)) {
        return i18n('weather_precip_type_snow');
    }

    return i18n('weather_precip_type_none');
}

// 格式化时间函数（用于日出日落时间）
function formatTime(timeString) {
    if (!timeString) return "--:--";

    try {
        const date = new Date(timeString);
        if (isNaN(date.getTime())) {
            const timeMatch = timeString.match(/(\d{1,2}):(\d{1,2})/);
            if (timeMatch) {
                const hours = timeMatch[1].padStart(2, '0');
                const minutes = timeMatch[2].padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            return timeString;
        }

        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (error) {
        debugLogger.error('Error formatting time:', error, timeString);
        return timeString;
    }
}
