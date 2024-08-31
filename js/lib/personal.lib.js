/**给元素添加颜色 */
function Element_effects_color(TorF,Element,Element_color,Element_blurcolor){

    Element.style.color = 'rgb('+Element_color+')';

    if(TorF){
        Element.style.textShadow = '0 0 20px rgb('+Element_blurcolor+')';
    }else{
        Element.style.textShadow = null
    }

    
}

/**给元素添加亚克力效果 */
function Element_effects_yakeli(TorF,Element,Element_yakeli,Element_yakelicolor,Element_bluryakeli){
    if(TorF){
        Element.style.background = "rgba("+Element_yakelicolor+","+Element_yakeli+")"
        Element.style.backdropFilter = "blur("+Element_bluryakeli+"px)"
    }else{
        Element.style.background = null
        Element.style.backdropFilter = null
    }
}

/**时间不足两位数则加"0" */
function add0(n){
    return n<10 ? '0'+n : ''+n;
}

/**Hex转化为16位 */
function hexToRgb(hexColor) {  
    var colorCode = hexColor.replace("#", "");  

    var r = parseInt(colorCode.substring(0, 2), 16);  
    var g = parseInt(colorCode.substring(2, 4), 16);  
    var b = parseInt(colorCode.substring(4, 6), 16);  

    return [r , g , b] ;  
    
}