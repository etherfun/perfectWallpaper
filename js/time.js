/**
 * Created by Administrator on 2017/5/6 0006.
 */
// 当前时间实现代码

var oClock = document.querySelector("#clock");
var oClock_block = document.querySelector("#clock .block");
var oClock_webtext_min = document.querySelector("#clock .block .min")
var oClock_webtext_ti = document.querySelector("#clock .block .time-indicators")
var oClock_webtext_sec = document.querySelector("#clock .block .time-indicators .sec")
var oClock_webtext_st = document.querySelector("#clock .block .time-indicators .st")


var tStyle = true;


var vv = 0;
var timeTag = 1;
var color2;


//以后添加
function setTimeColor() {

	if (vv > 255) { timeTag *= -1; vv = 255; }
	if (vv < 0) { timeTag *= -1; vv = 0; }
	color2 = 'hsl(' + vv + ',90%,50%)';
	vv += timeTag / 1;


	oClock.style.color = color2;
	oDate.style.color = color2;
}


function oClockInit() {
	var w = window.innerWidth;
	var h = window.innerHeight;
	//oClock.style.width = w+'px';
	//oClock.style.lineHeight = h+'px';
	//oClock.style.height =  h+'px';
	oClock.style.fontSize = Math.floor(h / 300 * 20) + 'px';
	//oDate.style.width = w+'px';
	oDate.style.fontSize = Math.floor(h / 300 * 20) + 'px';

	//weather.font-size = '0.5em';
}

oClockInit();

function autoTime() {
	getTime_sec();
	setTimeout(autoTime, 1000);
}

autoTime();

function getTime_sec() {
	var t = new Date();
	oClock_webtext_sec.innerHTML = add0(t.getSeconds());

	if (tStyle == false) {
		//h = t.getHours()
		oClock_webtext_min.innerHTML = add0(t.getHours() >= 12 ? t.getHours() - 12 : t.getHours()) + " : " + add0(t.getMinutes());
		oClock_webtext_st.style.display = "flex";
		var str = t.getHours() <= 12 ? "AM" : "PM";
		oClock_webtext_st.innerHTML = str;
	} else {
		oClock_webtext_min.innerHTML = add0(t.getHours()) + " : " + add0(t.getMinutes());
		oClock_webtext_st.style.display = "none";
	}

	if (tStyle == false) {
		var str = t.getHours() < 12 ? "AM" : "PM";
		oClock_webtext_st.innerHTML = str;
	}

	if (t.getHours() === 0 && t.getMinutes() === 0 && t.getSeconds() === 0) {
		getdate();
	}
}



