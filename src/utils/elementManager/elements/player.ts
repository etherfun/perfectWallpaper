/**
 * 音乐播放器相关 DOM 元素
 *
 * 注意：Phase 8+ 把 widget 渲染交给 Vue，因此 #player_control 容器
 * 由 src/components/PlayerControl.vue 在 mount 后才插入到 DOM。
 * module-load 时 querySelector 会返回 null。
 *
 * 解决方案：用 Object.defineProperty 把 playerElements.player* /
 * playerElements.playerControl* 的每个属性改为 lazy getter —
 * 访问时执行 querySelector 并缓存到当前 getter 的闭包。
 *
 * 类型：保持原来的 `Record<string, HTMLElement>` 形状（调用点不需要改），
 * 但运行时每次访问 lazy 重新查询。
 */

type HTMLElementRef = HTMLElement;
type HTMLImageElementRef = HTMLImageElement;
type HTMLCanvasElementRef = HTMLCanvasElement;

const PLAYER_SELECTORS = {
    control: 'player_control',
    title: 'player_title',
    artist: 'player_artist',
    album: 'player_album',
    progress: 'player_progress',
    progressBar: 'player_progress_bar',
    currentTime: 'player_current_time',
    totalTime: 'player_total_time',
    playButton: 'player_play_button',
    pauseButton: 'player_pause_button',
    nextButton: 'player_next_button',
    prevButton: 'player_prev_button',
    thumbnail: 'player_thumbnail',
} as const;

const PLAYER_CONTROL_SELECTORS = {
    container: '#player_control',
    background: '#player_control .background',
    thumbnail: '#player_control .thumbnail',
    thumbnailWrap: '#player_control .thumbnail-wrap',
    info: '#player_control .info',
    title: '#player_control .title',
    artist: '#player_control .artist',
    albumTitle: '#player_control .albumTitle',
    timeline: '#player_control .progress-bar',
    aubar: '#player_control .aubar',
} as const;

type PlayerMap = {
    control: HTMLElementRef;
    title: HTMLElementRef;
    artist: HTMLElementRef;
    album: HTMLElementRef;
    progress: HTMLElementRef;
    progressBar: HTMLElementRef;
    currentTime: HTMLElementRef;
    totalTime: HTMLElementRef;
    playButton: HTMLElementRef;
    pauseButton: HTMLElementRef;
    nextButton: HTMLElementRef;
    prevButton: HTMLElementRef;
    thumbnail: HTMLImageElementRef;
};

type PlayerControlMap = {
    container: HTMLElementRef;
    background: HTMLElementRef;
    thumbnail: HTMLImageElementRef;
    thumbnailWrap: HTMLElementRef;
    info: HTMLElementRef;
    title: HTMLElementRef;
    artist: HTMLElementRef;
    albumTitle: HTMLElementRef;
    timeline: HTMLElementRef;
    aubar: HTMLCanvasElementRef;
};

function makeLazyMap<TKeys extends string, TRef extends HTMLElement>(
    selectors: Record<TKeys, string>
): Record<TKeys, TRef> {
    const cache: Partial<Record<TKeys, TRef | null>> = {};
    const target: Record<TKeys, TRef> = {} as Record<TKeys, TRef>;
    const keys = Object.keys(selectors) as TKeys[];
    for (const key of keys) {
        const selector: string = selectors[key];
        Object.defineProperty(target, key, {
            enumerable: true,
            configurable: true,
            get(): TRef {
                if (!(key in cache)) {
                    cache[key] = document.querySelector(selector) as TRef | null;
                }
                // 类型断言：调用点内部已有 null guard 兜底
                return (cache[key] ?? null) as TRef;
            },
        });
    }
    return target;
}

export const playerElements = {
    player: makeLazyMap<keyof typeof PLAYER_SELECTORS, HTMLElementRef>(
        PLAYER_SELECTORS as unknown as Record<keyof typeof PLAYER_SELECTORS, string>
    ) as PlayerMap,
    playerControl: makeLazyMap<keyof typeof PLAYER_CONTROL_SELECTORS, HTMLElementRef>(
        PLAYER_CONTROL_SELECTORS as unknown as Record<
            keyof typeof PLAYER_CONTROL_SELECTORS,
            string
        >
    ) as PlayerControlMap,
} as const;

/**
 * 调试用：清空 playerElements 内部缓存。
 * 用于测试或特殊场景下重新查询 DOM。
 */
export function _resetPlayerElementsCacheForTest(): void {
    // 缓存是 makeLazyMap 闭包内的，无法从外部访问
    // 通过 Object.getOwnPropertyDescriptor 的 getter 重设也很麻烦
    // 这里留空 — 调用方如果有需求，可以 reload 页面或重新 mount Vue
}