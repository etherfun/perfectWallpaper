var weather = document.querySelector("#weather");
var weather_webtext = document.querySelector("#weather .text");

var checkcity
var wt
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
    checkcity: "",
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
    updatetime: "",
    windLv: "",
    cityname: "",
    high: "",
    low: "",
    air: "",
    weatherAlert: "",
    weatherAlertColor: "",
    hourlyData: null,
    hourlyTimes: ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
    hourlyPops: ["0%", "0%", "0%", "0%", "0%", "0%", "0%"],
};

var temperature = "未获取";
var feels = "未获取";
var weatherdata = "未获取";
var weathernow = "未获取";
var wind = "未获取";
var windLv = "未获取";
var precip = "未获取";
var cloud = "未获取";
var humidity = "未获取";
var windSpeed = "未获取";
var vis = "未获取";
var dew = "未获取";
var cityname = "未获取";
var pressure = "未获取";

var cityname = "未获取";
var weathernow = "未获取";
var wind = "未获取";
var windLv = "未获取";
var feels = "未获取";
var high = "未获取";
var low = "未获取";
var air = "未获取";

var windSpeed = "未获取";
var humidity = "未获取";
var temperature = "未获取";
var temperature_max = "未获取";
var temperature_min = "未获取";
var feels = "未获取";
var feels_max = "未获取";
var feels_min = "未获取";
var weathernow = "未获取";
var wind = "未获取";
var precip = "未获取";
var precipcover = "未获取";
var precipprob = "未获取";
var snow = "未获取";
var snowdepth = "未获取";
var preciptype = "未获取";
var windgust = "未获取";
var visibility = "未获取";
var solarradiation = "未获取";
var uvindex = "未获取";
var sunriseset
var sunrise = "未获取";
var sunset = "未获取";
var moonphase = "未获取";
var cloud = "未获取";
var vis = "未获取";
var dew = "未获取";
var pressure = "未获取";
var rangefeelstemperature = "未获取"
var rangetemperature = "未获取"
var obstime = "未获取"
var weatherAlert = "未获取";
var alertColor = "#ffffff";

var nullweather = ""

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
    switch (weather_lang) {
        case "zh":
            wlang = {
                datetime: "观测时间%1",
                humidity: "湿度%1%",
                rangetemperature: "气温范围%1%3~%2%3",
                feelstemperature: "体感%1%2",
                rangefeelstemperature: "体感范围%1%3~%2%3",
                precip: "降水",
                precipcover: "全天预计%1%2小时",
                precipprob: "当前%1%%2%3%4",
                preciptype: "降水类型",
                snow: "降雪%1%2",
                snowdepth: "积雪深度%3%2",
                windgust: "瞬时%1%2",
                windSpeed: "平均%1%2",
                vis: "能见度%1%2",
                solarradiation: "太阳功率%1%2",
                uvindex: "紫外线%1UV",
                sunriseset: "日出/落%1-%2",
                moonphase: "月相%1",
                cloud: "云层密度%1%",
                dewtemperature: "露点%1%2",
                pressure: "大气压强%1%2"
            }
            break
        case "en":
            wlang = {
                datetime: "Observation time %1",
                humidity: "Humidity %1%",
                rangetemperature: "Temperature range %1%3~%2%3",
                feelstemperature: "Feels like %1%2",
                rangefeelstemperature: "Feels like range %1%3~%2%3",
                precip: "Precipitation",
                precipcover: "Total expected %1%2 hours",
                precipprob: "Current %1% %2%3",
                preciptype: "Precipitation type",
                snow: "Snowfall %1%2",
                snowdepth: "Snow depth %3%2",
                windgust: "Gust %1%2",
                windSpeed: "Aerage %1%2",
                vis: "Visibility %1%2",
                solarradiation: "Solar radiation %1%2",
                uvindex: "UVI%1",
                sunriseset: "Sunrise/Set %1-%2",
                moonphase: "Moonphase %1",
                cloud: "Cloud cover %1%",
                dewtemperature: "Dew point %1%2",
                pressure: "Atmospheric pressure %1%2"
            }
            break
    }
}

function oWeatherInit() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    //weather.style.width = w+'px';
    weather.style.lineHeight = h + 'px';
    //weather.style.height =  h+'px';
    weather.style.fontSize = Math.floor(h / 300 * 20) + 'px';
}
oWeatherInit()

function weather_init() {
    if (strCity == "") {
        $.get("http://i.tianqi.com/index.php?c=code&id=11", function (citydata) {

            strCity = citydata.split("</strong>")[1].split(" ")[0];
            apiuse()
        })
    }

    switch (weather_api_choose) {
        case 1:
            if (!qweatherapi_paymode && weather_paymode()) {
                return;
            }

            if (weather_address.citynumber == "" || strCity != weather_address.checkcity) {
                weather_address.checkcity = strCity
                fetch_with_retry(`https://${APIHost}/geo//v2/city/lookup?location=${strCity}`, {
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
                        console.log("地理位置数据:", JSON.stringify(data));
                        weather_address.citynumber = data.location[0].id
                        weather_address.cityname = data.location[0].name

                        // 保存经纬度信息到全局变量
                        weather_address.latitude = data.location[0].lat;
                        weather_address.longitude = data.location[0].lon;

                        // 顺序调用API
                        getWeather_input_qweatherapi(weather_address.citynumber);
                    })
            } else {
                // 如果已有城市编号，直接调用天气API
                getWeather_input_qweatherapi(weather_address.citynumber);
            }
            break
        case 2:
            fetch_with_retry("https://api.icufree.com/weather.php?cityname=" + strCity, {}, 3)
                .then(response => response.json())
                .then(res => {
                    weather_data.cityname = res.cityname;
                    weather_data.temperature = res.feels;
                    weather_data.weathernow = res.weathernow;
                    weather_data.wind = res.wind;
                    weather_data.windLv = res.windLv;
                    weather_data.high = res.high;
                    weather_data.low = res.low;
                    weather_data.weather_webtext.innerHTML = FormatWeather_freeapi(strHtml);
                });
            generateWeatherTable();
            FristLoadWeather = false;
            break
        case 3:
            getWeather_input_tianqiapi("{城市} {天气}{气温} {范围} {风向}{风级}{风速} {湿度} {空气质量} {大气气压}")
            FristLoadWeather = false
            break
        case 4:
            getWeather_input_VisualCrossingAPI()
            FristLoadWeather = false
            break
        case 5:
            getWeather_input_open_meteo()
            FristLoadWeather = false
            break
    }
}

