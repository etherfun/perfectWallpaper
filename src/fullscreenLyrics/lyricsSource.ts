/**
 * Lyrics data source: WebSocket with HTTP polling fallback.
 * Owns the WS connection and the polling timer; exposes a handle to disconnect.
 */

import { debugLogger } from '@/utils/logger';

import { HTTP_POLL_INTERVAL_MS, LYRICS_API_URL, LYRICS_HTTP_URL } from './constants';
import type { LyricsData } from './types';

/** Disposable handle returned by connectLyricsSource */
export interface LyricsSourceHandle {
    /** Stop WS + polling, release timers */
    disconnect: () => void;
}

/**
 * Connect to the lyrics WebSocket. If WS fails or disconnects, transparently
 * falls back to HTTP polling. The returned handle must be `disconnect()`-ed
 * by the caller to release resources.
 */
export function connectLyricsSource(onUpdate: (data: LyricsData) => void): LyricsSourceHandle {
    let ws: WebSocket | null = null;
    let httpPollInterval: number | null = null;

    const startHTTPPolling = (): void => {
        if (httpPollInterval !== null) return;
        httpPollInterval = window.setInterval(() => {
            void fetchLyrics(onUpdate);
        }, HTTP_POLL_INTERVAL_MS);
    };

    const handleMessage = (event: MessageEvent): void => {
        try {
            const data = JSON.parse(event.data) as LyricsData;
            onUpdate(data);
        } catch (e) {
            debugLogger.error('[FullscreenLyrics] Failed to parse lyrics data', { error: e });
        }
    };

    try {
        ws = new WebSocket(LYRICS_API_URL);

        ws.onopen = () => {
            debugLogger.info('[FullscreenLyrics] WebSocket connected');
        };

        ws.onmessage = handleMessage;

        ws.onclose = () => {
            debugLogger.info('[FullscreenLyrics] WebSocket disconnected, falling back to HTTP');
            startHTTPPolling();
        };

        ws.onerror = error => {
            debugLogger.error('[FullscreenLyrics] WebSocket error', { error });
            startHTTPPolling();
        };
    } catch (e) {
        debugLogger.error('[FullscreenLyrics] Failed to connect to lyrics server', { error: e });
        startHTTPPolling();
    }

    return {
        disconnect: () => {
            if (ws) {
                ws.close();
                ws = null;
            }
            if (httpPollInterval !== null) {
                clearInterval(httpPollInterval);
                httpPollInterval = null;
            }
        },
    };
}

/** Single HTTP poll request */
async function fetchLyrics(onUpdate: (data: LyricsData) => void): Promise<void> {
    try {
        const response = await fetch(LYRICS_HTTP_URL);
        if (response.ok) {
            const data = (await response.json()) as LyricsData;
            onUpdate(data);
        }
    } catch (e) {
        debugLogger.info('[FullscreenLyrics] HTTP polling failed', { error: String(e) });
    }
}
