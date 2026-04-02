/**
 * 音频可视化模块
 * 注册 Wallpaper Engine 音频监听器，将音频数据存储到 config.runtime
 * 并在音频数据到达时触发 PWCircle 和 PWLine 的绘制
 */

import { config } from './utils/config';
import { debugLogger } from './utils/logger';

// PWCircle 绘制函数

/** 上一帧的音频数据（用于时序平滑） */
let _prevAudioData: number[] | null = null;

/**
 * 对数组应用空间平滑（相邻频段平均）
 * 消除孤立的单波峰，使频谱更加连贯
 * 使用循环平滑，头尾相连（适用于圆环可视化）
 */
function spatialSmooth(data: number[], windowSize: number): number[] {
    const result = new Array(data.length);
    const halfWindow = Math.floor(windowSize / 2);
    const len = data.length;
    // 实际求和的元素数量（j 从 -halfWindow 到 +halfWindow 共 2*halfWindow+1 个）
    const actualCount = halfWindow * 2 + 1;

    for (let i = 0; i < len; i++) {
        let sum = 0;

        // 循环平滑：使用取模运算实现头尾相连
        for (let j = -halfWindow; j <= halfWindow; j++) {
            // 使用 ((i + j) % len + len) % len 实现正确的负数取模
            const idx = ((i + j) % len + len) % len;
            sum += data[idx];
        }

        result[i] = sum / actualCount;
    }

    return result;
}

/**
 * 对数组应用时序平滑（指数移动平均）
 * 基于上一帧数据平滑过渡，避免突变
 */
function temporalSmooth(data: number[], prevData: number[] | null, smoothFactor: number): number[] {
    if (!prevData || prevData.length !== data.length) {
        return data;
    }

    return data.map((value, i) => {
        const prev = prevData[i] ?? 0;
        // 指数移动平均：new = old * factor + prev * (1 - factor)
        return value * smoothFactor + prev * (1 - smoothFactor);
    });
}

/**
 * 限制音频值在合理范围内
 * 根据文档，有些频率可能超过 1.0，需要限制
 */
function clampAudioData(data: number[]): number[] {
    return data.map(v => Math.min(1.0, Math.max(0.0, v)));
}

/**
 * 平滑音频数据
 * 1. 先限制值范围
 * 2. 空间平滑（消除孤立峰值）
 * 3. 时序平滑（帧间过渡平滑）
 */
function smoothAudioData(rawData: number[]): number[] {
    // 始终先限制范围
    let processed = clampAudioData(rawData);

    // 检查是否启用平滑
    if (!config.audio_smooth_enabled) {
        _prevAudioData = null; // 重置时序数据
        return processed;
    }

    // 从配置读取平滑参数
    const smoothFactor = (config.audio_smooth_factor as number) / 100;
    const spatialWindow = config.audio_spatial_window as number;

    // 验证平滑因子有效性
    if (isNaN(smoothFactor) || smoothFactor <= 0 || smoothFactor >= 1) {
        return processed;
    }

    // Step 2: 空间平滑
    processed = spatialSmooth(processed, spatialWindow);

    // Step 3: 时序平滑
    processed = temporalSmooth(processed, _prevAudioData, smoothFactor);

    // 更新上一帧数据
    _prevAudioData = [...processed];

    return processed;
}

/**
 * 验证音频数据有效性，确保没有 NaN 或无效值
 */
function validateAudioData(data: number[]): boolean {
    if (!data || data.length === 0) return false;
    for (const v of data) {
        if (isNaN(v) || !isFinite(v)) {
            return false;
        }
    }
    return true;
}

import { setCan, createPoint, style1, style2, style3 } from './PWCircle';
import { setCTXLine, PWLineCreatePoint, PWLineStyle1, PWLineStyle2, PWLineStyle3 } from './PWLine';

const circleStyles = [style1, style2, style3] as const;
const lineStyles = [PWLineStyle1, PWLineStyle2, PWLineStyle3] as const;

// 缓存的 Canvas Context（避免每帧查询）
let _circleCtx: CanvasRenderingContext2D | null = null;
let _lineCtx: CanvasRenderingContext2D | null = null;

/**
 * 初始化 Canvas Context 缓存
 */
function initCanvasContexts(): void {
    const can = document.querySelector("#can") as HTMLCanvasElement | null;
    _circleCtx = can?.getContext("2d") ?? null;

    const canLine = document.querySelector("#CanLine") as HTMLCanvasElement | null;
    _lineCtx = canLine?.getContext("2d") ?? null;
}

/**
 * 清除画布
 */
function clearCanvases(): void {
    const wallpaper = config.runtime.wallpaper;

    wallpaper?.audiovisualizer('clearCanvas');
    _lineCtx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
    _circleCtx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

/**
 * 渲染圆圈可视化
 */
function renderCircle(audioData: number[]): void {
    const ctx = _circleCtx;
    const param = config.runtime.param;

    if (!ctx || !param || !param.showCircle) return;

    setCan();
    createPoint(audioData);
    circleStyles[param.style - 1]?.();
}

/**
 * 渲染直线可视化
 */
function renderLine(audioData: number[]): void {
    const ctx = _lineCtx;
    const param = config.runtime.PWLineParam;

    if (!ctx || !param || !param.showLine) return;

    setCTXLine();
    PWLineCreatePoint(audioData);
    lineStyles[param.style - 1]?.();
}

/**
 * 音频数据监听回调
 * 仅负责将音频数据存储到 config.runtime
 * 由 Wallpaper Engine 调用，约30fps
 */
export function audioDataListener(audioData: number[]): void {

    // 验证原始数据有效性
    if (!validateAudioData(audioData)) {
        debugLogger.warn('[AudioVisual] Invalid audio data, skipping');
        return;
    }

    // 应用平滑处理，使波形更加连贯美观
    const smoothedData = smoothAudioData(audioData);

    // 再次验证处理后的数据
    if (!validateAudioData(smoothedData)) {
        debugLogger.warn('[AudioVisual] Smoothed data invalid, skipping');
        return;
    }

    // 存储处理后的音频数据
    config.runtime.playerInfo.audioArray = smoothedData;

    // 触发渲染（渲染函数会自行判断当前模式）
    renderAudioVisualization();
}

/**
 * 音频可视化渲染函数
 * 从 config.runtime 读取音频数据并渲染到 Canvas
 */
export function renderAudioVisualization(): void {
    const audioData = config.runtime.playerInfo.audioArray;
    if (!audioData?.length) {
        debugLogger.info('[AudioVisual] No audio data to render');
        return;
    }

    // 首次调用时初始化 Canvas Context
    if (!_circleCtx) {
        initCanvasContexts();
        debugLogger.info(`[AudioVisual] Canvas contexts initialized, circle: ${!!_circleCtx}, line: ${!!_lineCtx}`);
    }

    clearCanvases();

    switch (config.visual_audio_model) {
        case 1:
            renderCircle(audioData);
            break;
        case 2:
            renderLine(audioData);
            break;
        case 3:
            config.runtime.wallpaper?.audiovisualizer('drawCanvas', audioData);
            break;
    }
}

