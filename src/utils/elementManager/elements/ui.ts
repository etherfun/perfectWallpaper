/**
 * 模态/弹窗/UI 元素 - 版本、调试面板
 *
 * lazy getter：这些元素由 Vue 组件或 JS 模块动态创建，
 * 不在静态 index.html 中。
 */
import { makeLazyIdMap } from '../lazyMap';

const lazyVersionIds = makeLazyIdMap({
    modal: 'version-modal',
    linkNotificationContainer: 'link-notification-container',
    closeBtn: 'modal-close',
    understandBtn: 'understand-btn',
    dontShowBtn: 'dont-show-btn',
});

const lazyDebugIds = makeLazyIdMap({
    modal: 'debug-log-modal',
    textarea: 'debug-log-textarea',
});

export const uiElements = {
    version: {
        modal: lazyVersionIds.modal,
        linkNotificationContainer: lazyVersionIds.linkNotificationContainer,
        closeBtn: lazyVersionIds.closeBtn,
        understandBtn: lazyVersionIds.understandBtn,
        dontShowBtn: lazyVersionIds.dontShowBtn,
    },
    debug: {
        modal: lazyDebugIds.modal,
        textarea: lazyDebugIds.textarea as HTMLTextAreaElement,
    },
};
