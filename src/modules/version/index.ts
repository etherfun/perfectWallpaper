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

// 新版本自动弹的唯一入口：等 WE 首帧属性推送完成（update_init_complete）
// 再判断 isNewVersion 并弹。超时也兜底预载历史，保证手动点击有内容。
function triggerInitModal(): void {
    if (!runtimeStore.versionManager) {
        runtimeStore.versionManager = new versionManager();
    }
    // 额外延迟确保 Vue 挂载与样式就绪
    setTimeout(async () => {
        try {
            await (runtimeStore.versionManager as unknown as { initUpdateModal: () => Promise<void> }).initUpdateModal();
        } catch (error) {
            console.error('初始化版本弹窗失败:', error);
        }
    }, 2000);
}

waitAndExecute(
    () => config.update_init_complete === true,
    () => triggerInitModal(),
    500,
    15000
).catch(() => {
    // 超时兜底：即使 WE 未推送首帧，也预加载历史，手动点开不空白
    triggerInitModal();
});
