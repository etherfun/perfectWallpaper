/**
 * 调试日志保存器
 * 用于保存报错日志到变量中，包含时间戳和重要等级
 */

import { appConfig } from './config';

// 日志条目接口
interface LogEntry {
    id: number;
    timestamp: Date;
    timeString: string;
    message: string;
    level: number;
    levelName: string;
    extraData: any;
    stackTrace: string | null;
}

// 控制台捕获配置接口
interface ConsoleCaptureConfig {
    enabled: boolean;
    captureLog: boolean;
    captureWarn: boolean;
    captureError: boolean;
    captureInfo: boolean;
    captureDebug: boolean;
    captureAssert: boolean;
    captureDir: boolean;
    captureDirxml: boolean;
    captureTable: boolean;
    captureTrace: boolean;
    captureGroup: boolean;
    captureGroupCollapsed: boolean;
    captureGroupEnd: boolean;
    captureTime: boolean;
    captureTimeEnd: boolean;
    captureCount: boolean;
    captureCountReset: boolean;
    captureClear: boolean;
    captureProfile: boolean;
    captureProfileEnd: boolean;
    captureTimeStamp: boolean;
    preserveOriginal: boolean;
    logOriginalCall: boolean;
    captureBrowserErrors: boolean;
}

// 定时器对象接口
interface TimerObject {
    id: string;
    callback: Function;
    delay: number;
    remaining: number;
    startTime: number;
    timerId: number | null;
    isPaused: boolean;
    isActive: boolean;
    status: 'running' | 'paused' | 'finished' | 'error';
}

export class DebugLogger {
    private outPutConsole: boolean = false;
    public logs: LogEntry[] = [];
    private maxLogs: number = 200;
    private static _gettingStackTrace: boolean = false;
    
