// @vitest-environment jsdom
/**
 * Tests for src/composables/usePlayerControlProperties.ts — Stage 3-3
 *
 * Covers the high-traffic branches: show/scale, color family,
 * size + thumbnail size / size_value, rotation, showwidth, opacity,
 * showaway / same-album-title / get-color passthroughs.
 */
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useConfigStore } from '@/stores/config';
import { debugLogger } from '@/utils/logger';

const { mockPlayerControl, mockElements } = vi.hoisted(() => {
    const makeEl = (): HTMLElement =>
        Object.assign(document.createElement('div'), {
            style: { cssText: '' } as CSSStyleDeclaration,
        }) as HTMLElement;
    const container = makeEl();
    const thumbnail = makeEl();
    const thumbnailWrap = makeEl();
    const background = makeEl();
    const info = makeEl();
    const artist = makeEl();
    const albumTitle = makeEl();

    const mockPlayerControl = {
        pc_aubar: vi.fn(),
        playertitle: vi.fn(),
        thumbnailsue: vi.fn(),
    };

    const mockElements = {
        body: document.body,
        playerControl: {
            container,
            thumbnail,
            thumbnailWrap,
            background,
            info,
            artist,
            albumTitle,
        },
    };

    return { mockPlayerControl, mockElements };
});

vi.mock('@/modules/player_control', () => mockPlayerControl);

vi.mock('@/utils/elementManager', () => ({ elements: mockElements }));

import { refreshPlayerControlRefs, usePlayerControlProperties } from '@/modules/player_control/usePlayerControlProperties';
import { useRuntimeStore } from '@/stores/runtime';

