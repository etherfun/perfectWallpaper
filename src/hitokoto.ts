// 一言模块
import { elements } from './utils/elementManager';
import { config } from './utils/config';

const hitokoto = elements.hitokoto.container;
const hitokoto_webtext = elements.hitokoto.webtext;
const hitokotoRuntime = config.runtime.hitokoto;

async function getHitokoto_input(strHtml1: string): Promise<void> {
    const params = config.hitCategories.join("");

    const res = await fetch(`https://v1.hitokoto.cn/?${params}`).then(res => res.json()) as {
        hitokoto: string;
        from: string;
        from_who: string | null;
    };

    hitokotoRuntime.hitokoto_text = res.hitokoto;
    hitokotoRuntime.from_text = res.from;
    hitokotoRuntime.from_who_text = res.from_who ?? "未获取";

    hitokoto_webtext.innerHTML = formatHitokoto(strHtml1);
}

function formatHitokoto(strHtml: string): string {
    const { hitokoto_text, from_who_text, from_text } = hitokotoRuntime;
    const unknownAuthors = ["未知", "佚名"];

    const author = unknownAuthors.includes(from_who_text) ? "" : from_who_text;
    const source = from_text === from_who_text ? "" : `《${from_text}》`;

    return strHtml
        .replace("{一言}", hitokoto_text)
        .replace("{作者}", author)
        .replace("{出处}", source);
}

export function getHitokoto(): void {
    const templates: Record<number, string> = {
        1: "<div class='text1'>{一言}</div><div class='text2'>——{作者}{出处}</div>",
        2: "{一言}"
    };

    const template = templates[config.hitoktoFormatTest];
    if (template) {
        getHitokoto_input(template);
    }
}

export const autoHitokto = getHitokoto;
