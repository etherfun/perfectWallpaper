import { debugLogger } from '@/utils/logger';

import {
    type AggregateInfo,
    type AllIconsResult,
    type ApiErrorResponse,
    type ApiResponse,
    type AudioMetadata,
    type ClearCacheResponse,
    type ConfigView,
    type CustomIconResponse,
    type DiskSummaryInfo,
    type FileListResult,
    type IconData,
    type MediaControlResult,
    type OpenConsoleSuccess,
    type OpenItemRequest,
    type OpenItemResponse,
    type OpenPawnioReleasesSuccess,
    type SelectFileResult,
    type SetPortSuccess,
    type SetupActionRequest,
    type SetupState,
} from '../types';

/**
 * Typed `fetch` wrapper for the .NET sidecar.
 *
 * Every `/api/*` endpoint returns the same
 * envelope: `{ success, data, error, timestamp }`.
 * This helper:
 *   - unwraps `data` (returns `T` on success,
 *     `null` on error)
 *   - logs failures with the i18n `error` string
 *     so a developer running the wallpaper can
 *     see what went wrong without having to
 *     open the browser devtools network tab
 *   - returns `null` on network failure so
 *     callers can early-return without try/catch
 *     noise
 *
 * Use `apiPost` for mutating actions; it also
 * returns a parsed JSON body, but typed against
 * the action's expected success shape.
 */

export interface ApiRequestOptions {
    /** Override the URL prefix; defaults to `''` (caller passes the full path) */
    baseUrl?: string;
    /** AbortSignal for cancellation */
    signal?: AbortSignal;
}

