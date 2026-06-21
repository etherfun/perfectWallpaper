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
 */

import { createI18n } from 'vue-i18n';

import { useConfigStore } from '@/stores/config';

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
        // 占位 — 实际值由异步加载的 source/i18n/zh-CN.json 覆盖
    },
    'en-US': {
        app_title: 'PerfectWall',
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (i18n as any).global.setLocaleMessage(target, messages);
            i18n.global.locale.value = target as 'zh-CN' | 'en-US';
        }
    } catch (err) {
        console.warn('[i18n] failed to load', target, err);
    }
}
