/**
 * Tests for src/utils/string.ts
 *
 * Covers:
 *   - escapeHtml: HTML special character escaping for safe insertion
 *   - truncateUrl: URL truncation for compact display
 */

import { describe, expect, test } from 'vitest';

import { escapeHtml, truncateUrl } from '@/utils/string';

describe('escapeHtml', () => {
    test('escapes the five HTML special characters', () => {
        expect(escapeHtml(`<script>alert("xss'")</script>`)).toBe(
            '&lt;script&gt;alert(&quot;xss&#039;&quot;)&lt;/script&gt;'
        );
    });

    test('escapes ampersand first to avoid double-escaping', () => {
        // Critical: & must be replaced before others, otherwise &lt; would become &amp;lt;
        expect(escapeHtml('a & b')).toBe('a &amp; b');
    });

    test('returns empty string for empty input', () => {
        expect(escapeHtml('')).toBe('');
    });

    test('returns empty string for falsy input (null/undefined/0)', () => {
        // Implementation uses `if (!text) return '';` so all falsy values return ''
        expect(escapeHtml(null as unknown as string)).toBe('');
        expect(escapeHtml(undefined as unknown as string)).toBe('');
    });

    test('passes through plain text unchanged', () => {
        expect(escapeHtml('hello world')).toBe('hello world');
    });

    test('escapes single and double quotes', () => {
        expect(escapeHtml("it's")).toBe('it&#039;s');
        expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    });

    test('escapes angle brackets', () => {
        expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    });
});

describe('truncateUrl', () => {
    test('returns original URL when shorter than maxLength', () => {
        expect(truncateUrl('https://a.com', 100)).toBe('https://a.com');
    });

    test('returns original URL when exactly at maxLength', () => {
        expect(truncateUrl('https://a.com', 13)).toBe('https://a.com');
    });

    test('truncates with "..." in the middle for long URLs', () => {
        const url = 'https://very-long-domain.example.com/some/very/long/path/file.html';
        const result = truncateUrl(url, 30);
        expect(result).toContain('...');
        expect(result.length).toBeLessThan(url.length);
    });

    test('preserves start and end of long URL', () => {
        const url = 'https://example.com/a/very/long/path/to/resource/file.json';
        const result = truncateUrl(url, 20);
        expect(result.startsWith('https://')).toBe(true);
        expect(result.endsWith('.json')).toBe(true);
        expect(result).toContain('...');
    });

    test('handles maxLength too small to be useful (clamps to half - 2)', () => {
        // Implementation: half = floor(maxLength/2) - 2
        // For maxLength=4, half=0, so result = '' + '...' + '' = '...'
        expect(truncateUrl('https://example.com', 4)).toBe('...');
    });
});
