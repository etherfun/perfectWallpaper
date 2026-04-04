/**
 * Simple Markdown parser
 * Handles basic markdown formatting
 */

import {
    parseMarkdown,
    processInlineMarkdown,
    renderListHtml,
    type ListItem
} from "../utils/markdown";
import { truncateUrl } from "../utils/string";
import { i18n } from "../utils/i18n";

/**
 * Enhanced Markdown parser (delegates to utility functions)
 */
export class SimpleMarkdown {
    static parse(text: string): string {
        return parseMarkdown(text);
    }

    static processInlineMarkdown(text: string): string {
        return processInlineMarkdown(text);
    }

    static renderListHtml(items: ListItem[]): string {
        return renderListHtml(items);
    }

    // Copy link and show notification
    static copyLink(linkElement: HTMLElement): void {
        const url = linkElement.getAttribute('data-url');
        if (!url) return;

        this.copyToClipboard(url);
        this.showCopyNotification(url);

        linkElement.classList.add('link-copied');
        setTimeout(() => {
            linkElement.classList.remove('link-copied');
        }, 1000);
    }

    // Copy text to clipboard
    static copyToClipboard(text: string): boolean {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text);
                return true;
            }

            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();

            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                return successful;
            } catch (err) {
                document.body.removeChild(textarea);
                return false;
            }
        } catch (error) {
            return false;
        }
    }

    // Show copy notification
    static showCopyNotification(url: string): void {
        const existingNotification = document.querySelector('.link-copy-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'link-copy-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">📋</div>
                <div class="notification-text">
                    <div class="notification-title">${i18n("already_copy")}</div>
                    <div class="notification-url">${truncateUrl(url, 40)}</div>
                    <div class="notification-hint">${i18n("already_copy_tip")}</div>
                </div>
                <button class="notification-close">&times;</button>
            </div>
        `;

        const versionModal = document.getElementById('version-modal');
        const linkNotificationContainer = document.getElementById('link-notification-container');

        if (versionModal && linkNotificationContainer) {
            linkNotificationContainer.appendChild(notification);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    notification.classList.add('show');
                });
            });
        }

        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideNotification(notification);
            });
        }

        notification.addEventListener('animationend', (event) => {
            if (event.animationName === 'slideInOut') {
                this.removeNotification(notification);
            }
        });
    }

    static truncateUrl(url: string, maxLength: number): string {
        if (url.length <= maxLength) return url;
        const half = Math.floor(maxLength / 2) - 2;
        return url.substring(0, half) + '...' + url.substring(url.length - half);
    }

    static hideNotification(notification: HTMLElement): void {
        notification.classList.remove('show');
        setTimeout(() => {
            this.removeNotification(notification);
        }, 300);
    }

    static removeNotification(notification: HTMLElement): void {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }
}
