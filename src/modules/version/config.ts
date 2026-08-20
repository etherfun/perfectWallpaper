/**
 * Version module - Configuration, types, and data loading
 */

import { fetch_with_retry } from '../../utils/tool';

export interface VersionHistoryEntry {
    version: string;
    date: string;
    titleKey?: string;
    title?: string;
    imageAltKey?: string;
    imageAlt?: string;
    changesKey?: string;
    changes?: string[];
}

export const versionConfig = {
    CURRENT_VERSION: '2.2.0',

    MODAL_SIZE: {
        width: '65%',
        height: '93%',
        maxWidth: '90%',
        maxHeight: '95%',
    },

    VERSION_HISTORY: [] as VersionHistoryEntry[],

    STORAGE_KEY: 'perfectwall_version',

    SHOW_SETTINGS: {
        autoCloseDelay: 60000,
        animationDuration: 400,
        showOnFirstLoad: false,
        // 默认开启更新提示；用户可通过 project.json 的
        // wallpaper_updata_open_on_update 关闭（未设置时不取 localStorage 的 false 兜底）。
        // 若 localStorage 显式为 "false" 则关闭，否则开启。
        showOnUpdate: localStorage.getItem('perfectwall_version_show_update') !== 'false',
        enableHistoryNavigation: true,
        enableMarkdown: true,
        defaultView: 'current',
    },

    IMAGE_SETTINGS: {
        maxHeight: '40vh',
        borderRadius: '12px',
        showImage: true,
        lazyLoad: true,
    },
};

export const VERSION_HISTORY_PROMISE = fetch_with_retry('update/history.json').then(res =>
    res.json()
);