function attachTooltip(element) {
    const tooltip = document.querySelector("#weatherTooltip");

    element.addEventListener("mouseenter", () => {
        const alert = weather_data.weatherAlert.find(a => a.id == element.getAttribute("data-id"));
        if (alert.alert == "诸事顺遂") {
            tooltip.style.display = "none";
        }

        tooltip.style.setProperty("--alert-color", alert.color);

        tooltip.querySelector(".tooltip-title").textContent = alert.alert;
        tooltip.querySelector(".sender").textContent = alert.sender;
        tooltip.querySelector(".tooltip-time .text").textContent = getTime(alert.releaseTime, true);
        tooltip.querySelector(".event-severity .text").textContent = alert.level;
        tooltip.querySelector(".event-timing .start .time").textContent = getTime(alert.startTime, false);
        tooltip.querySelector(".event-timing .end .time").textContent = getTime(alert.endTime, false);
        tooltip.querySelector(".tooltip-headline").textContent = alert.title;
        tooltip.querySelector(".tooltip-description").textContent = alert.description;
        tooltip.querySelector(".tooltip-criteria").textContent = alert.criteria;
        const instruction = alert.instruction?.split(" ").map(line => `<li>${line}</li>`).join("");
        if (instruction) {
            tooltip.querySelector(".tooltip-instructions").style.display = "block";
            tooltip.querySelector(".tooltip-instructions ol").innerHTML = instruction;
        } else {
            tooltip.querySelector(".tooltip-instructions").style.display = "none";
        }
        tooltip.querySelector(".tooltip-source").textContent = alert.source;

        fetch(`source/QWeather-Icons/icons/${alert.icon}.svg`)
            .then(res => res.text())
            .then(svg => {
                tooltip.querySelector(".tooltip-icon").innerHTML = svg;
            });

        tooltip.classList.add("show", "glow");
        tooltip.style.display = "block";
    });

    element.addEventListener("mousemove", (e) => {
        const tipWidth = tooltip.offsetWidth;
        const tipHeight = tooltip.offsetHeight;

        let left = e.clientX + 20;
        let top = e.clientY + 20;

        if (left + tipWidth > window.innerWidth - 10) {
            left = e.clientX - tipWidth - 20;
        }

        if (top + tipHeight > window.innerHeight - 10) {
            top = e.clientY - tipHeight - 20;
        }

        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
    });

    element.addEventListener("mouseleave", () => {
        tooltip.classList.remove("show", "glow");
        setTimeout(() => {
            if (!tooltip.classList.contains("show")) {
                tooltip.style.display = "none";
            }
        }, 250);
    });
}

function autoWeather() {
    weather_init();
    //getcity();
    switch (weather_updata) {
        case 1:
            wt = setTimeout(autoWeather, 900000);
            break
        case 2:
            wt = setTimeout(autoWeather, 1200000);
            break
        case 3:
            wt = setTimeout(autoWeather, 1800000);
            break
        case 4:
            wt = setTimeout(autoWeather, 2700000);
            break
        case 6:
            wt = setTimeout(autoWeather, 3600000);
    }
}

function getcity() {
    if (strCity == "") {
        $.get("http://i.tianqi.com/index.php?c=code&id=11", function (citydata) {

            strCity = citydata.split("</strong>")[1].split(" ")[0];
            apiuse()
        })
    } else {
        apiuse()
    }
}

function apiuse() {
    switch (weather_api_choose) {
        case 1:
            getcity_qweatherapi("{城市} {天气}{气温}{露点温度}{体感} {风向}{风级}{风速}   {湿度} {降水} {大气压强}  {云} {能见度}");
            FristLoadWeather = false
            break
        case 2:
            getWeather_input_freeapi("{城市} {天气}{气温} {范围} {风向}{风级}")
            FristLoadWeather = false
            break
        case 3:
            getWeather_input_tianqiapi("{城市} {天气}{气温} {范围} {风向}{风级}{风速} {湿度} {空气质量} {大气气压}")
            FristLoadWeather = false
            break
        case 4:
            getWeather_input_VisualCrossingAPI()
            FristLoadWeather = false
            break
        case 5:
            getWeather_input_open_meteo()
            FristLoadWeather = false
            break
    }
    FristLoadWeather = false
}

