/**
 * Wallpaper sources - 根据 wallpaper_mode 路由到对应的源加载器
 *
 * 子模块:
 * - info: 图片信息显示 (clearpicturesinfo / picturesinfo_showrl)
 * - loader: 通用图片加载 (transitionBackground + RGB 同步)
 * - bing: Bing 每日壁纸
 * - nasa: NASA APOD (HTML / JSON)
 * - chiyuan: 次元 API
 * - spotlight: Windows 聚焦
 * - types: API 响应类型
 *
 * 路由 (wallpaper_mode):
 * 1 单张壁纸   2 随机播放   3 视频   4 Bing
 * 5 Lorem     6 NASA       7 次元   8 Windows聚焦
 * 9 自定义URL
 *
 * Stage 3.5-A3 (Phase 7 批次 3-3 follow-up):
 *   之前 `import { config } from '../../../utils/config'` 读 appConfig 单例，
 *   与 slide/index.ts 的 Pinia 版本（`useConfigStore()`）不同步。
 *   当用户在 WE 中切换 wallpapermode，Pinia wallpaper_mode 已被更新，
 *   changeBackground 走新 case，但 shouldShow 仍按 appConfig.wallpaper_mode=1
 *   → 永远停留在 1.jpg。
 *
 *   修复：已迁移到 Pinia 的字段（wallpaper_mode / custom / background_route /
 *   rgb_show / pictures_url 等）改读 useConfigStore()，runtime.*（高频写入：
 *   photo.nextphoto、photo.infomation、myList 等）保留 appConfig.runtime 访问。
 */

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { background2canvas } from '../../rgb-effect/RGB';

const runtimeStore = useRuntimeStore();
import { ChangeVideoModel } from '../../core/video';
import { transitionBackground } from '../transition';
import { backgroundLayers, pictures } from '../types';
import { loadBing } from './bing';
import { loadChiyuan } from './chiyuan';
import { clearpicturesinfo, picturesinfo_showrl } from './info';
import { onImageError, onImageLoad } from './loader';
import { loadNasa } from './nasa';
import { loadWindowsSpotlight } from './spotlight';

function getMyVideo(): HTMLVideoElement | null {
    return document.getElementById('myvideo') as HTMLVideoElement | null;
}

/** Should show wallpaper based on current mode */
export function shouldShow(): void {
    const store = useConfigStore();
    document.body.style.backgroundImage = '';

    if (!backgroundLayers.container || !backgroundLayers.layer1) {
        setTimeout(() => shouldShow(), 1000);
        return;
    }

    switch (store.wallpaper_mode) {
        case 1: // Single wallpaper mode
            {
                const v = getMyVideo();
                if (v) v.src = '';
                backgroundLayers.container.style.display = 'block';
                document.body.style.backgroundImage = '';

                let imageUrl: string;
                if (store.custom) {
                    imageUrl = 'file:///' + store.custom;
                } else {
                    imageUrl = (store.background_route ?? './source/imgs/1.jpg').replace(
                        /^url\("(.+?)"\)$/,
                        '$1'
                    );
                }

                transitionBackground(imageUrl);
                runtimeStore.photo.currentImg = imageUrl;

                clearpicturesinfo();
                pictures.picture_info.style.display = 'none';
                if (store.rgb_show) {
                    runtimeStore.photo.nextphoto = true;
                    setTimeout(function () {
                        background2canvas(imageUrl, false);
                        runtimeStore.photo.nextphoto = false;
                    }, 100);
                }
            }
            break;

        case 2: // Random mode
            {
                const v = getMyVideo();
                if (v) v.src = '';
            }
            backgroundLayers.container.style.display = 'block';
            if (runtimeStore.myList.length) {
                transitionBackground('file:///' + runtimeStore.photo.currentImg!);
            } else {
                transitionBackground('imgs/1.jpg');
                runtimeStore.photo.currentImg = 'imgs/1.jpg';
            }
            clearpicturesinfo();
            pictures.picture_info.style.display = 'none';
            if (store.rgb_show) {
                runtimeStore.photo.nextphoto = true;
                setTimeout(function () {
                    background2canvas(runtimeStore.photo.currentImg!, false);
                    runtimeStore.photo.nextphoto = false;
                }, 100);
            }
            break;

        case 3: // Video mode
            ChangeVideoModel();
            clearpicturesinfo();
            backgroundLayers.container.style.display = 'none';
            pictures.picture_info.style.display = 'none';
            if (store.rgb_show) {
                runtimeStore.photo.nextphoto = true;
                setTimeout(function () {
                    background2canvas(undefined, true);
                    runtimeStore.photo.nextphoto = false;
                }, 100);
            }
            break;

        case 4: // Bing wallpaper
            // 静默加载: 容器显示由 picturesinfo_showrl() 在 loader
            // 拿到真实版权/标题数据后再 display=flex,
            // 不再在此处提前 show,避免 fetch 期间出现空框架。
            {
                const v = getMyVideo();
                if (v) v.src = '';
            }
            backgroundLayers.container.style.display = 'block';
            loadBing();
            break;

        case 5: // Lorem Picsum
            {
                const v = getMyVideo();
                if (v) v.src = '';
                backgroundLayers.container.style.display = 'block';
                const timestamp = new Date().getTime();

                const loremImg = new Image();
                loremImg.src = 'https://picsum.photos/3840/2160?random=' + timestamp;

                loremImg.onload = function () {
                    onImageLoad(loremImg.src);
                };
                loremImg.onerror = function () {
                    onImageError('Lorem Picsum', loremImg.src);
                };
                clearpicturesinfo();
                pictures.picture_info.style.display = 'none';
            }
            break;

        case 6: // NASA
            {
                // 静默加载: 同 case 4, 由 picturesinfo_showrl() 负责显示。
                const v6 = getMyVideo();
                if (v6) v6.src = '';
                backgroundLayers.container.style.display = 'block';
                loadNasa();
            }
            break;

        case 7: // 次元api
            {
                const v7 = getMyVideo();
                if (v7) v7.src = '';
                backgroundLayers.container.style.display = 'block';
                loadChiyuan();
                clearpicturesinfo();
                pictures.picture_info.style.display = 'none';
            }
            break;

        case 8: // Windows聚焦
            {
                // 静默加载: 同 case 4, 由 picturesinfo_showrl() 负责显示。
                const v8 = getMyVideo();
                if (v8) v8.src = '';
                backgroundLayers.container.style.display = 'block';
                loadWindowsSpotlight();
            }
            break;

        case 9: // Custom
            {
                // 静默加载: 同 case 4, 由 picturesinfo_showrl() 负责显示。
                const v9 = getMyVideo();
                if (v9) v9.src = '';
                backgroundLayers.container.style.display = 'block';
                const customImg = new Image();
                customImg.src = store.pictures_url ?? '';

                customImg.onload = function () {
                    onImageLoad(customImg.src);
                };
                customImg.onerror = function () {
                    onImageError('Custom', customImg.src);
                };
                clearpicturesinfo();
                pictures.picture_info.style.display = 'none';
            }
            break;

        default:
            backgroundLayers.container.style.display = 'block';
            pictures.picture_info.style.display = 'none';
    }
}

export { clearpicturesinfo, picturesinfo_showrl };
