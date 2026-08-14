// PWLine.ts - Audio line visualizer module
// This module provides line-based audio visualization effects
//
// 拆分说明：共享状态 → ./state，初始化 → ./init，颜色 → ./color，
// 点位计算 → ./points，绘制样式 → ./styles。对外 API 与拆分前完全一致。

export { getColor, setCTXLine } from './color';
export { PWLineInit } from './init';
export { getLineXY, PWLineCreatePoint } from './points';
export { PWLineStyle1, PWLineStyle2, PWLineStyle3 } from './styles';
