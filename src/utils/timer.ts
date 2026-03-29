/**
 * 定时器模块
 * 包含多定时器管理器和相关工具函数
 */

import { debugLogger } from './logger';

// 定时器对象接口
interface TimerObject {
    id: string;
    callback: () => void;
    delay: number;
    remaining: number;
    startTime: number;
    timerId: number | null;
    isPaused: boolean;
    isActive: boolean;
    status: 'running' | 'paused' | 'finished' | 'error';
}

// 定时器状态接口
interface TimerStatus {
    id: string;
    name: string;
    status: string;
    delay: number;
    remaining: number;
    progress: string;
    isActive: boolean;
    isPaused: boolean;
}

/**
 * 多定时器管理器类（支持暂停）
 * 管理多个setTimeout定时器，每个定时器可独立控制
 */
export class MultiTimerManager {
    private timers: Map<string, TimerObject> = new Map();
    private counter: number = 0;

    /**
     * 创建并启动一个定时器
     * @param callback - 回调函数
     * @param delay - 延迟时间(毫秒)
     * @param name - 定时器名称（可选，不指定则自动生成）
     * @returns 定时器ID
     */
    create(callback: () => void, delay: number, name?: string): string {
        const timerId = name || `timer_${++this.counter}`;
        
        // 如果已存在同名定时器，先清除
        if (this.timers.has(timerId)) {
            this.remove(timerId);
        }

        const timerObj: TimerObject = {
            id: timerId,
            callback,
            delay,
            remaining: delay,      // 剩余时间
            startTime: Date.now(), // 开始时间
            timerId: null,         // 原生定时器ID
            isPaused: false,       // 是否暂停
            isActive: true,        // 是否激活
            status: 'running',     // 状态：running, paused, finished
        };

        // 设置原生定时器
        timerObj.timerId = window.setTimeout(() => {
            this._executeTimer(timerId);
        }, delay);

        // 存储定时器
        this.timers.set(timerId, timerObj);

        return timerId;
    }

    /**
     * 暂停定时器
     * @param timerId - 定时器ID
     * @returns 是否成功
     */
    pause(timerId: string): boolean {
        const timer = this.timers.get(timerId);
        if (!timer || !timer.isActive || timer.isPaused) {
            debugLogger.warn(`定时器 "${timerId}" 不存在、未激活或已暂停`);
            return false;
        }

        // 计算已运行的时间
        const elapsed = Date.now() - timer.startTime;
        timer.remaining = Math.max(0, timer.remaining - elapsed);
        
        // 清除原生定时器
        if (timer.timerId !== null) {
            clearTimeout(timer.timerId);
        }
        timer.timerId = null;
        timer.isPaused = true;
        timer.status = 'paused';
        
        return true;
    }

    /**
     * 恢复定时器
     * @param timerId - 定时器ID
     * @returns 是否成功
     */
    resume(timerId: string): boolean {
        const timer = this.timers.get(timerId);
        if (!timer || !timer.isActive || !timer.isPaused) {
            debugLogger.warn(`定时器 "${timerId}" 不存在、未激活或未暂停`);
            return false;
        }

        // 重新设置定时器
        timer.startTime = Date.now();
        timer.isPaused = false;
        timer.status = 'running';
        
        timer.timerId = window.setTimeout(() => {
            this._executeTimer(timerId);
        }, timer.remaining);

        return true;
    }

    /**
     * 清除定时器
     * @param timerId - 定时器ID
     * @returns 是否成功
     */
    remove(timerId: string): boolean {
        const timer = this.timers.get(timerId);
        if (!timer) {
            return false;
        }

        // 清除原生定时器
        if (timer.timerId !== null) {
            clearTimeout(timer.timerId);
        }

        // 从Map中移除
        this.timers.delete(timerId);
        return true;
    }

    /**
     * 获取所有定时器状态
     * @returns 定时器状态列表
     */
    getAllStatus(): TimerStatus[] {
        const statusList: TimerStatus[] = [];
        for (const [id, timer] of this.timers) {
            let remaining = timer.remaining;
            
            // 如果正在运行，重新计算剩余时间
            if (timer.isActive && !timer.isPaused) {
                const elapsed = Date.now() - timer.startTime;
                remaining = Math.max(0, timer.remaining - elapsed);
            }
            
            statusList.push({
                id: timer.id,
                name: timer.id,
                status: timer.status,
                delay: timer.delay,
                remaining: remaining,
                progress: timer.delay > 0 ? 
                    ((timer.delay - remaining) / timer.delay * 100).toFixed(1) + '%' : '100%',
                isActive: timer.isActive,
                isPaused: timer.isPaused
            });
        }
        return statusList;
    }

    /**
     * 获取单个定时器状态
     * @param timerId - 定时器ID
     * @returns 定时器状态或null
     */
    getStatus(timerId: string): TimerStatus | null {
        const timer = this.timers.get(timerId);
        if (!timer) return null;

        let remaining = timer.remaining;
        if (timer.isActive && !timer.isPaused) {
            const elapsed = Date.now() - timer.startTime;
            remaining = Math.max(0, timer.remaining - elapsed);
        }

        return {
            id: timer.id,
            name: timer.id,
            status: timer.status,
            delay: timer.delay,
            remaining: remaining,
            progress: timer.delay > 0 ? 
                ((timer.delay - remaining) / timer.delay * 100).toFixed(1) + '%' : '100%',
            isActive: timer.isActive,
            isPaused: timer.isPaused
        };
    }

    /**
     * 清除所有定时器
     */
    clearAll(): void {
        for (const [id, timer] of this.timers) {
            if (timer.timerId !== null) {
                clearTimeout(timer.timerId);
            }
        }
        this.timers.clear();
    }

    /**
     * 暂停所有定时器
     */
    pauseAll(): void {
        for (const [id] of this.timers) {
            this.pause(id);
        }
    }

    /**
     * 恢复所有定时器
     */
    resumeAll(): void {
        for (const [id] of this.timers) {
            this.resume(id);
        }
    }

    /**
     * 执行定时器回调（内部方法）
     * @param timerId - 定时器ID
     */
    private _executeTimer(timerId: string): void {
        const timer = this.timers.get(timerId);
        if (!timer) return;

        // 检查动画状态
        const checkAnimationState = () => {
            if (document.body.style.animationPlayState === 'paused') {
                // 动画暂停中，无限等待动画恢复

                // 监听动画状态变化
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'style' && 
                            document.body.style.animationPlayState !== 'paused') {
                            // 动画已恢复播放，停止监听并执行回调
                            observer.disconnect();
                            executeTimerCallback();
                        }
                    });
                });

                // 开始监听body元素的style属性变化
                observer.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['style']
                });
            } else {
                // 动画正在播放，直接执行回调
                executeTimerCallback();
            }
        };

        // 执行定时器回调的实际函数
        const executeTimerCallback = () => {
            try {
                this.timers.delete(timerId);
                // 执行回调
                timer.callback();
                timer.status = 'finished';
                timer.isActive = false;
            } catch (error) {
                debugLogger.error(`定时器 "${timerId}" 执行出错:`, error);
                timer.status = 'error';
            }
        };

        // 开始检查动画状态
        checkAnimationState();
    }
}

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
            } catch (error: any) {
                debugLogger.error(`条件检测失败: ${error.message}`);
                reject(new Error(`条件检测失败: ${error.message}`));
            }
        };
        
        check();
    });
}

// 全局定时器管理器实例
export const timerManager = new MultiTimerManager();