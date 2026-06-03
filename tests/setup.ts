/**
 * Vitest global setup.
 *
 * Stubs a minimal `window` object so modules that touch `window.*` at import
 * time (e.g. `src/utils/logger.ts` installs a global error listener on
 * construction) can load under the default `node` environment.
 *
 * Tests that need full DOM (document, HTMLElement, etc.) should opt into
 * `jsdom`/`happy-dom` per-file with `// @vitest-environment jsdom`.
 */

class StubEventTarget {
    private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map();
    addEventListener(type: string, listener: (...args: unknown[]) => void): void {
        const set = this.listeners.get(type) ?? new Set();
        set.add(listener);
        this.listeners.set(type, set);
    }
    removeEventListener(type: string, listener: (...args: unknown[]) => void): void {
        this.listeners.get(type)?.delete(listener);
    }
    dispatchEvent(_event: Event): boolean {
        return true;
    }
}

if (typeof globalThis.window === 'undefined') {
    const win = new StubEventTarget() as unknown as Record<string, unknown>;
    Object.defineProperty(globalThis, 'window', {
        value: win,
        writable: true,
        configurable: true,
    });
}

if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
        value: {
            getItem: (k: string) => store.get(k) ?? null,
            setItem: (k: string, v: string) => {
                store.set(k, v);
            },
            removeItem: (k: string) => {
                store.delete(k);
            },
            clear: () => store.clear(),
        },
        writable: true,
        configurable: true,
    });
}