//免费api
function getWeather_input_freeapi(strHtml) {
    $.get("https://api.icufree.com/weather.php?cityname=" + strCity, function (res) {

        console.log(JSON.stringify(res));
        cityname = res.cityname;
        temperature = res.feels;
        weathernow = res.weathernow;
        wind = res.wind;
        windLv = res.windLv;
        high = res.high;
        low = res.low;
        weather_webtext.innerHTML = FormatWeather_freeapi(strHtml);
    });

}
function FormatWeather_freeapi(strHtml) {
    return generateWeatherTable();
}

async function getWeather_input_qweatherapi(citynumber) {
    // 检查是否有经纬度信息
    if (!weather_address.latitude || !weather_address.longitude) {
        console.error("缺少经纬度信息，无法获取空气质量和预警数据");
        weather_webtext.innerHTML = generateWeatherTable();
        return;
    }

    console.log("使用经纬度:", weather_address.latitude, weather_address.longitude);

    if (!qweatherapi_paymode && weather_paymode()) {
        return Promise.reject(new Error(await get_i18n_text(error_get_weather_data_over_usage))); // 中断链
    }

    // 第一步：获取实时天气
    fetch(`https://${APIHost}/v7/weather/now?location=${citynumber}`,
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
            console.log("实时天气数据:", JSON.stringify(res));
            weather_data.updatetime = res.updateTime;

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

            // 第二步：获取空气质量信息
            if (!qweatherapi_paymode && weather_paymode()) {
                return Promise.reject(new Error(await get_i18n_text(error_get_weather_data_over_usage))); // 中断链
            }
            return fetch(`https://${APIHost}/airquality/v1/daily/${weather_address.latitude}/${weather_address.longitude}`,
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
            console.log("空气质量数据:", airData);
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
                        weather_data.air = aqiIndex.aqi || aqiIndex.aqiDisplay || await get_i18n_text("weather_no_data");
                        console.log("空气质量AQI:", air, "名称:", aqiIndex.name);
                    } else {
                        // 如果没有找到特定名称，使用第一个可用的指数
                        const firstIndex = day.indexes[0];
                        weather_data.air = firstIndex.aqi || firstIndex.aqiDisplay || await get_i18n_text("weather_no_data");
                        console.log("使用第一个空气质量指数:", air, "名称:", firstIndex.name);
                    }
                } else {
                    console.warn("空气质量指数数据为空");
                    weather_data.air = await get_i18n_text("weather_no_data");
                }
            } else {
                console.warn("空气质量数据为空或格式不正确");
                weather_data.air = await get_i18n_text("weather_no_data");
            }

            // 第三步：获取天气预警
            if (!qweatherapi_paymode && weather_paymode()) {
                return Promise.reject(new Error(await get_i18n_text(error_get_weather_data_over_usage))); // 中断链
            }
            return fetch(`https://${APIHost}/weatheralert/v1/current/${weather_address.latitude}/${weather_address.longitude}`,
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
            console.log("预警数据:", alertData);

            // 检查是否有预警数据
            if (alertData && alertData.metadata && alertData.metadata.zeroResult) {
                // 请求成功但无预警信息
                weather_data.weatherAlert = [{
                    alert: "诸事顺遂",
                    alertColor: "#ffffff"
                }];
            } else if (alertData && alertData.alerts && alertData.alerts.length > 0) {
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
                        icon: alertList.icon
                    }
                }); // 预警事件类型名称
            }

            // 第四步：获取逐小时降水概率预报
            if (!qweatherapi_paymode && weather_paymode()) {
                return Promise.reject(new Error(await get_i18n_text(error_get_weather_data_over_usage))); // 中断链
            }
            return fetch(`https://${APIHost}/v7/weather/24h?location=${citynumber}`,
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
        .then(hourlyData => {
            console.log("逐小时预报数据:", JSON.stringify(hourlyData));

            // 保存完整的24小时数据用于温度计算
            weather_data.hourlyData = hourlyData; // 保存为全局变量

            // 提取接下来7小时的降水概率
            if (hourlyData && hourlyData.hourly && hourlyData.hourly.length > 0) {
                // 取前7小时数据
                const next7Hours = hourlyData.hourly.slice(0, 7);

                // 提取时间和降水概率
                weather_data.hourlyTimes = next7Hours.map(hour => {
                    // 提取时间部分（如 "15:00"）
                    const timeStr = hour.fxTime;
                    return timeStr.split('T')[1].split('+')[0].substring(0, 5); // 获取 HH:MM 格式
                });

                weather_data.hourlyPops = next7Hours.map(hour => {
                    // 处理降水概率，如果为空显示"——"
                    return hour.pop !== undefined && hour.pop !== "" ? `${hour.pop}%` : "——";
                });

                console.log("降水概率时间:", weather_data.hourlyTimes);
                console.log("降水概率值:", weather_data.hourlyPops);
            } else {
                console.warn("逐小时预报数据为空");
                // 设置默认值
                weather_data.hourlyTimes = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
                weather_data.hourlyPops = ["0%", "0%", "0%", "0%", "0%", "0%", "0%"];
            }

            // 所有数据加载完成，一次性更新显示
            weather_webtext.innerHTML = generateWeatherTable();

            // 将 tooltip 绑到每个预警项上
            document.querySelectorAll(".weather-alert-item").forEach(item => {
                attachTooltip(item);
            });
        })
}

