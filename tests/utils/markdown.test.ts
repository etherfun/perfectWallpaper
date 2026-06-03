/**
 * Tests for src/utils/markdown.ts
 *
 * Covers the public markdown rendering API:
 *   - processInlineMarkdown: links, inline code, bold, strikethrough
 *   - renderListHtml: nested list rendering
 *   - parseMarkdown: code blocks, headings, lists, paragraphs
 */

import { describe, expect, test } from 'vitest';

import { type ListItem, parseMarkdown, processInlineMarkdown, renderListHtml } from '@/utils/markdown';

describe('processInlineMarkdown', () => {
    test('returns empty string for empty input', () => {
        expect(processInlineMarkdown('')).toBe('');
    });

    test('returns empty string for falsy input (null/undefined)', () => {
        expect(processInlineMarkdown(null as unknown as string)).toBe('');
        expect(processInlineMarkdown(undefined as unknown as string)).toBe('');
    });

    test('escapes HTML special characters in plain text', () => {
        expect(processInlineMarkdown('<script>alert("xss")</script>')).toBe(
            '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
        );
    });

    test('renders inline code with backticks', () => {
        expect(processInlineMarkdown('use `npm install` first')).toBe(
            'use <code class="md-inline-code">npm install</code> first'
        );
    });

    test('renders bold with ** delimiters', () => {
        expect(processInlineMarkdown('this is **important** text')).toBe(
            'this is <strong class="md-bold">important</strong> text'
        );
    });

    test('renders strikethrough with ~~ delimiters', () => {
        expect(processInlineMarkdown('~~deprecated~~')).toBe(
            '<del class="md-strikethrough">deprecated</del>'
        );
    });

    test('renders markdown links as click-to-copy anchors', () => {
        expect(processInlineMarkdown('[GitHub](https://github.com)')).toBe(
            '<a href="javascript:void(0)" class="md-link" data-url="https://github.com" onclick="SimpleMarkdown.copyLink(this)">GitHub</a>'
        );
    });

    test('processes multiple inline elements in a single string', () => {
        const result = processInlineMarkdown('**bold** and `code` and ~~old~~');
        expect(result).toContain('<strong class="md-bold">bold</strong>');
        expect(result).toContain('<code class="md-inline-code">code</code>');
        expect(result).toContain('<del class="md-strikethrough">old</del>');
    });
});

describe('renderListHtml', () => {
    test('returns empty string for empty list', () => {
        expect(renderListHtml([])).toBe('');
    });

    test('returns empty string for null/undefined list', () => {
        expect(renderListHtml(null as unknown as ListItem[])).toBe('');
        expect(renderListHtml(undefined as unknown as ListItem[])).toBe('');
    });

    test('renders a single flat list item', () => {
        const html = renderListHtml([{ indent: 0, content: 'item one' }]);
        expect(html).toContain('<ul class="md-list">');
        expect(html).toContain('<li class="md-list-item">item one</li>');
        expect(html).toContain('</ul>');
    });

    test('renders multiple flat list items in order', () => {
        const html = renderListHtml([
            { indent: 0, content: 'a' },
            { indent: 0, content: 'b' },
            { indent: 0, content: 'c' },
        ]);
        expect(html).toContain('a');
        expect(html).toContain('b');
        expect(html).toContain('c');
    });

    test('opens nested <ul> for deeper indent and closes it on return', () => {
        const html = renderListHtml([
            { indent: 0, content: 'top' },
            { indent: 1, content: 'nested' },
            { indent: 0, content: 'top again' },
        ]);
        expect(html).toContain('<ul class="md-nested-list">');
        expect(html).toContain('</ul>');
    });

    test('does not produce unclosed <ul> tags at the end', () => {
        const html = renderListHtml([
            { indent: 0, content: 'a' },
            { indent: 1, content: 'b' },
            { indent: 2, content: 'c' },
        ]);
        // All <ul> tags must have matching </ul> tags
        const open = (html.match(/<ul[\s>]/g) ?? []).length;
        const close = (html.match(/<\/ul>/g) ?? []).length;
        expect(open).toBe(close);
    });
});

describe('parseMarkdown', () => {
    test('returns empty string for empty input', () => {
        expect(parseMarkdown('')).toBe('');
    });

    test('renders plain text as a paragraph', () => {
        const html = parseMarkdown('hello world');
        expect(html).toContain('<p class="md-paragraph">hello world</p>');
    });

    test('renders ## heading as h3 with md-title class', () => {
        const html = parseMarkdown('## Heading');
        expect(html).toContain('<h3 class="md-title">Heading</h3>');
    });

    test('renders ### heading as h4 with md-subtitle class', () => {
        const html = parseMarkdown('### Subtitle');
        expect(html).toContain('<h4 class="md-subtitle">Subtitle</h4>');
    });

    test('renders # (h1) as paragraph (only ## and ### are special)', () => {
        const html = parseMarkdown('# Title');
        // Single # is not a recognized heading marker; falls through to paragraph
        expect(html).toContain('<p class="md-paragraph"># Title</p>');
    });

    test('extracts fenced code blocks and replaces with placeholders', () => {
        const html = parseMarkdown('```js\nconst x = 1;\n```');
        expect(html).toContain('<pre class="md-code-block">');
        expect(html).toContain('language-js');
        // Placeholders should not appear in final output
        expect(html).not.toContain('__CODE_BLOCK_0__');
    });

    test('renders list items wrapped in md-list ul', () => {
        const html = parseMarkdown('- first\n- second\n- third');
        expect(html).toContain('<ul class="md-list">');
        expect(html).toContain('first');
        expect(html).toContain('second');
        expect(html).toContain('third');
    });

    test('flushes pending list when transitioning to a non-list line', () => {
        const html = parseMarkdown('- list item\n\nparagraph after');
        expect(html).toContain('<li class="md-list-item">list item</li>');
        expect(html).toContain('<p class="md-paragraph">paragraph after</p>');
    });

    test('handles empty lines as md-empty-line divs outside lists', () => {
        const html = parseMarkdown('line one\n\nline two');
        expect(html).toContain('<div class="md-empty-line"></div>');
    });

    test('escapes HTML in code blocks', () => {
        const html = parseMarkdown('```html\n<script>alert(1)</script>\n```');
        expect(html).toContain('&lt;script&gt;');
        expect(html).not.toContain('<script>alert(1)</script>');
    });

    test('integrates inline markdown within headings and paragraphs', () => {
        const html = parseMarkdown('## Welcome to **perfectwall**');
        expect(html).toContain('<h3 class="md-title">');
        expect(html).toContain('<strong class="md-bold">perfectwall</strong>');
    });
});
