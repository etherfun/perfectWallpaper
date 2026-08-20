/**
 * 版本更新弹窗 — Pinia store
 *
 * 取代原 version/state.ts 的模块级 reactive 单例 versionUiState，
 * 成为版本弹窗的唯一响应式状态源。消费方（versionManager 类 / Version.vue）
 * 通过 useVersionStore() 获取同一实例，用法与旧单例一致。
 */

import { defineStore } from 'pinia';
import { reactive } from 'vue';

/** 左侧版本列表项（模板 v-for 渲染） */
export interface VersionListItem {
    version: string;
    date: string;
    title: string;
    /** 是否当前版本（原 .current class） */
    isCurrent: boolean;
    /** 是否选中（原 .selected class） */
    isSelected: boolean;
}

export const useVersionStore = defineStore('version', () => {
    const state = reactive({
        /** 是否显示（原 #version-modal .show class 写入） */
        visible: false,
        /** 是否降级弹窗（版本历史加载失败，原 createFallbackModal） */
        isFallback: false,
        /** 是否有新版本（原 NEW badge 显示条件） */
        isNewVersion: false,
        /** 弹窗标题（version_update_title / version_info_title） */
        modalTitle: '',
        /** 当前版本号 */
        currentVersion: '',
        /** 选中版本号 */
        selectedVersion: '',
        /** 是否正在加载版本历史（原 loading-indicator 显示） */
        loading: true,
        /**
         * 弹窗内容尺寸（原 getModalHTML 内联 style；
         * 值来自 versionConfig.MODAL_SIZE，模板直接绑定）
         */
        modalSize: {
            width: '65%',
            maxWidth: '90%',
            height: '93%',
            maxHeight: '95%',
        },
        /** 版本总数文本（原 .total-count textContent） */
        totalCountText: '',
        /** 左侧版本列表 */
        versionList: [] as VersionListItem[],
        /** 右侧详情标题（原 #detail-version-title textContent） */
        detailTitle: '',
        /** 右侧详情版本号（原 .detail-version 文本） */
        detailVersion: '',
        /** 右侧详情日期（原 .detail-date 文本） */
        detailDate: '',
        /** 右侧详情内容 HTML（含 SimpleMarkdown 解析结果，v-html 渲染） */
        detailContentHtml: '',
        /** 倒计时文本（原 #countdown-text textContent，如 " (58s)"） */
        countdownText: '',
        /** 倒计时是否进入警告态（原 .countdown-warning class，<=5s） */
        countdownWarning: false,
    });
    return state;
});
