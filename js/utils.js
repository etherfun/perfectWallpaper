/**给元素添加颜色 */
function Element_effects_color(TorF, Element, Element_color, Element_blurcolor) {

    Element.style.color = 'rgb(' + Element_color + ')';

    if (TorF) {
        Element.style.textShadow = '0 0 20px rgb(' + Element_blurcolor + ')';
    } else {
        Element.style.textShadow = null
    }
}

/**给元素添加亚克力效果 */
function Element_effects_yakeli(TorF, Element, Element_yakeli, Element_yakelicolor, Element_bluryakeli) {
    if (TorF) {
        Element.style.background = "rgba(" + Element_yakelicolor + "," + Element_yakeli + ")"
        Element.style.backdropFilter = "blur(" + Element_bluryakeli + "px)"
    } else {
        Element.style.background = null
        Element.style.backdropFilter = null
    }
}

/**时间不足两位数则加"0" */
function add0(n) {
    return n < 10 ? '0' + n : '' + n;
}

/**Hex转化为16位 */
function hexToRgb(hexColor) {
    var colorCode = hexColor.replace("#", "");

    var r = parseInt(colorCode.substring(0, 2), 16);
    var g = parseInt(colorCode.substring(2, 4), 16);
    var b = parseInt(colorCode.substring(4, 6), 16);

    return [r, g, b];

}

/** i18n */
let i18n_data = null;

async function load_i18n_data() {
    try {
        const res = await fetch(`i18n/zh-CN.json`);
        if (!res.ok) {
            console.warn(`Language file ${current_lang}.json not found, falling back to zh-cn`);
            current_lang = 'zh-cn';
            const fallbackRes = await fetch(`i18n/zh-cn.json`);
            i18n_data = await fallbackRes.json();
        } else {
            i18n_data = await res.json();
        }
        setTimeout(() => {
            updateAllI18nElements();
        }, 3000);
    } catch (error) {
        console.error('Failed to load i18n data:', error);
    }
}

load_i18n_data();

function i18n(key) {
    if (!i18n_data) {
        console.warn('i18n data not loaded yet');
        return key;
    }
    return i18n_data[key] || key;
}

/** 自动更新所有带有 data-i18n 属性的元素 */
function updateAllI18nElements() {
    if (!i18n_data) return;

    processElements(document.querySelectorAll('[data-i18n]'));

    document.querySelectorAll('template').forEach(template => {
        if (template.content) {
            console.log('Processing template for i18n');
            processElements(template.content.querySelectorAll('[data-i18n]'));
        }
    });
}

/** 处理元素集合的通用函数 */
function processElements(elements) {
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = i18n(key);

        if (element.children.length > 0) {
            const textNodes = Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE);

            if (textNodes.length > 0) {
                textNodes[0].textContent = translation;
            } else {
                element.insertBefore(
                    document.createTextNode(translation),
                    element.firstChild
                );
            }
        } else {
            element.textContent = translation;
        }
    });
}

/**天气请求数量检查 */
function weather_paymode() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    const usageData = JSON.parse(localStorage.getItem('UsageData') || '{}');
    localStorage.removeItem('UseNumber');

    if (currentDate === 1 || usageData.month !== currentMonth) {
        usageData.count = 0;
        usageData.month = currentMonth;
    }

    if (usageData.count >= 50000) {
        return true; // 需要付费
    }

    usageData.count = (usageData.count || 0) + 1;
    localStorage.setItem('UsageData', JSON.stringify(usageData));
}

/**
 * 如果失败多次重试fetch请求
 * @param {string} url url地址
 * @param {{}} options 传递请求头
 * @param {number} maxRetries 重试次数
 * @returns 
 */
function fetch_with_retry(url, options = {}, maxRetries = 3) {
    return new Promise((resolve, reject) => {
        const attempt = (retryCount) => {
            fetch(url, options)
                .then(async response => {
                    if (!response.ok) {
                        const errorMsg = typeof get_i18n_text === 'function'
                            ? String(await get_i18n_text(error_get_weather_data))
                            : '获取天气数据失败';
                        throw new Error(`${errorMsg} HTTP ${response.status}`);
                    }
                    return response;
                })
                .then(resolve)
                .catch(error => {
                    if (retryCount < maxRetries) {
                        console.log(`第 ${retryCount + 1} 次重试...`);
                        const delay = Math.pow(2, retryCount) * 1000;
                        setTimeout(() => attempt(retryCount + 1), delay);
                    } else {
                        reject(error);
                    }
                });
        };

        attempt(0);
    });
}
/**格式化时间 */
function getTime(timestamp, seconds = true) {
    let format = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        seconds: '',
        hour12: false
    }
    if (seconds) {
        format.seconds = '2-digit';
    }

    return timestamp.toLocaleString('zh-CN', format).replace(/\//g, '-'); // 将斜杠替换为横杠
}