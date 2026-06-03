/**
 * Tests for src/utils/logger.ts
 *
 * Covers the DebugLogger class:
 *   - 5 log levels (debug / info / warn / error / critical)
 *   - numeric level argument path
 *   - logs array bounded to maxLogs
 *   - clearLogs()
 *   - timestamp / levelName / stackTrace correctness
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { DebugLogger } from '@/utils/logger';

describe('DebugLogger', () => {
    let logger: DebugLogger;

    beforeEach(() => {
        logger = new DebugLogger();
    });

    afterEach(() => {
        logger.clearLogs();
    });

    describe('level methods', () => {
        test('debug() creates an entry with level 0 and name "DEBUG"', () => {
            const entry = logger.debug('a debug msg');
            expect(entry.level).toBe(0);
            expect(entry.levelName).toBe('DEBUG');
            expect(entry.message).toBe('a debug msg');
        });

        test('info() creates an entry with level 1 and name "INFO"', () => {
            const entry = logger.info('an info msg');
            expect(entry.level).toBe(1);
            expect(entry.levelName).toBe('INFO');
        });

        test('warn() creates an entry with level 2 and name "WARN"', () => {
            const entry = logger.warn('a warn msg');
            expect(entry.level).toBe(2);
            expect(entry.levelName).toBe('WARN');
        });

        test('error() creates an entry with level 3 and name "ERROR"', () => {
            const entry = logger.error('an error msg');
            expect(entry.level).toBe(3);
            expect(entry.levelName).toBe('ERROR');
            // ERROR level should capture stack trace
            expect(entry.stackTrace).not.toBeNull();
        });

        test('critical() creates an entry with level 4 and name "CRITICAL"', () => {
            const entry = logger.critical('a critical msg');
            expect(entry.level).toBe(4);
            expect(entry.levelName).toBe('CRITICAL');
            expect(entry.stackTrace).not.toBeNull();
        });

        test('low-level messages (DEBUG/INFO/WARN) do not capture stack trace', () => {
            const debugEntry = logger.debug('d');
            const infoEntry = logger.info('i');
            const warnEntry = logger.warn('w');
            expect(debugEntry.stackTrace).toBeNull();
            expect(infoEntry.stackTrace).toBeNull();
            expect(warnEntry.stackTrace).toBeNull();
        });
    });

    describe('numeric level path', () => {
        test('log() accepts a numeric level and derives levelName', () => {
            const entry = logger.log('numeric level msg', 2);
            expect(entry.level).toBe(2);
            expect(entry.levelName).toBe('WARN');
        });

        test('log() with unknown numeric level returns "UNKNOWN" name', () => {
            const entry = logger.log('unknown level', 99);
            expect(entry.level).toBe(99);
            expect(entry.levelName).toBe('UNKNOWN');
        });

        test('log() with no level defaults to INFO', () => {
            const entry = logger.log('no level arg');
            expect(entry.level).toBe(1);
            expect(entry.levelName).toBe('INFO');
        });
    });

    describe('logs array and clearLogs()', () => {
        test('appends entries to logs array in insertion order', () => {
            logger.debug('1st');
            logger.info('2nd');
            logger.warn('3rd');
            expect(logger.logs.map(l => l.message)).toEqual(['1st', '2nd', '3rd']);
        });

        test('clearLogs() empties the array', () => {
            logger.info('one');
            logger.info('two');
            expect(logger.logs.length).toBe(2);
            logger.clearLogs();
            expect(logger.logs.length).toBe(0);
        });

        test('ids are strictly increasing across entries', () => {
            const e1 = logger.info('a');
            const e2 = logger.info('b');
            const e3 = logger.info('c');
            expect(e2.id).toBeGreaterThan(e1.id);
            expect(e3.id).toBeGreaterThan(e2.id);
        });
    });

    describe('entry metadata', () => {
        test('stores extraData as-is', () => {
            const payload = { foo: 'bar', n: 42 };
            const entry = logger.info('with data', payload);
            expect(entry.extraData).toBe(payload);
        });

        test('extraData defaults to null when not provided', () => {
            const entry = logger.info('no data');
            expect(entry.extraData).toBeNull();
        });

        test('timestamp is a Date instance set to roughly now', () => {
            const before = Date.now();
            const entry = logger.info('now');
            const after = Date.now();
            expect(entry.timestamp).toBeInstanceOf(Date);
            const ts = entry.timestamp.getTime();
            expect(ts).toBeGreaterThanOrEqual(before);
            expect(ts).toBeLessThanOrEqual(after);
        });

        test('timeString matches YYYY-MM-DD HH:MM:SS.mmm format', () => {
            const entry = logger.info('ts');
            expect(entry.timeString).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
        });
    });
});
