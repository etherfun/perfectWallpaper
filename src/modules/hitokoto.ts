// 一言模块
import { elements } from '../utils/elementManager';
import { appConfig } from '../utils/config';

const hitokoto = elements.hitokoto.container;
const hitokoto_webtext = elements.hitokoto.webtext;

let hitokoto_text = "未获取";
let from_who_text = "未获取";
let from_text = "未获取";
const nullHitokoto = "";

// 获取一言数据
function getHitokoto_input(strHtml1: string): void {
    $.get("https://v1.hitokoto.cn/?" + 
        appConfig.getHitA() + appConfig.getHitB() + appConfig.getHitC() + appConfig.getHitD() + 
        appConfig.getHitE() + appConfig.getHitF() + appConfig.getHitG() + appConfig.getHitH() + 
        appConfig.getHitI() + appConfig.getHitJ() + appConfig.getHitK() + appConfig.getHitL(), 
        function(res1: any) {
        hitokoto_text = res1.hitokoto;
        from_text = res1.from;
        from_who_text = res1.from_who;

        hitokoto_webtext.innerHTML = FormatHitokto(strHtml1);
    });
}

// 格式化一言文本
function FormatHitokto(strHtml1: string): string {
    strHtml1 = strHtml1.replace("{一言}", hitokoto_text);
    
    if (from_who_text === null || from_who_text === "未知" || from_who_text === "佚名") {
        strHtml1 = strHtml1.replace("{作者}", nullHitokoto);
    } else {
        strHtml1 = strHtml1.replace("{作者}", from_who_text);
    }
    
    if (from_text == from_who_text) {
        strHtml1 = strHtml1.replace("{出处}", nullHitokoto);
    } else {
        strHtml1 = strHtml1.replace("{出处}", "《" + from_text + "》");
    }
    
    return strHtml1;
}

// 根据格式获取一言
export function getHitokoto(): void {
    switch (appConfig.getHitoktoFormatTest()) {
        case 1: // 默认格式
            getHitokoto_input("<div class='text1'>{一言}</div>" + "<div class='text2'>——{作者}{出处}</div>");
            break;
        case 2: // 隐藏作者与出处
            getHitokoto_input("{一言}");
            break;
    }
}

// 自动获取一言
export function autoHitokto(): void {
    getHitokoto();
}

