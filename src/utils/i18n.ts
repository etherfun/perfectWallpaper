/**
 * 国际化(i18n)模块
 * 用于处理多语言文本翻译和DOM元素更新
 */

import { config } from './config';
import { debugLogger } from './logger';

// i18n数据接口
interface I18nData {
    [key: string]: string;
}

// 全局变量声明
declare global {
    interface Window {
        current_lang: string;
    }
}

// 模块内部变量
let i18n_data: I18nData | null = null;
let i18nObserver: MutationObserver | null = null;
let i18nUpdateTimeout: number | null = null;
let pendingMutations: MutationRecord[] = [];

/**
 * 加载i18n数据
 */
export async function loadI18nData(): Promise<void> {
    try {
        const language = config.language;
        const res = await fetch(`src/source/i18n/${language}.json`);
        if (!res.ok) {
            debugLogger.warn(`Language file ${language}.json not found, falling back to en-US`);
            window.current_lang = 'en-US';
            const fallbackRes = await fetch(`i18n/en-US.json`);
            i18n_data = await fallbackRes.json();
        } else {
            i18n_data = await res.json();
        }

        initI18nUpdate();
    } catch (error) {
        debugLogger.error('Failed to load i18n data:', error);
    }
}

/**
 * 获取翻译文本
 * @param key - 翻译键
 * @returns 翻译后的文本
 */
export function i18n(key: string): string {
    if (!i18n_data) {
        debugLogger.warn('i18n data not loaded yet');
        return key;
    }
    return i18n_data[key] || key;
}

/**
 * 初始化i18n更新系统
 */
function initI18nUpdate(): void {
    updateAllI18nElements();

    initI18nObserver();

    setTimeout(() => {
        updateAllI18nElements();
    }, 5000);
}

/**
 * 自动更新所有带有 data-i18n 属性的元素
 */
export function updateAllI18nElements(): void {
    if (!i18n_data) return;

    processElements(Array.from(document.querySelectorAll('[data-i18n]')));

    document.querySelectorAll('template').forEach(template => {
        if (template.content) {
            processElements(Array.from(template.content.querySelectorAll('[data-i18n]')));
        }
    });

    // 更新页面标题
    const pageTitleElement = document.getElementById('page-title');
    if (pageTitleElement) {
        pageTitleElement.textContent = i18n('app_title');
    }
}

/**
 * 初始化MutationObserver监听DOM变化
 */
function initI18nObserver(): void {
    if (i18nObserver) {
        i18nObserver.disconnect();
    }

    // 创建MutationObserver实例
    i18nObserver = new MutationObserver((mutations) => {
        // 收集所有变化
        pendingMutations.push(...mutations);
        
        // 智能防抖处理：根据变化数量决定延迟时间
        if (i18nUpdateTimeout) {
            clearTimeout(i18nUpdateTimeout);
        }
        
        // 如果变化很多，给更多时间收集所有变化
        const delay = mutations.length > 5 ? 200 : 100;
        
        i18nUpdateTimeout = window.setTimeout(() => {
            if (pendingMutations.length > 0) {
                handleDomMutations(pendingMutations);
                pendingMutations = []; // 清空已处理的变更
            }
        }, delay);
    });

    // 配置观察选项
    const observerConfig = {
        childList: true,      // 观察子节点的添加或删除
        subtree: true,        // 观察所有后代节点
        attributes: true,     // 观察属性变化
        attributeFilter: ['data-i18n'] // 只观察data-i18n属性变化
    };

    // 开始观察整个文档
    i18nObserver.observe(document.documentElement, observerConfig);
}

/**
 * 处理DOM变化
 */
function handleDomMutations(mutations: MutationRecord[]): void {
    if (!i18n_data) return;

    const elementsToUpdate = new Set<Element>();

    mutations.forEach(mutation => {
        // 处理新增的节点
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    // 检查节点本身是否有data-i18n属性
                    if (element.hasAttribute && element.hasAttribute('data-i18n')) {
                        elementsToUpdate.add(element);
                    }
                    
                    // 检查节点的后代元素是否有data-i18n属性
                    const i18nElements = element.querySelectorAll ? element.querySelectorAll('[data-i18n]') : [];
                    i18nElements.forEach(el => elementsToUpdate.add(el));
                }
            });
        }
        
        // 处理属性变化
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-i18n') {
            elementsToUpdate.add(mutation.target as Element);
        }
    });

    // 如果有需要更新的元素，进行处理
    if (elementsToUpdate.size > 0) {
        processElements(Array.from(elementsToUpdate));
    }
}

/**
 * 停止监听DOM变化
 */
export function stopI18nObserver(): void {
    if (i18nObserver) {
        i18nObserver.disconnect();
        i18nObserver = null;
    }
    if (i18nUpdateTimeout) {
        clearTimeout(i18nUpdateTimeout);
        i18nUpdateTimeout = null;
    }
}

/**
 * 处理元素集合的通用函数
 * @param elements - 要处理的元素数组
 * @returns 实际处理的元素数量
 */
function processElements(elements: Element[]): number {
    const processedElements = new Set<Element>();
    
    elements.forEach(element => {
        // 跳过已处理的元素
        if (processedElements.has(element)) {
            return;
        }
        
        const key = element.getAttribute('data-i18n');
        if (!key) {
            return; // 如果没有data-i18n属性，跳过
        }
        
        const translation = i18n(key);
        
        // 检查是否需要更新（避免不必要的DOM操作）
        const currentText = element.textContent || '';
        if (currentText === translation && translation !== key) {
            processedElements.add(element);
            return; // 文本已经是最新翻译，跳过
        }

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
        
        processedElements.add(element);
    });
    
    return processedElements.size; // 返回实际处理的元素数量
}

// 自动加载i18n数据
loadI18nData();