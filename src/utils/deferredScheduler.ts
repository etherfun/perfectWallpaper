/**
 * deferredScheduler — 把依赖非 body 元素（如 #clock / #oDate）的初始化
 * 任务延后到 Vue mount 完成后执行。
 *
 * 背景：
 *   - `elementManager` 在模块加载时执行 `document.querySelector(...)`，但
 *     `#clock` / `#oDate` / `#countdown` / `#hitokoto` / `#player_control` /
 *     `#weather` 等元素由 Vue 组件创建，`app.mount()` 之前不存在。
 *   - Wallpaper Engine 注入 `wallpaperPropertyListener.applyUserProperties`
 *     的时机早于 `app.mount()`，导致 property handler 在初始化时拿到
 *     `null` 引用并整体失败。
 *
 * 用法：
 *   ```ts
 *   import {
 *     registerDeferred,
 *     updateDeferred,
 *     cancelDeferred,
 *     isDeferredReady,
 *   } from '@/utils/deferredScheduler';
 *
 *   // 1. 注册 — 若未 ready 则缓存，若已 ready 则立即执行
 *   registerDeferred('time:clock-height-observer', () => {
 *       const oClock = elements.clock.container;
 *       if (!oClock) return;
 *       const observer = new ResizeObserver(updateHeight);
 *       observer.observe(oClock);
 *       return () => observer.disconnect();   // 返回 cleanup 钩子
 *   });
 *
 *   // 2. 更新 — 替换已注册的回调，若已 ready 则立即执行新版本
 *   updateDeferred('time:clock-height-observer', newSetup);
 *
 *   // 3. 销毁 — 移除回调并触发 cleanup
 *   cancelDeferred('time:clock-height-observer');
 *   ```
 *
 * 接入点：
 *   - `main.ts` 在 `app.mount(root)` 之后调用 `markDeferredReady()`，
 *     触发所有缓存任务。
 *   - `markDeferredReady()` 幂等 — 重复调用安全。
 */

type Task = () => void | (() => void);
type Cleanup = () => void;

interface Entry {
    task: Task;
    cleanup?: Cleanup;
}

const registry = new Map<string, Entry>();
let ready = false;

function runTask(id: string, entry: Entry): void {
    // 先 dispose 上一次的 cleanup（update 时复用 cleanup 字段）
    if (entry.cleanup) {
        try {
            entry.cleanup();
        } catch (err) {
            console.error(`[deferredScheduler] cleanup for "${id}" failed`, err);
        }
        entry.cleanup = undefined;
    }

    try {
        const result = entry.task();
        if (typeof result === 'function') {
            entry.cleanup = result;
        }
    } catch (err) {
        console.error(`[deferredScheduler] task "${id}" failed`, err);
    }
}

/**
 * 注册一个延迟到 Vue mount 之后的回调。
 *
 * - 若 Vue 已 mount，立即同步执行；
 * - 若 Vue 未 mount，缓存任务，等到 `markDeferredReady()` 时统一触发。
 * - 若 `id` 已存在，替换任务并 dispose 旧 cleanup — 行为等价于 `updateDeferred`。
 *
 * @param id   唯一标识 — 注册、更新、销毁都依赖它
 * @param task 任务函数；可返回 `() => void` 作为 cleanup 钩子
 */
export function registerDeferred(id: string, task: Task): void {
    if (typeof task !== 'function') {
        throw new Error('[deferredScheduler] task must be a function');
    }
    const prev = registry.get(id);
    if (prev) {
        // 替换语义：先 dispose 旧 cleanup
        if (prev.cleanup) {
            try {
                prev.cleanup();
            } catch (err) {
                console.error(`[deferredScheduler] cleanup for "${id}" failed`, err);
            }
        }
    }
    const entry: Entry = { task };
    registry.set(id, entry);
    if (ready) {
        runTask(id, entry);
    }
}

/**
 * 用新回调替换已有的 `id` 任务。
 *
 * - 替换前自动触发旧任务的 cleanup（如果有）；
 * - 若 Vue 已 mount，立即执行新任务；否则仅替换缓存。
 *
 * @returns 是否成功替换（`false` 表示 `id` 未注册过）
 */
export function updateDeferred(id: string, task: Task): boolean {
    if (typeof task !== 'function') {
        throw new Error('[deferredScheduler] task must be a function');
    }
    const entry = registry.get(id);
    if (!entry) return false;
    entry.task = task;
    if (ready) {
        runTask(id, entry);
    }
    return true;
}

/**
 * 注销已注册的 `id` 任务并触发其 cleanup。
 *
 * @returns 是否成功移除
 */
export function cancelDeferred(id: string): boolean {
    const entry = registry.get(id);
    if (!entry) return false;
    if (entry.cleanup) {
        try {
            entry.cleanup();
        } catch (err) {
            console.error(`[deferredScheduler] cleanup for "${id}" failed`, err);
        }
    }
    return registry.delete(id);
}

/**
 * 通知调度器：Vue 已 mount 完成，统一触发所有缓存任务。
 *
 * - 应由 `main.ts` 在 `app.mount(root)` 之后调用一次。
 * - 重复调用安全（幂等）。
 */
export function markDeferredReady(): void {
    if (ready) return;
    ready = true;
    // Map 保持插入顺序 — 与注册顺序一致
    for (const [id, entry] of registry) {
        runTask(id, entry);
    }
}

/** 查询调度器是否已 ready（Vue 已 mount）。 */
export function isDeferredReady(): boolean {
    return ready;
}

/**
 * 重置调度器 — 仅供测试使用。
 * @internal
 */
export function _resetDeferredForTest(): void {
    registry.clear();
    ready = false;
}