var oDate = document.querySelector("#oDate");
var oDate_webtext = document.querySelector("#oDate .text");

var w_array = new Array("星期天","星期一","星期二","星期三","星期四","星期五","星期六");
var we_array = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
var m_array = new Array("正月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","腊月");
var me_array = new Array("January","February","March","April","May","June","July","August","September","October","November","December");

function getdate(){
    var t = new Date();

    switch (DateFormatTest) {
        case 1://"YYYY年MM月DD日 星期x"
            oDate_webtext.innerHTML = t.getFullYear() +"年"+(t.getMonth()+1) + "月" + t.getDate() + "日 "+ w_array[t.getDay()];
            break;
        case 2://"YYYY年MM月DD日"
            oDate_webtext.innerHTML = t.getFullYear() +"年"+(t.getMonth()+1) + "月" + t.getDate() + "日 ";
            break;
        case 3://"MM月DD日 星期x"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "月" + t.getDate() + "日 "+ w_array[t.getDay()];
            break;
        case 4://"MM月DD日"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "月" + t.getDate() + "日";
            break;
        case 5://"星期x"
            oDate_webtext.innerHTML = w_array[t.getDay()];
            break;
        case 6://"月份 星期x"
            oDate_webtext.innerHTML = m_array[t.getMonth()] + "&nbsp" + w_array[t.getDay()];
            break;
        case 7://"月份"
            oDate_webtext.innerHTML = m_array[t.getMonth()];
            break;
        case 8://"YYYY-MM-DD week"
            oDate_webtext.innerHTML = t.getFullYear() +"-"+(t.getMonth()+1) + "-" + t.getDate() + "&nbsp"+ we_array[t.getDay()];
            break;
        case 9://"YYYY-MM-DD 星期X"
            oDate_webtext.innerHTML = t.getFullYear() +"-"+(t.getMonth()+1) + "-" + t.getDate() + "&nbsp"+ w_array[t.getDay()];
            break;
        case 10://"YYYY-MM-DD"
            oDate_webtext.innerHTML = t.getFullYear() +"-"+(t.getMonth()+1) + "-" + t.getDate();
            break;
        case 11://"MM-DD week"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "-" + t.getDate() + "&nbsp"+ we_array[t.getDay()];
            break;
        case 12://"Month week"
            oDate_webtext.innerHTML = me_array[t.getMonth()] + "&nbsp" + we_array[t.getDay()];
            break;
        case 13://"week"
            oDate_webtext.innerHTML = we_array[t.getDay()];
            break;
        case 14://"Month"
            oDate_webtext.innerHTML = me_array[t.getMonth()];
            break;
        case 15://"YYYY/MM/DD week"
            oDate_webtext.innerHTML = t.getFullYear() +"/"+(t.getMonth()+1) + "/" + t.getDate() + "&nbsp" + we_array[t.getDay()];
            break;
        case 16://"YYYY/MM/DD 星期x"
            oDate_webtext.innerHTML = t.getFullYear() +"/"+(t.getMonth()+1) + "/" + t.getDate() + "&nbsp" + w_array[t.getDay()];
            break;
        case 17://"YYYY/MM/DD"
            oDate_webtext.innerHTML = t.getFullYear() +"/"+(t.getMonth()+1) + "/" + t.getDate() ;
            break;
        case 18://"MM/DD week"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "/" + t.getDate() + "&nbsp"+ we_array[t.getDay()];
            break;
        case 19://"MM/DD"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "/" + t.getDate();
            break;
        case 20://"Month"
            oDate_webtext.innerHTML = (t.getMonth()+1);
            break;
        case 21://"MM/DD/YYYY week"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "/" + t.getDate() + "/" + t.getFullYear() + "&nbsp" + we_array[t.getDay()];
            break;
        case 22://"MM/DD/YYYY 星期x"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "/" + t.getDate() + "/" + t.getFullYear() + "&nbsp" + w_array[t.getDay()];
            break;
        case 23://"MM/DD/YYYY"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "/" + t.getDate() + "/" + t.getFullYear();
            break;
        case 24://"MM-DD-YYYY"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "-" + t.getDate() + "-" + t.getFullYear();
            break;
        case 25://"MM-DD-YYYY week"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "-" + t.getDate() + "-" + t.getFullYear() + "&nbsp" + we_array[t.getDay()];
            break;
        case 26://"MM-DD-YYYY 星期x"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "-" + t.getDate() + "-" + t.getFullYear() + "&nbsp" + w_array[t.getDay()];
            break;
        case 27://MM.DD.YYYY
            oDate_webtext.innerHTML = (t.getMonth()+1) + "." + t.getDate() + "." + t.getFullYear() ;
            break;
        case 28://"YYYY.MM.DD"
            oDate_webtext.innerHTML = t.getFullYear() + "." + t.getDate() + "." + (t.getMonth()+1);
            break;
        case 29://"YYYY.MM.DD Week"
            oDate_webtext.innerHTML = t.getFullYear() + "." + t.getDate() + "." + (t.getMonth()+1) + "&nbsp" + we_array[t.getDay()];
            break;
        case 30://"YYYY.MM.DD 星期x"
            oDate_webtext.innerHTML = t.getFullYear() + "." + t.getDate() + "." + (t.getMonth()+1) + "&nbsp" + w_array[t.getDay()];
            break;
        case 31://"MM.DD.YYYY Week"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "." + t.getDate() + "." + t.getFullYear() + "&nbsp" + we_array[t.getDay()];
            break;
        case 32://"MM.DD.YYYY 星期x"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "." + t.getDate() + "." + t.getFullYear() + "&nbsp" + w_array[t.getDay()];
            break;
        case 33://"MM月DD日YYYY年 星期x"
            oDate_webtext.innerHTML = (t.getMonth()+1) + "月" + t.getDate() + "日" + t.getFullYear() + "年" + "&nbsp" + w_array[t.getDay()] ;
            break;
    }
}

function autodata(){
    getdate()
    setTimeout(getdate,600000)
}

autodata();