var weather = document.querySelector("#weather");
var weather_webtext = document.querySelector("#weather .text");

var checkcity
var wt
var wunit = {}
var wlang = {}
var weather_lat = {
    latitude: "",
    longitude: ""
}

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

function autoWeather() {
    getcity();
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
    switch (api) {
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
    if (cityname_show) {
        strHtml = strHtml.replace("{城市}", cityname);
    } else {
        strHtml = strHtml.replace("{城市}", nullweather);
    }
    if (temperature_show) {
        strHtml = strHtml.replace("{气温}", temperature + "℃");
    } else {
        strHtml = strHtml.replace("{气温}", nullweather);
    }
    if (weathernow_show) {
        strHtml = strHtml.replace("{天气}", weathernow);
    } else {
        strHtml = strHtml.replace("{天气}", nullweather);
    }
    if (wind_show) {
        strHtml = strHtml.replace("{风向}", wind);
    } else {
        strHtml = strHtml.replace("{风向}", nullweather);
    }
    if (windlv_show) {
        strHtml = strHtml.replace("{风级}", windLv);
    } else {
        strHtml = strHtml.replace("{风级}", nullweather);
    }
    if (rangetemperature_show) {
        strHtml = strHtml.replace("{范围}", low + "~" + high + "℃");
    } else {
        strHtml = strHtml.replace("{范围}", nullweather);
    }

    return strHtml;
}

//和风天气api
function getcity_qweatherapi(strHtml) {
    if (!qweatherapi_paymode) {
        if (localStorage.getItem('UseNumber') == null) {
            localStorage.setItem('UseNumber', "0");
        }

        if (parseInt(localStorage.getItem('UseNumber')) + 1 > 50000) return;
        if (new Date().day === 1) localStorage.setItem('UseNumber', "0")
    }
    let APIHost = window.APIHost === "" ? "geoapi.qweather.com" : `${window.APIHost}/geo`;
    if (citynumber == "" || strCity != checkcity) {
        if (!qweatherapi_paymode) localStorage.setItem('UseNumber', parseInt(localStorage.getItem('UseNumber')) + 1);
        checkcity = strCity
        fetch(`https://${APIHost}/v2/city/lookup?location=${strCity}`,
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
            .then(data => {
                console.log(JSON.stringify(data));
                citynumber = data.location[0].id
                cityname = data.location[0].name
                getWeather_input_qweatherapi(citynumber, strHtml);
            })
    } else {
        getWeather_input_qweatherapi(citynumber, strHtml);
    }
}
function getWeather_input_qweatherapi(citynumber, strHtml) {
    if (!qweatherapi_paymode) {
        if (parseInt(localStorage.getItem('UseNumber')) + 1 > 50000) return;
    }
    localStorage.setItem('UseNumber', parseInt(localStorage.getItem('UseNumber')) + 1);

    let APIHost = window.APIHost === "" ? "devapi.qweather.com" : window.APIHost;
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
        .then(res => {
            console.log(JSON.stringify(res));
            times = res.updateTime;

            windSpeed = res.now.windSpeed;
            humidity = res.now.humidity;
            temperature = res.now.temp;
            feels = res.now.feelsLike;
            weathernow = res.now.text;
            wind = res.now.windDir;
            windLv = res.now.windScale;
            precip = res.now.precip;
            cloud = res.now.cloud;
            vis = res.now.vis;
            dew = res.now.dew;
            pressure = res.now.pressure;

            weather_webtext.innerHTML = FormatWeather_qweatherapi(strHtml);
        })
}
function FormatWeather_qweatherapi(strHtml) {
    if (temperature_show) {
        strHtml = strHtml.replace("{气温}", temperature + "℃");
    } else {
        strHtml = strHtml.replace("{气温}", nullweather);
    }
    if (windspeed_show) {
        strHtml = strHtml.replace("{风速}", windSpeed + "KM/h");
    } else {
        strHtml = strHtml.replace("{风速}", nullweather);
    }
    if (humidity_show) {
        strHtml = strHtml.replace("{湿度}", "湿度" + humidity + "%");
    } else {
        strHtml = strHtml.replace("{湿度}", nullweather);
    }
    if (feelstemperature_show) {
        strHtml = strHtml.replace("{体感}", "体感" + feels + "℃");
    } else {
        strHtml = strHtml.replace("{体感}", nullweather);
    }
    if (weathernow_show) {
        strHtml = strHtml.replace("{天气}", weathernow);
    } else {
        strHtml = strHtml.replace("{天气}", nullweather);
    }
    if (wind_show) {
        strHtml = strHtml.replace("{风向}", wind);
    } else {
        strHtml = strHtml.replace("{风向}", nullweather);
    }
    if (precip_show) {
        if (precip === "0.0") {
            strHtml = strHtml.replace("{降水}", nullweather);
        } else {
            strHtml = strHtml.replace("{降水}", "降水" + precip + "mm/h");
        }

    } else {
        strHtml = strHtml.replace("{降水}", nullweather);
    }
    if (cloud_show) {
        strHtml = strHtml.replace("{云}", "云层密度" + cloud + "%");
    } else {
        strHtml = strHtml.replace("{云}", nullweather);
    }
    if (windlv_show) {
        strHtml = strHtml.replace("{风级}", windLv + "级");
    } else {
        strHtml = strHtml.replace("{风级}", nullweather);
    }
    if (vis_show) {
        strHtml = strHtml.replace("{能见度}", "能见度" + vis + "KM");
    } else {
        strHtml = strHtml.replace("{能见度}", nullweather);
    }
    if (dewtemperature_show) {
        strHtml = strHtml.replace("{露点温度}", "露点" + dew + "℃");
    } else {
        strHtml = strHtml.replace("{露点温度}", nullweather);
    }
    if (pressure_show) {
        strHtml = strHtml.replace("{大气压强}", "大气压强" + pressure + "hPa");
    } else {
        strHtml = strHtml.replace("{大气压强}", nullweather);
    }
    if (cityname_show) {
        strHtml = strHtml.replace("{城市}", cityname);
    } else {
        strHtml = strHtml.replace("{城市}", nullweather);
    }
    return strHtml
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
    if (cityname_show) {
        strHtml = strHtml.replace("{城市}", cityname);
    } else {
        strHtml = strHtml.replace("{城市}", nullweather);
    }
    if (temperature_show) {
        strHtml = strHtml.replace("{气温}", temperature + "℃");
    } else {
        strHtml = strHtml.replace("{气温}", nullweather);
    }
    if (weathernow_show) {
        strHtml = strHtml.replace("{天气}", weathernow);
    } else {
        strHtml = strHtml.replace("{天气}", nullweather);
    }
    if (wind_show) {
        strHtml = strHtml.replace("{风向}", wind);
    } else {
        strHtml = strHtml.replace("{风向}", nullweather);
    }
    if (windlv_show) {
        strHtml = strHtml.replace("{风级}", windLv);
    } else {
        strHtml = strHtml.replace("{风级}", nullweather);
    }
    if (rangetemperature_show) {
        strHtml = strHtml.replace("{范围}", low + "~" + high + "℃");
    } else {
        strHtml = strHtml.replace("{范围}", nullweather);
    }
    if (pressure_show) {
        strHtml = strHtml.replace("{大气气压}", "大气压强" + pressure + "hPa");
    } else {
        strHtml = strHtml.replace("{大气气压}", nullweather);
    }
    if (humidity_show) {
        strHtml = strHtml.replace("{湿度}", "湿度" + humidity);
    } else {
        strHtml = strHtml.replace("{湿度}", nullweather);
    }
    if (air_show) {
        strHtml = strHtml.replace("{空气质量}", "空气质量" + air);
    } else {
        strHtml = strHtml.replace("{空气质量}", nullweather);
    }
    if (windspeed_show) {
        strHtml = strHtml.replace("{风速}", windSpeed);
    } else {
        strHtml = strHtml.replace("{风速}", nullweather);
    }
    return strHtml;
}

//Visual Crossing API
function getWeather_input_VisualCrossingAPI() {
    $.get("https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/" + strCity + "/today?unitGroup=" + weather_unit + "&include=current&key=" + VisualCrossing_Key + "&contentType=json&lang=" + weather_lang, function (res) {

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
            switch (weather_lang) {//wind
                case "zh":
                    if ((resn.winddir >= 337.5 && resn.winddir < 360) || (resn.winddir >= 0 && resn.winddir < 22.5)) {
                        wind = "北风"
                    } else if (resn.winddir >= 22.5 && resn.winddir < 67.5) {
                        wind = "东北风"
                    } else if (resn.winddir >= 67.5 && resn.winddir < 112.5) {
                        wind = "东风"
                    } else if (resn.winddir >= 112.5 && resn.winddir < 157.5) {
                        wind = "东南风"
                    } else if (resn.winddir >= 157.5 && resn.winddir < 202.5) {
                        wind = "南风"
                    } else if (resn.winddir >= 202.5 && resn.winddir < 247.5) {
                        wind = "西南风"
                    } else if (resn.winddir >= 247.5 && resn.winddir < 292.5) {
                        wind = "西风"
                    } else if (resn.winddir >= 292.5 && resn.winddir < 337.5) {
                        wind = "西北风"
                    } else {
                        wind = "未知风向"
                    }
                    break
                case "en":
                    if ((resn.winddir >= 337.5 && resn.winddir < 360) || (resn.winddir >= 0 && resn.winddir < 22.5)) {
                        wind = "north wind"
                    } else if (resn.winddir >= 22.5 && resn.winddir < 67.5) {
                        wind = "north-easterly wind"
                    } else if (resn.winddir >= 67.5 && resn.winddir < 112.5) {
                        wind = "east wind"
                    } else if (resn.winddir >= 112.5 && resn.winddir < 157.5) {
                        wind = "south-easterly wind"
                    } else if (resn.winddir >= 157.5 && resn.winddir < 202.5) {
                        wind = "south wind"
                    } else if (resn.winddir >= 202.5 && resn.winddir < 247.5) {
                        wind = "southwest wind"
                    } else if (resn.winddir >= 247.5 && resn.winddir < 292.5) {
                        wind = "westwind"
                    } else if (resn.winddir >= 292.5 && resn.winddir < 337.5) {
                        wind = "northwest wind"
                    } else {
                        wind = "uncharted wind"
                    }
                    break
            }
        } else {
            wind = nullweather
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

        weather_webtext.innerHTML = obstime + " " + cityname + " " + weathernow + " " + temperature + " " + feels + " " + dew + " " + rangetemperature + " " + rangefeelstemperature + " " + wind + windSpeed + windgust + " " + precipcover + " " + precipprob + " " + snow + " " + humidity + " " + snowdepth + " " + visibility + " " + moonphase + " " + uvindex + " " + cloud + " " + pressure + " " + sunriseset + " " + solarradiation
    });
}


function getWeather_input_open_meteo() {
    $.get("https://api.open-meteo.com/v1/forecast?latitude=" + weather_lat.latitude + "&longitude=" + weather_lat.longitude + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=1" + "&temperature_unit=" + wunit.temperature_code + "&wind_speed_unit=" + wunit.wind_speed_code + "&precipitation_code" + wunit.precipitation_code, function (res) {
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
                        wind = "westwind"
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
        weather_webtext.innerHTML = obstime + " " + weathernow + " " + temperature + " " + feels + " " + rangetemperature + " " + wind + windSpeed + windgust + " " + precip + " " + humidity + " " + cloud + " " + pressure + " " + sunriseset
    })
}


var weather_graph_top = document.querySelector("#weather_graph .text_top")
var weather_graph_bottom = document.querySelector("#weather_graph .text_bottom")
var weather_graph_graph = document.querySelector("#weather_graph .graph")
//天气图表  
function weather_graph() {

}

// 调用天气API函数  