//天气api
function getWeather_input_tianqiapi(strHtml) {
    $.get("https://v1.yiketianqi.com/free/day?appid=" + appid + "&appsecret=" + appsecret + "&unescape=1&city=" + strCity, function (res) {

        console.log(JSON.stringify(res));
        cityname = res.city;
        temperature = res.tem;
        weathernow = res.wea;
        wind = res.win;
        windLv = res.win_speed;
        windSpeed = res.win_meter
        high = res.tem_day;
        low = res.tem_night;
        air = res.air;
        pressure = res.pressure;
        humidity = res.humidity;
        weather_webtext.innerHTML = FormatWeather_tianqiapi(strHtml);
    });

}
function FormatWeather_tianqiapi(strHtml) {
    return generateWeatherTable();
}

//Visual Crossing API
function getWeather_input_VisualCrossingAPI() {
    $.get("https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/" + strCity + "/today?unitGroup=" + weather_unit + "&include=current&key=" + VisualCrossing_Key + "&contentType=json&lang=" + weather_lang, async function (res) {

        console.log(JSON.stringify(res));
        var resn = res.currentConditions
        var resd = res.days[0]

        if (cityname_show) {
            cityname = res.resolvedAddress
        } else {
            cityname = nullweather
        }
        if (obstime_show) {
            obstime = wlang.datetime.replace("%1", resn.datetime)
        } else {
            obstime = nullweather
        }
        if (windspeed_show) {
            windSpeed = wlang.windSpeed.replace("%1", resn.windspeed).replace("%2", wunit.wind)
        } else {
            windSpeed = nullweather
        }
        if (humidity_show) {
            humidity = wlang.humidity.replace("%1", resn.humidity)
        } else {
            humidity = nullweather
        }
        if (temperature_show) {
            temperature = resn.temp + wunit.temp
        } else {
            temperature = nullweather
        }
        if (feelstemperature_show) {
            feels = wlang.feelstemperature.replace("%1", resn.feelslike).replace("%2", wunit.temp)
        } else {
            feels = nullweather
        }
        if (rangetemperature_show) {
            rangetemperature = wlang.rangetemperature.replace("%1", resd.tempmin).replace("%2", resd.tempmax).replace("%3", wunit.temp).replace("%3", wunit.temp)
        } else {
            rangetemperature = nullweather
        }
        if (rangefeelstemperature_show) {
            rangefeelstemperature = wlang.rangefeelstemperature.replace("%1", resd.feelslikemin).replace("%2", resd.feelslikemax).replace("%3", wunit.temp).replace("%3", wunit.temp)
        } else {
            rangefeelstemperature = nullweather
        }
        if (weathernow_show) {
            weathernow = resn.conditions
        } else {
            weathernow = nullweather
        }
        if (precipcover_show) {
            precipcover = wlang.precipcover.replace("%1", resd.preciptype).replace("%2", resd.precipcover)
        } else {
            precipcover = nullweather
        }
        if (precipprob_show) {
            precipprob = wlang.precipprob.replace("%1", resn.precipprob).replace("%2", resn.preciptype).replace("%3", resn.precip).replace("%4", wunit.precip_1)
        } else {
            precipprob = nullweather
        }
        if (snow_show) {
            snow = wlang.snow.replace("%1", resn.snow).replace("%2", wunit.snow_1)
        } else {
            snow = nullweather
        }
        if (snowdepth_show) {
            snowdepth = wlang.snowdepth.replace("%3", resn.snowdepth).replace("%2", wunit.snow)
        } else {
            snowdepth = nullweather
        }
        if (windgust_show) {
            windgust = wlang.windgust.replace("%1", resn.windgust).replace("%2", wunit.wind)
        } else {
            windgust = nullweather
        }
        if (vis_show) {
            visibility = wlang.vis.replace("%1", resn.visibility).replace("%2", wunit.vis)
        } else {
            visibility = nullweather
        }
        if (solarradiation_show) {
            solarradiation = wlang.solarradiation.replace("%1", resn.solarradiation).replace("%2", wunit.solarradiation)
        } else {
            solarradiation = nullweather
        }
        if (uvindex_show) {
            uvindex = wlang.uvindex.replace("%1", resn.uvindex)
        } else {
            uvindex = nullweather
        }
        if (sunriseset_show) {
            sunriseset = wlang.sunriseset.replace("%1", resd.sunrise).replace("%2", resd.sunset)//sunrise = resd.sunrise;sunset = resd.sunset
        } else {
            sunriseset = nullweather
        }
        if (cloud_show) {
            cloud = wlang.cloud.replace("%1", resn.cloudcover)
        } else {
            cloud = nullweather
        }
        if (dewtemperature_show) {
            dew = wlang.dewtemperature.replace("%1", resn.dew).replace("%2", wunit.temp)
        } else {
            dew = nullweather
        }
        if (pressure_show) {
            pressure = wlang.pressure.replace("%1", resn.pressure).replace("%2", wunit.pressure)
        } else {
            pressure = nullweather
        }

        if (wind_show) {
            if ((resn.winddir >= 337.5 && resn.winddir < 360) || (resn.winddir >= 0 && resn.winddir < 22.5)) {
                wind = await get_i18n_text("weather_wind_north");
            } else if (resn.winddir >= 22.5 && resn.winddir < 67.5) {
                wind = await get_i18n_text("weather_wind_northeast");
            } else if (resn.winddir >= 67.5 && resn.winddir < 112.5) {
                wind = await get_i18n_text("weather_wind_east");
            } else if (resn.winddir >= 112.5 && resn.winddir < 157.5) {
                wind = await get_i18n_text("weather_wind_southeast");
            } else if (resn.winddir >= 157.5 && resn.winddir < 202.5) {
                wind = await get_i18n_text("weather_wind_south");
            } else if (resn.winddir >= 202.5 && resn.winddir < 247.5) {
                wind = await get_i18n_text("weather_wind_southwest");
            } else if (resn.winddir >= 247.5 && resn.winddir < 292.5) {
                wind = await get_i18n_text("weather_wind_west");
            } else if (resn.winddir >= 292.5 && resn.winddir < 337.5) {
                wind = await get_i18n_text("weather_wind_northwest");
            } else {
                wind = await get_i18n_text("weather_no_data");
            }
        } else {
            wind = await get_i18n_text("weather_no_data");
        }

        if (moonphase_show) {
            switch (weather_lang) {//moonphase
                case "zh":
                    if (moonphase === 0 || resd.moonphase === 1) {
                        moonphase = wlang.moonphase.replace("%1", "新月")
                    } else if (resd.moonphase > 0 && resd.moonphase < 0.20) {
                        moonphase = wlang.moonphase.replace("%1", "娥眉月")
                    } else if (resd.moonphase >= 0.2 && resd.moonphase >= 0.3) {
                        moonphase = wlang.moonphase.replace("%1", "上弦月")
                    } else if (resd.moonphase > 0.30 && resd.moonphase < 0.5) {
                        moonphase = wlang.moonphase.replace("%1", "渐盈凸月")
                    } else if (resd.moonphase == 0.5) {
                        moonphase = wlang.moonphase.replace("%1", "满月")
                    } else if (resd.moonphase > 0.5 && resd.moonphase < 0.70) {
                        moonphase = wlang.moonphase.replace("%1", "渐亏凸月")
                    } else if (resd.moonphase >= 0.70 && resd.moonphase >= 0.80) {
                        moonphase = wlang.moonphase.replace("%1", "下弦月")
                    } else if (resd.moonphase > 0.80 && resd.moonphase < 1) {
                        moonphase = wlang.moonphase.replace("%1", "残月")
                    }
                    break
                case "en":
                    if (moonphase === 0 || resd.moonphase === 1) {
                        moonphase = wlang.moonphase.replace("%1", "New Moon")
                    } else if (resd.moonphase > 0 && resd.moonphase < 0.20) {
                        moonphase = wlang.moonphase.replace("%1", "Waxing Crescent Moon")
                    } else if (resd.moonphase >= 0.2 && resd.moonphase >= 0.3) {
                        moonphase = wlang.moonphase.replace("%1", "First Quarter Moon")
                    } else if (resd.moonphase > 0.30 && resd.moonphase < 0.5) {
                        moonphase = wlang.moonphase.replace("%1", "Waxing Gibbous Moon")
                    } else if (resd.moonphase == 0.5) {
                        moonphase = wlang.moonphase.replace("%1", "Full Moon")
                    } else if (resd.moonphase > 0.5 && resd.moonphase < 0.70) {
                        moonphase = wlang.moonphase.replace("%1", "Waning Gibbous Moon")
                    } else if (resd.moonphase >= 0.70 && resd.moonphase >= 0.80) {
                        moonphase = wlang.moonphase.replace("%1", "Last Quarter Moon")
                    } else if (resd.moonphase > 0.80 && resd.moonphase < 1) {
                        moonphase = wlang.moonphase.replace("%1", "Waning Crescent Moon")
                    }
                    break
            }
        } else {
            moonphase = nullweather
        }

        weather_webtext.innerHTML = generateWeatherTable();
    });
}

