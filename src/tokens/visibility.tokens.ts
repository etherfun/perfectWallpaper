/** 统一可见性令牌：display / visibility（解决各组件散落的 --x-display|--x-visibility） */
export type VisibilityKind = 'flex' | 'block' | 'none';

export function applyVisibility(prefix: string, visible: boolean, kind: VisibilityKind = 'flex'): void {
    const displayKey = `--${prefix}-display` as const;
    const visibilityKey = `--${prefix}-visibility` as const;
    document.body.style.setProperty(displayKey, visible ? kind : 'none');
    document.body.style.setProperty(visibilityKey, visible ? 'visible' : 'hidden');
}
