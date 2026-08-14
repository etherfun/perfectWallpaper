// PWCircle.ts - Audio circle visualizer module
// This module provides circular audio visualization effects
//
// 拆分说明：共享状态 → ./state，初始化 → ./init，颜色 → ./color，
// 点位计算 → ./points，绘制样式 → ./styles。对外 API 与拆分前完全一致。

export { setCan } from './color';
export { resize } from './init';
export { createPoint, getXY } from './points';
export { style1, style2, style3 } from './styles';
