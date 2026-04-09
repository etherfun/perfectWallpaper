import './audioVisualizer';
import './fullscreenLyrics';

import { setupWallpaperPropertyListener } from './propertyHandlers/wallpaperPropertyListener';
import { resize as pwCircleResize } from './PWCircle';
import { PWLineInit } from './PWLine';
import { config } from './utils/config';
import { debugLogger } from './utils/logger';
import { WallpaperEffectController } from './WallpaperEffectController';

config.runtime.wallpaper = new WallpaperEffectController(document.body);

setupWallpaperPropertyListener();
pwCircleResize();
PWLineInit();

debugLogger.info('[App] PerfectWall 壁纸引擎初始化完成');
