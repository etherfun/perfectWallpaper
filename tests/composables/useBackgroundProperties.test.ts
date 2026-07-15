// @vitest-environment jsdom
/**
 * Tests for src/composables/useBackgroundProperties.ts — Stage 3-3
 *
 * Covers the most-touched branches: picture-info (Y/X/size/color/blur/yakeli),
 * background style (bgx/bgy/bgs), audio/video volume, transitionMode,
 * chiyuanapi url rotation. Side-effects in @/slide / @/modules/core/video are stubbed.
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

const { mockSlide, mockVideo, mockTimerManager } = vi.hoisted(() => {
    const mockSlide = {
        changeBackground: vi.fn(),
        shouldShow: vi.fn(),
        TransitionSwith: vi.fn(),
        applyBackgroundStyle: vi.fn(),
        picture_info: document.createElement('div'),
    };
    const mockVideo = {
        ChangeAudioModel: vi.fn(),
        ChangeVideoModel: vi.fn(),
        updateMusicPlaylist: vi.fn(),
    };
    const mockTimerManager = {
        remove: vi.fn(),
    };
    return { mockSlide, mockVideo, mockTimerManager };
});

vi.mock('@/utils/elementManager', () => ({
    elements: {
        body: document.body,
        myvideo: { volume: 0 },
        myAudio: { volume: 0 },
        slide: { picture_info: document.createElement('div') },
    },
}));

vi.mock('@/modules/slide', () => mockSlide);

vi.mock('@/modules/core/video', () => mockVideo);

vi.mock('@/utils/timer', () => ({
    timerManager: mockTimerManager,
}));

import { useBackgroundProperties } from '@/modules/slide/useBackgroundProperties';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    Object.values(mockSlide).forEach(fn => {
        if (typeof fn === 'function') fn.mockClear();
    });
    Object.values(mockVideo).forEach(fn => fn.mockClear());
    mockTimerManager.remove.mockClear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('useBackgroundProperties', () => {
    test('image → custom + shouldShow on non-FirstLoad', () => {
        const store = useConfigStore();
        useBackgroundProperties({ image: { value: 'wallpaper.png' } } as never, false);
        expect(store.custom).toBe('wallpaper.png');
        expect(mockSlide.shouldShow).toHaveBeenCalledTimes(1);
    });

    test('image → shouldShow skipped on FirstLoad', () => {
        useBackgroundProperties({ image: { value: 'wallpaper.png' } } as never, true);
        expect(mockSlide.shouldShow).not.toHaveBeenCalled();
    });

    test('chiyuanapi 1/2/3/4/5 → 5 distinct URLs', () => {
        const store = useConfigStore();
        useBackgroundProperties({ chiyuanapi: { value: 1 } } as never, false);
        expect(store.chiyuanapi).toBe('https://t.alcy.cc/ycy/?json');
        useBackgroundProperties({ chiyuanapi: { value: 2 } } as never, false);
        expect(store.chiyuanapi).toBe('https://t.alcy.cc/moez/?json');
        useBackgroundProperties({ chiyuanapi: { value: 3 } } as never, false);
        expect(store.chiyuanapi).toBe('https://t.alcy.cc/ai/?json');
        useBackgroundProperties({ chiyuanapi: { value: 4 } } as never, false);
        expect(store.chiyuanapi).toBe('https://t.alcy.cc/ysz/?json');
        useBackgroundProperties({ chiyuanapi: { value: 5 } } as never, false);
        expect(store.chiyuanapi).toBe('https://t.alcy.cc/fj/?json');
    });

    test('galaxyapi → store', () => {
        const store = useConfigStore();
        useBackgroundProperties({ galaxyapi: { value: 'https://api.example.com/' } } as never, false);
        expect(store.galaxy_api).toBe('https://api.example.com/');
    });

    test('customdirectory → changeBackground + timerManager.remove', () => {
        useBackgroundProperties({ customdirectory: { value: '/pics' } } as never, false);
        expect(mockTimerManager.remove).toHaveBeenCalledWith('backgroundChange');
        expect(mockSlide.changeBackground).toHaveBeenCalledTimes(1);
    });

    test('wallpapermode → setTimeout(5000) on FirstLoad', () => {
        vi.useFakeTimers();
        useBackgroundProperties({ wallpapermode: { value: 1 } } as never, true);
        expect(mockSlide.changeBackground).not.toHaveBeenCalled();
        vi.advanceTimersByTime(5000);
        expect(mockSlide.changeBackground).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    test('wallpapermode → changeBackground immediately on non-FirstLoad', () => {
        useBackgroundProperties({ wallpapermode: { value: 1 } } as never, false);
        expect(mockSlide.changeBackground).toHaveBeenCalledTimes(1);
    });

    test('TransitionMode + choose_0/1/4 → store + TransitionSwith', () => {
        const store = useConfigStore();
        useBackgroundProperties(
            {
                TransitionMode: { value: 2 },
                TransitionMode_choose_0: { value: true },
                TransitionMode_choose_1: { value: false },
                TransitionMode_choose_4: { value: false },
            } as never,
            false
        );
        expect(store.transition_mode).toBe(2);
        expect(store.transition_mode_choose_0).toBe(true);
        expect(store.transition_mode_choose_1).toBe(false);
        expect(store.transition_mode_choose_4).toBe(false);
        expect(mockSlide.TransitionSwith).toHaveBeenCalledTimes(1);
    });

    test('selectvideo true → cusvideo_route + ChangeVideoModel (only when wallpaper_mode=3)', () => {
        const store = useConfigStore();
        store.wallpaper_mode = 3;
        useBackgroundProperties({ selectvideo: { value: 'movie.mp4' } } as never, false);
        expect(store.select_video).toBe('movie.mp4');
        expect(store.cusvideo_route).toBe('file:///movie.mp4');
        expect(mockVideo.ChangeVideoModel).toHaveBeenCalledTimes(1);
    });

    test('selectvideo false → cusvideo_route cleared', () => {
        const store = useConfigStore();
        useBackgroundProperties({ selectvideo: { value: '' } } as never, false);
        expect(store.cusvideo_route).toBe('');
    });

    test('VideoVolume /100 → myvideo.volume', () => {
        const store = useConfigStore();
        useBackgroundProperties({ VideoVolume: { value: 75 } } as never, false);
        expect(store.video_volume).toBeCloseTo(0.75);
    });

    test('selectmusic + cusaudio_route + ChangeAudioModel', () => {
        const store = useConfigStore();
        useBackgroundProperties({ selectmusic: { value: 'track.mp3' } } as never, false);
        expect(store.selectmusic).toBe('track.mp3');
        expect(store.cusaudio_route).toBe('file:///track.mp3');
        expect(mockVideo.ChangeAudioModel).toHaveBeenCalledTimes(1);
    });

    test('musicdirectory + server_mode → musicdirectory + updateMusicPlaylist', () => {
        const store = useConfigStore();
        store.server_mode = true;
        useBackgroundProperties({ musicdirectory: { value: '/music' } } as never, false);
        expect(store.musicdirectory).toBe('/music');
        expect(mockVideo.updateMusicPlaylist).toHaveBeenCalledTimes(1);
    });

    test('MuiscVolume /100 → music_volume', () => {
        const store = useConfigStore();
        useBackgroundProperties({ MuiscVolume: { value: 80 } } as never, false);
        expect(store.music_volume).toBeCloseTo(0.8);
    });

    test('random passthrough', () => {
        const store = useConfigStore();
        useBackgroundProperties({ random: { value: 1 } } as never, false);
        expect(store.random).toBe(1);
    });

    test('imageswitchtimes → speed + changeBackground', () => {
        const store = useConfigStore();
        useBackgroundProperties({ imageswitchtimes: { value: 30 } } as never, false);
        expect(store.speed).toBe(30);
        expect(mockSlide.changeBackground).toHaveBeenCalledTimes(1);
    });

    test('imageswitchtimeinput when speed==custom → changeBackground', () => {
        const store = useConfigStore();
        store.speed = 'custom';
        useBackgroundProperties({ imageswitchtimeinput: { value: 5 } } as never, false);
        expect(store.switch_interval_input).toBe(5);
        expect(mockSlide.changeBackground).toHaveBeenCalledTimes(1);
    });

    test('bgy/bgx/bgs + applyBackgroundStyle', () => {
        const store = useConfigStore();
        useBackgroundProperties(
            {
                bgy: { value: 60 },
                bgx: { value: 40 },
                bgs: { value: 75 },
            } as never,
            false
        );
        expect(store.bgy).toBe('20%'); // (60-50)*2
        expect(store.bgx).toBe('-20%'); // (40-50)*2
        expect(store.bgs).toBe('75%');
        expect(mockSlide.applyBackgroundStyle).toHaveBeenCalled();
    });

    test('imagedisplaystlye → bg_style + applyBackgroundStyle', () => {
        const store = useConfigStore();
        useBackgroundProperties({ imagedisplaystlye: { value: 2 } } as never, false);
        expect(store.bg_style).toBe(2);
        expect(mockSlide.applyBackgroundStyle).toHaveBeenCalled();
    });

    test('picturesinfo Y/X/size + CSS variables', () => {
        const store = useConfigStore();
        useBackgroundProperties(
            {
                picturesinfoY: { value: 30 },
                picturesinfoX: { value: 70 },
                picturesinfo_size: { value: 80 },
            } as never,
            false
        );
        expect(store.pictures_info_y).toBe(30);
        expect(store.pictures_info_x).toBe(70);
        expect(store.pictures_info_size).toBe(80);
        expect(document.body.style.getPropertyValue('--picture-info-top')).toBe('30%');
        expect(document.body.style.getPropertyValue('--picture-info-left')).toBe('70%');
    });

    test('picturesinfo_show true (non-FirstLoad) → CSS display:flex', () => {
        useBackgroundProperties({ picturesinfo_show: { value: true } } as never, false);
        expect(document.body.style.getPropertyValue('--picture-info-display')).toBe('flex');
    });

    test('picturesinfo_color "1 0 0" → [255,0,0] + CSS', () => {
        const store = useConfigStore();
        useBackgroundProperties({ picturesinfo_color: { value: '1 0 0' } } as never, false);
        expect(store.pictures_info_color).toEqual([255, 0, 0]);
        expect(document.body.style.getPropertyValue('--picture-info-color')).toBe('255, 0, 0');
    });

    test('picturesinfo_blurcolor_show / yakeli_show → CSS toggle', () => {
        useBackgroundProperties({ picturesinfo_blurcolor_show: { value: true } } as never, false);
        expect(document.body.style.getPropertyValue('--picture-info-blur-enabled')).toBe('1');
        useBackgroundProperties({ picturesinfo_yakeli_show: { value: false } } as never, false);
        expect(document.body.style.getPropertyValue('--picture-info-yakeli-enabled')).toBe('0');
    });

    test('picturesinfo_yakeli /100 + bluryakeli px → CSS', () => {
        useBackgroundProperties(
            {
                picturesinfo_yakeli: { value: 50 },
                picturesinfo_bluryakeli: { value: 12 },
            } as never,
            false
        );
        expect(document.body.style.getPropertyValue('--picture-info-yakeli')).toBe('0.5');
        expect(document.body.style.getPropertyValue('--picture-info-blur-yakeli')).toBe('12px');
    });

    test('picturesinfo_showaway true → translate(-100%, 0)', () => {
        useBackgroundProperties({ picturesinfo_showaway: { value: true } } as never, false);
        expect(document.body.style.getPropertyValue('--picture-info-transform')).toBe(
            'translate(-100%, 0)'
        );
    });

    test('picturesinfo_showRorL true → text-align:right', () => {
        useBackgroundProperties({ picturesinfo_showRorL: { value: true } } as never, false);
        expect(document.body.style.getPropertyValue('--picture-info-text-align')).toBe('right');
    });

    test('picturesinfo_showwidth 0 → auto, else width %', () => {
        useBackgroundProperties({ picturesinfo_showwidth: { value: 0 } } as never, false);
        expect(document.body.style.getPropertyValue('--picture-info-show-width')).toBe('auto');
    });

    test('picturesinfo_description true → display:block', () => {
        useBackgroundProperties({ picturesinfo_description: { value: true } } as never, false);
        expect(
            document.body.style.getPropertyValue('--picture-info-description-display')
        ).toBe('block');
    });

    test('FirstLoad → bg_init_complete set + log', () => {
        const store = useConfigStore();
        useBackgroundProperties({} as never, true);
        expect(store.bg_init_complete).toBe(true);
        const matched = debugLogger.logs.find(
            l => l.message === '[Background] 壁纸参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});