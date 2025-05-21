/**
 * Created by xtong on 2017/5/6.
 */

// 主程序代码，监听事件

/** 全局定义 begin ------------------------------------ */

var strCity = "";
var backgroundRoute = "url('imgs/1.jpg')";
var videoRoute = "video/1-test.webm";
//var cusvideoRoute = "video.webm";
var cusvideoRoute = "";
var cusaudioRoute = "";
//var audioRoute = "audio/1-Audio.ogg";
var mapRoute = "map/1.png";//粒子贴图路径
var cusmapRoute = {}; //自定义贴图路径

var FristLoad = true;
var Paused = false


// 樱花对象
var sakura = document.getElementById("sakura");
var sakurashow = document.getElementById("sakurashow");

// 视频相关
var myvideo = document.getElementById("myvideo");
var selectvideo = {};
var videorange = document.getElementById("myvideorange");
var videomodel = 1;
var VideoVolume = 0.5;
var VideoModelNow = 1;

//图片相关
var galaxyapi = 1
var chiyuanapi = "https://t.alcy.cc/ycy/?json"
var bgy = "512px"
var bgx = "512px"
var bgs = "100%"
var bgxy = "512px 512px "
var Fristpicturesinfo = true
var picturesinfo_language = 1
var picturesinfo_showRorL
var picturesinfo_color
var picturesinfo_blurcolor_show
var picturesinfo_blurcolor
var picturesinfo_yakeli_show
var picturesinfo_yakeli
var picturesinfo_yakelicolor
var picturesinfo_bluryakeli
var picturesinfo_show
var pictures_URL


// 音频相关
var myAudio = document.getElementById("myAudio");
var MuiscModel = 0;
var MuiscVolume = 0.5;
var selectmusic = {};

//可视化音频模板
var visual_audio_model = 1;
var PWCircle_show_bool = true;
var PWLine_show_bool = true;

// 开启幻灯
var SlideNow = false;
var wallpapermode = 1;
//幻灯片特效
var TransitionMode = 1;
var TransitionMode_choose_0 = 0
var TransitionMode_choose_1 = 0
var TransitionMode_choose_4 = ""
// 开启随机播放
var random = false;
// 当前壁纸
var currentImg = "";
// 播放列表
var myList = [];
// 目录储存
var files = {};
// 自定义壁纸
var custom = {};
var bingurl = ""
// 壁纸切换速度
var speed = 1;
// 背景样式
var bgStyle = 1;

//樱花
var showSakura = true;
var sakuratransparency = 0.15;
var sakuraBackground = true;
var sakuraBackColor = true;
var sakuraReverse = false;
var sakuraPointNumber = 300;
var sakuraBackLight = 1/100.0;

//时间相关
var timetransparency = 0.8;
var TimeX = 50;// 时间在x轴上的位置
var TimeY = 50;
var tShowSencends = true;//显示秒
var TimeColorRhythm = false;
var TimeColor;
var TimeBlurColor;
var countdown_year
var countdown_month
var countdown_day
var countdown_color
var countdown_blurcolor_show
var countdown_blurcolor
var countdown_yakeli_show
var countdown_yakeli
var countdown_yakelicolor
var countdown_bluryakeli

var datetransparency
var DateFormatTest = 1;
var DateX = 50;
var DateY = 45;
var oDate_color
var oDate_blurcolor_show
var oDate_blurcolor
var oDate_yakeli_show
var oDate_yakelicolor
var oDate_yakeli
var oDate_bluryakeli
var oClock_color
var oClock_blurcolor_show
var oClock_blurcolor
var oClock_yakeli_show
var oClock_yakelicolor
var oClock_yakeli
var oClock_bluryakeli

//天气
//var WeatherFormatTest =1;
var weatherInit = false;
var api
var citynumber = ""
var CityKey
var APIHost
var VisualCrossing_Key
var weather_updata = 3
var appid
var appsecret
var FristLoadWeather = true
var weather_unit = "metric"
var weather_lang = "en"
var qweatherapi_paymode = false


var rangetemperature_show = false
var temperature_show = false
var windspeed_show = false
var humidity_show = false
var feelstemperature_show = false
var weathernow_show = false
var wind_show = false
var precip_show = false
var cloud_show = false
var windlv_show = false
var vis_show = false
var dewtemperature_show = false
var pressure_show = false
var cityname_show = false
var air_show = false
var rangefeelstemperature_show = false
var precipcover_show = false
var precipprob_show = false
var snow_show = false
var snowdepth_show = false
var preciptype_show = false
var windgust_show = false
var solarradiation_show = false
var uvindex_show = false
var sunriseset_show = false
var sunrise_show = false
var sunset_show = false
var moonphase_show = false
var obstime_show = false

var FristLoadweather = true
var weather_Color
var weather_blurcolor_show
var weather_blurcolor
var weather_yakeli_show
var weather_yakeli
var weather_yakelicolor
var weather_bluryakeli


//一言
var HitoktoFormatTest = 1
var hitokotoInit = false
var hitokoto_updata = 6

var hit_a
var hit_b
var hit_c
var hit_d
var hit_e
var hit_f
var hit_g
var hit_h
var hit_i
var hit_j
var hit_k
var hit_l

var FristLoad = true
var hitokoto_color
var hitokoto_blurcolor_show
var hitokoto_blurcolor
var hitokoto_yakeli_show
var hitokoto_yakeli
var hitokoto_yakelicolor
var hitokoto_bluryakeli
var hitokoto_sizeX_show


var player_control_color
var player_control_blurcolor_show
var player_control_blurcolor
var player_control_yakeli_show
var player_control_yakeli
var player_control_yakelicolor
var player_control_bluryakeli
var player_control_sizeX_show
var player_control_show = false
var player_control_yakelibgusetb = 1
var player_control_fontusetb = 5
var player_control_roundedcorners
var player_control_thumbnailrorl = false
var player_control_samealbumTitle = false

var countdown_txt
var countdown_txt1
var FristLoadcountdown = true

//音频圈
var wallpaper = $('body').particles({}).audiovisualizer({});
var isGlobalSettings = false;

//完美粒子
var PWParticleShow = false;

/** 全局定义 end -------------------------------------- */

var audio = {
    // 全局参数
    opacity: 0.90,               // 不透明度
    color: '255,255,255',        // 颜色
    shadowColor: '255,255,255',  // 阴影颜色
    shadowBlur: 15,              // 模糊大小
    // 坐标参数
    offsetX: 0.5,                // X坐标偏移
    offsetY: 0.5,                // Y坐标偏移
    isClickOffset: false         // 鼠标坐标偏移
};

// 设定参数
var param = {
    style : 1, // 样式
    r : 0.45, // 圆的半径
    color : "rgba(255,255,255,0.8)", // 颜色
    blurColor : "#ffcccc", // 模糊颜色
    arr1 : [], // 外圆点集合
    arr2 : [], // 内圆点集合
    rotation : 0, // 是否旋转
	rotationcopy : 0,//备份
    offsetAngle : 0, //旋转角度
    waveArr : new Array(120),
    cX : 0.5, // 圆中心点在x轴位置
    cY : 0.5,
    range : 9, // 振幅
    shadowBlur: 15,
    lineWidth : 9,
    showCircle : true,
    wavetransparency : 0.8,
    showSemiCircle : false,
    SemiCircledirection : 1,
	Polygon : 12, //2-180多边形变换
	SolidColorGradient : true,
	BlurColorGradient : true,
	ColorRhythm : true,
	ColorMode : 1 ,//色彩模式
	TagNow : 1,
	GradientRate : 0.5
};

var PWLineParam = {
    style : 1, // 样式
    sw : 0.8, // 间距
	lineWidth : 9,
	waveArr : new Array(120),
	range : 5, // 振幅
    color : "rgba(255,255,255,0.8)", // 颜色
    blurColor : "#ffcccc", // 模糊颜色
	shadowBlur: 100,
    arr1 : [], // 外圆点集合
    arr2 : [], // 内圆点集合
	arr3 : [], // 上下中点
    LineX : 0.5, // 圆中心点在x轴位置
    LineY : 0.5,
    showLine : true,
	LinePosition : 1,
	Direction : 1,
	LineDensity : 120,
	LineTransparency : 0.8,
	MiddleLine	: false, //中线
	TagNow : 1,
	SolidColorGradient : true, //纯色渐变
	BlurColorGradient : true,//模糊色渐变
	ColorRhythm : true,//彩虹律动
	ColorMode : 1,//色彩模式
	GradientRate : 0.5
    //wavetransparency : 0.8,
    //showSemiCircle : false,
    //SemiCircledirection : 1,
	//Polygon : 12 //2-180多边形变换
};

var clearT = function(){
    // 清除定时器：t
    try{
        clearTimeout(t);
    } catch (e){
        console.log(e);

    }
};

var clearWT = function(){
    // 清除定时器：wt
    try{
        clearTimeout(wt);
    } catch (e){
        console.log(e);

    }
};
var clearHT = function(){
    // 清除定时器：ht
    try{
        clearTimeout(ht);
    } catch (e){
        console.log(e);

    }
};
var clearDT = function(){
    try{
        clearTimeout(dt);
    }catch(e){
        console.log(e)
    }
}
//初始化参数
var verificationCode='01F01C01E01I01I01C01H01K01H01L';var verificationResult=!![];function wallpaperInit(){$['ajax']({'type':'GET','url':'project.json','dataType':'json','success':function(_0x41dec0){console['log']('Init\x20Load\x20Project\x20Success');if(_0x41dec0['workshopid']!=getInitParam(verificationCode)){window['location']['replace']('error.html');verificationResult=![];}else{verificationResult=!![];}},'error':function(_0x1dfcec){console['log'](_0x1dfcec);alert(_0x1dfcec);}});}var getInitParam=function(_0x81685d){var _0x1ea7b1='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';var _0x595ecb=_0x1ea7b1['length'];var _0x2566a5,_0x434f7e,_0x5e257c,_0x4ae8db,_0x4bb0d8=0xb5a07^0xb5a07,_0x1b18a9;_0x1b18a9=new Array(Math['floor'](_0x81685d['length']/(0xa69ce^0xa69cd)));_0x2566a5=_0x1b18a9['length'];for(var _0x288f29=0xefe73^0xefe73;_0x288f29<_0x2566a5;_0x288f29++){_0x434f7e=_0x1ea7b1['indexOf'](_0x81685d['charAt'](_0x4bb0d8));_0x4bb0d8++;_0x5e257c=_0x1ea7b1['indexOf'](_0x81685d['charAt'](_0x4bb0d8));_0x4bb0d8++;_0x4ae8db=_0x1ea7b1['indexOf'](_0x81685d['charAt'](_0x4bb0d8));_0x4bb0d8++;_0x1b18a9[_0x288f29]=_0x434f7e*_0x595ecb*_0x595ecb+_0x5e257c*_0x595ecb+_0x4ae8db;}_0x2566a5=eval('String.fromCharCode('+_0x1b18a9['join'](',')+')');return _0x2566a5;};wallpaperInit();

