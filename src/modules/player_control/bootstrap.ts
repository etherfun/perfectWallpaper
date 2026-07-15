/**
 * 模块副作用：
 *   1. 把 4 个 wallpaperMedia* 监听器注册到 window
 *   2. 初始化 .play-pause/.prev/.next 控制按钮
 *
 * `import './bootstrap'` 触发，无导出。
 *
 * 控制按钮的 DOM 操作通过 registerDeferred 延后到 Vue mount 之后执行。
 */
import { wallpaperMediaPlaybackListener } from './media/mediaPlaybackListener';
import { wallpaperMediaPropertiesListener } from './media/mediaPropertiesListener';
import { wallpaperMediaThumbnailListener } from './media/mediaThumbnailListener';
import { initPlayerControls } from './ui/controlsUI';
import { wallpaperMediaTimelineListener } from './ui/timeline';

window.wallpaperRegisterMediaThumbnailListener?.(wallpaperMediaThumbnailListener);
window.wallpaperRegisterMediaTimelineListener?.(wallpaperMediaTimelineListener);
window.wallpaperRegisterMediaPropertiesListener?.(wallpaperMediaPropertiesListener);
window.wallpaperRegisterMediaPlaybackListener?.(wallpaperMediaPlaybackListener);

initPlayerControls();
