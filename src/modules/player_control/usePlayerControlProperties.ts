/**
 * usePlayerControlProperties 鈥?Vue 3 composable wrapper for player control
 * properties (show, color, position, size, thumbnail, animation).
 *
 * Stage 3-3 (Phase 7 鎵规 3-3): wrap src/propertyHandlers/playerControlPropertyHandler.ts
 * as a composable. Module-level state (player_control_show / thumbnail_size_value)
 * preserved as local closure variables since they reflect "current state of
 * the player control DOM" and are not surfaced to consumers.
 */
import { pc_aubar, playertitle, thumbnailsue } from '@/modules/player_control';
import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';
import { WallpaperProperties } from '@/types/types';
import { registerDeferred } from '@/utils/deferredScheduler';
import { elements } from '@/utils/elementManager';
import { logInitComplete } from '@/utils/helpers';

/**
 * 妯″潡椤跺眰 DOM 寮曠敤缂撳瓨銆?
 *
 * Phase 8+ 鎶?widget 娓叉煋浜ょ粰 Vue锛屽洜姝?#player_control 鍦?module-load
 * 鏃惰繕涓嶅瓨鍦紙querySelector 杩斿洖 null锛夈€備絾 usePlayerControlProperties 涓?
 * 鏈?30+ 澶?`player_control.style.xxx = ...` 杩欑鐩存帴灞炴€ц祴鍊煎啓娉曪紝
 * 鏃犳硶鍦ㄤ笉鐮村潖璋冪敤鐐圭殑鎯呭喌涓嬫妸 `const player_control` 鏀规垚鍑芥暟 getter銆?
 *
 * 瑙ｅ喅鏂规锛氭妸 const 鏀规垚 let锛?*鍒濆涓?null**锛屽苟鍦?main.ts 鐨?
 * `app.mount(root)` 涔嬪悗璋冪敤 `refreshPlayerControlRefs()` 閲嶆柊鏌ヨ DOM銆?
 * 璋冪敤鐐逛繚鎸佸師鏍凤紙`player_control.style.xxx`锛夛紝绫诲瀷鏂█涓洪潪 null 璁?
 * TypeScript 涓嶆姤閿欙紝杩愯鏃剁敱 `app.mount` 涔嬪悗鐨?refresh 淇濊瘉寮曠敤鏈夋晥銆?
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
 * 鍦?Vue mount 瀹屾垚鍚庯紙#player_control 瀹瑰櫒宸插瓨鍦級璋冪敤锛岄噸鏂版煡璇?
 * DOM 骞跺埛鏂版ā鍧楅《灞?let 寮曠敤锛岀劧鍚庨噸鏀炬墍鏈夊緟澶勭悊鐨勬牱寮忋€?
 */
export function refreshPlayerControlRefs(): void {
    player_control = elements.playerControl.container;
    player_control_thumbnail = elements.playerControl.thumbnail;
    player_control_thumbnailWrap = elements.playerControl.thumbnailWrap;
    player_control_background = elements.playerControl.background;
    player_control_info = elements.playerControl.info;
    player_control_artist = elements.playerControl.artist;
    player_control_albumTitle = elements.playerControl.albumTitle;

    // 閲嶆斁涔嬪墠鍥犲厓绱犱笉瀛樺湪鑰屾湭鐢熸晥鐨勬牱寮?
    applyPendingPlayerStyles();

    // 閲嶆斁鍏堜簬 Vue mount 鍒拌揪鐨勫獟浣撲簨浠?display:flex
    applyPendingMediaDisplay();
}

