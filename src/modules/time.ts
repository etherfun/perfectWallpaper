import { add0 } from '../utils/tool';
import { elements } from '../utils/elementManager';

var oClock = elements.clock.container;
var oClock_block = elements.clock.block;
var oClock_webtext_min = elements.clock.min;
var oClock_webtext_ti = elements.clock.indicators;
var oClock_webtext_sec = elements.clock.sec;
var oClock_webtext_st = elements.clock.st;


var oDate = elements.date.container as HTMLElement;
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
	if (oDate) {
		oDate.style.color = color2;
	}
}

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

// 导出函数
export { getTime_sec };