beforeEach(() => {
    setActivePinia(createPinia());
    debugLogger.clearLogs();
    Object.values(mockPlayerControl).forEach(fn => fn.mockClear());
    // Phase 8+：#player_control 容器由 Vue mount 后才存在，
    // usePlayerControlProperties 的 let refs 在 module-load 时为 null。
    // 测试必须显式 refresh 让 let 指向 mockElements 的真实 DOM 节点。
    refreshPlayerControlRefs();
    // 确保有歌曲信息，让 needShow=true 正常触发 display:flex
    useRuntimeStore().playerInfo.singtitle = 'Test Song';
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('usePlayerControlProperties', () => {
    test('player_control_show true (non-FirstLoad) → visibility + thumbnailsue', () => {
        const store = useConfigStore();
        usePlayerControlProperties(
            { player_control_show: { value: true } } as never,
            false
        );
        expect(store.player_control_show).toBe(true);
        expect(mockElements.playerControl.container.style.visibility).toBe('visible');
        expect(mockElements.playerControl.container.style.display).toBe('flex');
        expect(mockPlayerControl.thumbnailsue).toHaveBeenCalledTimes(1);
    });

    test('player_control_show true (FirstLoad) → visibility visible + display none', () => {
        usePlayerControlProperties(
            { player_control_show: { value: true } } as never,
            true
        );
        expect(mockElements.playerControl.container.style.display).toBe('none');
        expect(mockElements.playerControl.container.style.visibility).toBe('visible');
    });

    test('player_control_scalefactor → store', () => {
        const store = useConfigStore();
        usePlayerControlProperties(
            { player_control_scalefactor: { value: 120 } } as never,
            false
        );
        expect(store.player_control_scalefactor).toBe(120);
    });

    test('playery + playerx → top/left %', () => {
        usePlayerControlProperties(
            {
                playery: { value: 25 },
                playerx: { value: 75 },
            } as never,
            false
        );
        expect(mockElements.playerControl.container.style.top).toBe('25%');
        expect(mockElements.playerControl.container.style.left).toBe('75%');
    });

    test('player_control_color "1 0 0" → [255,0,0] + CSS', () => {
        const store = useConfigStore();
        usePlayerControlProperties(
            { player_control_color: { value: '1 0 0' } } as never,
            false
        );
        expect(store.player_control_color).toEqual([255, 0, 0]);
        expect(document.body.style.getPropertyValue('--player-color')).toBe('255, 0, 0');
    });

    test('player_control_blurcolor + blurcolor_show + yakeli + bluryakeli → CSS', () => {
        usePlayerControlProperties(
            {
                player_control_blurcolor_show: { value: true },
                player_control_blurcolor: { value: '1 0 0' },
                player_control_yakeli_show: { value: true },
                player_control_yakeli: { value: 50 },
                player_control_bluryakeli: { value: 8 },
            } as never,
            false
        );
        expect(document.body.style.getPropertyValue('--player-blur-enabled')).toBe('1');
        expect(document.body.style.getPropertyValue('--player-blur-color')).toBe('255,0,0');
        expect(document.body.style.getPropertyValue('--player-yakeli-enabled')).toBe('1');
        expect(document.body.style.getPropertyValue('--player-yakeli')).toBe('0.5');
        expect(document.body.style.getPropertyValue('--player-blur-yakeli')).toBe('8px');
    });

    test('player_control_size → player_control_size_value (window.innerHeight / 150 * s)', () => {
        const store = useConfigStore();
        usePlayerControlProperties(
            { player_control_size: { value: 100 } } as never,
            false
        );
        expect(store.player_control_size_value).toBe(
            Math.floor((window.innerHeight / 150) * 100)
        );
    });

    test('player_control_thumbnail_size false → removes flex-center', () => {
        mockElements.playerControl.thumbnailWrap.classList.add('flex-center');
        usePlayerControlProperties(
            { player_control_thumbnail_size: { value: false } } as never,
            false
        );
        expect(mockElements.playerControl.thumbnailWrap.classList.contains('flex-center')).toBe(
            false
        );
    });

    test('player_control_thumbnail_size_value → store', () => {
        const store = useConfigStore();
        usePlayerControlProperties(
            { player_control_thumbnail_size_value: { value: 80 } } as never,
            false
        );
        expect(store.player_control_thumbnail_size_value).toBe(80);
    });

    test('player_control_thumbnail_rotation false → animation cleared', () => {
        mockElements.playerControl.thumbnail.style.animation = 'spin 5s linear infinite';
        usePlayerControlProperties(
            { player_control_thumbnail_rotation: { value: false } } as never,
            false
        );
        expect(mockElements.playerControl.thumbnail.style.animation).toBe('');
    });

    test('player_control_thumbnail_rotation true → animation set + circular class', () => {
        usePlayerControlProperties(
            { player_control_thumbnail_rotation: { value: true } } as never,
            false
        );
        expect(mockElements.playerControl.thumbnail.style.animation).toContain('spin');
        expect(mockElements.playerControl.thumbnailWrap.classList.contains('circular')).toBe(
            true
        );
    });

    test('player_control_thumbnail_rotation_speed → 10 - value', () => {
        const store = useConfigStore();
        usePlayerControlProperties(
            { player_control_thumbnail_rotation_speed: { value: 3 } } as never,
            false
        );
        expect(store.player_control_thumbnail_rotation_speed).toBe(7);
    });

    test('player_control_timetransparency /100 → opacity', () => {
        const store = useConfigStore();
        usePlayerControlProperties(
            { player_control_timetransparency: { value: 80 } } as never,
            false
        );
        expect(store.player_control_timetransparency).toBe(80);
        expect(mockElements.playerControl.container.style.opacity).toBe('0.8');
    });

    test('player_control_showwidth 0 → info.width cleared, else px', () => {
        usePlayerControlProperties(
            { player_control_showwidth: { value: 50 } } as never,
            false
        );
        expect(mockElements.playerControl.info.style.width).toBe(
            window.innerWidth * 0.5 + 'px'
        );
    });

    test('player_control_yakelibgusetb / fontusetb (non-FirstLoad) → thumbnailsue', () => {
        usePlayerControlProperties(
            {
                player_control_yakelibgusetb: { value: 1 },
                player_control_fontusetb: { value: 'Arial' },
            } as never,
            false
        );
        expect(mockPlayerControl.thumbnailsue).toHaveBeenCalled();
    });

    test('player_control_visualaudiobar / barline (non-FirstLoad) → pc_aubar', () => {
        usePlayerControlProperties(
            {
                player_control_visualaudiobar: { value: true },
                player_control_barline: { value: true },
            } as never,
            false
        );
        expect(mockPlayerControl.pc_aubar).toHaveBeenCalledTimes(2);
    });

    test('player_control_getcolor → store + thumbnailsue (non-FirstLoad)', () => {
        const store = useConfigStore();
        usePlayerControlProperties(
            { player_control_getcolor: { value: 1 } } as never,
            false
        );
        expect(store.color_pickup_method).toBe(1);
        expect(mockPlayerControl.thumbnailsue).toHaveBeenCalledTimes(1);
    });

    test('player_control_hdong /500 → store', () => {
        const store = useConfigStore();
        usePlayerControlProperties(
            { player_control_hdong: { value: 250 } } as never,
            false
        );
        expect(store.player_control_hdong).toBeCloseTo(0.5);
    });

    test('player_control_samealbumtitle (non-FirstLoad) → playertitle', () => {
        usePlayerControlProperties(
            { player_control_samealbumtitle: { value: true } } as never,
            false
        );
        expect(mockPlayerControl.playertitle).toHaveBeenCalledTimes(1);
    });

    test('player_control_showaway true → show-away class added', () => {
        usePlayerControlProperties(
            { player_control_showaway: { value: true } } as never,
            false
        );
        expect(mockElements.playerControl.container.classList.contains('show-away')).toBe(true);
    });

    test('FirstLoad → logInitComplete', () => {
        usePlayerControlProperties({} as never, true);
        const matched = debugLogger.logs.find(
            l => l.message === '[PlayerControl] 播放器参数初始化完成'
        );
        expect(matched).toBeDefined();
    });
});