/** 寰呴噸鏀剧殑 player 鍐呰仈鏍峰紡鍊硷紙鍦ㄥ厓绱犱笉瀛樺湪鏃舵殏瀛橈級 */
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
 * 鏃跺簭闂锛歐E 娉ㄥ叆灞炴€?鈫?usePlayerControlProperties 璁?display:none锛團irstLoad锛?
 * 鈫?WE 鎺ㄩ€佸獟浣撲簨浠?鈫?wallpaperMediaPropertiesListener 鎯宠 display:flex
 * 浣?#player_control 杩樹笉瀛樺湪锛圴ue 鏈?mount锛夆啋 涓㈠け銆?
 *
 * 鏇夸唬鏂规锛歮ediaPropertiesListener 鍦?player_control 涓?null 鏃舵妸瀹屾暣浜嬩欢
 * 鏆傚瓨鍒?pendingMediaEvent锛屾湰鍑芥暟鍦?refresh 鏃剁洿鎺ラ噸鏀俱€?
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

    if (properties.player_control_scalefactor) {
        const v = properties.player_control_scalefactor.value;
        patch.player_control_scalefactor = v;
        config.player_control_scalefactor = v; // sync
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
        elements.body.style.setProperty(
            '--player-blur-enabled',
            properties.player_control_blurcolor_show.value ? '1' : '0'
        );
    }

    if (properties.player_control_blurcolor) {
        const blurcolor = properties.player_control_blurcolor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        const v = blurcolor as [number, number, number];
        patch.player_control_blurcolor = v;
        config.player_control_blurcolor = v; // sync
        elements.body.style.setProperty('--player-blur-color', blurcolor.join(', '));
    }

    if (properties.player_control_yakeli_show) {
        const v = properties.player_control_yakeli_show.value;
        patch.player_control_yakeli_show = v;
        config.player_control_yakeli_show = v; // sync
        elements.body.style.setProperty(
            '--player-yakeli-enabled',
            properties.player_control_yakeli_show.value ? '1' : '0'
        );
    }

    if (properties.player_control_yakelicolor) {
        const yakeliccolor = properties.player_control_yakelicolor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        const v = yakeliccolor as [number, number, number];
        patch.player_control_yakelic_color = v;
        config.player_control_yakelic_color = v; // sync
        elements.body.style.setProperty('--player-yakeli-color', yakeliccolor.join(', '));
    }

    if (properties.player_control_yakeli) {
        const yakeli = properties.player_control_yakeli.value / 100;
        patch.player_control_yakeli = yakeli;
        config.player_control_yakeli = yakeli; // sync
        elements.body.style.setProperty('--player-yakeli', String(yakeli));
    }

    if (properties.player_control_bluryakeli) {
        const v = properties.player_control_bluryakeli.value;
        patch.player_control_bluryakeli = v;
        config.player_control_bluryakeli = v; // sync
        elements.body.style.setProperty(
            '--player-blur-yakeli',
            `${properties.player_control_bluryakeli.value}px`
        );
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

        // 瀹瑰櫒鐢?PlayerControl.vue 鍦?Vue mount 涔嬪悗鍒涘缓锛宱bserver 蹇呴』寤跺悗鎸傝浇銆?
        // closure 鍐呴€氳繃 refresh 鍚庣殑 let 寮曠敤鎷挎渶鏂拌妭鐐广€?
        registerDeferred('playerControl:roundedcorners-observer', () => {
            // 妯″潡椤跺眰 let 寮曠敤鍦?main.ts 鐨?app.mount 涔嬪悗鐢?
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
                player_control_thumbnail.style.animation = `spin ${store.player_control_thumbnail_rotation_speed ?? 10}s linear infinite`;
                player_control_thumbnailWrap.classList.add('circular');
            }
        }
    }

    if (properties.player_control_thumbnail_rotation_speed) {
        const v = 10 - properties.player_control_thumbnail_rotation_speed.value;
        patch.player_control_thumbnail_rotation_speed = v;
        config.player_control_thumbnail_rotation_speed = v; // sync
        if (player_control_thumbnail?.style.animation) {
            player_control_thumbnail.style.animationDuration =
                String(store.player_control_thumbnail_rotation_speed ?? 10) + 's';
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
                // 鏄惧紡 class 鏍囪缂╃暐鍥惧湪鍙充晶锛岃 CSS 鏍规嵁 class 鍐冲畾锛?
                //   1. flex-direction锛氱缉鐣ュ浘鍥哄畾鍦?DOM 椤哄簭鏈綅锛坮ow-reverse 浠呭垏鎹?paint 椤哄簭锛?
                //   2. 鍥炬爣 margin 鏂瑰悜锛氭爣棰樻枃瀛楀湪 icon 宸︿晶 鈫?margin-left
                //   3. info 鏂囧瓧瀵归綈锛歠lex-end 璁╂枃瀛楄创鍚戠缉鐣ュ浘渚?
                // 涓嶅啀鐢ㄦā绯婄殑 .rtl 瑙﹀彂 row-reverse 鍚庤繕瑕侀厤鍚?inline className 浜掓崲銆?
                player_control.classList.add('thumbnail-on-right');
                player_control.classList.remove('thumbnail-on-left');
                const rawpadding = window.getComputedStyle(player_control_background).paddingRight;
                player_control_background.style.paddingRight = '';
                player_control_background.style.paddingLeft = rawpadding;
                player_control_info.style.alignItems = 'flex-end';
            }, 2500);
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

    if (properties.player_control_hdong) {
        const v = properties.player_control_hdong.value / 500;
        patch.player_control_hdong = v;
        config.player_control_hdong = v; // sync
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[PlayerControl]', '播放器', FirstLoad);
    }
}