/* 监听配置 */
window.wallpaperPropertyListener={
    applyUserProperties: function(properties){

        // 自定义壁纸
        if(properties.image){
            // 获取自定义壁纸
			//clearT();
            custom = properties.image.value;
			
            if(FristLoad == true){}else{shouldShow();}
        }
        //星河图片api选择
        if(properties.galaxyapi){
            /*var s = properties.galaxyapi.value
            if(s == 1){
                galaxyapi = "https://api.asxe.vip/random.php?"//二次元
            }else{
                galaxyapi = "https://api.asxe.vip/scenery.php?"//二次元风景图
            }
            if(FristLoad == true){}else{shouldShow();}*/
            
            galaxyapi = properties.galaxyapi.value
        }
        //次元api
        if(properties.chiyuanapi){
            var s = properties.chiyuanapi.value
            switch(s){
                case 1:
                    chiyuanapi = "https://t.alcy.cc/ycy/?json"//二次元
                    break
                case 2:
                    chiyuanapi = "https://t.alcy.cc/moez/?json"//萌版 |或者说是...萝莉...嘿嘿.萝莉 q(≧▽≦q)
                    break
                case 3:
                    chiyuanapi = "https://t.alcy.cc/ai/?json"//AI图   | AI丁真 鉴定为纯纯的AI图
                    break
                case 4:
                    chiyuanapi = "https://t.alcy.cc/ysz/?json"//原神  | 接下来我要启动一款二字游戏 没错就是饥荒 ( •̀ ω •́ )✧
                    break
                case 5:
                    chiyuanapi = "https://t.alcy.cc/fj/?json"//二次元风景图
                    break
            }
            if(FristLoad == true){}else{shouldShow();}
        }
		//
		if(properties.customdirectory){
            // 获取自定义壁纸
			clearT();
			if((properties.customdirectory) && (FristLoad == false))
			{
				changeBackground();
			}
        }
        // 监听幻灯开关变化
        if (properties.wallpapermode) {
			clearT();
            wallpapermode = properties.wallpapermode.value;
			//changeBackground();
            if(FristLoad){
                setTimeout(function(){
                changeBackground()
            },5000) 
            }else{
                changeBackground()
            }
        }
		//幻灯片特效
		if (properties.TransitionMode) {
			TransitionMode = properties.TransitionMode.value;
            TransitionSwith()
        }
		if (properties.TransitionMode_choose_0) {
			TransitionMode_choose_0 = properties.TransitionMode_choose_0.value;
            TransitionSwith()
        }
		if (properties.TransitionMode_choose_1) {
			TransitionMode_choose_1 = properties.TransitionMode_choose_1.value;
            TransitionSwith()
        }
		if (properties.TransitionMode_choose_4) {
			TransitionMode_choose_4 = properties.TransitionMode_choose_4.value;
            TransitionSwith()
        }
		/*默认壁纸
		if (properties.DefaultWallpaper) {
			backgroundRoute = "url('imgs/"+ properties.DefaultWallpaper.value +".jpg')"
			if(FristLoad == true){}else{shouldShow();}
        }*/
        if (properties.background_wallpapermode_9_URL) {
            pictures_URL = properties.background_wallpapermode_9_URL.value;
            if (wallpapermode == 9) {
                changeBackground()
            }
        }
		//自定义视频
		if(properties.selectvideo){
			selectvideo = properties.selectvideo.value;
			if(selectvideo){
				//myvideo.src = "url('"+'file:///' + selectvideo + "')";
				cusvideoRoute = 'file:///' + selectvideo;
				//myvideo.src = 'file:///' + selectvideo;
				//myvideo.type = "video/webm";
				//myvideo.play();
                //SetCustomVideo();
			}else{
				cusvideoRoute = "";
			}
            if(wallpapermode == 3){
				ChangeVideoModel();
			}
        }
		//视频模板
		if (properties.videomodel) {
            videomodel = properties.videomodel.value;
			
			if(wallpapermode == 3)
			{
				videoRoute = 'video/' + videomodel + '-test.webm'
				if(cusvideoRoute == "")
				{
					ChangeVideoModel();
				}
			}
        }
		//自定义音乐
		if(properties.selectmusic)
		{
			selectmusic = properties.selectmusic.value;
			
			if(selectmusic)
			{	
				cusaudioRoute = 'file:///' + selectmusic;
			}
			else
			{
				cusaudioRoute = "";
			}
			ChangeAudioModel();
		}
		//音量
		if (properties.VideoVolume) 
		{
			myvideo.volume = properties.VideoVolume.value/100
        }
		//音频模板
		/*if (properties.MuiscModel) 
		{
            MuiscModel = properties.MuiscModel.value;
			audioRoute = "audio/" + MuiscModel +"-Audio.ogg"
			if(cusaudioRoute == "")
			{
				ChangeAudioModel();
			}
        }*/
		//音量
		if (properties.MuiscVolume) {
			myAudio.volume = properties.MuiscVolume.value/100
        }
        // 监听随机模式开关变化
        if (properties.random) {
            random = properties.random.value;
        }
        // 更改幻灯切换时间
        if(properties.imageswitchtimes){
            speed = properties.imageswitchtimes.value;
            if(FristLoad == true){}else{changeBackground()};
        }
        //自由变换
        if(properties.bgy){
            var y = properties.bgy.value
            //var h = window.innerHeight
            bgy = h*((y-50)/50) + "px"
            setBackgroundStyle();
        }
        if(properties.bgx){
            var x = properties.bgx.value
            //var w = window.innerWidth
            bgx = w*((x-50)/50) + "px"
            setBackgroundStyle();
        }
        if(properties.bgs){
            bgs = properties.bgs.value + "%"
            setBackgroundStyle()
        }
        // 更改背景展示样式
        if(properties.imagedisplaystlye){
            bgStyle = properties.imagedisplaystlye.value;
            setBackgroundStyle()
        }
		//多边形变换
		if(properties.PolygonAngle){
             SetPolygonAngle(properties.PolygonAngle.value);
        }
        // 样式
        if(properties.style){
            param.style = properties.style.value;
        }
        // 半径
        if(properties.radius){
            param.r = properties.radius.value/100;
        }
        // 幅度
        if(properties.range){
            param.range = properties.range.value/5;
        }
        // 颜色
        if(properties.color){
            var c = properties.color.value.split(' ').map(function(c){return Math.ceil(c*255)});
            ctx.strokeStyle = param.color = 'rgba('+ c +',0.8)';
            //oClock.style.color = 'rgb('+c+')';
        }
        // 模糊颜色
        if(properties.blurColor){
            var c = properties.blurColor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            ctx.shadowColor = param.blurColor = 'rgb('+ c +')';
            //oClock.style.textShadow = '0 0 20px rgb('+c+')';
        }
        // 是否显示时间
        if(properties.showTime){
            oClock.style.display = properties.showTime.value ? 'flex' : 'none';
        }
		// 是否显示日期
        if(properties.showDate){
            oDate.style.display = properties.showDate.value ? 'flex' : 'none';
        }
		// 是否显示秒
        if(properties.tShowSencends){
            tShowSencends = properties.tShowSencends.value;
        }
        // 圆的位置
        if(properties.cX){
            param.cX = properties.cX.value*0.01;
        }
        if(properties.cY){
            param.cY = properties.cY.value*0.01;
        }
		//色彩模式
		if(properties.ColorMode){
            param.ColorMode = properties.ColorMode.value;
        }
		//纯色渐变
		if(properties.SolidColorGradient){
            param.SolidColorGradient = properties.SolidColorGradient.value;
			
			if(!param.SolidColorGradient) ctx.strokeStyle = param.color;
        }
		//模糊色渐变
		if(properties.BlurColorGradient){
            param.BlurColorGradient = properties.BlurColorGradient.value;
        }
		//彩虹律动
		if(properties.ColorRhythm){
            param.ColorRhythm = properties.ColorRhythm.value;
        }
		//渐变速率
		if(properties.GradientRate){
            param.GradientRate = properties.GradientRate.value/10;
        }
		// 时间大小
        if(properties.tSize){
            var s = properties.tSize.value;
            oClock.style.fontSize = Math.floor(h/300*s) + 'px';
            oClock.style.lineHeight = Math.floor(h/390*s) + 'px';
            document.querySelector("#clock .block .time-indicators").style.marginLeft = s + 'px'; 
        }
        if(properties.oclock_roundedcorners){
            var Roundedcorners = properties.oclock_roundedcorners.value
            if(FristLoad == true){
                while (true) {
                var height = window.getComputedStyle(oClock).height
                if (height != '0px') {
                oClock_block.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                oClock_block.style.padding = null
                oClock_block.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
                    break;
                }
                }
                setTimeout(function(){
                var height = window.getComputedStyle(oClock).height
                oClock_block.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                oClock_block.style.padding = null
                oClock_block.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
            },2000)
            }else{
                var height = window.getComputedStyle(oClock).height
                oClock_block.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                oClock_block.style.padding = null
                oClock_block.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
            }
            
        }
		// 日期大小
        if(properties.DateSize){
            var s = properties.DateSize.value;
			oDate.style.fontSize = Math.floor(h/300*s) + 'px';
            oDate.style.lineHeight = Math.floor(h/570*s) + 'px';
        } 
        if(properties.date_showwidth){
            if(properties.date_showwidth.value == 0){
                oDate_webtext.style.width = "auto"
            }else{
            var s = properties.date_showwidth.value/100
            //var w = window.innerWidth
            oDate_webtext.style.width = w*s + "px"
            }
        }
		// 日期格式
		if(properties.DateFormat){
            DateFormatTest = properties.DateFormat.value;
            getdate();
        }
        // 时间的位置
        if(properties.tX){
            TimeX = properties.tX.value;
            oClock.style.left = TimeX+'%';
			//oDate.style.left = TimeX-50+'%';
        }
        if(properties.tY){
            TimeY = properties.tY.value;
            oClock.style.top = TimeY+'%';
			//oDate.style.top = TimeY-45+'%';
        }
		// 日期的位置
        if(properties.DateX){
            DateX = properties.DateX.value;
			oDate.style.left = DateX+'%';
        }
        if(properties.DateY){
            DateY = properties.DateY.value;
			oDate.style.top = DateY+'%';
        }
		// 颜色律动
        if(properties.TimeColorRhythm){
            TimeColorRhythm = properties.TimeColorRhythm.value;
			if(!TimeColorRhythm){
				oClock.style.color = TimeColor;
				oDate.style.color = TimeColor;
				oClock.style.textShadow = TimeBlurColor;
				oDate.style.textShadow = TimeBlurColor;
			}
        }
		// 时间颜色
        if(properties.TimeColor){
            var c = properties.TimeColor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            oClock.style.color = TimeColor = 'rgb('+c+')';
			//oDate.style.color = TimeColor = 'rgb('+c+')';
        }
        // 时间模糊颜色
        if(properties.TimeBlurColor){
            var c = properties.TimeBlurColor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            oClock.style.textShadow = TimeBlurColor = '0 0 20px rgb('+c+')';
			//oDate.style.textShadow = TimeBlurColor = '0 0 20px rgb('+c+')';
        }
        // 时间制式
        if(properties.tStyle){
            if(properties.tStyle.value){
                oClock_webtext_ti.style.justifyContent = "flex-end"
            }else{
                oClock_webtext_ti.style.justifyContent = "space-between"
            }
            tStyle = properties.tStyle.value;
            getTime_sec();
        }
		//时间透明度
        if(properties.timetransparency){
            timetransparency = properties.timetransparency.value/100;
            oClock.style.opacity = timetransparency;
        }
        if(properties.datetransparency){
            datetransparency = properties.datetransparency.value/100
            oDate.style.opacity = datetransparency;
        }
        //日期圆角
        if(properties.odate_roundedcorners){
            var Roundedcorners = properties.odate_roundedcorners.value
            if(FristLoad == true){
                while (true) {
                    
                var height =  window.getComputedStyle(oDate).height
                if (height != "0px"){
                oDate_webtext.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                oDate_webtext.style.padding = null
                oDate_webtext.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
                break;
                }
                }
            }else{
                var height =  window.getComputedStyle(oDate).height
                oDate_webtext.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                oDate_webtext.style.padding = null
                oDate_webtext.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
            }
        }
        //天气颜色
        if(properties.odate_color){
            oDate_color = properties.odate_color.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoad == false){
                oDateappearance()
            }
        }
        if(properties.odate_blurcolor_show){
            oDate_blurcolor_show = properties.odate_blurcolor_show.value
            if(FristLoad == false){
            oDateappearance()
            }
        }
        if(properties.odate_blurcolor){
            oDate_blurcolor = properties.odate_blurcolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoad == false){
            oDateappearance()
            }
        }
        if(properties.odate_yakeli_show){
            oDate_yakeli_show = properties.odate_yakeli_show.value
            if(FristLoad == false){
            oDateappearance()
            }
        }
        if(properties.odate_yakelicolor){
            oDate_yakelicolor = properties.odate_yakelicolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoad == false){
            oDateappearance()
            }
        }
        if(properties.odate_yakeli){
            oDate_yakeli = properties.odate_yakeli.value/100
            if(FristLoad == false){
            oDateappearance()
            }
        }
        if(properties.odate_bluryakeli){
            oDate_bluryakeli = properties.odate_bluryakeli.value
            oDateappearance()
        }
        function oDateappearance(){

            oDate.style.color = 'rgb('+oDate_color+')';

            if(oDate_blurcolor_show){
                oDate_webtext.style.textShadow = '0 0 20px rgb('+oDate_blurcolor+')';
            }else{
                oDate_webtext.style.textShadow = null
            }

            if(oDate_yakeli_show){
                oDate_webtext.style.background = "rgba("+oDate_yakelicolor+","+oDate_yakeli+")"
                oDate_webtext.style.backdropFilter = "blur("+oDate_bluryakeli+"px)"
            }else{
                oDate_webtext.style.background = null
                oDate_webtext.style.backdropFilter = null
            }
        }
        /*if(properties.oclock_color){
            oClock_color = properties.oclock_color.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoad = true){
                oDateappearance()
            }
        }*/
        if(properties.oclock_blurcolor_show){
            oClock_blurcolor_show = properties.oclock_blurcolor_show.value
            if(FristLoad = true){
            oClockappearance()
            }
        }
        if(properties.oclock_blurcolor){
            oClock_blurcolor = properties.oclock_blurcolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoad = true){
            oClockappearance()
            }
        }
        if(properties.oclock_yakeli_show){
            oClock_yakeli_show = properties.oclock_yakeli_show.value
            if(FristLoad = true){
            oClockappearance()
            }
        }
        if(properties.oclock_yakelicolor){
            oClock_yakelicolor = properties.oclock_yakelicolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoad = true){
            oClockappearance()
            }
        }
        if(properties.oclock_yakeli){
            oClock_yakeli = properties.oclock_yakeli.value/100
            if(FristLoad = true){
            oClockappearance()
            }
        }
        if(properties.oclock_bluryakeli){
            oClock_bluryakeli = properties.oclock_bluryakeli.value
            oClockappearance()


        }
        function oClockappearance(){

            //oClock.style.color = 'rgb('+oClock_color+')';

            if(oClock_blurcolor_show){
                oClock_block.style.textShadow = '0 0 20px rgb('+oClock_blurcolor+')';
            }else{
                oClock_block.style.textShadow = null
            }

            if(oClock_yakeli_show){
                oClock_block.style.background = "rgba("+oClock_yakelicolor+","+oClock_yakeli+")"
                oClock_block.style.backdropFilter = "blur("+oClock_bluryakeli+"px)"
            }else{
                oClock_block.style.background = null
                oClock_block.style.backdropFilter = null
            }
        }
		//天气
        //获取key 和风天气api
        if(properties.getcitykey_qweather){
            CityKey = properties.getcitykey_qweather.value
        }
        //获取API host 和风天气api
        if(properties.getAPIHOST_qweather){
            APIHost = properties.getAPIHOST_qweather.value
        }
        //获取appid&appsecret 天气api
        if(properties.getcityappid_tianqiapi){
            appid = properties.getcityappid_tianqiapi.value
        }
        if(properties.getcityappsecret_tianqiapi){
            appsecret = properties.getcityappsecret_tianqiapi.value
        }
        //VisualCrossing_Key
        if(properties.getcitykey_visualcrossing){
            VisualCrossing_Key = properties.getcitykey_visualcrossing.value
        }
        //天气更新时间
        if(properties.weather_updata){
            weather_updata = properties.weather_updata.value
        }
        //显示语言
        if(properties.weather_lang){
            weather_lang = properties.weather_lang.value
            weather_lang_choose()
            
        }
        //显示单位
        if(properties.weather_unit){
            weather_unit = properties.weather_unit.value
            weather_unit_choose()
            
        }
        if(properties.weather_lat_latitude){
            weather_lat.latitude = properties.weather_lat_latitude.value
        }
        if(properties.weather_lat_longitude){
            weather_lat.longitude = properties.weather_lat_longitude.value
        }     
		//获取天气城市优先获取
		if(properties.weather_CityText){
			strCity = properties.weather_CityText.value;
			if(!FristLoad)//首次不调用天气，由总开关调用
			{
				//alert("调用:城市");	
                weatherInit = false;
			}
        }
        //天气自定义
        //基础
        if(properties.cityname){//城市
            if(properties.cityname.value){
                cityname_show = true
            }
        }
        if(properties.weathernow){//天气
            if(properties.weathernow.value){
                weathernow_show = true
            }
        }
        if(properties.temperature){//气温
            if(properties.temperature.value){
                temperature_show = true
            }
        }
        if(properties.wind){//风向
            if(properties.wind.value){
                wind_show = true
            }
        }
        if(properties.windlv){//风力
            if(properties.windlv.value){
                windlv_show = true
            }
        }
        if(properties.windspeed){//风速
            if(properties.windspeed.value){
                windspeed_show = true
            }
        }
        if(properties.humidity){//湿度
            if(properties.humidity.value){
                humidity_show = true
            }
        }
        if(properties.obstime){//观测时间
            if(properties.obstime.value){
                obstime_show = true
            }
        }
        //功能类
        if(properties.feelstemperature){//体感
            if(properties.feelstemperature.value){
                feelstemperature_show = true
            }
        }
        if(properties.rangefeelstemperature){//体感范围
            if(properties.rangefeelstemperature.value){
                rangefeelstemperature_show = true
            }
        }
        if(properties.dewtemperature){//露点
            if(properties.dewtemperature.value){
                dewtemperature_show = true
            }
        }
        if(properties.rangetemperature){//气温范围
            if(properties.rangetemperature.value){
                rangetemperature_show = true
            }
        }
        if(properties.precip){//降水
            if(properties.precip.value){
                precip_show = true
            }
        }
        if(properties.cloud){//云
            if(properties.cloud.value){
                cloud_show = true
            }
        }
        if(properties.vis){//能见度
            if(properties.vis.value){
                vis_show = true
            }
        }
        if(properties.pressure){//大气压强
            if(properties.pressure.value){
                pressure_show = true
            }
        }
        if(properties.air){//空气质量
            if(properties.air.value){
                air_show = true
            }
        }
        if(properties.precipcover){//降水小时
            if(properties.precipcover.value){
                precipcover_show = true;
            }
        }
        
        if(properties.precipprob){//降水率
            if(properties.precipprob.value){
                precipprob_show = true;
            }
        }
        if(properties.snow){//降雪
            if(properties.snow.value){
                snow_show = true;
            }
        }
        if(properties.snowdepth){//积雪深度
            if(properties.snowdepth.value){
                snowdepth_show = true;
            }
        }
        if(properties.preciptype){//降水类型
            if(properties.preciptype.value){
                preciptype_show = true;
            }
        }
        if(properties.windgust){//最大风速
            if(properties.windgust.value){
                windgust_show = true;
            }
        }
        if(properties.solarradiation){//太阳辐射功率
            if(properties.solarradiation.value){
                solarradiation_show = true;
            }
        }
        if(properties.uvindex){//紫外线
            if(properties.uvindex.value){
                uvindex_show = true;
            }
        }
        if(properties.sunriseset){//日出
            if(properties.sunriseset.value){
                sunriseset_show = true;
            }
        }
        if(properties.moonphase){//月相
            if(properties.moonphase.value){
                moonphase_show = true;
            }
        }
        //API选择
        if(properties.freeapi){
            if(properties.freeapi.value){
                api = 2
                if(FristLoadWeather == false){
                    getcity()
                }
            }
        }
        if(properties.qweatherapi){
            if(properties.qweatherapi.value){
                api = 1
                if(FristLoadWeather == false){
                    getcity()
                }
            }
        }if(properties.qweatherapi_paymode){
            if(properties.qweatherapi_paymode.value){
                qweatherapi_paymode = properties.qweatherapi_paymode.value
            }
        }
        if(properties.tianqiapi){
            if(properties.tianqiapi.value){
                api = 3
                if(FristLoadWeather == false){
                    getcity()
                }
            }
        }
        if(properties.visualcrossingapi){
            if(properties.visualcrossingapi.value){
                api = 4
                if(FristLoadWeather == false){
                    getcity()
                }
            }
        }
        if(properties.open_meteoapi){
            if(properties.open_meteoapi.value){
                api = 5
                if(FristLoadWeather == false){
                    getcity()
                }
            }
        }
		// 是否天气
        if(properties.weather_show){
			clearWT();
			if(properties.weather_show.value)
			{
				weather.style.display = 'flex';
                weatherInit = false;
				autoWeather();
			}else{
				weather.style.display = 'none';
			}
        }
        //天气api选择
        /*if(properties.api){
            api = properties.api.value
                apiuse();
        }*/            
		// 天气颜色
        if(properties.weather_Color){
            weather_Color = properties.weather_Color.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoadweather == false){
                weatherappearance()
            }
        }
        if(properties.weather_blurcolor_show){
            weather_blurcolor_show = properties.weather_blurcolor_show.value
            if(FristLoadweather == false){
            weatherappearance()
            }
        }
        if(properties.weather_blurcolor){
            weather_blurcolor = properties.weather_blurcolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoadweather == false){
            weatherappearance()
            }
        }
        if(properties.weather_yakeli_show){
            weather_yakeli_show = properties.weather_yakeli_show.value
            if(FristLoadweather == false){
            weatherappearance()
            }
        }
        if(properties.weather_yakelicolor){
            weather_yakelicolor = properties.weather_yakelicolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoadweather == false){
            weatherappearance()
            }
        }
        if(properties.weather_yakeli){
            weather_yakeli = properties.weather_yakeli.value/100
            if(FristLoadweather == false){
            weatherappearance()
            }
        }
        if(properties.weather_bluryakeli){
            weather_bluryakeli = properties.weather_bluryakeli.value
            weatherappearance()

            FristLoadweather = false
        }
        function weatherappearance(){

            weather.style.color = 'rgb('+weather_Color+')';

            if(weather_blurcolor_show){
                weather_webtext.style.textShadow = '0 0 20px rgb('+weather_blurcolor+')';
            }else{
                weather_webtext.style.textShadow = null
            }

            if(weather_yakeli_show){
                weather_webtext.style.background = "rgba("+weather_yakelicolor+","+weather_yakeli+")"
                weather_webtext.style.backdropFilter = "blur("+weather_bluryakeli+"px)"
            }else{
                weather_webtext.style.background = null
                weather_webtext.style.backdropFilter = null
            }
        }
		//天气透明度
        if(properties.weather_timetransparency){
            var t = properties.weather_timetransparency.value/100;
            weather.style.opacity = t;
        }
        //天气圆角
        if(properties.weather_roundedcorners){
            var Roundedcorners = properties.weather_roundedcorners.value
            if(FristLoad == true){
                while (condition) {
                    var height =  window.getComputedStyle(weather).height
                    if (height != "0px") {
                    weather_webtext.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                    weather_webtext.style.padding = null
                    weather_webtext.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
                    break;
                    }
                }
            }else{
                    var height =  window.getComputedStyle(weather).height
                    weather_webtext.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                    weather_webtext.style.padding = null
                    weather_webtext.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
            }
        }
		// 天气大小
        if(properties.weather_size){
            var s = properties.weather_size.value;
			weather.style.fontSize = Math.floor(h/300*s) + 'px';
            weather.style.lineHeight = Math.floor(h/570*s) + 'px';
        } 
        if(properties.weather_showwidth){
            if(properties.weather_showwidth.value == 0){
                weather_webtext.style.width = "auto"
            }else{
            var s = properties.weather_showwidth.value/100
            //var w = window.innerWidth
            weather_webtext.style.width = w*s + "px"
            }
            
        }
		// 天气位置
        if(properties.weatherX){
            var weatherX = properties.weatherX.value;
			weather.style.left = weatherX+'%';
        }
        if(properties.weatherY){
            var weatherY = properties.weatherY.value;
			weather.style.top = weatherY+'%';
        }
        //一言
        //一言更新时间
        if(properties.hitokoto_updata){
            hitokoto_updata = properties.hitokoto_updata.value
        }
		// 一言格式
		if(properties.hitokoto_auth){
            if(properties.hitokoto_auth.value){
                HitoktoFormatTest = 1
            }else{
                HitoktoFormatTest = 2
            }
        }
        //一言自定义
        if(properties.hitokoto_a){
            if(properties.hitokoto_a.value){
                hit_a = "c=a&"
            }else{
                hit_a = ""
            }
        }
        if(properties.hitokoto_b){
            if(properties.hitokoto_b.value){
                hit_b = "c=b&"
            }else{
                hit_b = ""
            }
        }
        if(properties.hitokoto_c){
            if(properties.hitokoto_c.value){
                hit_c = "c=c&"
            }else{
                hit_c = ""
            }
        }
        if(properties.hitokoto_d){
            if(properties.hitokoto_d.value){
                hit_d = "c=d&"
            }else{
                hit_d = ""
            }
        }
        if(properties.hitokoto_e){
            if(properties.hitokoto_e.value){
                hit_e = "c=e&"
            }else{
                hit_e = ""
            }
        }
        if(properties.hitokoto_f){
            if(properties.hitokoto_f.value){
                hit_f = "c=f&"
            }else{
                hit_f = ""
            }
        }
        if(properties.hitokoto_g){
            if(properties.hitokoto_g.value){
                hit_g = "c=g&"
            }else{
                hit_g = ""
            }
        }
        if(properties.hitokoto_h){
            if(properties.hitokoto_h.value){
                hit_h = "c=h&"
            }else{
                hit_h = ""
            }
        }
        if(properties.hitokoto_i){
            if(properties.hitokoto_i.value){
                hit_i = "c=i&"
            }else{
                hit_i = ""
            }
        }
        if(properties.hitokoto_j){
            if(properties.hitokoto_j.value){
                hit_j = "c=j&"
            }else{
                hit_j = ""
            }
        }
        if(properties.hitokoto_k){
            if(properties.hitokoto_k.value){
                hit_k = "c=k&"
            }else{
                hit_k = ""
            }
        }
        if(properties.hitokoto_l){
            if(properties.hitokoto_l.value){
                hit_l = "c=l&"
            }else{
                hit_l = ""
            }
        }
        // 是否一言
        if(properties.hitokoto_show){
			clearHT();
			if(properties.hitokoto_show.value)
			{
				hitokoto.style.display = 'flex';
                hitokotoInit = false;

				autoHitokto();
			}else{
                hitokoto.style.display = 'none';

				setTimeout(function(){
                    if(hitokoto_webtext.innerText == "一言"){hitokoto.style.display = "none"}
                }, 10000);
			}
        }
        // 一言外观
        if(properties.hitokoto_color){
            hitokoto_color = properties.hitokoto_color.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoad == false){
                Element_effects_color(hitokoto_blurcolor_show,hitokoto_webtext,hitokoto_color,hitokoto_blurcolor)
            }
        }
        if(properties.hitokoto_blurcolor){
            hitokoto_blurcolor = properties.hitokoto_blurcolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoad == false){
                Element_effects_color(hitokoto_blurcolor_show,hitokoto_webtext,hitokoto_color,hitokoto_blurcolor)
            }
        }
        if(properties.hitokoto_yakelicolor){
            hitokoto_yakelicolor = properties.hitokoto_yakelicolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            if(FristLoad == false){
                Element_effects_yakeli(hitokoto_yakeli_show,hitokoto_webtext,hitokoto_yakeli,hitokoto_yakelicolor,hitokoto_bluryakeli)
            }
        }
        if(properties.hitokoto_yakeli){
            hitokoto_yakeli = properties.hitokoto_yakeli.value/100
            if(FristLoad == false){
                Element_effects_yakeli(hitokoto_yakeli_show,hitokoto_webtext,hitokoto_yakeli,hitokoto_yakelicolor,hitokoto_bluryakeli)
            }
        }
        if(properties.hitokoto_bluryakeli){
            hitokoto_bluryakeli = properties.hitokoto_bluryakeli.value
            if(FristLoad == false){
                Element_effects_yakeli(hitokoto_yakeli_show,hitokoto_webtext,hitokoto_yakeli,hitokoto_yakelicolor,hitokoto_bluryakeli)
            }
        }
        if(properties.hitokoto_blurcolor_show){
            hitokoto_blurcolor_show = properties.hitokoto_blurcolor_show.value
            Element_effects_color(hitokoto_blurcolor_show,hitokoto_webtext,hitokoto_color,hitokoto_blurcolor)
        }
        if(properties.hitokoto_yakeli_show){
            hitokoto_yakeli_show = properties.hitokoto_yakeli_show.value
            Element_effects_yakeli(hitokoto_yakeli_show,hitokoto_webtext,hitokoto_yakeli,hitokoto_yakelicolor,hitokoto_bluryakeli)
        }
        /*
        function hitokotoappearance(){

            hitokoto.style.color = 'rgb('+hitokoto_color+')';

            if(hitokoto_blurcolor_show){
                hitokoto_webtext.style.textShadow = '0 0 20px rgb('+hitokoto_blurcolor+')';
            }else{
                hitokoto_webtext.style.textShadow = null
            }

            if(hitokoto_yakeli_show){
                hitokoto_webtext.style.background = "rgba("+hitokoto_yakelicolor+","+hitokoto_yakeli+")"
                hitokoto_webtext.style.backdropFilter = "blur("+hitokoto_bluryakeli+"px)"
            }else{
                hitokoto_webtext.style.background = null
                hitokoto_webtext.style.backdropFilter = null
            }
        }*/

		//一言透明度
        if(properties.hitokoto_timetransparency){
            var t = properties.hitokoto_timetransparency.value/100;
            hitokoto.style.opacity = t;
        }
        //一言圆角
        if(properties.hitokoto_roundedcorners){
            var Roundedcorners = properties.hitokoto_roundedcorners.value
            if(FristLoad == true){
                while (true) {
                    var height =  window.getComputedStyle(hitokoto).height
                    if (height != '0px'){
                        hitokoto_webtext.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                        hitokoto_webtext.style.padding = null
                        hitokoto_webtext.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
                        break;
                    }
                }
            }else{
                var height =  window.getComputedStyle(hitokoto).height
                hitokoto_webtext.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                hitokoto_webtext.style.padding = null
                hitokoto_webtext.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
            }
        }
		// 一言大小
        if(properties.hitokoto_size){
            var s = properties.hitokoto_size.value;
			hitokoto.style.fontSize = Math.floor(h/300*s) + 'px';
            hitokoto.style.lineHeight = Math.floor(h/570*s) + 'px';
        } 
        if(properties.hitokoto_showwidth){
            if(properties.hitokoto_showwidth.value == 0){
                hitokoto_webtext.style.width = "auto"
            }else{
            var s = properties.hitokoto_showwidth.value/100
            //var w = window.innerWidth
            hitokoto_webtext.style.width = w*s + "px"    
            }
        }
		// 一言位置
        if(properties.hitokotoX){
            var hitokotoX = properties.hitokotoX.value;
			hitokoto.style.left = hitokotoX+'%';
        }
        if(properties.hitokotoY){
            var hitokotoY = properties.hitokotoY.value;
			hitokoto.style.top = hitokotoY+'%';
        }
        // 是否旋转
        if(properties.rotation){
            param.rotation = properties.rotation.value;
			rotationcopy = param.rotation;
        }
        // 线宽
        if(properties.lineWidth){
            ctx.lineWidth = param.lineWidth = properties.lineWidth.value;
        }
        // 是否显示圆
        /*if(properties.showCircle){
            param.showCircle = properties.showCircle.value;
			PWCircle_show_bool = param.showCircle;
        }*/
        // 方向
        if(properties.direction){
            param.direction = properties.direction.value;
        }
        //樱花透明度
        if(properties.sakuratransparency){
            sakuratransparency = properties.sakuratransparency.value/100;
            //sakura.getContext('webgl').canvas.style.opacity = sakuratransparency;
            sakurashow.getContext('2d').canvas.style.opacity = sakuratransparency;
        }          
        //樱花背景
        if(properties.sakurabackground){
            sakuraBackground = properties.sakurabackground.value;
        }
        //樱花背景色
        if(properties.sakurabackcolor){
            sakuraBackColor = properties.sakurabackcolor.value;
        }
        //樱花背景色
        if(properties.sakurareverse){
            sakuraReverse = properties.sakurareverse.value;
        }
        //樱花数量
        if(properties.sakurapointnumber){
            sakuraPointNumber = properties.sakurapointnumber.value;
            sakuraResize();
        }
        //背景亮度
        if(properties.sakurabacklight){
            // sakura.getContext('webgl').canvas.style.opacity = sakuratransparency;
            sakuraBackLight = parseFloat(properties.sakurabacklight.value/100.0);
            sakuraReLoadEffect();
        }
        //樱花特效
        if(properties.showSakura){
            showSakura = properties.showSakura.value;
            if(showSakura){
                // 开启樱花，全屏樱花
                makeCanvasFullScreen(sakura,sakurashow);
                animating = true
                animate()
                removesakura()
            }else{
                // 关闭樱花，隐藏樱花
                makeCanvasHide(sakura,sakurashow);
                animating = false
            }
        }                      
        //可视化音频透明度
        if(properties.wavetransparency){
            param.wavetransparency = properties.wavetransparency.value/100;
            ctx.globalAlpha = param.wavetransparency;
        }
        //显示为半圆
        if(properties.showSemiCircle){
            param.showSemiCircle = properties.showSemiCircle.value;
			if(param.showSemiCircle)
			{	
				rotationcopy = param.rotation;
				param.rotation = 0;
				param.offsetAngle = 0;
			}else{
				param.rotation =rotationcopy;
			}
		}
        //显示为半圆
        if(properties.SemiCircledirection){
            param.SemiCircledirection = properties.SemiCircledirection.value;
        }
		//显示直线
		/*if(properties.PWLineShow){
            PWLineParam.showLine = properties.PWLineShow.value;
			PWLine_show_bool = PWLineParam.showLine;
        }*///直线位置
		if(properties.PWLinePosition){
            PWLineParam.LinePosition = properties.PWLinePosition.value;
        }
		//样式
		if(properties.PWLineStyle){
            PWLineParam.style = properties.PWLineStyle.value;
        }
		//方向
		if(properties.PWLineDirection){
            PWLineParam.Direction = properties.PWLineDirection.value;
        }
		//线宽
		if(properties.PWLineWidth){
            CTXLine.lineWidth = PWLineParam.lineWidth = properties.PWLineWidth.value;
        }
		//间距
		if(properties.PWLineSpacing){
            PWLineParam.sw = properties.PWLineSpacing.value/10;
        }
		//疏密
		if(properties.PWLineDensity){
            PWLineParam.LineDensity = properties.PWLineDensity.value*10;
        }
		//幅度
		if(properties.PWLineRange){
            PWLineParam.range = properties.PWLineRange.value/5;
        }
		//可视化音频透明度
        if(properties.PWLineTransparency){
            PWLineParam.LineTransparency = properties.PWLineTransparency.value/100;
            CTXLine.globalAlpha = PWLineParam.LineTransparency;
        }
		// 颜色
        if(properties.PWLineColor){
            var c = properties.PWLineColor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            CTXLine.strokeStyle = PWLineParam.color = 'rgba('+ c +',0.8)';
        }
        // 模糊颜色
        if(properties.PWLineBlurColor){
            var c = properties.PWLineBlurColor.value.split(' ').map(function(c){return Math.ceil(c*255)});
            CTXLine.shadowColor = PWLineParam.blurColor = 'rgb('+ c +')';
        }
		// 圆的位置
        if(properties.PWLineX){
            PWLineParam.LineX = properties.PWLineX.value/100.0;
        }
        if(properties.PWLineY){
            PWLineParam.LineY = properties.PWLineY.value/100.0;
        }
		//中间线
		if(properties.PWMiddleLine){
            PWLineParam.MiddleLine = properties.PWMiddleLine.value;
        }
		//色彩模式
		if(properties.PWLineColorMode){
            PWLineParam.ColorMode = properties.PWLineColorMode.value;
        }
		//纯色渐变
		if(properties.PWLineSolidColorGradient){
            PWLineParam.SolidColorGradient = properties.PWLineSolidColorGradient.value;
			if(!PWLineParam.SolidColorGradient) CTXLine.strokeStyle = PWLineParam.color;
        }
		//模糊色渐变
		if(properties.PWLineBlurColorGradient){
            PWLineParam.BlurColorGradient = properties.PWLineBlurColorGradient.value;
        }
		//彩虹律动
		if(properties.PWLineColorRhythm){
            PWLineParam.ColorRhythm = properties.PWLineColorRhythm.value;
        }
		//渐变速率
		if(properties.PWLineGradientRate){
            PWLineParam.GradientRate = properties.PWLineGradientRate.value/10;
        }
		//可视化音频模板选择
		if(properties.visual_audio_model){
            visual_audio_model = properties.visual_audio_model.value;
			switch (visual_audio_model){
				case 0://无
					param.showCircle = false;
					PWLineParam.showLine = false;
					break;
				case 1://完美壁纸
					param.showCircle =PWCircle_show_bool;
					PWLineParam.showLine = false;
					break;
				case 2://完美直线
					param.showCircle = false;
					PWLineParam.showLine = PWLine_show_bool;
					break;
				case 3://come soon
					//wallpaper.audiovisualizer({});
					param.showCircle = false;
					PWLineParam.showLine = false;
                    //$('body').particles('startParticles');
					break;
				case 4://完美直线
					param.showCircle = false;
					PWLineParam.showLine = false;
					break;
				default:
			}
        }
		
			// 粒子参数
            //-----------------------------------------------------------

            // 显示粒子
            if (properties.particles_isParticles) {
                if (properties.particles_isParticles.value) {
                    wallpaper.particles('startParticles');
                } else {
                    wallpaper.particles('clearCanvas')
                        .particles('stopParticles');
                }
            }
            // 粒子数量
            if (properties.particles_number) {
                wallpaper.particles('addParticles', properties.particles_number.value);
            }
            // 粒子不透明度
            if (properties.particles_opacity) {
                wallpaper.particles('set', 'opacity', properties.particles_opacity.value / 100);
            }
            // 粒子随机不透明度
            if (properties.particles_opacityRandom) {
                wallpaper.particles('set', 'opacityRandom', properties.particles_opacityRandom.value);
            }
            // 粒子颜色
            if (properties.particles_color) {
                var color = properties.particles_color.value.split(' ').map(function (c) {
                    return Math.ceil(c * 255)
                });
                wallpaper.particles('set', 'color', color);
            }
            // 粒子模糊颜色
            if (properties.particles_shadowColor) {
                var color = properties.particles_shadowColor.value.split(' ').map(function (c) {
                    return Math.ceil(c * 255)
                });
                wallpaper.particles('set', 'shadowColor', color);
            }
            // 粒子模糊大小
            if (properties.particles_shadowBlur) {
                wallpaper.particles('set', 'shadowBlur', properties.particles_shadowBlur.value);
            }
			// 自定义粒子图片
            if (properties.particles_image) {
				cusmapRoute = properties.particles_image.value
				shouldShowMap();
            }
            // 粒子类型
            if (properties.particles_shapeType) {
                switch (properties.particles_shapeType.value) {
                    case 1:
                        wallpaper.particles('set', 'shapeType', 'circle');
                        break;
                    case 2:
                        wallpaper.particles('set', 'shapeType', 'edge');
                        break;
                    case 3:
                        wallpaper.particles('set', 'shapeType', 'triangle');
                        break;
                    case 4:
                        wallpaper.particles('set', 'shapeType', 'star');
                        break;
                    case 5:
                        wallpaper.particles('set', 'shapeType', 'image');
						shouldShowMap();
                        break;
                    default:
                        wallpaper.particles('set', 'shapeType', 'circle');
                }
            }
			//默认图片
			if(properties.particles_picdef)
			{
				mapRoute = 'map/' + properties.particles_picdef.value + '.png';
				shouldShowMap();
			}
            // 粒子大小
            if (properties.particles_sizeValue) {
                wallpaper.particles('set', 'sizeValue', properties.particles_sizeValue.value);
            }
            // 粒子随机大小
            if (properties.particles_sizeRandom) {
                wallpaper.particles('set', 'sizeRandom', properties.particles_sizeRandom.value);
            }
            // 显示连线
            if (properties.particles_linkEnable) {
                wallpaper.particles('set', 'linkEnable', properties.particles_linkEnable.value);
            }
            // 连线距离
            if (properties.particles_linkDistance) {
                wallpaper.particles('set', 'linkDistance', properties.particles_linkDistance.value);
            }
            // 连线宽度
            if (properties.particles_linkWidth) {
                wallpaper.particles('set', 'linkWidth', properties.particles_linkWidth.value);
            }
            // 连线颜色
            if (properties.particles_linkColor) {
                var color = properties.particles_linkColor.value.split(' ').map(function (c) {
                    return Math.ceil(c * 255)
                });
                wallpaper.particles('set', 'linkColor', color);
            }
            // 连线不透明度
            if (properties.particles_linkOpacity) {
                wallpaper.particles('set', 'linkOpacity', properties.particles_linkOpacity.value / 100);
            }
            // 粒子是否移动
            if (properties.particles_isMove) {
                wallpaper.particles('set', 'isMove', properties.particles_isMove.value);
            }
            // 粒子速度
            if (properties.particles_speed) {
                wallpaper.particles('set', 'speed', properties.particles_speed.value);
            }
            // 随机粒子速度
            if (properties.particles_speedRandom) {
                wallpaper.particles('set', 'speedRandom', properties.particles_speedRandom.value);
            }
            // 粒子方向
            if (properties.particles_direction) {
                switch (properties.particles_direction.value) {
                    case 1:
                        wallpaper.particles('set', 'direction', 'none');
                        break;
                    case 2:
                        wallpaper.particles('set', 'direction', 'top');
                        break;
                    case 3:
                        wallpaper.particles('set', 'direction', 'top-right');
                        break;
                    case 4:
                        wallpaper.particles('set', 'direction', 'right');
                        break;
                    case 5:
                        wallpaper.particles('set', 'direction', 'bottom-right');
                        break;
                    case 6:
                        wallpaper.particles('set', 'direction', 'bottom');
                        break;
                    case 7:
                        wallpaper.particles('set', 'direction', 'bottom-left');
                        break;
                    case 8:
                        wallpaper.particles('set', 'direction', 'left');
                        break;
                    case 9:
                        wallpaper.particles('set', 'direction', 'top-left');
                        break;
                    default:
                        wallpaper.particles('set', 'direction', 'none');
                }
            }
            // 粒子是否笔直移动
            if (properties.particles_isStraight) {
                wallpaper.particles('set', 'isStraight', properties.particles_isStraight.value);
            }
            // 粒子反弹
            if (properties.particles_isBounce) {
                wallpaper.particles('set', 'isBounce', properties.particles_isBounce.value);
            }
            // 粒子离屏模式
            if (properties.particles_moveOutMode) {
                switch (properties.particles_moveOutMode.value) {
                    case 1:
                        wallpaper.particles('set', 'moveOutMode', 'out');
                        break;
                    case 2:
                        wallpaper.particles('set', 'moveOutMode', 'bounce');
                        break;
                    default:
                        wallpaper.particles('set', 'moveOutMode', 'out');
                }
            }
			
			            // 音频参数
            //-----------------------------------------------------------

            // 音频振幅
            if (properties.audio_amplitude) {
                wallpaper.audiovisualizer('set', 'amplitude', properties.audio_amplitude.value);
            }
            // 音频衰弱
            if (properties.audio_decline) {
                wallpaper.audiovisualizer('set', 'decline', properties.audio_decline.value / 100);
            }

            // 圆环参数
            //-----------------------------------------------------------

            // 显示圆环
            if (properties.audio_isRing) {
                if (properties.audio_isRing.value) {
                    wallpaper.audiovisualizer('set', 'isRing', true);
                } else {
                    wallpaper.audiovisualizer('set', 'isRing', false);
                }
            }
            // 显示静态环
            if (properties.audio_isStaticRing) {
                if (properties.audio_isStaticRing.value) {
                    wallpaper.audiovisualizer('set', 'isStaticRing', true);
                } else {
                    wallpaper.audiovisualizer('set', 'isStaticRing', false);
                }
            }
            // 显示内环
            if (properties.audio_isInnerRing) {
                if (properties.audio_isInnerRing.value) {
                    wallpaper.audiovisualizer('set', 'isInnerRing', true);
                } else {
                    wallpaper.audiovisualizer('set', 'isInnerRing', false);
                }
            }
            // 显示内环
            if (properties.audio_isOuterRing) {
                if (properties.audio_isOuterRing.value) {
                    wallpaper.audiovisualizer('set', 'isOuterRing', true);
                } else {
                    wallpaper.audiovisualizer('set', 'isOuterRing', false);
                }
            }
            // 圆环半径
            if (properties.audio_radius) {
                wallpaper.audiovisualizer('set', 'radius', properties.audio_radius.value / 10);
            }
            // 圆环旋转
            if (properties.audio_ringRotation) {
                wallpaper.audiovisualizer('set', 'ringRotation', properties.audio_ringRotation.value);
            }
            // 圆环和小球不透明度
            if (properties.audio_opacity) {
                audio.opacity = properties.audio_opacity.value / 100;
                //if (isGlobalSettings == false) {
                    wallpaper.audiovisualizer('set', 'opacity', audio.opacity);
                //}
            }
            // 圆环和小球颜色
            if (properties.audio_color) {
                audio.color = properties.audio_color.value.split(' ').map(function (c) {
                    return Math.ceil(c * 255)
                });
                if (isGlobalSettings == false) {
                    wallpaper.audiovisualizer('set', 'color', audio.color);
                }
            }
            // 圆环和小球模糊颜色
            if (properties.audio_shadowColor) {
                audio.shadowColor = properties.audio_shadowColor.value.split(' ').map(function (c) {
                    return Math.ceil(c * 255)
                });
                if (isGlobalSettings == false) {
                    wallpaper.audiovisualizer('set', 'shadowColor', audio.shadowColor);
                }
            }
            // 圆环和小球发光程度
            if (properties.audio_shadowBlur) {
                audio.shadowBlur = properties.audio_shadowBlur.value * 5;
                if (isGlobalSettings == false) {
                    wallpaper.audiovisualizer('set', 'shadowBlur', audio.shadowBlur);
                }
            }
            // 圆环和小球X轴偏移
            if (properties.audio_offsetX) {
                audio.offsetX = properties.audio_offsetX.value / 100;
                if (isGlobalSettings == false) {
                    wallpaper.audiovisualizer('set', 'offsetX', audio.offsetX);
                }
            }
            // 圆环和小球Y轴偏移
            if (properties.audio_offsetY) {
                audio.offsetY = properties.audio_offsetY.value / 100;
                if (isGlobalSettings == false) {
                    wallpaper.audiovisualizer('set', 'offsetY', audio.offsetY);
                }
            }
            // 圆环和小球鼠标坐标偏移
            if (properties.audio_isClickOffset) {
                audio.isClickOffset = properties.audio_isClickOffset.value;
                if (isGlobalSettings == false) {
                    wallpaper.audiovisualizer('set', 'isClickOffset', audio.isClickOffset);
                }
            }

            // 线条参数
            //-----------------------------------------------------------

            // 是否连线
            if (properties.audio_isLineTo) {
                wallpaper.audiovisualizer('set', 'isLineTo', properties.audio_isLineTo.value);
            }
            // 第一点
            if (properties.audio_firstPoint) {
                wallpaper.audiovisualizer('set', 'firstPoint', properties.audio_firstPoint.value);
            }
            // 第二点
            if (properties.audio_secondPoint) {
                wallpaper.audiovisualizer('set', 'secondPoint', properties.audio_secondPoint.value);
            }
            // 圆环点数
            if (properties.audio_pointNum) {
                wallpaper.audiovisualizer('set', 'pointNum', properties.audio_pointNum.value);
            }
            // 内外环距离
            if (properties.audio_distance) {
                wallpaper.audiovisualizer('set', 'distance', properties.audio_distance.value);
            }
            // 线条粗细
            if (properties.audio_lineWidth) {
                wallpaper.audiovisualizer('set', 'lineWidth', properties.audio_lineWidth.value);
            }

            // 小球参数
            //-----------------------------------------------------------

            // 显示小球
            if (properties.audio_isBall) {
                wallpaper.audiovisualizer('set', 'isBall', properties.audio_isBall.value);
            }
            // 小球间隔
            if (properties.audio_ballSpacer) {
                wallpaper.audiovisualizer('set', 'ballSpacer', properties.audio_ballSpacer.value);
            }
            // 小球大小
            if (properties.audio_ballSize) {
                wallpaper.audiovisualizer('set', 'ballSize', properties.audio_ballSize.value);
            }
            // 圆环旋转
            if (properties.audio_ballRotation) {
                wallpaper.audiovisualizer('set', 'ballRotation', properties.audio_ballRotation.value);
            }
			
			//完美粒子
			// 数量等级
            	if(properties.number && properties.number.value != numLevel){
            		numLevel = properties.number.value;
            		createPoint();
            	};
            	// 背景颜色
				if(properties.bgcolor){
					var bgcolor = properties.bgcolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
					CanPar.style.backgroundColor = 'rgb('+bgcolor+')';
				};
				// 背景图
				if(properties.image123){
					if(properties.image.value){
						CanPar.style.backgroundImage = 'url(file:///'+ properties.image.value +')';
						CanPar.style.backgroundSize = '100% 100%';
					}else{
						CanPar.style.backgroundImage = 'none';
					}
				};
				// 粒子大小（系数）
				if(properties.ratio){
					ratio = properties.ratio.value/1.5;
				};
				// 粒子大小动态补偿
				if(properties.tEqualize){
					equalize = 1-properties.tEqualize.value/10;
				};
				// 是否显示连线
				if(properties.showline){
					isShowLine = properties.showline.value;
				};
				// 是否显示粒子
				if(properties.showpoint){
					isShowPoint = properties.showpoint.value;
				};
				// 粒子是否跟随音频移动
				if(properties.smovefollow){
					isMoveFollow = properties.smovefollow.value;
				};
				// 粒子样式
				if(properties.style){
					pStyle = properties.style.value;
				};
				// 是否使用单色
				if(properties.usePColor){
					usePColor = properties.usePColor.value;
				};
				// 粒子颜色
				if(properties.pColor){
					var color = properties.pColor.value.split(' ').map(function(c){return Math.ceil(c*255)});
					pColor = 'rgba('+color+',0.8)';
				};
				// 是否开启模糊
				if(properties.isBlur){
					isBlur = properties.isBlur.value;
				};
				// 模糊颜色
				if(properties.blurColor){
					var color = properties.blurColor.value.split(' ').map(function(c){return Math.ceil(c*255)});
					blurColor = 'rgb('+color+')';
				};
                if(properties.player_control_show){
                    player_control_show = properties.player_control_show.value
                    if(FristLoad == false){
                        player_control.style.visibility = player_control_show ? 'visible' : 'hidden';
                        player_control.style.display = player_control_show ? 'flex' : 'none';
                        if(player_control_show){
                            wallpaperMediaThumbnailListener(null);
                            wallpaperMediaPropertiesListener(null);
                            wallpaperMediaPlaybackListener(null);

                            thumbnailsue();
                            player_controlappearance();
                        }
                    }else{
                        player_control.style.display = "flex"
                        player_control.style.visibility = player_control_show ? 'visible' : 'hidden'

                        setTimeout(function(){
                            if(!player_control_show || (document.querySelector("#player_control .title .left").innerText == "loading...") || (document.querySelector("#player_control .title .right").innerText == "loading...")){
                                player_control.style.display = "none"
                            }
                        }, 5000);
                    }
                }
                if(properties.playery){
                    var y = properties.playery.value
                    player_control.style.top = y + "%"
                }
                if(properties.playerx){
                    var x = properties.playerx.value
                    player_control.style.left = x + "%"
                }
                // 外观
                if(properties.player_control_color){
                    player_control_color = properties.player_control_color.value.split(' ').map(function(c){return Math.ceil(c*255)});
                    if(FristLoad == false){
                        player_controlappearance()
                    }
                }
                if(properties.player_control_blurcolor_show){
                    player_control_blurcolor_show = properties.player_control_blurcolor_show.value
                    if(FristLoad == false){
                        player_controlappearance()
                    }
                }
                if(properties.player_control_blurcolor){
                    player_control_blurcolor = properties.player_control_blurcolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
                    if(FristLoad == false){
                        player_controlappearance()
                    }
                }
                if(properties.player_control_yakeli_show){
                    player_control_yakeli_show = properties.player_control_yakeli_show.value
                    if(FristLoad == false){
                        player_controlappearance()
                    }
                }
                if(properties.player_control_yakelicolor){
                    player_control_yakelicolor = properties.player_control_yakelicolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
                    if(FristLoad == false){
                        player_controlappearance()
                    }
                }
                if(properties.player_control_yakeli){
                    player_control_yakeli = properties.player_control_yakeli.value/100
                    if(FristLoad == false){
                        player_controlappearance()
                    }
               }
                if(properties.player_control_bluryakeli){
                    player_control_bluryakeli = properties.player_control_bluryakeli.value
                    if(FristLoad == false){
                        player_controlappearance()
                    }
                }
		        // 大小
                if(properties.player_control_size){
                    var s = properties.player_control_size.value;
                    var ss = Math.floor(h/150*s);
			        player_control.style.fontSize = Math.floor(h/300*s) + 'px';
                    player_control.style.lineHeight = Math.floor(h/700*s) + 'px';
                    player_control_artist.style.lineHeight = Math.floor(h/1000*s) + 'px';
                    player_control_albumTitle.style.lineHeight = Math.floor(h/1000*s) + 'px';
                    player_control_thumbnail.style.width = ss + 'px';
                    player_control_thumbnail.style.height = ss + 'px';
                } 
                //圆角
                if(properties.player_control_roundedcorners){
                    player_control_roundedcorners = properties.player_control_roundedcorners.value
                    if(FristLoad == true){
                        while (true) {
                            var height =  window.getComputedStyle(player_control_thumbnail).height
                            if (height !== '0px') {
                                player_control_background.style.borderRadius = (height.slice(0,-2)/2)*(player_control_roundedcorners/100) + 'px';
                                player_control_thumbnail.style.borderRadius = (height.slice(0,-2)/2)*(player_control_roundedcorners/100) + 'px';
                                player_control_background.style.paddingRight = null
                                player_control_background.style.paddingRight = (height.slice(0,-2)/2)*(player_control_roundedcorners/200) + 'px';
                                break;
                            }
                        }
                    }else{
                        var height =  window.getComputedStyle(player_control_thumbnail).height
                        player_control_background.style.borderRadius = (height.slice(0,-2)/2)*(player_control_roundedcorners/100) + 'px';
                        player_control_thumbnail.style.borderRadius = (height.slice(0,-2)/2)*(player_control_roundedcorners/100) + 'px';
                        player_control_background.style.paddingRight = null
                        player_control_background.style.paddingRight = (height.slice(0,-2)/2)*(player_control_roundedcorners/200) + 'px';
                    }
                }
                function player_controlappearance(){

                    player_control.style.color = 'rgb(' + player_control_color + ')';
                    if(player_control_blurcolor_show){
                        player_control_background.style.textShadow = '0 0 20px rgb('+player_control_blurcolor+')';
                    }else{
                        player_control_background.style.textShadow = null
                    }

                    if(player_control_yakeli_show){
                        player_control_background.style.background = "rgba("+player_control_yakelicolor+","+player_control_yakeli+")"
                        player_control_background.style.backdropFilter = "blur("+player_control_bluryakeli+"px)"
                    }else{
                        player_control_background.style.background = null
                        player_control_background.style.backdropFilter = null
                    }

                }
		        //透明度
                if(properties.player_control_timetransparency){
                    var t = properties.player_control_timetransparency.value/100;
                    player_control.style.opacity = t;
                }
                if(properties.player_control_showwidth){
                    if(properties.player_control_showwidth.value == 0){
                        player_control_background.style.width = 'auto'
                    }else{
                    var s = properties.player_control_showwidth.value/100
                    //var w = window.innerWidth
                    player_control_background.style.width = w*s + 'px'    
                    }
                }
                if(properties.player_control_yakelibgusetb){
                    player_control_yakelibgusetb = properties.player_control_yakelibgusetb.value;
                    thumbnailsue()
                }
                if(properties.player_control_fontusetb){
                    player_control_fontusetb = properties.player_control_fontusetb.value;
                    thumbnailsue()
                }
                if(properties.player_control_thumbnailrorl){
                    player_control_thumbnailrorl = properties.player_control_thumbnailrorl.value
                    if(properties.player_control_thumbnailrorl.value == true){
                        setTimeout(function(){
                            player_control_background.style.flexDirection = 'row-reverse'
                            var rawpadding = window.getComputedStyle(player_control_background).paddingRight
                            player_control_background.style.paddingRight = null
                            player_control_background.style.paddingLeft = rawpadding
                            player_control_info.style.alignItems = 'flex-end'
                        },2500)
                    }else{
                        if(FristLoad == false){
                            player_control_background.style.flexDirection = 'row'
                            var rawpadding = window.getComputedStyle(player_control_background).paddingLeft
                            player_control_background.style.paddingLeft = null
                            player_control_background.style.paddingRight = rawpadding
                            player_control_info.style.alignItems = 'flex-start'
                        }
                    }
                    if(FristLoad == false){
                        thumbnailsue()
                        playertitle()
                    }
                }
                if(properties.player_control_showaway){
                    if(properties.player_control_showaway.value == true){
                        player_control.style.transform = 'translate(-100%, 0)';
                        //player_control.style.left = '0px'
                    }else{
                        player_control.style.transform = 'translate(0, 0)';
                        //player_control.style.left = null
                    }
                }
                if(properties.player_control_samealbumtitle){
                    player_control_samealbumTitle = properties.player_control_samealbumtitle.value
                    if(FristLoad == false){
                        playertitle()
                    }
                }
                if(properties.player_control_visualaudiobar){
                    player_control_visualaudiobar = properties.player_control_visualaudiobar.value
                    if(FristLoad == false){
                        pc_aubar()
                    }
                }
                if(properties.player_control_barline){
                    player_control_barline = properties.player_control_barline.value
                    if(FristLoad == false){
                        aubarstop = true
                        pc_aubar()
                    }
                }
                if(properties.player_control_getcolor){
                    Color_pickup_method = properties.player_control_getcolor.value
                }
                if(properties.player_control_scalefactor){
                    player_control_scalefactor = properties.player_control_scalefactor.value
                }
                if(properties.player_control_hdong){
                    player_control_hdong = properties.player_control_hdong.value/500
                }
                if(properties.countdownY){
                    var y = properties.countdownY.value
                    countdown.style.top = y + "%"
                }
                if(properties.countdownX){
                    var x = properties.countdownX.value
                    countdown.style.left = x + "%"
                }
                if(properties.countdown_size){
                    var s = properties.countdown_size.value;
			        countdown.style.fontSize = Math.floor(h/300*s) + 'px';
                    countdown.style.lineHeight = Math.floor(h/570*s) + 'px';
                }
                if(properties.countdown_txt){
                    countdown_txt = properties.countdown_txt.value
                }
                if(properties.countdown_txt1){
                    countdown_txt1 = properties.countdown_txt1.value
                }
                if(properties.countdown_show){
                    clearDT()
                    if(properties.countdown_show.value){
                        countdown.style.display = "flex"
                        setcountdown_a()
                    }else{
                        countdown.style.display = "none"
                    }
                }
                if(properties.countdown_year){
                    countdown_year = properties.countdown_year.value
                }
                if(properties.countdown_month){
                    countdown_month = properties.countdown_month.value
                }
                if(properties.countdown_day){
                    countdown_day = properties.countdown_day.value
                }
                if(properties.countdown_color){
                    countdown_color = properties.countdown_color.value.split(' ').map(function(c){return Math.ceil(c*255)});
                    if(FristLoadcountdown == false){
                        countdownappearance()
                    }
                }
                if(properties.countdown_blurcolor_show){
                    countdown_blurcolor_show = properties.countdown_blurcolor_show.value
                    if(FristLoadcountdown == false){
                    countdownappearance()
                    }
                }
                if(properties.countdown_blurcolor){
                    countdown_blurcolor = properties.countdown_blurcolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
                    if(FristLoadcountdown == false){
                    countdownappearance()
                    }
                }
                if(properties.countdown_yakeli_show){
                    countdown_yakeli_show = properties.countdown_yakeli_show.value
                    if(FristLoadcountdown == false){
                    countdownappearance()
                    }
                }
                if(properties.countdown_yakelicolor){
                    countdown_yakelicolor = properties.countdown_yakelicolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
                    if(FristLoadcountdown == false){
                    countdownappearance()
                    }
                }
                if(properties.countdown_yakeli){
                    countdown_yakeli = properties.countdown_yakeli.value/100
                    if(FristLoadcountdown == false){
                    countdownappearance()
                    }
                }
                if(properties.countdown_bluryakeli){
                    countdown_bluryakeli = properties.countdown_bluryakeli.value
                    countdownappearance()
        
                    FristLoadcountdown = false
                }
                function countdownappearance(){
        
                    countdown.style.color = 'rgb('+countdown_color+')';
        
                    if(countdown_blurcolor_show){
                        countdown_webtext.style.textShadow = '0 0 20px rgb('+countdown_blurcolor+')';
                    }else{
                        countdown_webtext.style.textShadow = null
                    }
        
                    if(countdown_yakeli_show){
                        countdown_webtext.style.background = "rgba("+countdown_yakelicolor+","+countdown_yakeli+")"
                        countdown_webtext.style.backdropFilter = "blur("+countdown_bluryakeli+"px)"
                    }else{
                        countdown_webtext.style.background = null
                        countdown_webtext.style.backdropFilter = null
                    }
                }
                if(properties.countdown_timetransparency){
                    var t = properties.countdown_timetransparency.value/100;
                    countdown.style.opacity = t;
                }
                if(properties.countdown_roundedcorners){
                    var Roundedcorners = properties.countdown_roundedcorners.value
                    if(FristLoad == true){
                        while (true) {
                            var height =  window.getComputedStyle(countdown).height
                            if (height != "0px"){
                                countdown_webtext.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                                countdown_webtext.style.padding = null
                                countdown_webtext.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
                                break;
                            }
                        }
                    }else{
                        var height =  window.getComputedStyle(countdown).height
                        countdown_webtext.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                        countdown_webtext.style.padding = null
                        countdown_webtext.style.padding = "0 " + (height.slice(0,-2)/2)*(Roundedcorners/200) + 'px';
                    }
                }

                if(properties.picturesinfo_language){
                    picturesinfo_language = properties.picturesinfo_language.value
                }
                if(properties.picturesinfoY){
                    var y = properties.picturesinfoY.value
                    pictures.picture_info.style.top = y + "%"
                }
                if(properties.picturesinfoX){
                    var x = properties.picturesinfoX.value
                    pictures.picture_info.style.left = x + "%"
                }
                if(properties.picturesinfo_size){
                    var s = properties.picturesinfo_size.value;
			        pictures.picture_info.style.fontSize = Math.floor(h/600*s) + 'px';
                    pictures.picture_info.style.lineHeight = Math.floor(h/1140*s) + 'px';
                }
                if(properties.picturesinfo_show){
                    picturesinfo_show = properties.picturesinfo_show.value
                    if(properties.picturesinfo_show.value){
                        pictures.picture_info.style.display = "flex"
                    }else{
                        pictures.picture_info.style.display = "none"
                    }
                }
                if(properties.picturesinfo_color){
                    picturesinfo_color = properties.picturesinfo_color.value.split(' ').map(function(c){return Math.ceil(c*255)});
                    if(Fristpicturesinfo == false){
                        picturesinfoappearance()
                    }
                }
                if(properties.picturesinfo_blurcolor_show){
                    picturesinfo_blurcolor_show = properties.picturesinfo_blurcolor_show.value
                    if(Fristpicturesinfo == false){
                    picturesinfoappearance()
                    }
                }
                if(properties.picturesinfo_blurcolor){
                    picturesinfo_blurcolor = properties.picturesinfo_blurcolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
                    if(Fristpicturesinfo == false){
                    picturesinfoappearance()
                    }
                }
                if(properties.picturesinfo_yakeli_show){
                    picturesinfo_yakeli_show = properties.picturesinfo_yakeli_show.value
                    if(Fristpicturesinfo == false){
                    picturesinfoappearance()
                    }
                }
                if(properties.picturesinfo_yakelicolor){
                    picturesinfo_yakelicolor = properties.picturesinfo_yakelicolor.value.split(' ').map(function(c){return Math.ceil(c*255)});
                    if(Fristpicturesinfo == false){
                    picturesinfoappearance()
                    }
                }
                if(properties.picturesinfo_yakeli){
                    picturesinfo_yakeli = properties.picturesinfo_yakeli.value/100
                    if(Fristpicturesinfo == false){
                    picturesinfoappearance()
                    }
                }
                if(properties.picturesinfo_bluryakeli){
                    picturesinfo_bluryakeli = properties.picturesinfo_bluryakeli.value
                    picturesinfoappearance()
        
                    Fristpicturesinfo = false
                }
                function picturesinfoappearance(){
        
                    pictures.picture_info.style.color = 'rgb('+picturesinfo_color+')';
                    var titleicon =  document.querySelector("#picture_info .titleicon")
                    var authoricon =  document.querySelector("#picture_info .authoricon")
                    var locationicon = document.querySelector("#picture_info .locationicon")
                    var filter = 'drop-shadow(0 10240px ' + 'rgb(' + picturesinfo_color + '))'
                    var filter1 = 'drop-shadow(0 10237px ' + 'rgb(' + picturesinfo_color + '))'
                    titleicon.style.filter = filter1;
                    authoricon.style.filter = filter;
                    locationicon.style.filter = filter;
                    
                }
                if(picturesinfo_blurcolor_show){
                    pictures.info.style.textShadow = '0 0 20px rgb('+picturesinfo_blurcolor+')';
                }else{
                    pictures.info.style.textShadow = null
                }        
                if(picturesinfo_yakeli_show){
                    pictures.info.style.background = "rgba("+picturesinfo_yakelicolor+","+picturesinfo_yakeli+")"
                    pictures.info.style.backdropFilter = "blur("+picturesinfo_bluryakeli+"px)"
                }else{
                    pictures.info.style.background = null                
                    pictures.info.style.backdropFilter = null
                }
                if(properties.picturesinfo_timetransparency){
                    var t = properties.picturesinfo_timetransparency.value/100;
                    pictures.picture_info.style.opacity = t;
                }
                if(properties.picturesinfo_roundedcorners){
                    var Roundedcorners = properties.picturesinfo_roundedcorners.value
                    if(FristLoad == true){
                        while (true) {
                            var height =  window.getComputedStyle(picture_info).height
                            if (height != '0px') {
                            pictures.info.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                            pictures.info.style.padding = null
                            pictures.info.style.padding = ((height.slice(0,-2)/2)*(Roundedcorners/200) + 'px ') + ((height.slice(0,-2)/2)*(Roundedcorners/200) + 'px ') + "0";
                            break;
                            }
                        }
                    }else{
                        var height =  window.getComputedStyle(picture_info).height
                        pictures.info.style.borderRadius = (height.slice(0,-2)/2)*(Roundedcorners/100) + 'px';
                        pictures.info.style.padding = null
                        pictures.info.style.padding = ((height.slice(0,-2)/2)*(Roundedcorners/200) + 'px ') + ((height.slice(0,-2)/2)*(Roundedcorners/200) + 'px ') + "0";
                    }
                }
                if(properties.picturesinfo_showaway){
                    if(properties.picturesinfo_showaway.value == true){
                        pictures.picture_info.style.transform = 'translate(-100%, 0)';
                    }else{
                        pictures.picture_info.style.transform = 'translate(0, 0)';
                    }
                }
                if(properties.picturesinfo_showRorL){
                    picturesinfo_showRorL = properties.picturesinfo_showRorL.value
                    if(properties.picturesinfo_showRorL.value){
                        pictures.picture_info.style.textAlign = "right"
                    }else{
                        pictures.picture_info.style.textAlign = "left"
                    }
                }
                if(properties.picturesinfo_showwidth){
                    if(properties.picturesinfo_showwidth.value == 0){
                        pictures.info.style.width = 'auto'
                    }else{
                    var s = properties.picturesinfo_showwidth.value/100
                    //var w = window.innerWidth
                    pictures.info.style.width = w*s + 'px'    
                    }
                }
                if(properties.picturesinfo_description){
                    document.querySelector('.description').style.display = properties.picturesinfo_description.value ? "block" : "none"
                }
                if(properties.rgb_fps){
                    switch(properties.rgb_fps.value){
                        case 24:
                            RGBRefresh = 41
                            
                        case 30:
                            RGBRefresh = 33
                
                        case 45:
                            RGBRefresh = 22
                
                        case 60:
                            RGBRefresh = 16
                    }
                }
                if(properties.rgb_show){
                    RGB_show = properties.rgb_show.value
                }
                if(properties.rgb_bg){
                    backgroundRGB = properties.rgb_bg.value
                }
                if(properties.rgb_sa){
                    sakuraRGB = properties.rgb_sa.value
                }
                if(properties.rgb_pa){
                    particlesRGB = properties.rgb_pa.value
                }
                if(properties.rgb_au){
                    audiobarRGB = properties.rgb_au.value
                }
                if(properties.rgb_sa_op){
                    opacity_saRGb = properties.rgb_sa_op.value/100
                }
                if(properties.rgb_au_high){
                    aurgbhigh = properties.rgb_au_high.value
                }
                if(properties.rgb_au_color){
                    aurgbcolor = properties.rgb_au_color.value.split(' ').map(function(c){return Math.ceil(c*255)});
                }
                if(properties.rgb_color_rainbow){
                    audiobarrainbowcolor = properties.rgb_color_rainbow.value
                }
                if(properties.rgb_color_rainbow_move){
                    rainbowmove = properties.rgb_color_rainbow_move.value
                }
                if(properties.rgb_color_rainbow_movespeed){
                    rainbowmovespeed = properties.rgb_color_rainbow_movespeed.value
                }
                if(FristLoad == true){console.log("main.js load success")}
                setTimeout(function(){
                    FristLoad = false;
                },10000)
    },
    userDirectoryFilesAddedOrChanged: function(propertyName, changedFiles) {
        if (!files.hasOwnProperty(propertyName)) {
            // First time that files are sent.
            files[propertyName] = changedFiles;
        } else {
            files[propertyName] = files[propertyName].concat(changedFiles);

        }
        updateFileList(files[propertyName]);
    },
    userDirectoryFilesRemoved: function(propertyName, removedFiles) {
        // The user removed files from the directory while the wallpaper was running.
        // Remove these files from the global array first.
        for (var i = 0; i < removedFiles.length; ++i) {
            var index = files[propertyName].indexOf(removedFiles[i]);
            var myindex = myList.indexOf(removedFiles[i]);
            if (index >= 0) {
                files[propertyName].splice(index, 1);
            }
            if (myindex >= 0) {
                // 列表中删除
                myList.splice(myindex, 1);
            }
        }
        updateFileList(files[propertyName]);
    },
	setPaused: function( isPaused ) {
		if (isPaused){
            Paused = true
			myvideo.pause();
			myAudio.pause();
		}else{
            Paused = false
			if (!(myvideo.paused && (myvideo.src.slice(-10) === 'twall/null' || myvideo.src.slice(-10) === 'index.html'))
            ) {
				myvideo.play();

			}
			if (!(myAudio.paused && (myAudio.src.slice(-10) === 'twall/null' || myAudio.src.slice(-10) === 'index.html'))
            ) {
				myAudio.play();
			}
            if(RGB_show == true){
                if(wallpapermode != 3){
                    var src = document.body.style.backgroundImage.replace(/^url\("(.+?)"\)$/, '$1')
                    background2canvas(src, false)
                }else{    
			        background2canvas(null,true)
                }
            }
            if(showSakura == true){
                removesakura()
            }
		}
	}
};

