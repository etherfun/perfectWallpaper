// @vitest-environment jsdom
/**
 * 流体效果初始加载竞态回归测试
 *
 * 场景（WE 真实启动时序）：
 *   1. applyUserProperties 首帧推送（FirstLoad）→ fluid handler 调 set('enabled', true)
 *   2. 此刻播放内容尚未就绪（singtitle 为空 / playerState 为 null），
 *      performInitNormalEffect 静默返回 → state=NORMAL 但渲染器未创建
 *   3. 之后媒体事件到达（歌曲标题 + 播放状态）
 *
 * 期望：内容就绪后再次 enable()/sync 应自愈重建渲染器，而不是被
 * `state === NORMAL → early return` 守卫挡住导致流体效果永远不出现。
 *
 * 注意：lifecycleImpl / pictureInfo 在模块顶层调用 useRuntimeStore()，
 * 因此必须先 setActivePinia 再动态导入被测模块（见 beforeAll）。
 */
import { createPinia, setActivePinia } from 'pinia';
import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

// ─── mock 叶子 DOM/Canvas 模块，让真实 FluidEffect + lifecycleImpl 跑通 ───
vi.mock('@/modules/fluid/effect/canvasLayout', () => ({
    createCanvasGrid: vi.fn((container: HTMLElement) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'fluid-effect-wrapper';
        container.appendChild(wrapper);
        return { wrapper, canvases: [], contexts: [], offsets: [] };
    }),
    layoutCanvasGrid: vi.fn(() => ({ displaySize: 100, dpr: 1 })),
    randomizeCanvasOffsets: vi.fn(),
    unmountCanvasGrid: vi.fn((grid: { wrapper: HTMLElement }) => {
        grid.wrapper.parentNode?.removeChild(grid.wrapper);
    }),
}));
vi.mock('@/modules/fluid/effect/svgFilter', () => ({
    mountSvgFilter: vi.fn(() => ({
        svg: document.createElement('div'),
        feTurbulence: { setAttribute: vi.fn() },
        feDisplacementMap: { setAttribute: vi.fn() },
    })),
    unmountSvgFilter: vi.fn(),
}));
vi.mock('@/modules/fluid/effect/imageSource', () => ({
    drawImageToCanvasGrid: vi.fn(),
    loadImageFromUrl: vi.fn((_url: string, cb: (img: HTMLImageElement) => void) => {
        cb(new Image());
    }),
}));

import { useRuntimeStore } from '@/stores/runtime';

import type { Pinia } from 'pinia';

// 单一 pinia：lifecycleImpl / pictureInfo 模块顶层的 useRuntimeStore()
// 绑定首次激活的实例，跨测试不能换 pinia，只能重置状态
type FluidEffectCtor = typeof import('@/modules/fluid/effect/FluidEffect').FluidEffect;
let FluidEffect: FluidEffectCtor;
let pinia: Pinia;

function setupPlayerContainer(): void {
    document.body.innerHTML = '';
    const playerControl = document.createElement('div');
    playerControl.id = 'player_control';
    const background = document.createElement('div');
    background.className = 'background';
    playerControl.appendChild(background);
    document.body.appendChild(playerControl);
}

beforeAll(async () => {
    pinia = createPinia();
    setActivePinia(pinia);
    ({ FluidEffect } = await import('@/modules/fluid/effect/FluidEffect'));
});

/** 模拟媒体事件到达：歌曲信息 + 播放中状态 */
function simulateMediaContentReady(): void {
    const runtime = useRuntimeStore();
    runtime.updatePlayerInfo({ singtitle: 'Test Song', playerState: 1 });
}

beforeEach(() => {
    setupPlayerContainer();
    const runtime = useRuntimeStore();
    runtime.fluidEffect = undefined;
    runtime.updatePlayerInfo({ singtitle: '', playerState: null });
});

describe('fluid 初始加载竞态', () => {
    test('内容未就绪时 enable() 不创建渲染器；内容就绪后再次 enable() 应回补初始化', () => {
        const fe = FluidEffect.create();

        // 模拟 FirstLoad：属性先到、播放内容尚未就绪
        fe.enable();
        expect(fe.enabled).toBe(true);
        expect(fe.normalEffect).toBeNull(); // 静默失败：无渲染器

        // 模拟媒体事件到达后外部重试 enable（controller sync 路径）
        simulateMediaContentReady();
        fe.enable();

        // 修复前：state 已是 NORMAL → early return → 渲染器永远为 null（bug）
        // 修复后：enable() 自愈重试 → 渲染器创建
        expect(fe.normalEffect).not.toBeNull();
        expect(
            document.querySelector('#player_control .background .fluid-effect-wrapper')
        ).not.toBeNull();
    });

    test('全屏模式同理：内容就绪后 enableFullscreen() 应回补初始化', () => {
        const fe = FluidEffect.create();

        fe.enableFullscreen();
        expect(fe.fullscreenEnabled).toBe(true);
        expect(fe.fullscreenEffect).toBeNull(); // 内容未就绪，静默失败

        simulateMediaContentReady();
        fe.enableFullscreen();

        expect(fe.fullscreenEffect).not.toBeNull();
    });

    test('渲染器已存在时 enable() 保持幂等，不重复创建', () => {
        const fe = FluidEffect.create();
        simulateMediaContentReady();

        fe.enable();
        const first = fe.normalEffect;
        expect(first).not.toBeNull();

        fe.enable();
        expect(fe.normalEffect).toBe(first); // 同一实例，不重复 init
    });

    test('disable 后再 enable 正常重建（回归保护）', () => {
        const fe = FluidEffect.create();
        simulateMediaContentReady();

        fe.enable();
        expect(fe.normalEffect).not.toBeNull();
        fe.disable();
        expect(fe.normalEffect).toBeNull();
        expect(fe.enabled).toBe(false);

        fe.enable();
        expect(fe.normalEffect).not.toBeNull();
    });

    test('集成：FirstLoad 启用 → 媒体事件到达后 controller 自动回补渲染器', async () => {
        const { useConfigStore } = await import('@/stores/config');
        const { useFluidEffect } = await import('@/modules/fluid/controller');
        const { useFluidEffectProperties } = await import(
            '@/modules/fluid/useFluidEffectProperties'
        );
        const { mount } = await import('@vue/test-utils');
        const { defineComponent, nextTick } = await import('vue');

        const Host = defineComponent({
            setup() {
                useFluidEffect();
                return () => null;
            },
        });
        const wrapper = mount(Host, { global: { plugins: [pinia] } });

        // 模拟 WE 首帧推送：属性先到、播放内容尚未就绪
        useFluidEffectProperties({ fluidEffectEnabled: { value: true } } as never, true);
        await nextTick();

        const config = useConfigStore();
        const runtime = useRuntimeStore();
        expect(config.fluidEffectEnabled).toBe(true);
        expect(runtime.fluidEffect).not.toBeNull();
        // 修复前 bug 状态：state=NORMAL 但渲染器未创建
        expect(runtime.fluidEffect?.normalEffect ?? null).toBeNull();

        // 媒体事件到达（歌曲标题 + 播放状态）→ watcher 触发 sync 自愈
        simulateMediaContentReady();
        await nextTick();

        expect(runtime.fluidEffect?.normalEffect ?? null).not.toBeNull();
        wrapper.unmount();
    });
});
