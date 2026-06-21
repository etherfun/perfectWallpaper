/**
 * Bundle Entry Point
 * This file imports all modules to be bundled into a single file
 */

// IMPORTANT: main.ts must be imported FIRST to set up globals before other modules
// that depend on them (like PWLine, PWCircle, PWParticles) are loaded.
import './main';

// Phase 1: 4 个叶子组件已迁移到 Vue SFC，注释掉旧 .ts 入口避免双重渲染。
// Phase 7 将删除这些 .ts 文件。
// import './time';
// import './date';
// import './hitokoto';
// import './countdown';

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
