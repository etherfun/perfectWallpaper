/**
 * usePlayerControlProperties 鈥?Vue 3 composable wrapper for player control
 * properties (show, color, position, size, thumbnail, animation).
 *
 * Stage 3-3 (Phase 7 批次 3-3): wrap src/propertyHandlers/playerControlPropertyHandler.ts
 * as a composable. Module-level state (player_control_show / thumbnail_size_value)
 * preserved as local closure variables since they reflect "current state of
 * the player control DOM" and are not surfaced to consumers.
 */
import { pc_aubar, playertitle, thumbnailsue } from '@/modules/player_control';
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { applyGlass } from '@/tokens/glass.tokens';
import { WallpaperProperties } from '@/types/types';
import { registerDeferred } from '@/utils/deferredScheduler';
import { elements } from '@/utils/elementManager';
import { logInitComplete } from '@/utils/helpers';

import {
    DEFAULT_THUMBNAIL_ROTATION_SEC,
    THUMBNAIL_RTL_SWAP_DELAY_MS,
} from './constants';

/**
 * 模块顶层 DOM 引用缓存。
 *
 * Phase 8+ 把 widget 渲染交给 Vue，因此 #player_control 在 module-load
 * 时还不存在（querySelector 返回 null）。但 usePlayerControlProperties 中
 * 有 30+ 处 `player_control.style.xxx = ...` 这种直接属性赋值写法，
 * 无法在不破坏调用点的情况下把 `const player_control` 改成函数 getter。
 *
 * 解决方案：把 const 改成 let，**初始化为 null**，并在 main.ts 的
 * `app.mount(root)` 之后调用 `refreshPlayerControlRefs()` 重新查询 DOM。
 * 调用点保持原样（`player_control.style.xxx`），类型断言为非 null 记号
 * TypeScript 不报错，运行时由 `app.mount` 之后的 refresh 保证引用有效。
 */
export let player_control: HTMLElement = null as unknown as HTMLElement;
export let player_control_thumbnail: HTMLImageElement =
    null as unknown as HTMLImageElement;
export let player_control_thumbnailWrap: HTMLElement =
    null as unknown as HTMLElement;
export let player_control_background: HTMLElement = null as unknown as HTMLElement;
export let player_control_info: HTMLElement = null as unknown as HTMLElement;
export let player_control_artist: HTMLElement = null as unknown as HTMLElement;
export let player_control_albumTitle: HTMLElement = null as unknown as HTMLElement;

/**
 * 在 Vue mount 完成后（#player_control 容器已存在）调用，重新查询
 * DOM 并刷新模块顶层 let 引用，然后重放所有待处理的样式。
 */
export function refreshPlayerControlRefs(): void {
    player_control = elements.playerControl.container;
    player_control_thumbnail = elements.playerControl.thumbnail;
    player_control_thumbnailWrap = elements.playerControl.thumbnailWrap;
    player_control_background = elements.playerControl.background;
    player_control_info = elements.playerControl.info;
    player_control_artist = elements.playerControl.artist;
    player_control_albumTitle = elements.playerControl.albumTitle;

   // 重放之前因元素不存在而未生效的样式
    applyPendingPlayerStyles();

    // 閲嶆斁鍏堜簬 Vue mount 鍒拌揪鐨勫獟浣撲簨浠?display:flex
    applyPendingMediaDisplay();
}

/** 待重放的 player 内联样式值（在元素不存在时暂存） */
let pendingVisibility: string | null = null;
let pendingDisplay: string | null = null;
let pendingTop: string | null = null;
let pendingLeft: string | null = null;
let pendingFontSize: string | null = null;
let pendingLineHeight: string | null = null;
let pendingArtistLineHeight: string | null = null;
let pendingAlbumLineHeight: string | null = null;
let pendingOpacity: string | null = null;

