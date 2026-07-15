/**
 * Tests for src/version/simple-markdown.ts
 *
 * The class is a thin wrapper that delegates:
 *   - SimpleMarkdown.parse(text)              → utils/markdown.parseMarkdown
 *   - SimpleMarkdown.processInlineMarkdown(t) → utils/markdown.processInlineMarkdown
 *   - SimpleMarkdown.renderListHtml(items)    → utils/markdown.renderListHtml
 *   - SimpleMarkdown.truncateUrl(url, maxLen) → utils/string.truncateUrl
 *
 * These tests verify delegation equivalence (regression insurance that
 * the wrapper does not silently drop behavior). DOM-heavy methods
 * (copyLink, copyToClipboard, showCopyNotification, hideNotification,
 * removeNotification) are skipped in this pure-function test.
 */

// Mock i18n so the module's side-effecting import chain does not trigger
// a fetch in the test environment.
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/utils/i18n', () => ({
    i18n: (key: string) => key,
}));

import { SimpleMarkdown } from '@/modules/version/simple-markdown';

describe('SimpleMarkdown static delegation', () => {
    describe('parse', () => {
        test('returns empty string for empty input', () => {
            expect(SimpleMarkdown.parse('')).toBe('');
        });

        test('renders plain text as a paragraph', () => {
            expect(SimpleMarkdown.parse('hello world')).toContain(
                '<p class="md-paragraph">hello world</p>'
            );
        });

        test('renders ## heading as h3 with md-title class', () => {
            expect(SimpleMarkdown.parse('## Heading')).toContain(
                '<h3 class="md-title">Heading</h3>'
            );
        });

        test('renders fenced code block', () => {
            const html = SimpleMarkdown.parse('```js\nconst x = 1;\n```');
            expect(html).toContain('<pre class="md-code-block">');
            expect(html).toContain('language-js');
        });
    });

    describe('processInlineMarkdown', () => {
        test('escapes HTML in plain text', () => {
            expect(SimpleMarkdown.processInlineMarkdown('<b>x</b>')).toBe('&lt;b&gt;x&lt;/b&gt;');
        });

        test('renders **bold**', () => {
            expect(SimpleMarkdown.processInlineMarkdown('**x**')).toBe(
                '<strong class="md-bold">x</strong>'
            );
        });

        test('renders `inline code`', () => {
            expect(SimpleMarkdown.processInlineMarkdown('`x`')).toBe(
                '<code class="md-inline-code">x</code>'
            );
        });
    });

    describe('renderListHtml', () => {
        test('returns empty string for empty list', () => {
            expect(SimpleMarkdown.renderListHtml([])).toBe('');
        });

        test('wraps a single item in md-list ul', () => {
            const html = SimpleMarkdown.renderListHtml([{ indent: 0, content: 'one' }]);
            expect(html).toContain('<ul class="md-list">');
            expect(html).toContain('<li class="md-list-item">one</li>');
        });
    });

    describe('truncateUrl', () => {
        test('returns original URL when shorter than maxLength', () => {
            expect(SimpleMarkdown.truncateUrl('https://a.com', 100)).toBe('https://a.com');
        });

        test('truncates long URL with "..." in the middle', () => {
            const long = 'https://very-long-domain.example.com/some/very/long/path/file.html';
            const result = SimpleMarkdown.truncateUrl(long, 30);
            expect(result).toContain('...');
            expect(result.length).toBeLessThan(long.length);
        });

        test('truncation is symmetric (preserves start and end)', () => {
            const url = 'https://example.com/a/very/long/path/to/resource/file.json';
            const result = SimpleMarkdown.truncateUrl(url, 25);
            expect(result.startsWith('https://')).toBe(true);
            expect(result.endsWith('.json')).toBe(true);
        });
    });
});
