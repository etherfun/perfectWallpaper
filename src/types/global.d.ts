// 全局声明

// SimpleMarkdown 类（用于 onclick="SimpleMarkdown.copyLink(this)"）
declare class SimpleMarkdown {
    static copyLink(linkElement: HTMLElement): void;
    static copyToClipboard(text: string): boolean;
    static showCopyNotification(url: string): void;
    static hideNotification(notification: HTMLElement): void;
    static removeNotification(notification: HTMLElement): void;
    static parse(text: string): string;
    static processInlineMarkdown(text: string): string;
    static renderListHtml(items: Array<{ indent: number; content: string }>): string;
    static renderList(items: string[]): string;
}

// 扩展 Window 接口以支持 window.SimpleMarkdown
interface Window {
    SimpleMarkdown: typeof SimpleMarkdown;
    showDebugLogModal: () => void;
    closeDebugLogModal: () => void;
    toggleLogDetails: (id: number) => void;
    smoothedAudioArray: number[] | undefined;
}
