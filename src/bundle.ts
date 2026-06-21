/**
 * Bundle Entry Point
 * This file imports all modules to be bundled into a single file
 */

// IMPORTANT: main.ts must be imported FIRST to set up globals before other modules
// that depend on them (like PWLine, PWCircle, PWParticles) are loaded.
import './main';

// Stage 7-B (Phase 7 批次 1): 4 个叶子 .ts 已删除 — 时间/日期/倒计时/一言
// 已由 Clock.vue / Date.vue / Countdown.vue / Hitokoto.vue (Phase 1) 完全替代。

import './version';
import './sakura';
import './slide';
import './video';
import './player_control';
import './fluid';
import './RGB';
import './PWLine';
import './PWCircle';
import './PWParticles';
import './weather';
import './WallpaperEffectController';
import './dockbar';