function getWeather_input_open_meteo() {
    $.get("https://api.open-meteo.com/v1/forecast?latitude=" + weather_address.latitude + "&longitude=" + weather_address.longitude + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=1" + "&temperature_unit=" + wunit.temperature_code + "&wind_speed_unit=" + wunit.wind_speed_code + "&precipitation_code" + wunit.precipitation_code, function (res) {
        console.log(res)

        //now
        if (obstime_show) {
            obstime = wlang.datetime.replace("%1", res.current.time.replace("T", " "))
        } else {
            obstime = nullweather
        }
        if (windspeed_show) {
            windSpeed = wlang.windSpeed.replace("%1", res.current.wind_speed_10m).replace("%2", wunit.wind)
        } else {
            windSpeed = nullweather
        }
        if (humidity_show) {
            humidity = wlang.humidity.replace("%1", res.current.relative_humidity_2m)
        } else {
            humidity = nullweather
        }
        if (temperature_show) {
            temperature = res.current.temperature_2m + wunit.temp
        } else {
            temperature = nullweather
        }
        if (feelstemperature_show) {
            feels = wlang.feelstemperature.replace("%1", res.current.apparent_temperature).replace("%2", wunit.temp)
        } else {
            feels = nullweather
        }
        if (rangetemperature_show) {
            rangetemperature = wlang.rangetemperature.replace("%1", res.daily.temperature_2m_min[0]).replace("%2", res.daily.temperature_2m_min[0]).replace("%3", wunit.temp).replace("%3", wunit.temp)
        } else {
            rangetemperature = nullweather
        }
        if (weathernow_show) {
            if (weather_lang == "zh") {
                const weatherCodes = {
                    0: "万里无云",
                    1: "多云",
                    2: "多云",
                    3: "阴天",
                    45: "雾",
                    48: "浓雾",
                    51: "毛毛雨",
                    53: "毛毛雨",
                    55: "毛毛雨",
                    56: "冰冻毛毛雨",
                    57: "冰冻毛毛雨",
                    61: "小雨",
                    63: "中雨",
                    65: "大雨",
                    67: "冻雨",
                    71: "小雪",
                    73: "中雪",
                    75: "大雪",
                    77: "冰雹",
                    80: "小阵雨",
                    81: "中阵雨",
                    82: "大阵雨",
                    85: "小阵雪",
                    86: "阵雪",
                    95: "雷暴",
                    96: "雷暴携冰雹",
                    99: "雷暴携大量冰雹"
                };
                weathernow = weatherCodes[res.current.weather_code]
            } else {
                const weatherCodes = {
                    0: "Clear sky",
                    1: "Cloudy",
                    2: "Cloudy",
                    3: "Overcast",
                    45: "Fog",
                    48: "Thick fog",
                    51: "Slight Drizzle",
                    53: "Moderate Drizzle",
                    55: "Heavy intensity Drizzle",
                    56: "Freezing Rain",
                    57: "Freezing Rain",
                    61: "Slight rain",
                    63: "Moderate rain",
                    65: "Heavy intensity rain",
                    67: "Freezing Rain",
                    71: "Slight Snow fall",
                    73: "Moderate Snow fall",
                    75: "Heavy intensity Snow fall",
                    77: "Snow grains",
                    80: "Slight Rain showers",
                    81: "Moderate Rain showers",
                    82: "Heavy intensity Rain showers",
                    85: "Slight Snow showers",
                    86: "Heavy Snow showers",
                    95: "Thunderstorm",
                    96: "Thunderstorm with slight hail",
                    99: "Thunderstorm with heavy hail"
                };
                weathernow = weatherCodes[res.current.weather_code]
            }
        } else {
            weathernow = nullweather
        }
        if (precip_show) {
            if (weather_lang == "zh") {
                precip = "降水" + res.current.precipitation + wunit.precip_1
            } else {
                precip = "Precipitation" + res.current.precipitation + wunit.precip_1
            }
        } else {
            precip = nullweather
        }
        if (windgust_show) {
            windgust = wlang.windgust.replace("%1", res.current.wind_gusts_10m).replace("%2", wunit.wind)
        } else {
            windgust = nullweather
        }
        if (sunriseset_show) {
            sunriseset = wlang.sunriseset.replace("%1", res.daily.sunrise[0].slice(-5)).replace("%2", res.daily.sunset[0].slice(-5))//sunrise = resd.sunrise;sunset = resd.sunset
        } else {
            sunriseset = nullweather
        }
        if (cloud_show) {
            cloud = wlang.cloud.replace("%1", res.current.cloud_cover)
        } else {
            cloud = nullweather
        }
        if (pressure_show) {
            pressure = wlang.pressure.replace("%1", res.current.pressure_msl).replace("%2", wunit.pressure)
        } else {
            pressure = nullweather
        }

        if (wind_show) {
            switch (weather_lang) {//wind
                case "zh":
                    if ((res.current.wind_direction_10m >= 337.5 && res.current.wind_direction_10m < 360) || (res.current.wind_direction_10m >= 0 && res.current.wind_direction_10m < 22.5)) {
                        wind = "北风"
                    } else if (res.current.wind_direction_10m >= 22.5 && res.current.wind_direction_10m < 67.5) {
                        wind = "东北风"
                    } else if (res.current.wind_direction_10m >= 67.5 && res.current.wind_direction_10m < 112.5) {
                        wind = "东风"
                    } else if (res.current.wind_direction_10m >= 112.5 && res.current.wind_direction_10m < 157.5) {
                        wind = "东南风"
                    } else if (res.current.wind_direction_10m >= 157.5 && res.current.wind_direction_10m < 202.5) {
                        wind = "南风"
                    } else if (res.current.wind_direction_10m >= 202.5 && res.current.wind_direction_10m < 247.5) {
                        wind = "西南风"
                    } else if (res.current.wind_direction_10m >= 247.5 && res.current.wind_direction_10m < 292.5) {
                        wind = "西风"
                    } else if (res.current.wind_direction_10m >= 292.5 && res.current.wind_direction_10m < 337.5) {
                        wind = "西北风"
                    } else {
                        wind = "未知风向"
                    }
                    break
                case "en":
                    if ((res.current.wind_direction_10m >= 337.5 && res.current.wind_direction_10m < 360) || (res.current.wind_direction_10m >= 0 && res.current.wind_direction_10m < 22.5)) {
                        wind = "north wind"
                    } else if (res.current.wind_direction_10m >= 22.5 && res.current.wind_direction_10m < 67.5) {
                        wind = "north-easterly wind"
                    } else if (res.current.wind_direction_10m >= 67.5 && res.current.wind_direction_10m < 112.5) {
                        wind = "east wind"
                    } else if (res.current.wind_direction_10m >= 112.5 && res.current.wind_direction_10m < 157.5) {
                        wind = "south-easterly wind"
                    } else if (res.current.wind_direction_10m >= 157.5 && res.current.wind_direction_10m < 202.5) {
                        wind = "south wind"
                    } else if (res.current.wind_direction_10m >= 202.5 && res.current.wind_direction_10m < 247.5) {
                        wind = "southwest wind"
                    } else if (res.current.wind_direction_10m >= 247.5 && res.current.wind_direction_10m < 292.5) {
                        wind = "west wind"
                    } else if (res.current.wind_direction_10m >= 292.5 && res.current.wind_direction_10m < 337.5) {
                        wind = "northwest wind"
                    } else {
                        wind = "uncharted wind"
                    }
                    break
            }
        } else {
            wind = nullweather
        }
        weather_webtext.innerHTML = generateWeatherTable();
    });
}

