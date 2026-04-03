// 一言模块
import { elements } from './utils/elementManager';
import { config } from './utils/config';
import { escapeHtml } from './utils/string';

const hitokoto = elements.hitokoto.container;
const hitokoto_webtext = elements.hitokoto.webtext;
const hitokotoRuntime = config.runtime?.hitokoto ?? { hitokoto_text: "", from_text: "", from_who_text: "" };

async function getHitokoto_input(strHtml1: string): Promise<void> {
    const params = (['hit_a', 'hit_b', 'hit_c', 'hit_d', 'hit_e', 'hit_f', 'hit_g', 'hit_h', 'hit_i', 'hit_j', 'hit_k', 'hit_l'] as const)
    .map(k => config[k] as string)
    .filter(Boolean)
    .join('');

    try {
        const res = await fetch(`https://v1.hitokoto.cn/?${params}`).then(res => res.json()) as {
            hitokoto: string;
            from: string;
            from_who: string | null;
        };

        hitokotoRuntime.hitokoto_text = res.hitokoto;
        hitokotoRuntime.from_text = res.from;
        hitokotoRuntime.from_who_text = res.from_who ?? "未获取";

        hitokoto_webtext.innerHTML = formatHitokoto(strHtml1);
    } catch (error) {
        console.error('Failed to fetch hitokoto:', error);
    }
}

function formatHitokoto(strHtml: string): string {
    const { hitokoto_text, from_who_text, from_text } = hitokotoRuntime;
    const unknownAuthors = ["未知", "佚名"];

    const author = unknownAuthors.includes(from_who_text) ? "" : from_who_text;
    const source = from_text === from_who_text ? "" : `《${from_text}》`;

    return strHtml
        .replace("{一言}", escapeHtml(hitokoto_text))
        .replace("{作者}", escapeHtml(author))
        .replace("{出处}", escapeHtml(source));
}

export function getHitokoto(): void {
    const templates: Record<number, string> = {
        1: "<div class='text1'>{一言}</div><div class='text2'>——{作者}{出处}</div>",
        2: "{一言}"
    };

    const template = templates[config.hitokoto_format_test];
    if (template) {
        getHitokoto_input(template);
    }
}

export const autoHitokto = getHitokoto;
