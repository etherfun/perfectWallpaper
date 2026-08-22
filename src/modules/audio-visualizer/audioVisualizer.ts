/**
 * 音频可视化模块
 * 注册 Wallpaper Engine 音频监听器，将音频数据存储到 config.runtime
 * 并在音频数据到达时触发 PWCircle 和 PWLine 的绘制
 */

import { useConfigStore } from "@/stores/config";
import { useRuntimeStore } from '@/stores/runtime';

import { debugLogger } from '../../utils/logger';

const runtimeStore = useRuntimeStore();

// PWCircle 绘制函数

/** 预分配的缓冲区（避免每帧分配新数组） */
let _clampBuffer: number[] = [];
let _spatialBuffer: number[] = [];
let _rearrangedBuffer: number[] = [];
/** 上一帧的音频数据（用于时序平滑，按声道独立） */
let _prevLeft: number[] | null = null;
let _prevRight: number[] | null = null;

/** WE 音频数组的单声道长度（128 = 64 左 + 64 右） */
const CHANNEL_BINS = 64;

/** 确保缓冲区大小匹配，必要时重新分配 */
function ensureBufferSize(buffer: number[], size: number): number[] {
    if (buffer.length !== size) {
        buffer.length = size;
    }
    return buffer;
}

/**
 * 限制音频值在合理范围内（原地操作）
 */
