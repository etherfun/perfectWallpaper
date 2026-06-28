/**
 * 惰性 DOM 元素映射工具
 *
 * 用于把 `document.getElementById` / `document.querySelector` 从
 * 模块加载时执行延迟到属性首次访问时执行。这样 Vue 组件在 mount 后
 * 插入的 DOM 元素仍然能被正确找到。
 *
 * 用法：
 *   const myElements = makeLazyMap({
 *       foo: '#foo',
 *       bar: '#bar .baz',
 *   } as const);
 *   // myElements.foo 在首次访问时才执行 querySelector('#foo')
 *
 * 类型：返回 `Record<K, HTMLElement>`，调用点内部已有 null guard 兜底。
 */
type SelectorRecord = Record<string, string>;

export function makeLazyMap<TKeys extends string>(
    selectors: Record<TKeys, string>
): Record<TKeys, HTMLElement> {
    const cache: Partial<Record<TKeys, HTMLElement>> = {};
    const target = {} as Record<TKeys, HTMLElement>;
    const keys = Object.keys(selectors) as TKeys[];
    for (const key of keys) {
        const selector: string = selectors[key];
        Object.defineProperty(target, key, {
            enumerable: true,
            configurable: true,
            get(): HTMLElement {
                // 只在 cache 有真值时跳过查询。
                // null/undefined 时不缓存，后续访问会重新 querySelector，
                // 兼容 Vue 模板中尚未 mount 的元素（如 #myvideo, #sakura 等）。
                if (!(key in cache)) {
                    const el = document.querySelector(selector);
                    if (el) {
                        cache[key] = el as HTMLElement;
                    }
                    return (el ?? null) as unknown as HTMLElement;
                }
                return cache[key] as HTMLElement;
            },
        });
    }
    return target;
}

/**
 * 惰性 getElementById 映射 — 用 id 列表生成惰性映射。
 *
 * 注意：id 使用简单字符串拼接，不通过 CSS.escape（JSDOM 不支持）。
 * 调用方需确保 id 不含需要 CSS 转义的特殊字符。
 */
export function makeLazyIdMap<TKeys extends string>(
    ids: Record<TKeys, string>
): Record<TKeys, HTMLElement> {
    const selectorMap = {} as Record<TKeys, string>;
    const keys = Object.keys(ids) as TKeys[];
    for (const key of keys) {
        selectorMap[key] = `#${ids[key]}`;
    }
    return makeLazyMap(selectorMap);
}
