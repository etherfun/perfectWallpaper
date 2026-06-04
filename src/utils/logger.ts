/**
 * 调试日志 — 仅记录 5 个等级 + 浏览器错误事件。
 * 不再劫持 console.*，第三方 SDK 行为不受影响。
 */

export interface LogEntry {
    id: number;
    timestamp: Date;
    timeString: string;
    message: string;
    level: number;
    levelName: string;
    extraData: unknown;
    stackTrace: string | null;
}

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, CRITICAL: 4 } as const;
type LevelName = keyof typeof LEVELS;

export class DebugLogger {
    public logs: LogEntry[] = [];
    private maxLogs = 200;
    private nextId = 1;
    private installed = false;

    constructor() {
        this.install();
    }

    install(): void {
        if (this.installed) return;
        this.installed = true;
        window.addEventListener('error', e => {
            this.error(`未捕获的错误: ${e.message}`, {
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                error: e.error,
            });
        });
        window.addEventListener('unhandledrejection', e => {
            this.error(`未处理的Promise拒绝: ${e.reason}`, { reason: e.reason });
        });
    }

    uninstall(): void {
        this.installed = false;
    }

    log(message: string, level: number | LevelName = 'INFO', extraData: unknown = null): LogEntry {
        const levelNum = typeof level === 'string' ? LEVELS[level] : level;
        const levelName = typeof level === 'string' ? level : this.getLevelName(levelNum);
        const entry: LogEntry = {
            id: this.nextId++,
            timestamp: new Date(),
            timeString: this.formatTimestamp(new Date()),
            message,
            level: levelNum,
            levelName,
            extraData,
            stackTrace: levelNum >= LEVELS.ERROR ? this.captureStack() : null,
        };
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) this.logs.shift();
        return entry;
    }

    debug(message: string, extraData?: unknown): LogEntry {
        return this.log(message, 'DEBUG', extraData);
    }

    info(message: string, extraData?: unknown): LogEntry {
        return this.log(message, 'INFO', extraData);
    }

    warn(message: string, extraData?: unknown): LogEntry {
        return this.log(message, 'WARN', extraData);
    }

    error(message: string, extraData?: unknown): LogEntry {
        return this.log(message, 'ERROR', extraData);
    }

    critical(message: string, extraData?: unknown): LogEntry {
        return this.log(message, 'CRITICAL', extraData);
    }

    clearLogs(): void {
        this.logs = [];
    }

    private formatTimestamp(d: Date): string {
        const pad = (n: number, w = 2) => n.toString().padStart(w, '0');
        return (
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
            `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
        );
    }

    private getLevelName(level: number): string {
        for (const [name, value] of Object.entries(LEVELS)) {
            if (value === level) return name;
        }
        return 'UNKNOWN';
    }

    private captureStack(): string | null {
        try {
            throw new Error('stack');
        } catch (e) {
            return e instanceof Error ? (e.stack ?? null) : null;
        }
    }
}

export const debugLogger = new DebugLogger();

export function registerDebugLogger(cfg: { runtime: { debugLogger: DebugLogger } }): void {
    if (cfg?.runtime) cfg.runtime.debugLogger = debugLogger;
}
