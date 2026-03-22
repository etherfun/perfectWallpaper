/**
 * Bundle Entry Point
 * This file imports all modules to be bundled into a single file
 */

// IMPORTANT: main.ts must be imported FIRST to set up globals before other modules
// that depend on them (like PWLine, PWCircle, PWParticles) are loaded.
import './modules/main';

import './modules/version';
import './modules/sakura';
import './modules/slide';
import './modules/video';
import './modules/time';
import './modules/date';
import './modules/hitokoto';
import './modules/countdown';
import './modules/fluid_effect2';
import './modules/fluid_control';
import './modules/player_control';
import './modules/RGB';
import './modules/PWLine';
import './modules/PWCircle';
import './modules/PWParticles';
import './modules/weather';
import './modules/WallpaperEffectController'
