/**
 * 模态/弹窗/UI 元素 - 版本、调试面板
 */
export const uiElements = {
    version: {
        modal: document.getElementById('version-modal'),
        linkNotificationContainer: document.getElementById('link-notification-container'),
        closeBtn: document.getElementById('modal-close'),
        understandBtn: document.getElementById('understand-btn'),
        dontShowBtn: document.getElementById('dont-show-btn'),
    },
    debug: {
        modal: document.getElementById('debug-log-modal'),
        textarea: document.getElementById('debug-log-textarea') as HTMLTextAreaElement,
    },
} as const;