// 问候语变更逻辑
function getGreetingText() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '早上好，先生。';
    if (hour >= 12 && hour < 18) return '下午好，先生。';
    if (hour >= 18 && hour < 22) return '晚上好，先生。';
    return '夜深了，先生。';
}

// 新增：获取天气提示语
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
    if (typeof hourlyData !== 'undefined' && weather_data.hourlyData.hourly) {
        weather_data.hourlyData.hourly.forEach(hour => {
            const temp = parseInt(hour.temp);
            if (!isNaN(temp)) {
                if (temp > maxTemp) maxTemp = temp;
                if (temp < minTemp) minTemp = temp;
            }
        });
    }

    // 如果无法从24小时数据获取温度，使用当前温度作为默认值
    if (maxTemp === -100 && temperature && temperature !== "未获取") {
        const currentTemp = parseInt(weather_data.temperature);
        if (!isNaN(currentTemp)) {
            maxTemp = currentTemp;
            minTemp = currentTemp;
        }
    }

    // 优先级0: 天气晴朗，早上好、下午好、晚上好时
    if ((weatherText.includes('晴') || weatherText.includes('多云')) && !isNight) {
        tips.push({ priority: 0, text: '祝您拥有愉快的一天。' });
    }

    // 优先级1: 下雨
    if (weatherText.includes('雨')) {
        tips.push({ priority: 1, text: '今日有雨，建议携带雨具。' });
    }

    // 优先级2: 大风
    if (windScale >= 5) {
        tips.push({ priority: 2, text: '今日大气对流活动增强。' });
    }

    // 优先级3: 极端温度
    if (maxTemp >= 35) {
        tips.push({ priority: 3, text: '今日大气温度异常上升。' });
    } else if (minTemp <= -10) {
        tips.push({ priority: 3, text: '今日大气温度异常降低。' });
    }

    // 优先级4: 空气质量差
    if (airQuality > 100) {
        tips.push({ priority: 4, text: '今日大气杂质浓度异常。' });
    }

    // 优先级5: 下雪
    if (weatherText.includes('雪')) {
        tips.push({ priority: 5, text: '今日有雪，建议部署防滑措施。' });
    }

    // 优先级6: 天气晴朗，夜深了时
    if ((weatherText.includes('晴') || weatherText.includes('多云')) && isNight) {
        tips.push({ priority: 6, text: '请您注意休息，不休息也行。' });
    }

    // 按优先级排序，取优先级最高的
    if (tips.length > 0) {
        tips.sort((a, b) => b.priority - a.priority);
        return tips[0].text;
    }

    return '';
}

