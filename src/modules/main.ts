import { appConfig } from '../utils/config';
import { setupWallpaperPropertyListener } from './propertyHandlers/index';
import { WallpaperController } from './WallpaperController';
import './audioVisualizer';
import { resize as pwCircleResize } from './PWCircle';
import { PWLineInit } from './PWLine';

appConfig.runtime.wallpaper = new WallpaperController(document.body);

setupWallpaperPropertyListener();
pwCircleResize();
PWLineInit();

debugLogger.info('[App] PerfectWall 壁纸引擎初始化完成');