function applyPendingPlayerStyles(): void {
    if (!player_control) return;
    if (pendingVisibility !== null) player_control.style.visibility = pendingVisibility;
    if (pendingDisplay !== null) player_control.style.display = pendingDisplay;
    if (pendingTop !== null) player_control.style.top = pendingTop;
    if (pendingLeft !== null) player_control.style.left = pendingLeft;
    if (pendingFontSize !== null) player_control.style.fontSize = pendingFontSize;
    if (pendingLineHeight !== null) player_control.style.lineHeight = pendingLineHeight;
    if (pendingArtistLineHeight !== null && player_control_artist)
        player_control_artist.style.lineHeight = pendingArtistLineHeight;
    if (pendingAlbumLineHeight !== null && player_control_albumTitle)
        player_control_albumTitle.style.lineHeight = pendingAlbumLineHeight;
    if (pendingOpacity !== null) player_control.style.opacity = pendingOpacity;
}

/**
 * 閲嶆斁濯掍綋闆嗘垚鍙兘閿欒繃鐨?display:flex銆?
 *
 * 时序问题：WE 注入属性 → usePlayerControlProperties 设 display:none，FirstLoad
 * 鈫?WE 鎺ㄩ€佸獟浣撲簨浠?鈫?wallpaperMediaPropertiesListener 鎯宠 display:flex
 * 故 #player_control 还不存在（Vue 未 mount）→ 丢失。
 *
 * 替代方案：mediaPropertiesListener 在 player_control 为 null 时把完整事件
 * 暂存到 pendingMediaEvent，本函数在 refresh 时直接重放。
 */
import { clearPendingMediaEvent,pendingMediaEvent } from '@/modules/player_control/domRefs';

function applyPendingMediaDisplay(): void {
    if (!player_control) return;
    const evt = pendingMediaEvent();
    if (!evt) return;
    clearPendingMediaEvent();

    const config = useConfigStore();
    // 检查 player_control_show —— 用旧 config 单例（同步写入立即可见）
    if (config.player_control_show) {
        player_control.style.display = 'flex';
        playertitle(Boolean(config.player_control_visualaudiobar));
    }
    // player_control_show 为 false 时暂不显示，等后续属性推送或用户开启时再处理
}

let player_control_show = false;
let player_control_thumbnail_size_value = 100;

