/**
 * 模块级常量
 */

/** 进度条更新基础间隔（ms），每次步进 0.1 秒 */
export const TIMELINE_TICK_MS = 100;

/** 等待新事件时的轮询间隔（ms） */
export const TIMELINE_WAIT_MS = 500;

/** 进度条每次步进的秒数 */
export const TIMELINE_STEP_SEC = 0.1;

/** 音频可视化条数（频谱被分成 64 段） */
export const AUDIO_BAR_COUNT = 64;

/** 进度条背景额外不透明度叠加值 */
export const TIMELINE_BG_ALPHA_OFFSET = 0.4;

/** 等待 server_mode 信号的延迟（ms） */
export const SERVER_MODE_PROBE_DELAY_MS = 3000;

/** 入场/淡出动画延时（ms） */
export const ITEM_ENTRANCE_DELAY_MS = 50;

/** 缩略图左右侧切换生效的延迟（ms，等布局稳定） */
export const THUMBNAIL_RTL_SWAP_DELAY_MS = 2500;

/** 封面旋转速度的默认值（秒/圈，属性未设置时使用） */
export const DEFAULT_THUMBNAIL_ROTATION_SEC = 10;
