/**
 * 定时器模块 — 类型定义
 *
 * 从 `src/utils/timer.ts` 拆出的内部类型。
 */

// 定时器对象接口
export interface TimerObject {
    id: string;
    callback: () => void;
    delay: number;
    remaining: number;
    startTime: number;
    timerId: number | null;
    isPaused: boolean;
    isActive: boolean;
    status: 'running' | 'paused' | 'finished' | 'error';
    observer?: MutationObserver | null; // 用于动画暂停检测的observer
    animationTimeout?: number | null; // 动画暂停检测超时
}

// 定时器状态接口
export interface TimerStatus {
    id: string;
    name: string;
    status: string;
    delay: number;
    remaining: number;
    progress: string;
    isActive: boolean;
    isPaused: boolean;
}
