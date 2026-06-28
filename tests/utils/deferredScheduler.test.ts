/**
 * Tests for src/utils/deferredScheduler.ts
 *
 * Covers:
 *   - registerDeferred queues when not ready, runs immediately when ready
 *   - markDeferredReady flushes in registration order
 *   - markDeferredReady is idempotent
 *   - updateDeferred replaces task and triggers cleanup of the old one
 *   - cancelDeferred removes and triggers cleanup
 *   - task returning a function is treated as cleanup hook
 *   - errors in task / cleanup are caught and don't break siblings
 *   - _resetDeferredForTest restores initial state
 *   - isDeferredReady reflects current state
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
    _resetDeferredForTest,
    cancelDeferred,
    isDeferredReady,
    markDeferredReady,
    registerDeferred,
    updateDeferred,
} from '@/utils/deferredScheduler';

describe('deferredScheduler', () => {
    beforeEach(() => {
        _resetDeferredForTest();
    });

    afterEach(() => {
        _resetDeferredForTest();
    });

    describe('isDeferredReady + markDeferredReady', () => {
        test('initial state is not ready', () => {
            expect(isDeferredReady()).toBe(false);
        });

        test('markDeferredReady flips state to ready', () => {
            markDeferredReady();
            expect(isDeferredReady()).toBe(true);
        });

        test('markDeferredReady is idempotent', () => {
            markDeferredReady();
            markDeferredReady();
            markDeferredReady();
            expect(isDeferredReady()).toBe(true);
        });
    });

    describe('registerDeferred before ready', () => {
        test('queues tasks without running them', () => {
            const fn = vi.fn();
            registerDeferred('a', fn);
            registerDeferred('b', fn);
            expect(fn).not.toHaveBeenCalled();
        });

        test('flushes all queued tasks in registration order on markReady', () => {
            const order: string[] = [];
            registerDeferred('a', () => order.push('a'));
            registerDeferred('b', () => order.push('b'));
            registerDeferred('c', () => order.push('c'));

            markDeferredReady();
            expect(order).toEqual(['a', 'b', 'c']);
        });
    });

    describe('registerDeferred after ready', () => {
        test('runs the task synchronously', () => {
            markDeferredReady();
            const fn = vi.fn();
            registerDeferred('late', fn);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('still adds to registry for later update / cancel', () => {
            markDeferredReady();
            registerDeferred('late', () => undefined);
            // subsequent update triggers the new task
            const fn2 = vi.fn();
            const ok = updateDeferred('late', fn2);
            expect(ok).toBe(true);
            expect(fn2).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateDeferred', () => {
        test('replaces queued task before markReady without running either', () => {
            const fn1 = vi.fn();
            const fn2 = vi.fn();
            registerDeferred('a', fn1);
            updateDeferred('a', fn2);
            expect(fn1).not.toHaveBeenCalled();
            expect(fn2).not.toHaveBeenCalled();

            markDeferredReady();
            expect(fn1).not.toHaveBeenCalled();
            expect(fn2).toHaveBeenCalledTimes(1);
        });

        test('returns false for unknown id', () => {
            expect(updateDeferred('nope', () => undefined)).toBe(false);
        });

        test('runs new task immediately when already ready', () => {
            markDeferredReady();
            const fn1 = vi.fn();
            const fn2 = vi.fn();
            registerDeferred('a', fn1);
            updateDeferred('a', fn2);
            expect(fn1).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1);
        });

        test('cleanup hook of old task runs when replaced', () => {
            markDeferredReady();
            const cleanup = vi.fn();
            registerDeferred('a', () => cleanup);

            const fn2 = vi.fn();
            updateDeferred('a', fn2);
            expect(cleanup).toHaveBeenCalledTimes(1);
            expect(fn2).toHaveBeenCalledTimes(1);
        });
    });

    describe('cancelDeferred', () => {
        test('removes a queued task before markReady (no run)', () => {
            const fn = vi.fn();
            registerDeferred('a', fn);
            expect(cancelDeferred('a')).toBe(true);
            markDeferredReady();
            expect(fn).not.toHaveBeenCalled();
        });

        test('returns false for unknown id', () => {
            expect(cancelDeferred('nope')).toBe(false);
        });

        test('triggers cleanup of running task', () => {
            markDeferredReady();
            const cleanup = vi.fn();
            registerDeferred('a', () => cleanup);
            cancelDeferred('a');
            expect(cleanup).toHaveBeenCalledTimes(1);
        });

        test('after cancel, register with same id runs a fresh task', () => {
            markDeferredReady();
            const cleanup = vi.fn();
            const fn1 = vi.fn(() => cleanup);
            registerDeferred('a', fn1);
            cancelDeferred('a');

            const fn2 = vi.fn();
            registerDeferred('a', fn2);
            expect(fn1).toHaveBeenCalledTimes(1);   // first register ran
            expect(cleanup).toHaveBeenCalledTimes(1); // cancelled → cleanup ran
            expect(fn2).toHaveBeenCalledTimes(1);   // new register runs again
        });
    });

    describe('cleanup hooks', () => {
        test('function returned by task is captured as cleanup', () => {
            markDeferredReady();
            const cleanup = vi.fn();
            registerDeferred('a', () => cleanup);

            updateDeferred('a', () => undefined);
            expect(cleanup).toHaveBeenCalledTimes(1);
        });

        test('cleanup is dropped when task does not return one', () => {
            markDeferredReady();
            registerDeferred('a', () => undefined);
            expect(() => updateDeferred('a', () => undefined)).not.toThrow();
        });
    });

    describe('error isolation', () => {
        test('throwing task does not stop sibling tasks from running', () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            const order: string[] = [];

            registerDeferred('a', () => order.push('a-1'));
            registerDeferred('b', () => {
                throw new Error('boom');
            });
            registerDeferred('c', () => order.push('c-1'));

            markDeferredReady();

            expect(order).toEqual(['a-1', 'c-1']);
            expect(consoleError).toHaveBeenCalled();
            consoleError.mockRestore();
        });

        test('throwing cleanup does not stop the replacement task', () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            markDeferredReady();

            registerDeferred('a', () => {
                return () => {
                    throw new Error('cleanup-boom');
                };
            });

            const fn2 = vi.fn();
            expect(() => updateDeferred('a', fn2)).not.toThrow();
            expect(fn2).toHaveBeenCalledTimes(1);
            expect(consoleError).toHaveBeenCalled();
            consoleError.mockRestore();
        });
    });

    describe('argument validation', () => {
        test('registerDeferred throws on non-function task', () => {
            // @ts-expect-error testing runtime guard
            expect(() => registerDeferred('a', 'not-a-fn')).toThrow(/task must be a function/);
        });

        test('updateDeferred throws on non-function task', () => {
            registerDeferred('a', () => undefined);
            // @ts-expect-error testing runtime guard
            expect(() => updateDeferred('a', 42)).toThrow(/task must be a function/);
        });
    });
});