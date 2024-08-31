/**
 * Created by Administrator on 2017/5/6 0006.
 */
// 当前时间实现代码
/*
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();
*/

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
function setTimeColor(){

		if(vv>255){timeTag*=-1;vv=255;}
		if(vv<0){timeTag*=-1;vv=0;}
		color2 = 'hsl('+vv+',90%,50%)';
		vv += timeTag/1;
		
		
		oClock.style.color = color2;
		oDate.style.color = color2;
		/*oClock.style.textShadow = '0 0 20px ' + color2;
		oDate.style.textShadow = '0 0 20px' + color2;*/
		//oClock.style.textShadow = '0 0 20px rgb('+c+')';
		//oDate.style.textShadow = '0 0 20px rgb('+c+')';
		//oClock.style.color = 'rgb('+c+')';
		//oDate.style.color = 'rgb('+c+')';
}


function oClockInit(){
	var w = window.innerWidth;
    var h = window.innerHeight;
	//oClock.style.width = w+'px';
	//oClock.style.lineHeight = h+'px';
	//oClock.style.height =  h+'px';
	oClock.style.fontSize = Math.floor(h/300*20) + 'px';
	//oDate.style.width = w+'px';
	oDate.style.fontSize = Math.floor(h/300*20) + 'px';

	//weather.font-size = '0.5em';
}

oClockInit();
//window.onresize = oClockInit;

/*
var show = document.querySelector("#show");
function showi(str){
    show.innerHTML = str;
}
*/


/* 时间 */
/*function getTime(){
    var t = new Date();
	
    if(tStyle){
		if(tShowSencends){
			oClock.innerHTML = add0(t.getHours())+" : "+add0(t.getMinutes())+" <span class='sec'>"+add0(t.getSeconds()) + "</span>";
		}else{
			oClock.innerHTML = add0(t.getHours())+" : "+add0(t.getMinutes());
		}
		//oDate.innerHTML = "<span class='sec'>" + t.getFullYear() +"年"+t.getMonth() + "月" + t.getDate() + "日 "+ w_array[t.getDay()] + "</span>";
    }else{
        var h = t.getHours();
        var str = h<12 ? "AM" : "PM";
        //var str = h<12 ? "上午" : "下午";
        h = h<=12 ? h : h-12;
		if(tShowSencends){
			oClock.innerHTML = "<span id='time'>"+add0(h)+" : "+add0(t.getMinutes())+" <span class='sec'>"+add0(t.getSeconds())+"</span><span class='st'>"+str+"</span></span>";
		}else{
			oClock.innerHTML = "<span id='time'>"+add0(h)+" : "+add0(t.getMinutes())+ "</span>" + " <span class='sec'>"+ str + "</span>"
		}
    }
}*/

function autoTime(){
    getTime_sec();
    setTimeout(autoTime, 1000);
}


autoTime();


function getTime_sec(){
	var t =new Date()
	oClock_webtext_sec.innerHTML = add0(t.getSeconds())
	if(tStyle == false){
		//h = t.getHours()
		oClock_webtext_min.innerHTML = add0( t.getHours() >= 12 ?  t.getHours() - 12 : t.getHours()) + " : " + add0(t.getMinutes())
		oClock_webtext_st.style.display = "flex"
		var str = t.getHours() <= 12 ? "AM" : "PM";
		oClock_webtext_st.innerHTML = str
	}else{
		oClock_webtext_min.innerHTML = add0(t.getHours()) + " : " + add0(t.getMinutes())
		oClock_webtext_st.style.display = "none"
	}
	if(tStyle == false){
		var str = t.getHours() < 12 ? "AM" : "PM";
		oClock_webtext_st.innerHTML = str
	}
}



