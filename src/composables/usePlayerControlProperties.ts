/**
 * usePlayerControlProperties — Vue 3 composable wrapper for player control
 * properties (show, color, position, size, thumbnail, animation).
 *
 * Stage 3-3 (Phase 7 批次 3-3): wrap src/propertyHandlers/playerControlPropertyHandler.ts
 * as a composable. Module-level state (player_control_show / thumbnail_size_value)
 * preserved as local closure variables since they reflect "current state of
 * the player control DOM" and are not surfaced to consumers.
 */
import { useConfigStore } from '@/stores/config';
import { elements } from '@/utils/elementManager';

import { logInitComplete } from '@/propertyHandlers/_helpers';
import { WallpaperProperties } from '@/propertyHandlers/types';
import { pc_aubar, playertitle, thumbnailsue } from '@/player_control';

const player_control = elements.playerControl.container;
const player_control_thumbnail = elements.playerControl.thumbnail;
const player_control_thumbnailWrap = elements.playerControl.thumbnailWrap;
const player_control_background = elements.playerControl.background;
const player_control_info = elements.playerControl.info;
const player_control_artist = elements.playerControl.artist;
const player_control_albumTitle = elements.playerControl.albumTitle;

let player_control_show = false;
let player_control_thumbnail_size_value = 100;

