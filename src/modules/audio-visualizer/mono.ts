/**
 * 双声道 → 单声道拼接助手
 *
 * 各无声道语义的消费者（PWLine 直线、Alice 圆环、PWParticles 粒子）
 * 原始设计都吃 WE 的 128 bin 数组（0..63 左 + 64..127 右）。
 * 这里用「拼接」而非逐 bin 取 max/max 平均——拼接完整保留 128 个
 * 频段分辨率，且顺序与 WE 原始布局一致，行为与旧单数组管线等价。
 *
 * 返回模块级复用缓冲区：同一帧内同步使用安全，勿跨帧持有引用。
 */

const _monoBuffer: number[] = [];

export function toMono(left: number[], right: number[]): number[] {
    const leftLen = left.length;
    const len = leftLen + right.length;
    if (_monoBuffer.length !== len) {
        _monoBuffer.length = len;
    }
    for (let i = 0; i < leftLen; i++) {
        _monoBuffer[i] = left[i] ?? 0;
    }
    for (let j = 0; j < right.length; j++) {
        _monoBuffer[leftLen + j] = right[j] ?? 0;
    }
    return _monoBuffer;
}