//多边形模式
var SetPolygonAngle = function(mode){

	switch (mode){
		case 1:
			param.PolygonAngle = 1;
			Polygon = 295; 
			break;
		case 2:
			param.PolygonAngle = 2;
			Polygon = 270;
			break;
		case 3:
			param.PolygonAngle = 4;
			Polygon = 245;
			break;
		case 4:
			param.PolygonAngle = 5;
			Polygon = 220;
			break;
		case 5:
			param.PolygonAngle = 7;
			Polygon = 195;
			break;
		case 6:
			param.PolygonAngle = 9;
			Polygon = 170;
			break;
		case 7:
			param.PolygonAngle = 10;
			Polygon = 145;
			break;
		case 8:
			param.PolygonAngle = 12;
			Polygon = 120;
			break;
		case 9:
			param.PolygonAngle = 30;
			Polygon = 95;
			break;
		case 10:
			param.PolygonAngle = 60;
			Polygon = 70;
			break;
		case 11:
			param.PolygonAngle = 90;
			Polygon = 45;
			break;
		case 12:
			param.PolygonAngle = 180;
			Polygon = 20;
			break;
		default:		
	}
	
};

var shouldShowMap = function(){
	if(cusmapRoute){
		wallpaper.particles('particlesImage', cusmapRoute,'false');
	}else{
		wallpaper.particles('particlesImage', mapRoute,'true');
	}
};