export function usePlayerControlProperties(
    properties: WallpaperProperties,
    FirstLoad: boolean
): void {
    const store = useConfigStore();
    const patch: Record<string, unknown> = {};

    if (properties.player_control_show) {
        patch.player_control_show = properties.player_control_show.value;
        player_control_show = properties.player_control_show.value;
        if (FirstLoad === false) {
            player_control.style.visibility = player_control_show ? 'visible' : 'hidden';
            player_control.style.display = player_control_show ? 'flex' : 'none';
            if (player_control_show) {
                thumbnailsue();
            }
        } else {
            player_control.style.visibility = player_control_show ? 'visible' : 'hidden';
            player_control.style.display = 'none';
        }
    }

    if (properties.player_control_scalefactor) {
        patch.player_control_scalefactor = properties.player_control_scalefactor.value;
    }

    if (properties.playery) {
        patch.playery = properties.playery.value;
        player_control.style.top = properties.playery.value + '%';
    }

    if (properties.playerx) {
        patch.playerx = properties.playerx.value;
        player_control.style.left = properties.playerx.value + '%';
    }

    if (properties.player_control_color) {
        const color = properties.player_control_color.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.player_control_color = color;
        elements.body.style.setProperty('--player-color', color.join(', '));
    }

    if (properties.player_control_blurcolor_show) {
        patch.player_control_blurcolor_show = properties.player_control_blurcolor_show.value;
        elements.body.style.setProperty(
            '--player-blur-enabled',
            properties.player_control_blurcolor_show.value ? '1' : '0'
        );
    }

    if (properties.player_control_blurcolor) {
        const blurcolor = properties.player_control_blurcolor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.player_control_blurcolor = blurcolor;
        elements.body.style.setProperty('--player-blur-color', blurcolor.join(', '));
    }

    if (properties.player_control_yakeli_show) {
        patch.player_control_yakeli_show = properties.player_control_yakeli_show.value;
        elements.body.style.setProperty(
            '--player-yakeli-enabled',
            properties.player_control_yakeli_show.value ? '1' : '0'
        );
    }

    if (properties.player_control_yakelicolor) {
        const yakeliccolor = properties.player_control_yakelicolor.value
            .split(' ')
            .map((c: string) => Math.ceil(parseFloat(c) * 255));
        patch.player_control_yakelic_color = yakeliccolor;
        elements.body.style.setProperty('--player-yakeli-color', yakeliccolor.join(', '));
    }

    if (properties.player_control_yakeli) {
        const yakeli = properties.player_control_yakeli.value / 100;
        patch.player_control_yakeli = yakeli;
        elements.body.style.setProperty('--player-yakeli', String(yakeli));
    }

    if (properties.player_control_bluryakeli) {
        patch.player_control_bluryakeli = properties.player_control_bluryakeli.value;
        elements.body.style.setProperty(
            '--player-blur-yakeli',
            `${properties.player_control_bluryakeli.value}px`
        );
    }

    if (properties.player_control_size) {
        const s = properties.player_control_size.value;
        patch.player_control_size_value = Math.floor((window.innerHeight / 150) * s);
        player_control.style.fontSize = Math.floor((window.innerHeight / 300) * s) + 'px';
        player_control.style.lineHeight = Math.floor((window.innerHeight / 700) * s) + 'px';
        player_control_artist.style.lineHeight = Math.floor((window.innerHeight / 1000) * s) + 'px';
        player_control_albumTitle.style.lineHeight =
            Math.floor((window.innerHeight / 1000) * s) + 'px';
    }

    if (properties.player_control_thumbnail_size !== undefined) {
        const thumbEnabled = properties.player_control_thumbnail_size.value;
        patch.player_control_thumbnail_size = thumbEnabled;
        if (thumbEnabled) {
            player_control_thumbnailWrap.classList.add('flex-center');
            player_control_thumbnailWrap.style.setProperty(
                '--player-thumb-size',
                (store.player_control_size_value ?? 0) + 'px'
            );
            if (FirstLoad === false) {
                const ss =
                    (store.player_control_size_value ?? 0) *
                    (player_control_thumbnail_size_value / 100);
                player_control_thumbnailWrap.style.setProperty(
                    '--player-thumb-inner-size',
                    ss + 'px'
                );
                player_control_thumbnail.style.setProperty('--player-thumb-inner-size', ss + 'px');
            }
        } else {
            player_control_thumbnailWrap.classList.remove('flex-center');
            player_control_thumbnailWrap.style.setProperty(
                '--player-thumb-size',
                (store.player_control_size_value ?? 0) + 'px'
            );
            player_control_thumbnailWrap.style.setProperty('--player-thumb-inner-size', '100%');
            player_control_thumbnail.style.setProperty('--player-thumb-inner-size', '100%');
        }
    }

    if (properties.player_control_thumbnail_size_value) {
        const s = store.player_control_size_value ?? 0;
        patch.player_control_thumbnail_size_value =
            properties.player_control_thumbnail_size_value.value;
        const ss = s * (properties.player_control_thumbnail_size_value.value / 100);
        if (store.player_control_thumbnail_size) {
            player_control_thumbnailWrap.style.setProperty('--player-thumb-size', s + 'px');
            player_control_thumbnailWrap.style.setProperty('--player-thumb-inner-size', ss + 'px');
            player_control_thumbnail.style.setProperty('--player-thumb-inner-size', ss + 'px');
        }
    }

    if (properties.player_control_roundedcorners) {
        patch.player_control_roundedcorners = properties.player_control_roundedcorners.value;
        const rounded = properties.player_control_roundedcorners.value;

        const updateCorners = () => {
            const height = parseFloat(getComputedStyle(player_control_thumbnail).height);
            if (!height) return;

            const radius = (height / 2) * (rounded / 100);
            const padding = (height / 2) * (rounded / 200);

            player_control.style.borderRadius = radius + 'px';
            player_control_background.style.paddingRight = padding + 'px';

            if (!store.player_control_thumbnail_rotation) {
                player_control_thumbnailWrap.style.setProperty(
                    '--player-thumb-radius',
                    radius + 'px'
                );
                player_control_thumbnailWrap.classList.remove('circular');
            }
        };

        updateCorners();

        const observer = new ResizeObserver(() => {
            if (!store.player_control_thumbnail_rotation) updateCorners();
        });
        observer.observe(player_control_thumbnail);
    }

    if (properties.player_control_thumbnail_rotation) {
        patch.player_control_thumbnail_rotation =
            properties.player_control_thumbnail_rotation.value;
        if (properties.player_control_thumbnail_rotation.value === false) {
            player_control_thumbnail.style.animation = '';
            player_control_thumbnailWrap.classList.remove('circular');
        } else {
            player_control_thumbnail.style.animation = `spin ${store.player_control_thumbnail_rotation_speed ?? 10}s linear infinite`;
            player_control_thumbnailWrap.classList.add('circular');
        }
    }

    if (properties.player_control_thumbnail_rotation_speed) {
        patch.player_control_thumbnail_rotation_speed =
            10 - properties.player_control_thumbnail_rotation_speed.value;
        if (player_control_thumbnail.style.animation) {
            player_control_thumbnail.style.animationDuration =
                String(store.player_control_thumbnail_rotation_speed ?? 10) + 's';
        }
    }

    if (properties.player_control_timetransparency) {
        patch.player_control_timetransparency = properties.player_control_timetransparency.value;
        player_control.style.opacity = String(
            properties.player_control_timetransparency.value / 100
        );
    }

    if (properties.player_control_showwidth) {
        patch.player_control_showwidth = properties.player_control_showwidth.value;
        if (properties.player_control_showwidth.value === 0) {
            player_control_info.style.width = '';
        } else {
            const s = properties.player_control_showwidth.value / 100;
            player_control_info.style.width = window.innerWidth * s + 'px';
        }
    }

    if (properties.player_control_yakelibgusetb) {
        patch.player_control_yakelibgusetb = properties.player_control_yakelibgusetb.value;
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_fontusetb) {
        patch.player_control_fontusetb = properties.player_control_fontusetb.value;
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_thumbnailrorl) {
        patch.player_control_thumbnailrorl = properties.player_control_thumbnailrorl.value;
        if (properties.player_control_thumbnailrorl.value === true) {
            setTimeout(function () {
                player_control_background.classList.add('rtl');
                const rawpadding = window.getComputedStyle(player_control_background).paddingRight;
                player_control_background.style.paddingRight = '';
                player_control_background.style.paddingLeft = rawpadding;
                player_control_info.style.alignItems = 'flex-end';
            }, 2500);
        } else {
            if (FirstLoad === false) {
                player_control_background.classList.remove('rtl');
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
        patch.player_control_samealbum_title = properties.player_control_samealbumtitle.value;
        if (FirstLoad === false) {
            playertitle();
        }
    }

    if (properties.player_control_visualaudiobar) {
        patch.player_control_visualaudiobar = properties.player_control_visualaudiobar.value;
        if (FirstLoad === false) {
            pc_aubar();
        }
    }

    if (properties.player_control_barline) {
        patch.player_control_barline = properties.player_control_barline.value;
        if (FirstLoad === false) {
            pc_aubar();
        }
    }

    if (properties.player_control_getcolor) {
        patch.color_pickup_method = properties.player_control_getcolor.value;
        if (FirstLoad === false) {
            thumbnailsue();
        }
    }

    if (properties.player_control_hdong) {
        patch.player_control_hdong = properties.player_control_hdong.value / 500;
    }

    if (Object.keys(patch).length > 0) {
        store.$patch(patch);
    }

    if (FirstLoad) {
        logInitComplete('[PlayerControl]', '播放器', FirstLoad);
    }
}