/**
 * DOM / CSS 变量工具 — 从各 property handler 提取的重复模式
 *
 * 原始重复位置：
 * - syncElementHeightToCssVar：clock / date / countdown / hitokoto / picture-info
 *   5 处完全相同的 registerDeferred + ResizeObserver 高度同步逻辑
 * - applyShowHide：clock / date / countdown / hitokoto 4 处 display/visibility toggle
 * - setShowWidth：date / countdown / hitokoto / picture-info 4 处 showwidth 换算
 */

/**
 * 用 ResizeObserver 监听元素高度变化并同步到 CSS 变量。
 *
 * 原模式（5 处重复）：
 *   registerDeferred(id, () => {
 *       const el = ...; if (!el) return;
 *       const update = () => {
 *           const h = el.getBoundingClientRect().height;
 *           if (!h) return;
 *           body.style.setProperty('--x-height', h + 'px');
 *       };
 *       update(); const observer = new ResizeObserver(update); observer.observe(el);
 *       return () => observer.disconnect();
 *   });
 *
 * @param cssVar      CSS 变量名（如 '--clock-height'）
 * @param getElement  元素访问器（惰性求值，元素可能在 Vue mount 后才存在）
 * @returns cleanup 函数（断开 observer）；元素不存在时返回空操作
 */
export function syncElementHeightToCssVar(
    cssVar: string,
    getElement: () => HTMLElement | null | undefined,
): () => void {
    const el = getElement();
    if (!el) return () => {};
    const updateHeight = (): void => {
        const height = el.getBoundingClientRect().height;
        if (!height) return;
        document.body.style.setProperty(cssVar, height + 'px');
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
}

/**
 * 显示/隐藏 toggle：同时设置 `--<prefix>-display`（flex/none）与
 * `--<prefix>-visibility`（visible/hidden）两个 CSS 变量。
 */
export function applyShowHide(cssPrefix: string, show: boolean): void {
    document.body.style.setProperty(`--${cssPrefix}-display`, show ? 'flex' : 'none');
    document.body.style.setProperty(`--${cssPrefix}-visibility`, show ? 'visible' : 'hidden');
}

/**
 * showwidth 属性模式：0 → 'auto'，否则按视口宽度百分比换算为 px。
 */
export function setShowWidth(cssVar: string, value: number): void {
    document.body.style.setProperty(
        cssVar,
        value === 0 ? 'auto' : window.innerWidth * (value / 100) + 'px'
    );
}
