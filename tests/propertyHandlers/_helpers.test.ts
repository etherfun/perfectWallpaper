/**
 * Tests for src/propertyHandlers/_helpers.ts
 *
 * Covers logInitComplete:
 *   - emits info log when FirstLoad is true
 *   - skips silently when FirstLoad is false
 *   - format: `${tag} ${displayName}参数初始化完成`
 */

import { beforeEach, describe, expect, test } from 'vitest';

import { logInitComplete } from '@/utils/_helpers';
import { debugLogger } from '@/utils/logger';

describe('logInitComplete', () => {
    beforeEach(() => {
        debugLogger.clearLogs();
    });

    test('emits an INFO entry when FirstLoad is true', () => {
        logInitComplete('[Background]', '背景', true);
        const matched = debugLogger.logs.find(
            l => l.message === '[Background] 背景参数初始化完成'
        );
        expect(matched).toBeDefined();
        expect(matched?.level).toBe(1);
        expect(matched?.levelName).toBe('INFO');
    });

    test('does NOT emit a log when FirstLoad is false', () => {
        logInitComplete('[Hitokoto]', '一言', false);
        const matched = debugLogger.logs.find(
            l => l.message === '[Hitokoto] 一言参数初始化完成'
        );
        expect(matched).toBeUndefined();
        expect(debugLogger.logs.length).toBe(0);
    });

    test('message format includes both tag and displayName', () => {
        logInitComplete('[Sakura]', '樱花效果', true);
        const msg = debugLogger.logs[0]?.message;
        expect(msg).toBe('[Sakura] 樱花效果参数初始化完成');
    });

    test('emits one log per call when FirstLoad is true', () => {
        logInitComplete('[Weather]', '天气', true);
        logInitComplete('[Time]', '时间', true);
        const matched = debugLogger.logs.filter(
            l => l.levelName === 'INFO' && l.message.includes('参数初始化完成')
        );
        expect(matched).toHaveLength(2);
    });
});
