/**
 * Version module - Version update manager and markdown utilities
 */

export { VERSION_HISTORY_PROMISE, versionConfig, type VersionHistoryEntry } from './config';
export { versionManager } from './manager';
export { SimpleMarkdown } from './simple-markdown';

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { waitAndExecute } from '../../utils/timer';
import { versionManager } from './manager';
import { SimpleMarkdown } from './simple-markdown';

const runtimeStore = useRuntimeStore();
const config = useConfigStore();

// 创建全局版本管理器实例并挂载到 runtime
const versionManagerInstance = new versionManager();
runtimeStore.versionManager = versionManagerInstance;

// 暴露 SimpleMarkdown 到全局作用域
window.SimpleMarkdown = SimpleMarkdown;

// 等待初始化完成；超时或未等到标记也强制预载，避免首帧内容空白
waitAndExecute(
    () => {
        const complete = config.update_init_complete === true;
        return complete;
    },
    () => {
        if (!runtimeStore.versionManager) {
            runtimeStore.versionManager = new versionManager();
        }

        // 延迟显示，确保其他内容已加载
        setTimeout(async () => {
            if (runtimeStore.versionManager) {
                try {
                    await (runtimeStore.versionManager as any).initUpdateModal();
                } catch (error) {
                    console.error('初始化版本弹窗失败:', error);
                }
            }
        }, 2000);
    },
    500,
    15000
).catch(() => {
    // 超时兜底：即使 update_init_complete 未置位，也预加载历史，避免首次加载点开是空
    if (!runtimeStore.versionManager) {
        runtimeStore.versionManager = new versionManager();
    }
    void (runtimeStore.versionManager as unknown as { initUpdateModal: () => Promise<void> })
        .initUpdateModal()
        .catch(e => console.error('初始化版本弹窗失败(超时兜底):', e));
});