function clampAudioData(data: number[], output: number[]): number[] {
    for (let i = 0; i < data.length; i++) {
        const v = data[i] ?? 0;
        output[i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
    return output;
}

/**
 * 首尾接缝融合（原地操作）
 *
 * 圆环可视化中 index 0（低频，幅度大）与 index len-1（高频，幅度小）
 * 在闭合点相邻，直接相连会出现明显的高低差。本步骤把两端各 fade 个
 * 频段向公共均值 seamAvg 线性渐变，端点精确等于 seamAvg，
 * 保证闭合点两侧高度一致、无突跳。
 *
 * 无论平滑开关是否启用都执行（接缝问题是几何闭合固有的，与平滑无关）。
 * 导出仅供单元测试使用。
 */
export function blendSeam(data: number[]): number[] {
    const len = data.length;
    if (len < 8) return data;
    // 渐变区长度：约 1/16 频谱（128 → 8），限制在 [2, 16]
    const fade = Math.max(2, Math.min(16, len >> 4));
    let headSum = 0;
    let tailSum = 0;
    for (let i = 0; i < fade; i++) {
        headSum += data[i] ?? 0;
        tailSum += data[len - 1 - i] ?? 0;
    }
    // 公共基准：两端均值的平均，保证闭合点两侧高度一致
    const seamAvg = (headSum + tailSum) / (fade * 2);
    for (let i = 0; i < fade; i++) {
        // t=0 在最端点（完全取 seamAvg），向内线性衰减回原值
        const t = i / fade;
        const inv = 1 - t;
        data[i] = seamAvg * inv + (data[i] ?? 0) * t;
        const j = len - 1 - i;
        data[j] = seamAvg * inv + (data[j] ?? 0) * t;
    }
    return data;
}

/**
 * 对数组应用空间平滑（相邻频段平均）— 滑动窗口 O(len)，收敛为 O(128)
 */
function spatialSmooth(data: number[], windowSize: number, output: number[]): number[] {
    const half = Math.floor(windowSize / 2);
    const len = data.length;
    const count = half * 2 + 1;
    if (len === 0) return output;
    // 初始窗口和：[-half .. half]
    let sum = 0;
    for (let j = -half; j <= half; j++) sum += data[(((j % len) + len) % len)] ?? 0;
    for (let i = 0; i < len; i++) {
        output[i] = sum / count;
        // 滑动：移出 i-half，移入 i+half+1（循环索引）
        const outIdx = (((i - half) % len) + len) % len;
        const inIdx = (((i + half + 1) % len) + len) % len;
        sum += (data[inIdx] ?? 0) - (data[outIdx] ?? 0);
    }
    return output;
}

/**
 * 对数组应用时序平滑（指数移动平均）
 * 基于上一帧数据平滑过渡，避免突变
 */
function temporalSmooth(
    data: number[],
    prevData: number[] | null,
    smoothFactor: number,
    output: number[]
): number[] {
    if (!prevData || prevData.length !== data.length) {
        return data;
    }

    for (let i = 0; i < data.length; i++) {
        const prev = prevData[i] ?? 0;
        // 指数移动平均：new = old * factor + prev * (1 - factor)
        output[i] = (data[i] ?? 0) * smoothFactor + prev * (1 - smoothFactor);
    }
    return output;
}

/**
 * 平滑单个声道（64 bin）
 * 1. 限制值范围
 * 2. 首尾接缝融合（声道内低频↔高频闭合处过渡）
 * 3. 空间平滑（消除孤立峰值，循环索引使首尾相邻）
 * 4. 时序平滑（帧间过渡平滑，按声道独立记忆）
 */
function smoothChannel(
    rawData: number[],
    output: number[],
    prevData: number[] | null,
    setPrev: (data: number[]) => void,
    smoothFactor: number,
    spatialWindow: number
): void {
    const len = rawData.length;

    // Step 1: 限制范围
    ensureBufferSize(_clampBuffer, len);
    clampAudioData(rawData, _clampBuffer);

    // Step 2: 首尾接缝融合（始终执行，消除声道内低频/高频端的高低差）
    blendSeam(_clampBuffer);

    // 未启用平滑：直接输出（重置该声道时序记忆由调用方统一处理）
    if (!config.audio_smooth_enabled) {
        for (let i = 0; i < len; i++) output[i] = _clampBuffer[i] ?? 0;
        return;
    }

    // 平滑因子无效时跳过后续 DSP
    if (isNaN(smoothFactor) || smoothFactor <= 0 || smoothFactor >= 1) {
        for (let i = 0; i < len; i++) output[i] = _clampBuffer[i] ?? 0;
        return;
    }

    // Step 3: 空间平滑（64 bin 循环索引，首尾天然相邻，无需人工重排）
    ensureBufferSize(_rearrangedBuffer, len);
    ensureBufferSize(_spatialBuffer, len);
    spatialSmooth(_clampBuffer, spatialWindow, _spatialBuffer);

    // Step 4: 时序平滑（按声道独立的上一帧记忆）
    if (prevData && prevData.length === len) {
        temporalSmooth(_spatialBuffer, prevData, smoothFactor, _rearrangedBuffer);
    } else {
        for (let i = 0; i < len; i++) {
            _rearrangedBuffer[i] = _spatialBuffer[i] ?? 0;
        }
    }

    // 写出 + 更新该声道上一帧记忆
    for (let i = 0; i < len; i++) {
        output[i] = _rearrangedBuffer[i] ?? 0;
        setPrev(output);
    }
}

/**
 * 平滑音频数据（双声道）
 *
 * WE 音频数组布局：0..63 = 左声道、64..127 = 右声道。
 * 拆分为两条独立声道分别做 clamp / 接缝融合 / 空间平滑 / 时序平滑，
 * 各消费者（圆环左右半圆、直线、音频条等）可自由拼接或混合。
 */
function smoothAudioData(
    rawData: number[]
): { left: number[]; right: number[] } {
    const leftRaw = rawData.slice(0, CHANNEL_BINS);
    const rightRaw = rawData.slice(CHANNEL_BINS, CHANNEL_BINS * 2);

    const enabled = config.audio_smooth_enabled;
    const smoothFactor = (config.audio_smooth_factor as number) / 100;
    const spatialWindow = config.audio_spatial_window as number;

    // 未启用平滑或参数无效：重置两条声道的时序记忆
    if (!enabled || isNaN(smoothFactor) || smoothFactor <= 0 || smoothFactor >= 1) {
        _prevLeft = null;
        _prevRight = null;
    }

    const left: number[] = new Array(leftRaw.length);
    const right: number[] = new Array(rightRaw.length);

    smoothChannel(
        leftRaw,
        left,
        _prevLeft,
        data => {
            _prevLeft = data.slice();
        },
        smoothFactor,
        spatialWindow
    );
    smoothChannel(
        rightRaw,
        right,
        _prevRight,
        data => {
            _prevRight = data.slice();
        },
        smoothFactor,
        spatialWindow
    );

    return { left, right };
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

import { createPoint, setCan, style1, style2, style3 } from './circle/PWCircle';
import { PWLineCreatePoint, PWLineStyle1, PWLineStyle2, PWLineStyle3, setCTXLine } from './line/PWLine';
import { toMono } from './mono';

const config = useConfigStore();

const circleStyles = [style1, style2, style3] as const;
const lineStyles = [PWLineStyle1, PWLineStyle2, PWLineStyle3] as const;

// 缓存的 Canvas Context（避免每帧查询）
let _circleCtx: CanvasRenderingContext2D | null = null;
let _lineCtx: CanvasRenderingContext2D | null = null;

/**
 * 初始化 Canvas Context 缓存
 */
function initCanvasContexts(): void {
    const can = document.querySelector('#can') as HTMLCanvasElement | null;
    _circleCtx = can?.getContext('2d') ?? null;

    const canLine = document.querySelector('#CanLine') as HTMLCanvasElement | null;
    _lineCtx = canLine?.getContext('2d') ?? null;
}

/**
 * 清除画布
 */
function clearCanvases(): void {
    const wallpaper = runtimeStore.wallpaper as any;

    wallpaper?.audiovisualizer('clearCanvas');
    _lineCtx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
    _circleCtx?.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

/**
 * 渲染圆圈可视化（双声道）
 * 左声道 → 上半圆、右声道 → 下半圆，由 createPoint 内部处理
 */
function renderCircle(left: number[], right: number[]): void {
    const ctx = _circleCtx;
    const param = runtimeStore.param;

    if (!ctx || !param || !param.showCircle) return;

    setCan();
    createPoint(left, right);
    circleStyles[param.style - 1]?.();
}

/**
 * 渲染直线可视化（左右声道拼接为 128 bin mono）
 * 直线是水平布局，无声道语义；拼接保留全部频段分辨率，
 * 与旧单数组管线的输入完全一致
 */
function renderLine(left: number[], right: number[]): void {
    const ctx = _lineCtx;
    const param = runtimeStore.PWLineParam;

    if (!ctx || !param || !param.showLine) return;

    setCTXLine();
    PWLineCreatePoint(toMono(left, right));
    lineStyles[param.style - 1]?.();
}

/**
 * 音频数据监听回调
 * 仅负责将音频数据存储到 config.runtime
 * 由 Wallpaper Engine 调用，约30fps
 */
export function audioDataListener(audioData: number[]): void {
    // 验证原始数据有效性（平滑输出由 [0,1] 输入经线性运算得到，数学上保证有效）
    if (!validateAudioData(audioData)) {
        debugLogger.warn('[AudioVisual] Invalid audio data, skipping');
        return;
    }

    // 应用平滑处理（双声道独立 DSP），使波形更加连贯美观
    const { left, right } = smoothAudioData(audioData);

    // 存储处理后的双声道数据
    runtimeStore.playerInfo.audioLeft = left;
    runtimeStore.playerInfo.audioRight = right;

    // 触发渲染（渲染函数会自行判断当前模式）
    renderAudioVisualization();
}

/**
 * 音频可视化渲染函数
 * 从 config.runtime 读取双声道数据并渲染到 Canvas
 */
export function renderAudioVisualization(): void {
    const left = runtimeStore.playerInfo.audioLeft;
    const right = runtimeStore.playerInfo.audioRight;
    if (!left?.length && !right?.length) {
        debugLogger.info('[AudioVisual] No audio data to render');
        return;
    }

    // 首次调用时初始化 Canvas Context
    if (!_circleCtx) {
        initCanvasContexts();
        debugLogger.info(
            `[AudioVisual] Canvas contexts initialized, circle: ${!!_circleCtx}, line: ${!!_lineCtx}`
        );
    }

    clearCanvases();

    switch (config.visual_audio_model) {
        case 1:
            renderCircle(left, right);
            break;
        case 2:
            renderLine(left, right);
            break;
        case 3:
            // Alice 圆环为单数组接口：拼接为 128 bin mono（与原始布局一致）
            (runtimeStore.wallpaper as any)?.audiovisualizer(
                'drawCanvas',
                toMono(left, right)
            );
            break;
    }
}
