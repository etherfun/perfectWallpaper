/**
 * Pinia store: runtime (Phase 1 — Composition API + shallowRef)
 *
 * 暴露原 `config.runtime.*` 字段。
 *
 * 架构设计：
 * - 高频字段（playerInfo / param / PWLineParam）：shallowRef
 *   → 避免 60Hz RAF 更新触发 Vue 响应式深度追踪
 * - 中低频字段（photo / files / hitokoto）：ref
 *   → 正常响应式，Vue 组件可 watch
 * - 实例字段（wallpaper / versionManager / fluidEffect*）：shallowRef
 *   → 仅追踪引用变化，不深度响应
 *
 * Transition path：
 *   Phase 1: 创建 Composition API store（当前）
 *   Phase 2: 迁移 config.runtime 消费者到 useRuntimeStore()
 *   Phase 4: config.runtime 从 AppConfig 中删除
 */

import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';

import type { RuntimeStoreState } from './types';

/** playerInfo 初始值 */
const PLAYER_INFO_INIT: RuntimeStoreState['playerInfo'] = {
    audioLeft: [],
    audioRight: [],
    playerState: null,
    singtitle: '',
    singartist: '',
    singalbumTitle: '',
    aubarstop: true,
    colorGroup: null,
    fontcolor: null,
    externalMediaActive: false,
    builtInPlayerInitializing: false,
};

/** param 初始值 */
const PARAM_INIT: RuntimeStoreState['param'] = {
    style: 1,
    r: 0.45,
    color: 'rgba(255,255,255,0.8)',
    blurColor: '#ffcccc',
    arr1: [],
    arr2: [],
    rotation: 0,
    rotationcopy: 0,
    offsetAngle: 0,
    // 圆环正常模式写 128 个点（多边形模式写前 120），初始尺寸对齐 128
    waveArr: new Array(128),
    cX: 0.5,
    cY: 0.5,
    range: 9,
    shadowBlur: 15,
    lineWidth: 9,
    showCircle: true,
    wavetransparency: 0.8,
    showSemiCircle: false,
    SemiCircledirection: 1,
    Polygon: 12,
    PolygonAngle: 0,
    activePoints: 128,
    polygonActive: false,
    direction: 1,
    SolidColorGradient: true,
    BlurColorGradient: true,
    ColorRhythm: true,
    ColorMode: 1,
    TagNow: 1,
    GradientRate: 0.5,
};

/** PWLineParam 初始值 */
const PWLINE_PARAM_INIT: RuntimeStoreState['PWLineParam'] = {
    style: 1,
    sw: 0.8,
    lineWidth: 9,
    waveArr: new Array(120),
    range: 5,
    color: 'rgba(255,255,255,0.8)',
    blurColor: '#ffcccc',
    shadowBlur: 100,
    arr1: [],
    arr2: [],
    arr3: [],
    LineX: 0.5,
    LineY: 0.5,
    showLine: true,
    LinePosition: 1,
    Direction: 1,
    LineDensity: 120,
    LineTransparency: 0.8,
    MiddleLine: false,
    TagNow: 1,
    SolidColorGradient: true,
    BlurColorGradient: true,
    ColorRhythm: true,
    ColorMode: 1,
    GradientRate: 0.5,
};

/** photo 初始值 */
const PHOTO_INIT: RuntimeStoreState['photo'] = {
    currentImg: null,
    nextphoto: false,
    infomation: { title: '', text: '', copyright: '', where: '' },
};

/** hitokoto 初始值 */
const HITOKOTO_INIT: RuntimeStoreState['hitokoto'] = {
    hitokoto_text: '未获取',
    from_text: '未获取',
    from_who_text: '未获取',
};

export const useRuntimeStore = defineStore('runtime', () => {
    // ═══════════════════════════════════════════════
    //  PlayerRuntime — 60Hz 高频，shallowRef
    // ═══════════════════════════════════════════════
    const playerInfo = shallowRef({ ...PLAYER_INFO_INIT });
    const param = shallowRef({ ...PARAM_INIT });
    const PWLineParam = shallowRef({ ...PWLINE_PARAM_INIT });

    // ═══════════════════════════════════════════════
    //  PhotoRuntime — 中低频，ref
    // ═══════════════════════════════════════════════
    const photo = ref({ ...PHOTO_INIT });

    // ═══════════════════════════════════════════════
    //  HitokotoRuntime — 中低频，ref
    // ═══════════════════════════════════════════════
    const hitokoto = ref({ ...HITOKOTO_INIT });

    // ═══════════════════════════════════════════════
    //  DockRuntime — 中低频，ref
    // ═══════════════════════════════════════════════
    const files = ref<RuntimeStoreState['files']>({});
    const myList = ref<RuntimeStoreState['myList']>([]);

    // ═══════════════════════════════════════════════
    //  FluidRuntime — 实例，shallowRef
    // ═══════════════════════════════════════════════
    const FluidEffect2 = shallowRef<RuntimeStoreState['FluidEffect2']>(undefined);
    const fluidEffect = shallowRef<RuntimeStoreState['fluidEffect']>(undefined);
    const fullscreenFluidEffect = shallowRef<RuntimeStoreState['fullscreenFluidEffect']>(undefined);
    const FluidEffect = shallowRef<RuntimeStoreState['FluidEffect']>(undefined);
    const fullscreenFluidEnabled = ref(false);
    const pictureInfoHideStyleAdded = ref(false);

    // ═══════════════════════════════════════════════
    //  WallpaperRuntime — 实例，shallowRef
    // ═══════════════════════════════════════════════
    const wallpaper = shallowRef<RuntimeStoreState['wallpaper']>(null);

    // ═══════════════════════════════════════════════
    //  ServiceRuntime — 实例，shallowRef
    // ═══════════════════════════════════════════════
    const versionManager = shallowRef<RuntimeStoreState['versionManager']>(undefined);
    const debugLogger = shallowRef<RuntimeStoreState['debugLogger']>(undefined);

    // ═══════════════════════════════════════════════
    //  Actions
    // ═══════════════════════════════════════════════

    /** 设置一言数据 */
    function setHitokoto(text: string, from: string, fromWho: string): void {
        hitokoto.value = { hitokoto_text: text, from_text: from, from_who_text: fromWho };
    }

    /** 批量更新 playerInfo（高频场景） */
    function updatePlayerInfo(data: Partial<RuntimeStoreState['playerInfo']>): void {
        playerInfo.value = { ...playerInfo.value, ...data };
    }

    /** 批量更新 param（高频场景） */
    function updateParam(data: Partial<RuntimeStoreState['param']>): void {
        param.value = { ...param.value, ...data };
    }

    /** 批量更新 PWLineParam（高频场景） */
    function updatePWLineParam(data: Partial<RuntimeStoreState['PWLineParam']>): void {
        PWLineParam.value = { ...PWLineParam.value, ...data };
    }

    return {
        // PlayerRuntime
        playerInfo,
        param,
        PWLineParam,
        // PhotoRuntime
        photo,
        // HitokotoRuntime
        hitokoto,
        // DockRuntime
        files,
        myList,
        // FluidRuntime
        FluidEffect2,
        fluidEffect,
        fullscreenFluidEffect,
        FluidEffect,
        fullscreenFluidEnabled,
        pictureInfoHideStyleAdded,
        // WallpaperRuntime
        wallpaper,
        // ServiceRuntime
        versionManager,
        debugLogger,
        // Actions
        setHitokoto,
        updatePlayerInfo,
        updateParam,
        updatePWLineParam,
    };
});
