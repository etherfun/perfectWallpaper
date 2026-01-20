var hitokoto = document.querySelector("#hitokoto");
var hitokoto_webtext = document.querySelector("#hitokoto .text");

var  hitokoto_text = "未获取";
var  from_who_text = "未获取";
var  from_text = "未获取";
var  nullHitokoto = "" 

function getHitokoto_input(strHtml1){
    $.get("https://v1.hitokoto.cn/?" + hit_a + hit_b + hit_c + hit_d + hit_e + hit_f + hit_g + hit_h + hit_i + hit_j + hit_k + hit_l , function(res1){
       
        console.log(JSON.stringify(res1));
        
        hitokoto_text = res1.hitokoto
        from_text = res1.from
        from_who_text = res1.from_who

        hitokoto_webtext.innerHTML = FormatHitokto(strHtml1);
    });
    
}


function FormatHitokto(strHtml1){
    strHtml1 = strHtml1.replace("{一言}",hitokoto_text);
    if(from_who_text === null || from_who_text === "未知" || from_who_text === "佚名"){
        strHtml1 = strHtml1.replace("{作者}",nullHitokoto);
    }else{
        strHtml1 = strHtml1.replace("{作者}",from_who_text);
    }
    if(from_text == from_who_text){
        strHtml1 = strHtml1.replace("{出处}",nullHitokoto);
    }else{
        strHtml1 = strHtml1.replace("{出处}","《"+from_text+"》");
    }
    return strHtml1
    
}


function getHitokoto(){
    switch(HitoktoFormatTest){
        case 1://默认
            getHitokoto_input("<div class='text1'>{一言}</div>"+"<div class='text2'>——{作者}{出处}</div>");
            break;
        case 2://隐藏作者与出处;
            getHitokoto_input("{一言}");
            break;
        }
}

function autoHitokto(){
    getHitokoto();
    switch(hitokoto_updata){//更新时间
        case 1:
            timerManager.create(autoHitokto, 1800000, 'updataHitokto');
            break
        case 2:
            timerManager.create(autoHitokto, 3600000, 'updataHitokto');
            break
        case 3:
            timerManager.create(autoHitokto, 7200000, 'updataHitokto');
            break
        case 4:
            timerManager.create(autoHitokto, 10800000, 'updataHitokto');
            break
        case 5:
            break
    }
}

