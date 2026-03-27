import { appConfig } from './utils/config';
import { debugLogger } from './utils/logger';
import { setupWallpaperPropertyListener } from './propertyHandlers/index';
import { WallpaperEffectController } from './WallpaperEffectController';
import './audioVisualizer';
import { resize as pwCircleResize } from './PWCircle';
import { PWLineInit } from './PWLine';
import './fullscreenLyrics';

appConfig.runtime.wallpaper = new WallpaperEffectController(document.body);

setupWallpaperPropertyListener();
pwCircleResize();
PWLineInit();

debugLogger.info('[App] PerfectWall 壁纸引擎初始化完成');