export function usePlayerControlProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const runtimeStore = useRuntimeStore();
    const config = store;
    const patch: Record<string, unknown> = {};

    /**
     * 获取有效的 player_control_size_value：
     * 优先用本次 patch 中的（同一批 WE 属性中可能已更新 player_control_size），
     * 回落到 store 当前值（默认或上次运行时保存的）。
     * 原始 main 分支用 config 同步赋值可立即读到，patch 是延迟批量的，必须用本函数。
     */
    function getSizeValue(): number {
        return (patch.player_control_size_value as number | undefined) ?? store.player_control_size_value ?? 100;
    }

    if (properties.player_control_show) {
        const v = properties.player_control_show.value;
        patch.player_control_show = v;
        config.player_control_show = v; // sync
        player_control_show = properties.player_control_show.value;
        // visibility/display 是内联样式，必须在元素存在时设置
        // 修复：当开启 player_control_show 但没有歌曲信息时，不设置 display: flex。
        // 后续 mediaPropertiesListener 收到歌曲后会触发显示。
        const hasTitle = !!runtimeStore.playerInfo.singtitle;
        const wantShow = player_control_show && hasTitle;
        const setVis = (show: boolean, firstLoad: boolean): void => {
            if (player_control) {
                player_control.style.visibility = show ? 'visible' : 'hidden';
                player_control.style.display = firstLoad ? 'none' : wantShow ? 'flex' : 'none';
                if (wantShow && !firstLoad) thumbnailsue();
            } else {
                pendingVisibility = show ? 'visible' : 'hidden';
                pendingDisplay = firstLoad ? 'none' : wantShow ? 'flex' : 'none';
            }
        };
        setVis(player_control_show, FirstLoad);
    }

    if (properties.playery) {
        patch.playery = properties.playery.value;
        const topVal = properties.playery.value + '%';
        if (player_control) {
            player_control.style.top = topVal;
        } else {
            pendingTop = topVal;
        }
    }

    if (properties.playerx) {
        patch.playerx = properties.playerx.value;
        const leftVal = properties.playerx.value + '%';
        if (player_control) {
            player_control.style.left = leftVal;
        } else {
            pendingLeft = leftVal;
        }
    }

    if (properties.player_control_color) {
        const color = properties.player_control_color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        const v = color as [number, number, number];
        patch.player_control_color = v;
        config.player_control_color = v; // sync
        elements.body.style.setProperty('--player-color', color.join(', '));
    }

    if (properties.player_control_blurcolor_show) {
        const v = properties.player_control_blurcolor_show.value;
        patch.player_control_blurcolor_show = v;
        config.player_control_blurcolor_show = v; // sync
        applyGlass('player', { blurEnabled: v });
    }

    if (properties.player_control_blurcolor) {
        const blurcolor = properties.player_control_blurcolor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        const v = blurcolor as [number, number, number];
        patch.player_control_blurcolor = v;
        config.player_control_blurcolor = v; // sync
        applyGlass('player', { blurColor: v });
    }

    if (properties.player_control_yakeli_show) {
        const v = properties.player_control_yakeli_show.value;
        patch.player_control_yakeli_show = v;
        config.player_control_yakeli_show = v; // sync
        applyGlass('player', { yakeliEnabled: v });
    }

    if (properties.player_control_yakelicolor) {
        const yakeliccolor = properties.player_control_yakelicolor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        const v = yakeliccolor as [number, number, number];
        patch.player_control_yakelic_color = v;
        config.player_control_yakelic_color = v; // sync
        applyGlass('player', { yakeliColor: v });
    }

    if (properties.player_control_yakeli) {
        const yakeli = properties.player_control_yakeli.value / 100;
        patch.player_control_yakeli = yakeli;
        config.player_control_yakeli = yakeli; // sync
        applyGlass('player', { yakeli });
    }

    if (properties.player_control_bluryakeli) {
        const v = properties.player_control_bluryakeli.value;
        patch.player_control_bluryakeli = v;
        config.player_control_bluryakeli = v; // sync
        applyGlass('player', { blurYakeli: `${v}px` });
    }

    if (properties.player_control_size) {
        const s = properties.player_control_size.value;
        patch.player_control_size_value = Math.floor((window.innerHeight / 150) * s);
        const fontSize = Math.floor((window.innerHeight / 300) * s) + 'px';
        const lineHeight = Math.floor((window.innerHeight / 700) * s) + 'px';
        const subLineHeight = Math.floor((window.innerHeight / 1000) * s) + 'px';
        if (player_control) {
            player_control.style.fontSize = fontSize;
            player_control.style.lineHeight = lineHeight;
        } else {
            pendingFontSize = fontSize;
            pendingLineHeight = lineHeight;
        }
        if (player_control_artist) {
            player_control_artist.style.lineHeight = subLineHeight;
        } else {
            pendingArtistLineHeight = subLineHeight;
        }
        if (player_control_albumTitle) {
            player_control_albumTitle.style.lineHeight = subLineHeight;
        } else {
            pendingAlbumLineHeight = subLineHeight;
        }
    }

    if (properties.player_control_thumbnail_size !== undefined) {
        const thumbEnabled = properties.player_control_thumbnail_size.value;
        patch.player_control_thumbnail_size = thumbEnabled;
        config.player_control_thumbnail_size = thumbEnabled; // sync
        const sizeVal = getSizeValue();
        elements.body.style.setProperty('--player-thumb-size', sizeVal + 'px');
        if (thumbEnabled) {
            if (player_control_thumbnailWrap) player_control_thumbnailWrap.classList.add('flex-center');
            if (FirstLoad === false) {
                const ss = sizeVal * (player_control_thumbnail_size_value / 100);
                elements.body.style.setProperty('--player-thumb-inner-size', ss + 'px');
            }
        } else {
            if (player_control_thumbnailWrap) player_control_thumbnailWrap.classList.remove('flex-center');
            elements.body.style.setProperty('--player-thumb-inner-size', '100%');
        }
    }

    if (properties.player_control_thumbnail_size_value) {
        const s = getSizeValue();
        patch.player_control_thumbnail_size_value =
            properties.player_control_thumbnail_size_value.value;
        const ss = s * (properties.player_control_thumbnail_size_value.value / 100);
        elements.body.style.setProperty('--player-thumb-size', s + 'px');
        elements.body.style.setProperty('--player-thumb-inner-size', ss + 'px');
    }

    if (properties.player_control_roundedcorners) {
        patch.player_control_roundedcorners = properties.player_control_roundedcorners.value;
        const rounded = properties.player_control_roundedcorners.value;

       // 容器由 PlayerControl.vue 在 Vue mount 之后创建，observer 必须延迟挂载。
       // closure 内通过 refresh 后的 let 引用拿最新节点。
        registerDeferred('playerControl:roundedcorners-observer', () => {
           // 模块顶层 let 引用在 main.ts 的 app.mount 之后由
            // refreshPlayerControlRefs() 閲嶆柊鎸囧悜鐪熷疄鑺傜偣銆?
            const container = player_control;
            const thumbnail = player_control_thumbnail;
            const background = player_control_background;
            const thumbnailWrap = player_control_thumbnailWrap;
            if (!container || !thumbnail || !background || !thumbnailWrap) return;

            const updateCorners = () => {
                const height = parseFloat(getComputedStyle(thumbnail).height);
                if (!height) return;

                const radius = (height / 2) * (rounded / 100);
                const padding = (height / 2) * (rounded / 200);

                container.style.borderRadius = radius + 'px';
                background.style.paddingRight = padding + 'px';

                if (!store.player_control_thumbnail_rotation) {
                    // 璁剧疆鍒?body 涓婏紝纭繚鎵€鏈夊瓙鍏冪礌閮借兘缁ф壙
                    elements.body.style.setProperty('--player-thumb-radius', radius + 'px');
                    thumbnailWrap.classList.remove('circular');
                }
            };

            updateCorners();
            const observer = new ResizeObserver(() => {
                if (!store.player_control_thumbnail_rotation) updateCorners();
            });
            observer.observe(thumbnail);
            return () => observer.disconnect();
        });
    }

    if (properties.player_control_thumbnail_rotation) {
        const v = properties.player_control_thumbnail_rotation.value;
        patch.player_control_thumbnail_rotation = v;
        config.player_control_thumbnail_rotation = v; // sync
        if (player_control_thumbnail && player_control_thumbnailWrap) {
            if (v === false) {
                player_control_thumbnail.style.animation = '';
                player_control_thumbnailWrap.classList.remove('circular');
            } else {
                player_control_thumbnail.style.animation = `spin ${store.player_control_thumbnail_rotation_speed ?? DEFAULT_THUMBNAIL_ROTATION_SEC}s linear infinite`;
                player_control_thumbnailWrap.classList.add('circular');
            }
        }
    }

    if (properties.player_control_thumbnail_rotation_speed) {
        const v = DEFAULT_THUMBNAIL_ROTATION_SEC - properties.player_control_thumbnail_rotation_speed.value;
        patch.player_control_thumbnail_rotation_speed = v;
        config.player_control_thumbnail_rotation_speed = v; // sync
        if (player_control_thumbnail?.style.animation) {
            player_control_thumbnail.style.animationDuration =
                String(store.player_control_thumbnail_rotation_speed ?? DEFAULT_THUMBNAIL_ROTATION_SEC) + 's';
        }
    }

    if (properties.player_control_timetransparency) {
        patch.player_control_timetransparency = properties.player_control_timetransparency.value;
        const opacityVal = String(properties.player_control_timetransparency.value / 100);
        if (player_control) {
            player_control.style.opacity = opacityVal;
        } else {
            pendingOpacity = opacityVal;
        }
    }

    if (properties.player_control_showwidth) {
        patch.player_control_showwidth = properties.player_control_showwidth.value;
        if (player_control_info) {
            if (properties.player_control_showwidth.value === 0) {
                player_control_info.style.width = '';
            } else {
                const s = properties.player_control_showwidth.value / 100;
                player_control_info.style.width = window.innerWidth * s + 'px';
            }
        }
    }

    if (properties.player_control_yakelibgusetb) {
        const v = properties.player_control_yakelibgusetb.value;
        patch.player_control_yakelibgusetb = v;
        config.player_control_yakelibgusetb = v; // sync
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_fontusetb) {
        const v = properties.player_control_fontusetb.value;
        patch.player_control_fontusetb = v;
        config.player_control_fontusetb = v; // sync
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_thumbnailrorl) {
        const v = properties.player_control_thumbnailrorl.value;
        patch.player_control_thumbnailrorl = v;
        config.player_control_thumbnailrorl = v; // sync
        if (v === true) {
            setTimeout(function () {
                // 显示 class 标记缩略图在右侧，让 CSS 根据 class 决定：
                //   1. flex-direction：缩略图固定在 DOM 顺序末尾（row-reverse 仅切换 paint 顺序）
                //   2. 图标 margin 方向：标题文字在 icon 左侧 → margin-left
                //   3. info 文字对齐：flex-end 让文字贴向缩略图侧
                // 不再用模糊的 .rtl 触发 row-reverse 后还要配合 inline className 互换。
                player_control.classList.add('thumbnail-on-right');
                player_control.classList.remove('thumbnail-on-left');
                const rawpadding = window.getComputedStyle(player_control_background).paddingRight;
                player_control_background.style.paddingRight = '';
                player_control_background.style.paddingLeft = rawpadding;
                player_control_info.style.alignItems = 'flex-end';
            }, THUMBNAIL_RTL_SWAP_DELAY_MS);
        } else {
            if (FirstLoad === false) {
                player_control.classList.add('thumbnail-on-left');
                player_control.classList.remove('thumbnail-on-right');
                const rawpadding = window.getComputedStyle(player_control_background).paddingLeft;
                player_control_background.style.paddingLeft = '';
                player_control_background.style.paddingRight = rawpadding;
                player_control_info.style.alignItems = 'flex-start';
            }
        }
        if (FirstLoad === false) {
            thumbnailsue();
            playertitle();
        }
    }

    if (properties.player_control_showaway) {
        if (properties.player_control_showaway.value === true) {
            player_control.classList.add('show-away');
        } else {
            player_control.classList.remove('show-away');
        }
    }

    if (properties.player_control_samealbumtitle) {
        const v = properties.player_control_samealbumtitle.value;
        patch.player_control_samealbum_title = v;
        config.player_control_samealbum_title = v; // sync
        if (FirstLoad === false) {
            playertitle();
        }
    }

    if (properties.player_control_visualaudiobar) {
        const v = properties.player_control_visualaudiobar.value;
        patch.player_control_visualaudiobar = v;
        config.player_control_visualaudiobar = v; // sync
        if (FirstLoad === false) {
            pc_aubar();
        }
    }

    if (properties.player_control_barline) {
        const v = properties.player_control_barline.value;
        patch.player_control_barline = v;
        config.player_control_barline = v; // sync
        if (FirstLoad === false) {
            pc_aubar();
        }
    }

    if (properties.player_control_getcolor) {
        const v = properties.player_control_getcolor.value;
        patch.color_pickup_method = v;
        config.color_pickup_method = v; // sync
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[PlayerControl]', '播放器', FirstLoad);
    }
}
