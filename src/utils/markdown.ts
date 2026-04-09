/**
 * Markdown Utility Functions
 * Shared markdown parsing utilities for the project
 */

import { escapeHtml } from './string';

/**
 * List item type for rendering
 */
export interface ListItem {
    indent: number;
    content: string;
}

/**
 * Process inline markdown elements (bold, strikethrough, code, links)
 */
export function processInlineMarkdown(text: string): string {
    if (!text) return '';

    // Escape HTML special characters
    let processed = escapeHtml(text);

    // Handle links [text](url) - click to copy link with notification
    processed = processed.replace(
        /\[([^\[\]]+)\]\(([^\)]+)\)/g,
        '<a href="javascript:void(0)" class="md-link" data-url="$2" onclick="SimpleMarkdown.copyLink(this)">$1</a>'
    );

    // Handle inline code `code`
    processed = processed.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Handle bold **bold**
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong class="md-bold">$1</strong>');

    // Handle strikethrough ~~strikethrough~~
    processed = processed.replace(/~~([^~]+)~~/g, '<del class="md-strikethrough">$1</del>');

    return processed;
}

/**
 * Render list items as HTML (supports nesting)
 */
export function renderListHtml(items: ListItem[]): string {
    if (!items || items.length === 0) return '';

    let html = '<ul class="md-list">';
    let currentIndent = 0;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Handle nesting
        if (item.indent > currentIndent) {
            html += '<ul class="md-nested-list">';
            currentIndent = item.indent;
        } else if (item.indent < currentIndent) {
            html += '</ul>';
            currentIndent = item.indent;
        }

        html += `<li class="md-list-item">${item.content}</li>`;
    }

    // Close all nested lists
    while (currentIndent > 0) {
        html += '</ul>';
        currentIndent--;
    }

    html += '</ul>';
    return html;
}

interface CodeBlock {
    placeholder: string;
    html: string;
}

/**
 * Extract code blocks from markdown text, replacing them with placeholders.
 * Returns the processed text and the extracted code blocks.
 */
function extractCodeBlocks(text: string): { processedText: string; codeBlocks: CodeBlock[] } {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
    const codeBlocks: CodeBlock[] = [];
    let blockIndex = 0;
    let processedText = text;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
        const language = match[1] || '';
        const code = match[2];
        const placeholder = `__CODE_BLOCK_${blockIndex}__`;
        codeBlocks.push({
            placeholder,
            html: `<pre class="md-code-block"><code class="language-${language}">${escapeHtml(code)}</code></pre>`,
        });
        processedText = processedText.replace(match[0], placeholder);
        blockIndex++;
    }

    return { processedText, codeBlocks };
}

/**
 * Restore extracted code blocks back into the processed HTML.
 */
function restoreCodeBlocks(result: string, codeBlocks: CodeBlock[]): string {
    codeBlocks.forEach(block => {
        result = result.replace(block.placeholder, block.html);
    });
    return result;
}

/**
 * Parse a single line and return HTML. Flushes list items if needed.
 * Returns { html, inList, flushList, listItem } where flushList is true when list items should be rendered.
 */
function parseLine(
    line: string,
    trimmedLine: string,
    inList: boolean,
    listItems: ListItem[]
): { html: string; inList: boolean; flushList: boolean; listItem?: ListItem } {
    // Empty line
    if (trimmedLine === '') {
        if (inList && listItems.length > 0) {
            return { html: renderListHtml(listItems), inList: false, flushList: true };
        }
        return { html: '<div class="md-empty-line"></div>', inList: false, flushList: false };
    }

    // Headings
    if (trimmedLine.startsWith('## ')) {
        return {
            html: `<h3 class="md-title">${processInlineMarkdown(trimmedLine.substring(3))}</h3>`,
            inList: false,
            flushList: inList && listItems.length > 0,
        };
    }
    if (trimmedLine.startsWith('### ')) {
        return {
            html: `<h4 class="md-subtitle">${processInlineMarkdown(trimmedLine.substring(4))}</h4>`,
            inList: false,
            flushList: inList && listItems.length > 0,
        };
    }

    // List items (support various markers: -, *, +, --, --- for nested)
    const listMatch = line.match(/^([\s]*)([-*+]+)\s+(.*)$/);
    if (listMatch) {
        const spaces = listMatch[1].length;
        const markers = listMatch[2];
        const content = listMatch[3];

        let indentLevel: number;
        if (markers.length === 1) {
            indentLevel = Math.floor(spaces / 2);
        } else {
            indentLevel = markers.length - 1;
            if (spaces > 0) {
                indentLevel += Math.floor(spaces / 2);
            }
        }

        return {
            html: '',
            inList: true,
            flushList: false,
            listItem: { indent: indentLevel, content: processInlineMarkdown(content.trim()) },
        };
    }

    // Regular paragraph
    return {
        html: `<p class="md-paragraph">${processInlineMarkdown(trimmedLine)}</p>`,
        inList: false,
        flushList: inList && listItems.length > 0,
    };
}

/**
 * Parse markdown text to HTML
 * Supports: code blocks, headings (##, ###), lists (-, *, +), paragraphs, inline formatting
 */
export function parseMarkdown(text: string): string {
    if (!text) return '';

    const { processedText, codeBlocks } = extractCodeBlocks(text);

    const lines = processedText.split('\n');
    let inList = false;
    let listItems: ListItem[] = [];
    let result = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Flush pending list items when transitioning away from lists
        const prevInList = inList;
        const prevListItems = [...listItems];

        const {
            html,
            inList: newInList,
            flushList,
            listItem,
        } = parseLine(line, trimmedLine, inList, listItems);

        if (flushList && prevInList && prevListItems.length > 0) {
            result += renderListHtml(prevListItems);
            listItems = [];
        }

        if (listItem) {
            listItems.push(listItem);
            inList = true;
        } else {
            result += html;
            inList = newInList;
        }
    }

    // Process remaining list
    if (inList && listItems.length > 0) {
        result += renderListHtml(listItems);
    }

    return restoreCodeBlocks(result, codeBlocks);
}
