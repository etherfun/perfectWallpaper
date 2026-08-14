/**
 * 定时器模块 — 条件等待工具
 *
 * 从 `src/utils/timer.ts` 拆出的 waitAndExecute。
 */

import { debugLogger } from '../logger';

/**
 * 等待条件成立后执行函数
 * @param conditionFn - 条件检测函数，返回true时执行
 * @param actionFn - 条件成立后要执行的函数
 * @param interval - 检查间隔(毫秒)
 * @param timeout - 超时时间(毫秒)
 * @returns 返回Promise，在actionFn执行后resolve
 */
export function waitAndExecute(
    conditionFn: () => boolean,
    actionFn: () => void,
    interval: number = 100,
    timeout: number = 20000
): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const check = () => {
            try {
                const conditionMet = conditionFn();

                if (conditionMet === true) {
                    const result = actionFn();
                    resolve(result);
                } else if (Date.now() - startTime > timeout) {
                    debugLogger.error('等待条件超时');
                    reject(new Error('等待条件超时'));
                } else {
                    setTimeout(check, interval);
                }
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                debugLogger.error(`条件检测失败: ${message}`);
                reject(new Error(`条件检测失败: ${message}`));
            }
        };

        check();
    });
}