    private levels = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        CRITICAL: 4
    };
    
    private consoleCaptureConfig: ConsoleCaptureConfig = {
        enabled: true,
        captureLog: false,       // 关闭普通日志
        captureWarn: true,       // 保留警告
        captureError: true,      // 保留错误
        captureInfo: false,      // 关闭信息
        captureDebug: false,     // 关闭调试
        captureAssert: true,     // 保留断言
        captureDir: false,
        captureDirxml: false,
        captureTable: false,
        captureTrace: false,
        captureGroup: false,
        captureGroupCollapsed: false,
        captureGroupEnd: false,
        captureTime: false,
        captureTimeEnd: false,
        captureCount: false,
        captureCountReset: false,
        captureClear: false,
        captureProfile: false,
        captureProfileEnd: false,
        captureTimeStamp: false,
        preserveOriginal: true,
        logOriginalCall: false,
        captureBrowserErrors: true
    };
    
    private originalConsole: { [key: string]: Function } = {};
    
    constructor() {
        // 绑定到全局对象以便其他文件访问
        (window as any).DebugLogger = DebugLogger;
        (window as any).debugLogger = this;
        
        // 初始化控制台捕获
        this.initConsoleCapture();
        
        // 全局错误捕获
        window.addEventListener('error', (event) => {
            this.error(`未捕获的错误: ${event.message}`, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.error(`未处理的Promise拒绝: ${event.reason}`, {
                reason: event.reason
            });
        });
    }
    
    /**
     * 添加日志
     * @param message - 日志消息
     * @param level - 日志等级（数字或字符串）
     * @param extraData - 额外数据
     * @returns 日志对象
     */
    log(message: string, level: number | string = 'INFO', extraData: any = null): LogEntry {
        const timestamp = new Date();
        const levelNum = typeof level === 'string' ? this.levels[level.toUpperCase() as keyof typeof this.levels] || 1 : level;
        const levelName = typeof level === 'string' ? level.toUpperCase() : this.getLevelName(level);
        
        // 只在错误级别及以上才获取堆栈跟踪，避免递归调用
        const stackTrace = levelNum >= this.levels.ERROR ? this.getStackTrace() : null;
        
        const logEntry: LogEntry = {
            id: this.logs.length + 1,
            timestamp: timestamp,
            timeString: this.formatTimestamp(timestamp),
            message: message,
            level: levelNum,
            levelName: levelName,
            extraData: extraData,
            stackTrace: stackTrace
        };
        
        this.logs.push(logEntry);
        
        // 限制日志数量
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // 控制台输出
        this.consoleOutput(logEntry);
        
        return logEntry;
    }
    
    /**
     * 格式化时间戳
     * @param date - 日期对象
     * @returns 格式化后的时间字符串
     */
    private formatTimestamp(date: Date): string {
        const year = date.getFullYear();
        const month = this.add0(date.getMonth() + 1);
        const day = this.add0(date.getDate());
        const hours = this.add0(date.getHours());
        const minutes = this.add0(date.getMinutes());
        const seconds = this.add0(date.getSeconds());
        const milliseconds = this.add0(date.getMilliseconds(), 3);
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    
    /**
     * 数字不足指定位数则加"0"
     */
    private add0(n: number, digits: number = 2): string {
        let str = n.toString();
        while (str.length < digits) {
            str = '0' + str;
        }
        return str;
    }
    
    /**
     * 根据等级数字获取等级名称
     * @param level - 等级数字
     * @returns 等级名称
     */
    private getLevelName(level: number): string {
        for (const [name, value] of Object.entries(this.levels)) {
            if (value === level) return name;
        }
        return 'UNKNOWN';
    }
    
    /**
     * 安全地获取堆栈跟踪，避免触发错误处理器
     * @returns 堆栈跟踪或null
     */
    private getStackTrace(): string | null {
        // 直接返回null，避免创建Error对象触发递归
        return null;
    }
    
    /**
     * 初始化控制台捕获
     */
    private initConsoleCapture(): void {
        if (!this.consoleCaptureConfig.enabled) return;
        
        // 备份所有原始控制台方法
        const consoleMethods = [
            'log', 'warn', 'error', 'info', 'debug', 'assert',
            'dir', 'dirxml', 'table', 'trace', 'group', 'groupCollapsed',
            'groupEnd', 'time', 'timeEnd', 'count', 'countReset',
            'clear', 'profile', 'profileEnd', 'timeStamp',
            'exception', 'debugger'
        ];
        
        consoleMethods.forEach(method => {
            if ((console as any)[method]) {
                this.originalConsole[method] = (console as any)[method].bind(console);
            }
        });
        
        // 设置控制台重定向
        this.setupConsoleRedirection();
    }
    
    /**
     * 设置控制台重定向
     */
    private setupConsoleRedirection(): void {
        // 基本日志方法
        if (this.consoleCaptureConfig.captureLog) {
            console.log = this.createConsoleWrapper('log', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureWarn) {
            console.warn = this.createConsoleWrapper('warn', 'WARN');
        }
        
        if (this.consoleCaptureConfig.captureError) {
            console.error = this.createConsoleWrapper('error', 'ERROR');
        }
        
        if (this.consoleCaptureConfig.captureInfo) {
            console.info = this.createConsoleWrapper('info', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureDebug) {
            console.debug = this.createConsoleWrapper('debug', 'DEBUG');
        }
        
        // 断言方法
        if (this.consoleCaptureConfig.captureAssert && this.originalConsole.assert) {
            console.assert = this.createAssertWrapper();
        }
        
        // 其他控制台方法
        if (this.consoleCaptureConfig.captureDir && this.originalConsole.dir) {
            console.dir = this.createConsoleWrapper('dir', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureDirxml && this.originalConsole.dirxml) {
            console.dirxml = this.createConsoleWrapper('dirxml', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureTable && this.originalConsole.table) {
            console.table = this.createConsoleWrapper('table', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureTrace && this.originalConsole.trace) {
            console.trace = this.createConsoleWrapper('trace', 'INFO');
        }
        
        // 分组方法
        if (this.consoleCaptureConfig.captureGroup && this.originalConsole.group) {
            console.group = this.createConsoleWrapper('group', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureGroupCollapsed && this.originalConsole.groupCollapsed) {
            console.groupCollapsed = this.createConsoleWrapper('groupCollapsed', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureGroupEnd && this.originalConsole.groupEnd) {
            console.groupEnd = this.createConsoleWrapper('groupEnd', 'INFO');
        }
        
        // 计时方法
        if (this.consoleCaptureConfig.captureTime && this.originalConsole.time) {
            console.time = this.createConsoleWrapper('time', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureTimeEnd && this.originalConsole.timeEnd) {
            console.timeEnd = this.createConsoleWrapper('timeEnd', 'INFO');
        }
        
        // 计数方法
        if (this.consoleCaptureConfig.captureCount && this.originalConsole.count) {
            console.count = this.createConsoleWrapper('count', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureCountReset && this.originalConsole.countReset) {
            console.countReset = this.createConsoleWrapper('countReset', 'INFO');
        }
        
        // 其他控制台方法
        if (this.consoleCaptureConfig.captureClear && this.originalConsole.clear) {
            console.clear = this.createConsoleWrapper('clear', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureProfile && this.originalConsole.profile) {
            console.profile = this.createConsoleWrapper('profile', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureProfileEnd && this.originalConsole.profileEnd) {
            console.profileEnd = this.createConsoleWrapper('profileEnd', 'INFO');
        }
        
        if (this.consoleCaptureConfig.captureTimeStamp && this.originalConsole.timeStamp) {
            console.timeStamp = this.createConsoleWrapper('timeStamp', 'INFO');
        }
        
        // 非标准控制台方法
        if (this.originalConsole.exception) {
            (console as any).exception = this.createConsoleWrapper('exception', 'ERROR');
        }
        
        if (this.originalConsole.debugger) {
            (console as any).debugger = this.createConsoleWrapper('debugger', 'DEBUG');
        }
    }
    
    /**
     * 创建控制台方法包装器
     * @param methodName - 方法名称
     * @param logLevel - 日志等级
     * @returns 包装后的函数
     */
    private createConsoleWrapper(methodName: string, logLevel: string): (...args: any[]) => void {
        return (...args: any[]) => {
            // 记录到调试日志
            const message = this.formatConsoleArgs(args);
            
            // 只在错误级别及以上才获取堆栈跟踪
            const levelNum = this.levels[logLevel as keyof typeof this.levels] || 1;
            const stackTrace = levelNum >= this.levels.ERROR ? this.getStackTrace() : null;
            
            const extraData = {
                method: methodName,
                originalArgs: args,
                timestamp: new Date().toISOString(),
                stackTrace: stackTrace
            };
            
            this.log(`控制台.${methodName}: ${message}`, logLevel, extraData);
            
            // 调用原始控制台方法
            if (this.consoleCaptureConfig.preserveOriginal && this.originalConsole[methodName]) {
                try {
                    this.originalConsole[methodName].apply(console, args);
                } catch (error) {
                    this.error(`调用原始控制台方法 ${methodName} 失败`, { error });
                }
            }
        };
    }
    
    /**
     * 创建断言包装器
     * @returns 包装后的断言函数
     */
    private createAssertWrapper(): (assertion?: boolean, ...args: any[]) => void {
        return (assertion?: boolean, ...args: any[]) => {
            if (!assertion) {
                const message = args.length > 0 ? this.formatConsoleArgs(args) : 'Assertion failed';
                const extraData = {
                    method: 'assert',
                    assertion: assertion,
                    originalArgs: args,
                    stackTrace: this.getStackTrace()
                };
                
                this.log(`控制台.assert: ${message}`, 'ERROR', extraData);
            }
            
            // 调用原始断言方法
            if (this.consoleCaptureConfig.preserveOriginal && this.originalConsole.assert) {
                try {
                    this.originalConsole.assert.apply(console, [assertion, ...args]);
                } catch (error) {
                    this.error('调用原始控制台.assert失败', { error });
                }
            }
        };
    }
    
    /**
     * 格式化控制台参数
     * @param args - 参数数组
     * @returns 格式化后的字符串
     */
    private formatConsoleArgs(args: any[]): string {
        return args.map(arg => {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (typeof arg === 'object') {
                try {
                    if (arg instanceof Error) {
                        return `Error: ${arg.message}`;
                    }
                    return JSON.stringify(arg, this.getCircularReplacer());
                } catch (error) {
                    return `[Object: ${Object.prototype.toString.call(arg)}]`;
                }
            }
            return String(arg);
        }).join(' ');
    }
    
    /**
     * 处理循环引用的JSON序列化
     * @returns 替换函数
     */
    private getCircularReplacer(): (key: string, value: any) => any {
        const seen = new WeakSet();
        return (key: string, value: any) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular Reference]';
                }
                seen.add(value);
            }
            return value;
        };
    }
    
    /**
     * 控制台输出
     * @param logEntry - 日志条目
     */
    private consoleOutput(logEntry: LogEntry): void {
        if (!this.outPutConsole) return;

        const colors: { [key: string]: string } = {
            DEBUG: 'color: #888',
            INFO: 'color: #2196F3',
            WARN: 'color: #FF9800',
            ERROR: 'color: #F44336',
            CRITICAL: 'color: #9C27B0'
        };
        
        const color = colors[logEntry.levelName] || 'color: #000';
        
        // 安全检查：确保 originalConsole.log 是原始方法
        const safeConsoleLog = this.getSafeConsoleMethod('log');
        
        if (safeConsoleLog) {
            try {
                safeConsoleLog(
                    `%c[${logEntry.timeString}] [${logEntry.levelName}] ${logEntry.message}`,
                    color
                );
                
                if (logEntry.extraData) {
                    safeConsoleLog('额外数据:', logEntry.extraData);
                }
                
                // 错误和严重级别显示堆栈跟踪
                if (logEntry.level >= this.levels.ERROR && logEntry.stackTrace) {
                    safeConsoleLog('堆栈跟踪:', logEntry.stackTrace);
                }
            } catch (error) {
                // 如果安全方法也失败，使用最原始的控制台方法
                if (console && typeof console.log === 'function' && console.log !== this.createConsoleWrapper) {
                    console.log(`[安全模式] [${logEntry.timeString}] [${logEntry.levelName}] ${logEntry.message}`);
                }
            }
        } else {
            // 备用方案：使用未被重写的控制台方法
            if (console && typeof console.log === 'function' && console.log !== this.createConsoleWrapper) {
                console.log(`[备用模式] [${logEntry.timeString}] [${logEntry.levelName}] ${logEntry.message}`);
            }
        }
    }
    
    /**
     * 获取安全的控制台方法，避免循环调用
     * @param methodName - 方法名称
     * @returns 安全的控制台方法或null
     */
    private getSafeConsoleMethod(methodName: string): Function | null {
        // 检查 originalConsole 中是否有备份的方法
        if (this.originalConsole[methodName] && 
            typeof this.originalConsole[methodName] === 'function' &&
            this.originalConsole[methodName] !== (console as any)[methodName]) {
            return this.originalConsole[methodName];
        }
        
        // 如果备份的方法不可用，尝试获取未被重写的方法
        if (console && (console as any)[methodName] && 
            typeof (console as any)[methodName] === 'function' &&
            (console as any)[methodName] !== this.createConsoleWrapper &&
            !(console as any)[methodName].toString().includes('createConsoleWrapper')) {
            return (console as any)[methodName].bind(console);
        }
        
        return null;
    }
    
    /**
     * 快捷方法：调试级别日志
     * @param message - 消息
     * @param extraData - 额外数据
     */
    debug(message: string, extraData: any = null): LogEntry {
        return this.log(message, 'DEBUG', extraData);
    }
    
    /**
     * 快捷方法：信息级别日志
     * @param message - 消息
     * @param extraData - 额外数据
     */
    info(message: string, extraData: any = null): LogEntry {
        return this.log(message, 'INFO', extraData);
    }
    
    /**
     * 快捷方法：警告级别日志
     * @param message - 消息
     * @param extraData - 额外数据
     */
    warn(message: string, extraData: any = null): LogEntry {
        return this.log(message, 'WARN', extraData);
    }
    
    /**
     * 快捷方法：错误级别日志
     * @param message - 消息
     * @param extraData - 额外数据
     */
    error(message: string, extraData: any = null): LogEntry {
        return this.log(message, 'ERROR', extraData);
    }
    
    /**
     * 快捷方法：严重级别日志
     * @param message - 消息
     * @param extraData - 额外数据
     */
    critical(message: string, extraData: any = null): LogEntry {
        return this.log(message, 'CRITICAL', extraData);
    }
    
    /**
     * 获取所有日志
     * @returns 日志数组
     */
    getAllLogs(): LogEntry[] {
        return [...this.logs];
    }
    
    /**
     * 按等级过滤日志
     * @param level - 等级（数字或字符串）
     * @returns 过滤后的日志数组
     */
    getLogsByLevel(level: number | string): LogEntry[] {
        const levelNum = typeof level === 'string' ? this.levels[level.toUpperCase() as keyof typeof this.levels] || 1 : level;
        return this.logs.filter(log => log.level === levelNum);
    }
    
    /**
     * 获取最近N条日志
     * @param count - 数量
     * @returns 最近N条日志
     */
    getRecentLogs(count: number = 10): LogEntry[] {
        return this.logs.slice(-count);
    }
    
    /**
     * 搜索日志
     * @param keyword - 关键词
     * @returns 匹配的日志数组
     */
    searchLogs(keyword: string): LogEntry[] {
        return this.logs.filter(log => 
            log.message.includes(keyword) || 
            (log.extraData && JSON.stringify(log.extraData).includes(keyword))
        );
    }
    
    /**
     * 清空日志
     */
    clearLogs(): void {
        this.logs = [];
        console.log('调试日志已清空');
    }
    
    /**
     * 导出日志为JSON字符串
     * @returns JSON字符串
     */
    exportToJSON(): string {
        return JSON.stringify(this.logs, null, 2);
    }
    
    /**
     * 导出日志为文本格式
     * @returns 文本格式日志
     */
    exportToText(): string {
        return this.logs.map(log => 
            `[${log.timeString}] [${log.levelName}] ${log.message}` +
            (log.extraData ? `\n额外数据: ${JSON.stringify(log.extraData, null, 2)}` : '') +
            (log.level >= this.levels.ERROR ? `\n堆栈跟踪: ${log.stackTrace}` : '')
        ).join('\n\n');
    }
    
    /**
     * 保存日志到本地存储
     * @param key - 存储键名
     */
    saveToLocalStorage(key: string = 'debug_logs'): void {
        try {
            localStorage.setItem(key, this.exportToJSON());
            console.log(`日志已保存到本地存储 (${key})`);
        } catch (error) {
            console.error('保存日志到本地存储失败:', error);
        }
    }
    
    /**
     * 启用/禁用控制台捕获
     * @param enabled - 是否启用
     */
    setConsoleCapture(enabled: boolean): void {
        this.consoleCaptureConfig.enabled = enabled;
        
        if (enabled) {
            this.setupConsoleRedirection();
            this.info('控制台捕获已启用');
        } else {
            this.restoreOriginalConsole();
            this.info('控制台捕获已禁用');
        }
    }
    
    /**
     * 恢复原始控制台方法
     */
    private restoreOriginalConsole(): void {
        for (const method in this.originalConsole) {
            (console as any)[method] = this.originalConsole[method];
        }
    }
    
    /**
     * 更新控制台捕获配置
     * @param config - 新的配置
     */
    updateConsoleCaptureConfig(config: Partial<ConsoleCaptureConfig>): void {
        Object.assign(this.consoleCaptureConfig, config);
        
        // 重新设置重定向
        this.restoreOriginalConsole();
        this.setupConsoleRedirection();
        
        this.info('控制台捕获配置已更新', { config: this.consoleCaptureConfig });
    }
    
    /**
     * 获取控制台方法统计
     * @returns 统计信息
     */
    getConsoleStats(): any {
        const consoleLogs = this.logs.filter(log => 
            log.extraData && log.extraData.method
        );
        
        const stats = {
            totalConsoleCalls: consoleLogs.length,
            byMethod: {} as { [key: string]: number },
            byLevel: {} as { [key: string]: number }
        };
        
        // 按方法统计
        consoleLogs.forEach(log => {
            const method = log.extraData.method;
            stats.byMethod[method] = (stats.byMethod[method] || 0) + 1;
            
            // 按等级统计
            const level = log.levelName;
            stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * 获取控制台调用历史
     * @param limit - 限制数量
     * @returns 控制台调用历史
     */
    getConsoleHistory(limit: number = 50): any[] {
        return this.logs
            .filter(log => log.extraData && log.extraData.method)
            .slice(-limit)
            .map(log => ({
                time: log.timeString,
                method: log.extraData.method,
                message: log.message,
                level: log.levelName
            }));
    }
    
    /**
     * 获取统计信息
     * @returns 统计信息对象
     */
    getStats(): any {
        const stats = {
            total: this.logs.length,
            byLevel: {} as { [key: string]: number },
            lastLogTime: this.logs.length > 0 ? this.logs[this.logs.length - 1].timeString : null,
            firstLogTime: this.logs.length > 0 ? this.logs[0].timeString : null,
            consoleStats: this.getConsoleStats()
        };
        
        // 按等级统计
        for (const levelName in this.levels) {
            stats.byLevel[levelName] = this.getLogsByLevel(levelName).length;
        }
        
        return stats;
    }
}

// 全局调试日志实例
export const debugLogger = new DebugLogger();

// 挂载到 runtime
appConfig.runtime.debugLogger = debugLogger;