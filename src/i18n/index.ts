/**
 * i18n 入口 — vue-i18n 配置
 *
 * 加载顺序：
 *   1. 内置 fallback 字典（Phase 1 用 — 等价于 source/i18n/zh-CN.json）
 *   2. 异步加载 source/i18n/{zh-CN|en-US}.json（独立运行模式下 fetch）
 *
 * 切换语言：`useI18n().locale.value = 'en-US'`
 *
 * 在 .vue 中：`const { t } = useI18n(); t('ui_setting_show')`
 * 在 .ts 中：`const { t } = useI18n(); t('ui_setting_show')`  ← 同样可用
 */

import { createI18n, useI18n } from 'vue-i18n';

import { useConfigStore } from '@/stores/config';

export { useI18n };

/**
 * 静态 i18n 翻译函数 — 适用于非 setup 上下文（.ts 模块顶层 / 普通函数 / 异步回调）。
 *
 * vue-i18n 9 在 `legacy: false` 模式下，`useI18n()` 必须有 inject 上下文
 * （SFC setup / 显式 runWithContext）。在 .ts 模块顶层或普通函数中调用
 * 会抛 "inject() can only be used inside setup()"。
 *
 * 本函数绕过该限制，直接访问 i18n 全局实例的 t() 方法：
 *   - 响应式（locale 变化时全局 messages 重新映射，调用处自动更新）
 *   - 不依赖 inject 上下文
 *   - 适用于 weather/version 等命令式模块的迁移
 */
export function globalT(key: string, ...args: unknown[]): string {
    // vue-i18n 类型未导出 Composer.t 的多参数重载，用 any 绕过
     
    return (i18n.global as any).t(key, ...args);
}

/**
 * 最小内置 fallback 字典
 *
 * 覆盖 Phase 1 涉及的 key（系统设置、状态显示等）。
 * 完整 i18n 字典位于 source/i18n/{en-US,zh-CN}.json，
 * 启动时会被异步加载并 merge 进来。
 */
const FALLBACK_MESSAGES = {
    'zh-CN': {
        app_title: '完美壁纸',
        weather_default_title: '天气',
        weather_no_data: '无数据',
        weather_loading: '正在加载天气数据...',
        weather_tip_rain: '今日有雨，建议携带雨具。',
        weather_tip_sunny_day: '祝您拥有愉快的一天。',
        sysmon_card_util: '利用率',
        sysmon_card_temp: '温度',
        sysmon_card_power: '功耗',
        sysmon_card_vram: '显存',
        sysmon_card_used: '已用',
        sysmon_card_free: '空闲',
        sysmon_card_label_cpu: 'CPU',
        sysmon_card_label_gpu: 'GPU',
        sysmon_card_label_mem: '内存',
        sysmon_card_label_net: '网络',
        version_current_version: '当前版本',
        version_no_data: '暂无版本信息',
        version_update_title: '版本更新',
    },
    'en-US': {
        app_title: 'PerfectWall',
        weather_default_title: 'Weather',
        weather_no_data: 'No data',
        weather_loading: 'Loading weather data...',
        sysmon_card_util: 'Util',
        sysmon_card_temp: 'Temp',
        sysmon_card_power: 'Power',
        sysmon_card_vram: 'VRAM',
        sysmon_card_used: 'Used',
        sysmon_card_free: 'Free',
        sysmon_card_label_cpu: 'CPU',
        sysmon_card_label_gpu: 'GPU',
        sysmon_card_label_mem: 'MEM',
        sysmon_card_label_net: 'NET',
        version_current_version: 'Current Version',
        version_no_data: 'No version information available',
        version_update_title: 'Version Update',
    },
};

export const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'zh-CN',
    fallbackLocale: 'zh-CN',
    messages: FALLBACK_MESSAGES,
});

/**
 * 异步加载 source/i18n/{lang}.json 并 merge 进 i18n 字典。
 * 失败时静默回退到内置 fallback。
 */
export async function loadI18n(lang?: string): Promise<void> {
    const config = useConfigStore();
    const target = lang || config.language || 'zh-CN';
    try {
        // 独立运行模式：dist/index.html 同目录下的 source/i18n/
        const res = await fetch(`source/i18n/${target}.json`);
        if (res.ok) {
            const messages = await res.json();
             
            (i18n as any).global.setLocaleMessage(target, messages);
            i18n.global.locale.value = target as 'zh-CN' | 'en-US';
        }
    } catch (err) {
        console.warn('[i18n] failed to load', target, err);
    }
}