export async function apiFetch<T>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<{ data: T; timestamp: number } | null> {
    try {
        const res = await fetch(options.baseUrl ? options.baseUrl + path : path, {
            signal: options.signal,
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
            debugLogger.error(`[api] HTTP ${res.status} on ${path}`);
            return null;
        }
        const body = (await res.json()) as ApiResponse<T>;
        if (body.success && body.data !== null) {
            return { data: body.data, timestamp: body.timestamp };
        }
        // success=false OR data=null — both are
        // "no usable payload" cases from the
        // caller's POV. Log the server's i18n'd
        // error string verbatim so the dev sees
        // the same Chinese/English the user would
        // see in the setup page.
        debugLogger.error(`[api] server error on ${path}: ${body.error ?? '(no data)'}`);
        return null;
    } catch (e: unknown) {
        debugLogger.error(`[api] network failure on ${path}`, { error: e });
        return null;
    }
}

/**
 * Variant for POST / PUT that also parses the
 * success envelope. Returns `null` on network
 * or `success=false`. Caller does the actual
 * error reporting.
 */
export async function apiPost<TReq, TRes>(
    path: string,
    body: TReq,
    options: ApiRequestOptions = {}
): Promise<{ data: TRes; timestamp: number } | null> {
    try {
        const res = await fetch(options.baseUrl ? options.baseUrl + path : path, {
            method: 'POST',
            signal: options.signal,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            debugLogger.error(`[api] HTTP ${res.status} on POST ${path}`);
            return null;
        }
        const json = (await res.json()) as ApiResponse<TRes>;
        if (json.success && json.data !== null) {
            return { data: json.data, timestamp: json.timestamp };
        }
        debugLogger.error(`[api] server error on POST ${path}: ${json.error ?? '(no data)'}`);
        return null;
    } catch (e: unknown) {
        debugLogger.error(`[api] network failure on POST ${path}`, { error: e });
        return null;
    }
}

/**
 * Narrowing type-guard for the error envelope.
 * Use after destructuring `apiFetch`'s return to
 * branch on `success === false` without losing
 * type info on `error`.
 */
export function isApiError<T>(r: ApiResponse<T>): r is ApiErrorResponse {
    return r.success === false;
}

/* =================================================================
 *  Typed convenience wrappers
 * =================================================================
 * Each endpoint we currently consume gets a
 * 1-2-line wrapper here. Callers use these
 * instead of raw `apiFetch` calls so the path
 * is right next to its return type and the
 * schema is checked at the wrapper site.
 */

export function fetchAggregate(
    baseUrl: string,
    signal?: AbortSignal
): Promise<AggregateInfo | null> {
    return apiFetch<AggregateInfo>(`/api/sysinfo`, { baseUrl, signal }).then(r => r?.data ?? null);
}

/**
 * `/api/sysinfo/disk` —— 物理磁盘 + 各自卷的容量 / 温度 / SMART。
 *
 * Why a separate endpoint (instead of reading
 * `aggregate.disks`):
 *   - Disk SMART poll is the most expensive sensor
 *     read in the .NET sidecar (~150-300ms on first
 *     call per process). Polling it on the same
 *     cadence as the 1-Hz aggregate wastes 10% of
 *     every CPU cycle.
 *   - The dashboard has a dedicated "storage" card
 *     that polls on a slower 2-3s cadence; the
 *     aggregate caller can keep its 1-Hz cadence
 *     for CPU/MEM/NET.
 *   - User-mode users still get the per-volume
 *     capacity data even when SMART is null, so the
 *     card degrades gracefully on a non-admin run.
 */
export function fetchDisk(baseUrl: string, signal?: AbortSignal): Promise<DiskSummaryInfo | null> {
    return apiFetch<DiskSummaryInfo>(`/api/sysinfo/disk`, { baseUrl, signal }).then(
        r => r?.data ?? null
    );
}

export function fetchConfig(baseUrl: string): Promise<ConfigView | null> {
    return apiFetch<ConfigView>('/api/config', { baseUrl }).then(r => r?.data ?? null);
}

export function updateConfig(
    baseUrl: string,
    body: { port?: number | null; auto_start?: boolean | null; log_level?: string | null }
): Promise<ConfigView | null> {
    return apiPost<typeof body, ConfigView>('/api/config', body, { baseUrl }).then(
        r => r?.data ?? null
    );
}

export function fetchSetup(baseUrl: string): Promise<SetupState | null> {
    return apiFetch<SetupState>('/api/setup', { baseUrl }).then(r => r?.data ?? null);
}

/**
 * The `/api/setup` POST actions return one of
 * several distinct success shapes:
 *   - set_port → SetPortSuccess (not wrapped in ApiResponse)
 *   - set_lang / set_auto_start_* → SetupState
 *   - open_pawnio_releases → OpenPawnioReleasesSuccess
 *   - open_console → OpenConsoleSuccess
 *
 * Callers can branch on the returned `data` type
 * (it's `unknown` here because the action union
 * is open). The runtime shape is action-specific,
 * so callers should narrow with their own type
 * guard.
 */
export function postSetupAction(
    baseUrl: string,
    action: SetupActionRequest
): Promise<{
    data: SetPortSuccess | SetupState | OpenPawnioReleasesSuccess | OpenConsoleSuccess;
    timestamp: number;
} | null> {
    return apiPost<
        SetupActionRequest,
        SetPortSuccess | SetupState | OpenPawnioReleasesSuccess | OpenConsoleSuccess
    >('/api/setup', action, { baseUrl });
}

export function fetchIcon(
    baseUrl: string,
    exePath: string,
    bypassCache = false
): Promise<IconData | null> {
    const t = bypassCache ? `?t=${Date.now()}` : '';
    return apiFetch<IconData>(`/api/icon?path=${encodeURIComponent(exePath)}${t}`, {
        baseUrl,
    }).then(r => r?.data ?? null);
}

export function fetchAllIcons(baseUrl: string, exePath: string): Promise<AllIconsResult | null> {
    return apiFetch<AllIconsResult>(
        `/api/icon/all?path=${encodeURIComponent(exePath)}&t=${Date.now()}`,
        { baseUrl }
    ).then(r => r?.data ?? null);
}

export function uploadCustomIcon(
    baseUrl: string,
    body: { data: string; type: string }
): Promise<CustomIconResponse['data'] | null> {
    return apiPost<typeof body, CustomIconResponse>('/api/icon/upload', body, { baseUrl }).then(
        r => r?.data.data ?? null
    );
}

export function clearIconCache(baseUrl: string): Promise<ClearCacheResponse['data'] | null> {
    return apiPost<Record<string, never>, ClearCacheResponse>(
        '/api/icon/cache',
        {},
        { baseUrl }
    ).then(r => r?.data.data ?? null);
}

export function openDockbarItem(baseUrl: string, body: OpenItemRequest): Promise<boolean> {
    return apiPost<OpenItemRequest, OpenItemResponse>('/api/dockbar/open', body, { baseUrl }).then(
        r => r?.data.success === true
    );
}

export function selectFile(
    baseUrl: string,
    type: 'app' | 'file'
): Promise<SelectFileResult | null> {
    return apiFetch<SelectFileResult>(`/api/dockbar/select-file?type=${type}`, { baseUrl }).then(
        r => r?.data ?? null
    );
}

export function listFiles(
    baseUrl: string,
    directory: string,
    filter?: string
): Promise<FileListResult | null> {
    const params = new URLSearchParams({ directory });
    if (filter) params.set('filter', filter);
    return apiFetch<FileListResult>(`/api/files?${params.toString()}`, { baseUrl }).then(
        r => r?.data ?? null
    );
}

/**
 * Media control actions share a uniform success
 * shape: `{ success: true, data: { opened: true } }`.
 * The actual `action` is in the URL path.
 */
export async function postMediaAction(
    baseUrl: string,
    action: 'play-pause' | 'next' | 'prev' | 'stop'
): Promise<boolean> {
    const r = await apiPost<Record<string, never>, MediaControlResult>(
        `/api/files/player/${action}`,
        {},
        { baseUrl }
    );
    return r?.data.success === true;
}

/**
 * Fetch audio metadata for a local file via
 * `GET /api/files/metadata?path=…`.
 *
 * Returns `null` on any failure (HTTP error,
 * server `success=false`, or network). The server
 * wraps the result in the standard `ApiResponse`
 * envelope; we only unwrap `data` to keep callers
 * free of envelope typing.
 */
export function fetchAudioMetadata(
    baseUrl: string,
    filePath: string
): Promise<AudioMetadata | null> {
    return apiFetch<AudioMetadata>(`/api/files/metadata?path=${encodeURIComponent(filePath)}`, {
        baseUrl,
    }).then(r => r?.data ?? null);
}

/**
 * Build the absolute audio-stream URL for a local file
 * (returned by `GET /api/files/audio?path=…`).
 *
 * This is a pure URL builder — the server streams the
 * file, the wallpaper just sets `<audio>.src`. No need
 * to round-trip through `apiFetch`.
 */
export function getAudioStreamUrl(baseUrl: string, filePath: string): string {
    return `${baseUrl}/api/files/audio?path=${encodeURIComponent(filePath)}`;
}