// ========== 新增表格显示函数 ==========
function generateWeatherTable() {
    console.log("生成天气表格函数被调用");
    // 检查数据是否已加载
    if (weather_data.temperature === "未获取" && weather_data.weathernow === "未获取") {
        return `
        <div class="weather-table-container" style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px;">
            <div style="color: white; text-align: center; font-size: 16px;">
                正在加载天气数据...
            </div>
        </div>
        `;
    }

    // 获取当前时间用于问候语
    const hour = new Date().getHours();
    let greeting = "祝您拥有愉快的一天";
    if (hour < 6) greeting = "夜深了，注意休息";
    else if (hour < 12) greeting = "早上好，祝您拥有愉快的一天";
    else if (hour < 14) greeting = "中午好，记得用餐";
    else if (hour < 18) greeting = "下午好，保持活力";
    else greeting = "晚上好，放松身心";

    // 获取天气图标
    function getWeatherIcon(weatherText) {
        const iconMap = {
            '晴': '☀️', '多云': '⛅', '阴': '☁️', '雨': '🌧', '雪': '❄️',
            '雾': '🌫', '雷': '⛈', '风': '💨', '沙': '🌪', '小雨': '🌧',
            '中雨': '🌧', '大雨': '🌧', '暴雨': '🌧', '小雪': '❄️', '中雪': '❄️',
            '大雪': '❄️', '暴雪': '❄️'
        };
        for (let key in iconMap) {
            if (weatherText && weatherText.includes(key)) return iconMap[key];
        }
        return '🌈';
    }

    // 获取空气质量等级
    function getAirQualityText(airValue) {
        if (!airValue || airValue === "未获取") return "未获取";

        // 尝试转换为数字
        let airNum = parseFloat(airValue);
        if (isNaN(airNum)) {
            // 如果无法转换为数字，直接返回原值
            return airValue;
        }

        // 根据中国空气质量指数标准分级
        if (airNum <= 50) return `优 (${airNum})`;
        if (airNum <= 100) return `良 (${airNum})`;
        if (airNum <= 150) return `轻度污染 (${airNum})`;
        if (airNum <= 200) return `中度污染 (${airNum})`;
        if (airNum <= 300) return `重度污染 (${airNum})`;
        return `严重污染 (${airNum})`;
    }

    function getAlart() {
        // severity 排序权重（越大越严重）
        const severityLevel = {
            extreme: 5,
            severe: 4,
            moderate: 3,
            minor: 2,
            unknown: 1
        };

        // 排序预警数组（从严重到轻微）
        let alerts = [...(weather_data.weatherAlert || [])].sort((a, b) => {
            return severityLevel[b.level] - severityLevel[a.level];
        });
        console.log("排序后的预警信息:", alerts);

        // 生成所有预警 HTML
        let alertsHTML = "";
        alerts.forEach(a => {
            alertsHTML += `<span class="weather-alert-item" style="color: rgb(${a.color}); font-weight: bold; margin-right: 10px;" data-id="${a.id}">${a.alert}</span>`;
        });

        if (air_show) {
            tableHTML += `<td class="weather-cell air-title-cell">空气质量</td>`;
            tableHTML += `<td class="weather-cell air-value-cell">${getAirQualityText(weather_data.air)}</td>`;
            tableHTML += `<td class="weather-cell warning-cell" colspan="4">预警信息：<div class="weather-alert-items-warp"><div class="weather-alert-items">${alertsHTML}<div><div></td>`;
        } else {
            tableHTML += `<td class="weather-cell warning-cell" colspan="6">预警信息：${alertsHTML}</td>`;
        }
    }

    // 构建表格HTML
    let tableHTML = `
    <div class="weather-table-container">
        <table class="weather-table">
            <tr class="weather-row main-row">
    `;

    // 第一行：城市和主要天气信息
    if (cityname_show) {
        tableHTML += `<td class="weather-cell city-cell" rowspan="2">${weather_address.cityname || "未获取"}</td>`;
    }

    if (weathernow_show) {
        tableHTML += `
            <td class="weather-cell icon-cell">${getWeatherIcon(weather_data.weathernow || "")}</td>
            <td class="weather-cell weather-cell">${weather_data.weathernow || "未获取"}</td>
        `;
    }

    if (temperature_show) {
        tableHTML += `<td class="weather-cell temp-cell">${weather_data.temperature || "未获取"}${wunit.temp || "℃"}</td>`;
    }

    if (feelstemperature_show) {
        tableHTML += `<td class="weather-cell feels-cell">体感${weather_data.feels || "未获取"}${wunit.temp || "℃"}</td>`;
    }

    if (humidity_show) {
        tableHTML += `<td class="weather-cell humidity-cell">湿度${weather_data.humidity || "未获取"}%</td>`;
    }

    tableHTML += `</tr><tr class="weather-row detail-row">`;

    // 第二行：风力和能见度信息
    if (wind_show) {
        tableHTML += `<td class="weather-cell wind-cell">${weather_data.wind || "未获取"}</td>`;
    }

    if (windlv_show) {
        tableHTML += `<td class="weather-cell wind-level-cell">${weather_data.windLv || "未获取"}级</td>`;
    }

    if (windspeed_show) {
        tableHTML += `<td class="weather-cell wind-speed-cell">${weather_data.windSpeed || "未获取"}${wunit.wind || "km/h"}</td>`;
    }

    if (vis_show) {
        tableHTML += `<td class="weather-cell visibility-cell">能见度${weather_data.vis || "未获取"}${wunit.vis || "km"}</td>`;
    }

    if (cloud_show) {
        tableHTML += `<td class="weather-cell cloud-cell">云度${weather_data.cloud || "未获取"}%</td>`;
    }

    tableHTML += `</tr><tr class="weather-row air-row">`;

    // 第三行：空气质量
    getAlart();

    // 降水概率行（动态显示）
    tableHTML += `
        <tr class="weather-row precip-row">
            <td class="weather-cell precip-icon">🌧</td>
            <td class="weather-cell precip-times" colspan="5">
                <span class="precip-time-cell">${weather_data.hourlyTimes[0] || "12:00"}</span>
                <span class="precip-time-cell">${weather_data.hourlyTimes[1] || "13:00"}</span>
                <span class="precip-time-cell">${weather_data.hourlyTimes[2] || "14:00"}</span>
                <span class="precip-time-cell">${weather_data.hourlyTimes[3] || "15:00"}</span>
                <span class="precip-time-cell">${weather_data.hourlyTimes[4] || "16:00"}</span>
                <span class="precip-time-cell">${weather_data.hourlyTimes[5] || "17:00"}</span>
                <span class="precip-time-cell">${weather_data.hourlyTimes[6] || "18:00"}</span>
            </td>
        </tr>
        <tr class="weather-row precip-prob-row">
            <td class="weather-cell dice-icon">🎲</td>
            <td class="weather-cell precip-probs" colspan="5">
                <span class="precip-prob-cell">${weather_data.hourlyPops[0] || "N/A%"}</span>
                <span class="precip-prob-cell">${weather_data.hourlyPops[1] || "N/A%"}</span>
                <span class="precip-prob-cell">${weather_data.hourlyPops[2] || "N/A%"}</span>
                <span class="precip-prob-cell">${weather_data.hourlyPops[3] || "N/A%"}</span>
                <span class="precip-prob-cell">${weather_data.hourlyPops[4] || "N/A%"}</span>
                <span class="precip-prob-cell">${weather_data.hourlyPops[5] || "N/A%"}</span>
                <span class="precip-prob-cell">${weather_data.hourlyPops[6] || "N/A%"}</span>
            </td>
        </tr>
    `;

    // 问候语行
    const greetingText = getGreetingText();
    const weatherTip = getWeatherTips();
    const fullGreeting = weatherTip ? `${greetingText} ${weatherTip}` : greetingText;

    tableHTML += `
        <tr class="weather-row greeting-row">
            <td class="weather-cell greeting-cell" colspan="6">${fullGreeting}</td>
        </tr>
    `;
    tableHTML += `
        </table>
    </div>
    `;


    return tableHTML;
}
