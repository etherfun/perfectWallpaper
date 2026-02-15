
/**
 * 调试日志保存器
 * 用于保存报错日志到变量中，包含时间戳和重要等级
 */
class DebugLogger {
    constructor() {
        this.outPutConsole = false

        this.logs = [];
        this.maxLogs = 1000; // 最大保存日志数量
        
        // 静态标志，用于避免递归调用
        if (!DebugLogger._gettingStackTrace) {
            DebugLogger._gettingStackTrace = false;
        }
        
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            CRITICAL: 4
        };
        
        // 控制台捕获配置
        this.consoleCaptureConfig = {
            enabled: true,
            captureLog: true,
            captureWarn: true,
            captureError: true,
            captureInfo: true,
            captureDebug: true,
            captureAssert: true,
            captureDir: true,
            captureDirxml: true,
            captureTable: true,
            captureTrace: true,
            captureGroup: true,
            captureGroupCollapsed: true,
            captureGroupEnd: true,
            captureTime: true,
            captureTimeEnd: true,
            captureCount: true,
            captureCountReset: true,
            captureClear: true,     // 新增：捕获 console.clear
            captureProfile: true,   // 新增：捕获 console.profile
            captureProfileEnd: true, // 新增：捕获 console.profileEnd
            captureTimeStamp: true, // 新增：捕获 console.timeStamp
            preserveOriginal: true, // 保留原始控制台输出
            logOriginalCall: false, // 是否记录原始调用信息
            captureBrowserErrors: true // 新增：捕获浏览器直接输出的错误
        };
        
        // 原始控制台方法备份
        this.originalConsole = {};
        
        // 绑定到全局对象以便其他文件访问
        window.DebugLogger = DebugLogger;
        window.debugLogger = this;
        
        // 初始化控制台捕获
        this.initConsoleCapture();
    }
    
    /**
     * 添加日志
     * @param {string} message - 日志消息
     * @param {number|string} level - 日志等级（数字或字符串）
     * @param {Object} extraData - 额外数据
     * @returns {Object} 日志对象
     */
    log(message, level = 'INFO', extraData = null) {
        const timestamp = new Date();
        const levelNum = typeof level === 'string' ? this.levels[level.toUpperCase()] || 1 : level;
        const levelName = typeof level === 'string' ? level.toUpperCase() : this.getLevelName(level);
        
        // 只在错误级别及以上才获取堆栈跟踪，避免递归调用
        const stackTrace = levelNum >= this.levels.ERROR ? this.getStackTrace() : null;
        
        const logEntry = {
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
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的时间字符串
     */
    formatTimestamp(date) {
        const year = date.getFullYear();
        const month = add0(date.getMonth() + 1);
        const day = add0(date.getDate());
        const hours = add0(date.getHours());
        const minutes = add0(date.getMinutes());
        const seconds = add0(date.getSeconds());
        const milliseconds = add0(date.getMilliseconds(), 3);
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    
    /**
     * 根据等级数字获取等级名称
     * @param {number} level - 等级数字
     * @returns {string} 等级名称
     */
    getLevelName(level) {
        for (const [name, value] of Object.entries(this.levels)) {
            if (value === level) return name;
        }
        return 'UNKNOWN';
    }
    
    /**
     * 安全地获取堆栈跟踪，避免触发错误处理器
     * @returns {string|null} 堆栈跟踪或null
     */
    getStackTrace() {
        // 直接返回null，避免创建Error对象触发递归
        return null;
        
        // 注意：在Wallpaper Engine环境中，创建Error对象可能会触发错误处理器
        // 导致递归调用。为了安全起见，我们直接返回null。
        // 如果需要堆栈跟踪，可以在非错误处理器上下文中使用其他方式获取。
    }
    
    /**
     * 初始化控制台捕获
     */
    initConsoleCapture() {
        if (!this.consoleCaptureConfig.enabled) return;
        
        // 备份所有原始控制台方法
        const consoleMethods = [
            'log', 'warn', 'error', 'info', 'debug', 'assert',
            'dir', 'dirxml', 'table', 'trace', 'group', 'groupCollapsed',
            'groupEnd', 'time', 'timeEnd', 'count', 'countReset',
            'clear', 'profile', 'profileEnd', 'timeStamp',
            'exception', 'debugger' // 新增：捕获更多控制台方法
        ];
        
        consoleMethods.forEach(method => {
            if (console[method]) {
                this.originalConsole[method] = console[method].bind(console);
            }
        });
        
        // 备份 console.exception（某些浏览器的非标准方法）
        if (console.exception && !this.originalConsole.exception) {
            this.originalConsole.exception = console.exception.bind(console);
        }
        
        // 备份 console.debugger（某些浏览器的非标准方法）
        if (console.debugger && !this.originalConsole.debugger) {
            this.originalConsole.debugger = console.debugger.bind(console);
        }
        
        // 重定向控制台方法
        this.setupConsoleRedirection();
    }
    
    /**
     * 设置控制台重定向
     */
    setupConsoleRedirection() {
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
            console.exception = this.createConsoleWrapper('exception', 'ERROR');
        }
        
        if (this.originalConsole.debugger) {
            console.debugger = this.createConsoleWrapper('debugger', 'DEBUG');
        }
    }
    
    /**
     * 创建控制台方法包装器
     * @param {string} methodName - 方法名称
     * @param {string} logLevel - 日志等级
     * @returns {Function} 包装后的函数
     */
    createConsoleWrapper(methodName, logLevel) {
        return (...args) => {
            // 记录到调试日志
            const message = this.formatConsoleArgs(args);
            
            // 只在错误级别及以上才获取堆栈跟踪
            const levelNum = this.levels[logLevel] || 1;
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
     * @returns {Function} 包装后的断言函数
     */
    createAssertWrapper() {
        return (assertion, ...args) => {
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
     * @param {Array} args - 参数数组
     * @returns {string} 格式化后的字符串
     */
    formatConsoleArgs(args) {
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
     * @returns {Function} 替换函数
     */
    getCircularReplacer() {
        const seen = new WeakSet();
        return (key, value) => {
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
     * @param {Object} logEntry - 日志条目
     */
    consoleOutput(logEntry) {
        if (!this.outPutConsole) return;

        const colors = {
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
     * @param {string} methodName - 方法名称
     * @returns {Function|null} 安全的控制台方法或null
     */
    getSafeConsoleMethod(methodName) {
        // 检查 originalConsole 中是否有备份的方法
        if (this.originalConsole[methodName] && 
            typeof this.originalConsole[methodName] === 'function' &&
            this.originalConsole[methodName] !== console[methodName]) {
            return this.originalConsole[methodName];
        }
        
        // 如果备份的方法不可用，尝试获取未被重写的方法
        if (console && console[methodName] && 
            typeof console[methodName] === 'function' &&
            console[methodName] !== this.createConsoleWrapper &&
            !console[methodName].toString().includes('createConsoleWrapper')) {
            return console[methodName].bind(console);
        }
        
        return null;
    }
    
    /**
     * 快捷方法：调试级别日志
     * @param {string} message - 消息
     * @param {Object} extraData - 额外数据
     */
    debug(message, extraData = null) {
        return this.log(message, 'DEBUG', extraData);
    }
    
    /**
     * 快捷方法：信息级别日志
     * @param {string} message - 消息
     * @param {Object} extraData - 额外数据
     */
    info(message, extraData = null) {
        return this.log(message, 'INFO', extraData);
    }
    
    /**
     * 快捷方法：警告级别日志
     * @param {string} message - 消息
     * @param {Object} extraData - 额外数据
     */
    warn(message, extraData = null) {
        return this.log(message, 'WARN', extraData);
    }
    
    /**
     * 快捷方法：错误级别日志
     * @param {string} message - 消息
     * @param {Object} extraData - 额外数据
     */
    error(message, extraData = null) {
        return this.log(message, 'ERROR', extraData);
    }
    
    /**
     * 快捷方法：严重级别日志
     * @param {string} message - 消息
     * @param {Object} extraData - 额外数据
     */
    critical(message, extraData = null) {
        return this.log(message, 'CRITICAL', extraData);
    }
    
    /**
     * 获取所有日志
     * @returns {Array} 日志数组
     */
    getAllLogs() {
        return [...this.logs];
    }
    
    /**
     * 按等级过滤日志
     * @param {number|string} level - 等级（数字或字符串）
     * @returns {Array} 过滤后的日志数组
     */
    getLogsByLevel(level) {
        const levelNum = typeof level === 'string' ? this.levels[level.toUpperCase()] || 1 : level;
        return this.logs.filter(log => log.level === levelNum);
    }
    
    /**
     * 获取最近N条日志
     * @param {number} count - 数量
     * @returns {Array} 最近N条日志
     */
    getRecentLogs(count = 10) {
        return this.logs.slice(-count);
    }
    
    /**
     * 搜索日志
     * @param {string} keyword - 关键词
     * @returns {Array} 匹配的日志数组
     */
    searchLogs(keyword) {
        return this.logs.filter(log => 
            log.message.includes(keyword) || 
            (log.extraData && JSON.stringify(log.extraData).includes(keyword))
        );
    }
    
    /**
     * 清空日志
     */
    clearLogs() {
        this.logs = [];
        console.log('调试日志已清空');
    }
    
    /**
     * 导出日志为JSON字符串
     * @returns {string} JSON字符串
     */
    exportToJSON() {
        return JSON.stringify(this.logs, null, 2);
    }
    
    /**
     * 导出日志为文本格式
     * @returns {string} 文本格式日志
     */
    exportToText() {
        return this.logs.map(log => 
            `[${log.timeString}] [${log.levelName}] ${log.message}` +
            (log.extraData ? `\n额外数据: ${JSON.stringify(log.extraData, null, 2)}` : '') +
            (log.level >= this.levels.ERROR ? `\n堆栈跟踪: ${log.stackTrace}` : '')
        ).join('\n\n');
    }
    
    /**
     * 保存日志到本地存储
     * @param {string} key - 存储键名
     */
    saveToLocalStorage(key = 'debug_logs') {
        try {
            localStorage.setItem(key, this.exportToJSON());
            console.log(`日志已保存到本地存储 (${key})`);
        } catch (error) {
            console.error('保存日志到本地存储失败:', error);
        }
    }
    
    /**
     * 启用/禁用控制台捕获
     * @param {boolean} enabled - 是否启用
     */
    setConsoleCapture(enabled) {
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
    restoreOriginalConsole() {
        for (const method in this.originalConsole) {
            console[method] = this.originalConsole[method];
        }
    }
    
    /**
     * 更新控制台捕获配置
     * @param {Object} config - 新的配置
     */
    updateConsoleCaptureConfig(config) {
        Object.assign(this.consoleCaptureConfig, config);
        
        // 重新设置重定向
        this.restoreOriginalConsole();
        this.setupConsoleRedirection();
        
        this.info('控制台捕获配置已更新', { config: this.consoleCaptureConfig });
    }
    
    /**
     * 获取控制台方法统计
     * @returns {Object} 统计信息
     */
    getConsoleStats() {
        const consoleLogs = this.logs.filter(log => 
            log.extraData && log.extraData.method
        );
        
        const stats = {
            totalConsoleCalls: consoleLogs.length,
            byMethod: {},
            byLevel: {}
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
     * @param {number} limit - 限制数量
     * @returns {Array} 控制台调用历史
     */
    getConsoleHistory(limit = 50) {
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
     * @returns {Object} 统计信息对象
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
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
var debugLogger = new DebugLogger();

// 全局错误捕获
window.addEventListener('error', function(event) {
    debugLogger.error(`未捕获的错误: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

window.addEventListener('unhandledrejection', function(event) {
    debugLogger.error(`未处理的Promise拒绝: ${event.reason}`, {
        reason: event.reason
    });
});

/**给元素添加颜色 */
function Element_effects_color(TorF, Element, Element_color, Element_blurcolor) {

    Element.style.color = 'rgb(' + Element_color + ')';

    if (TorF) {
        Element.style.textShadow = '0 0 20px rgb(' + Element_blurcolor + ')';
    } else {
        Element.style.textShadow = null
    }
}

/**给元素添加亚克力效果 */
function Element_effects_yakeli(TorF, Element, Element_yakeli, Element_yakelicolor, Element_bluryakeli) {
    if (TorF) {
        Element.style.background = "rgba(" + Element_yakelicolor + "," + Element_yakeli + ")"
        Element.style.backdropFilter = "blur(" + Element_bluryakeli + "px)"
    } else {
        Element.style.background = null
        Element.style.backdropFilter = null
    }
}

/**数字不足指定位数则加"0" */
function add0(n, digits = 2) {
    let str = n.toString();
    while (str.length < digits) {
        str = '0' + str;
    }
    return str;
}

/**Hex转化为16位 */
function hexToRgb(hexColor) {
    var colorCode = hexColor.replace("#", "");

    var r = parseInt(colorCode.substring(0, 2), 16);
    var g = parseInt(colorCode.substring(2, 4), 16);
    var b = parseInt(colorCode.substring(4, 6), 16);

    return [r, g, b];

}

/** i18n */
let i18n_data = null;

async function load_i18n_data() {
    try {
        const res = await fetch(`i18n/${globalSettingsLanguage}.json`);
        if (!res.ok) {
            debugLogger.warn(`Language file ${globalSettingsLanguage}.json not found, falling back to en-US`);
            current_lang = 'en-US';
            const fallbackRes = await fetch(`i18n/en-US.json`);
            i18n_data = await fallbackRes.json();
        } else {
            i18n_data = await res.json();
        }
        
        // 初始化i18n更新
        initI18nUpdate();
    } catch (error) {
        debugLogger.error('Failed to load i18n data:', error);
    }
}

/** 初始化i18n更新系统 */
function initI18nUpdate() {
    // 立即更新现有元素
    updateAllI18nElements();
    
    // 初始化MutationObserver监听DOM变化
    initI18nObserver();
    
    // 添加一个延迟的二次更新，确保所有动态内容都已加载
    setTimeout(() => {
        updateAllI18nElements();
    }, 5000);
}

load_i18n_data();

function i18n(key) {
    if (!i18n_data) {
        debugLogger.warn('i18n data not loaded yet')
        return key;
    }
    return i18n_data[key] || key;
}

/** 自动更新所有带有 data-i18n 属性的元素 */
function updateAllI18nElements() {
    if (!i18n_data) return;

    processElements(document.querySelectorAll('[data-i18n]'));

    document.querySelectorAll('template').forEach(template => {
        if (template.content) {
            debugLogger.info('Processing template for i18n')
            processElements(template.content.querySelectorAll('[data-i18n]'));
        }
    });

    // 更新页面标题
    const pageTitleElement = document.getElementById('page-title');
    if (pageTitleElement) {
        pageTitleElement.textContent = i18n('app_title');
    }
}

/** 初始化MutationObserver监听DOM变化 */
let i18nObserver = null;
let i18nUpdateTimeout = null;
let pendingMutations = [];

function initI18nObserver() {
    if (i18nObserver) {
        i18nObserver.disconnect();
    }

    // 创建MutationObserver实例
    i18nObserver = new MutationObserver((mutations) => {
        // 收集所有变化
        pendingMutations.push(...mutations);
        
        // 智能防抖处理：根据变化数量决定延迟时间
        clearTimeout(i18nUpdateTimeout);
        
        // 如果变化很多，给更多时间收集所有变化
        const delay = mutations.length > 5 ? 200 : 100;
        
        i18nUpdateTimeout = setTimeout(() => {
            if (pendingMutations.length > 0) {
                handleDomMutations(pendingMutations);
                pendingMutations = []; // 清空已处理的变更
            }
        }, delay);
    });

    // 配置观察选项
    const observerConfig = {
        childList: true,      // 观察子节点的添加或删除
        subtree: true,        // 观察所有后代节点
        attributes: true,     // 观察属性变化
        attributeFilter: ['data-i18n'] // 只观察data-i18n属性变化
    };

    // 开始观察整个文档
    i18nObserver.observe(document.documentElement, observerConfig);
    
    debugLogger.info('i18n MutationObserver initialized');
}

/** 处理DOM变化 */
function handleDomMutations(mutations) {
    if (!i18n_data) return;

    const elementsToUpdate = new Set();

    mutations.forEach(mutation => {
        // 处理新增的节点
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // 检查节点本身是否有data-i18n属性
                    if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                        elementsToUpdate.add(node);
                    }
                    
                    // 检查节点的后代元素是否有data-i18n属性
                    const i18nElements = node.querySelectorAll ? node.querySelectorAll('[data-i18n]') : [];
                    i18nElements.forEach(el => elementsToUpdate.add(el));
                }
            });
        }
        
        // 处理属性变化
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-i18n') {
            elementsToUpdate.add(mutation.target);
        }
    });

    // 如果有需要更新的元素，进行处理
    if (elementsToUpdate.size > 0) {
        processElements(Array.from(elementsToUpdate));
    }
}

/** 停止监听DOM变化 */
function stopI18nObserver() {
    if (i18nObserver) {
        i18nObserver.disconnect();
        i18nObserver = null;
    }
    clearTimeout(i18nUpdateTimeout);
}

/** 处理元素集合的通用函数 */
function processElements(elements) {
    const processedElements = new Set();
    
    elements.forEach(element => {
        // 跳过已处理的元素
        if (processedElements.has(element)) {
            return;
        }
        
        const key = element.getAttribute('data-i18n');
        if (!key) {
            return; // 如果没有data-i18n属性，跳过
        }
        
        const translation = i18n(key);
        
        // 检查是否需要更新（避免不必要的DOM操作）
        const currentText = element.textContent || '';
        if (currentText === translation && translation !== key) {
            processedElements.add(element);
            return; // 文本已经是最新翻译，跳过
        }

        if (element.children.length > 0) {
            const textNodes = Array.from(element.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE);

            if (textNodes.length > 0) {
                textNodes[0].textContent = translation;
            } else {
                element.insertBefore(
                    document.createTextNode(translation),
                    element.firstChild
                );
            }
        } else {
            element.textContent = translation;
        }
        
        processedElements.add(element);
    });
    
    return processedElements.size; // 返回实际处理的元素数量
}

/**天气请求数量检查 */
function weather_paymode() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();

    const usageData = JSON.parse(localStorage.getItem('UsageData') || '{}');
    localStorage.removeItem('UseNumber');

    if (currentDate === 1 || usageData.month !== currentMonth) {
        usageData.count = 0;
        usageData.month = currentMonth;
    }

    if (usageData.count >= 50000) {
        debugLogger.warn('Weather api over Usage')
        return true; // 需要付费
    }

    usageData.count = (usageData.count || 0) + 1;
    localStorage.setItem('UsageData', JSON.stringify(usageData));
}

/**
 * 如果失败多次重试fetch请求
 * @param {string} url url地址
 * @param {{}} options 传递请求头
 * @param {number} maxRetries 重试次数
 * @returns 
 */
function fetch_with_retry(url, options = {}, maxRetries = 3) {
    return new Promise((resolve, reject) => {
        const attempt = (retryCount) => {
            fetch(url, options)
                .then(async response => {
                    if (!response.ok) {
                        const errorMsg = typeof get_i18n_text === 'function'
                            ? String(await get_i18n_text(error_get_weather_data))
                            : '获取天气数据失败';
                            debugLogger.warn("Get weather feli")
                        throw new Error(`${errorMsg} HTTP ${response.status}`);
                    }
                    return response;
                })
                .then(resolve)
                .catch(error => {
                    if (retryCount < maxRetries) {
                        debugLogger.warn(`${url} 第 ${retryCount + 1} 次重试...`);
                        const delay = Math.pow(4, retryCount) * 2000;
                        setTimeout(() => attempt(retryCount + 1), delay);
                    } else {
                        debugLogger.warn(`${url} Get weather feli`)
                        reject(error);
                    }
                });
        };

        attempt(0);
    });
}
/**格式化时间 */
function getTime(timestamp, seconds = true) {
    let format = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        seconds: '',
        hour12: false
    }
    if (seconds) {
        format.seconds = '2-digit';
    }

    return timestamp.toLocaleString(undefined, format).replace(/\//g, '-');
}

/**
 * 根据 VisualCrossing icon 和昼夜状态获取和风 iconId
 * @param {string} vcIcon VisualCrossing icon
 * @param {boolean} isNight 是否夜晚
 * @returns {number} 和风天气 iconId
 */
function getQWeatherIcon(vcIcon, isNight) {
    if (!vcIcon) return 999;

    const rule = VC_ICON_TO_QWEATHER[vcIcon];
    if (!rule) return 999;

    return isNight ? rule.night : rule.day;
}

/**
 * 判断当前时间是否夜晚
 * @param {string} nowTime - 当前时间 "HH:MM:SS"
 * @param {string} sunrise - 日出时间 "HH:MM:SS"
 * @param {string} sunset - 日落时间 "HH:MM:SS"
 * @returns {boolean} - true 表示夜晚，false 表示白天
 */
function isNightTime(nowTime, sunrise, sunset) {
    const toMinutes = t => {
        const [hours, minutes, seconds] = t.split(":").map(Number);
        return hours * 60 + minutes + seconds / 60;
    };
    const now = toMinutes(nowTime);
    const rise = toMinutes(sunrise);
    const set = toMinutes(sunset);
    return now < rise || now > set;
}

/**
 * 多定时器管理器类（支持暂停）
 * 管理多个setTimeout定时器，每个定时器可独立控制
 */
class MultiTimerManager {
    constructor() {
        // 存储所有定时器：key -> 定时器对象
        this.timers = new Map();
        // 计数器，用于生成唯一ID
        this.counter = 0;
    }

    /**
     * 创建并启动一个定时器
     * @param {Function} callback - 回调函数
     * @param {number} delay - 延迟时间(毫秒)
     * @param {string} [name] - 定时器名称（可选，不指定则自动生成）
     * @returns {string} 定时器ID
     */
    create(callback, delay, name) {
        const timerId = name || `timer_${++this.counter}`;
        
        // 如果已存在同名定时器，先清除
        if (this.timers.has(timerId)) {
            this.remove(timerId);
        }

        const timerObj = {
            id: timerId,
            callback,
            delay,
            remaining: delay,      // 剩余时间
            startTime: Date.now(), // 开始时间
            timerId: null,         // 原生定时器ID
            isPaused: false,       // 是否暂停
            isActive: true,        // 是否激活
            status: 'running',     // 状态：running, paused, finished
        };

        // 设置原生定时器
        timerObj.timerId = setTimeout(() => {
            this._executeTimer(timerId);
        }, delay);

        // 存储定时器
        this.timers.set(timerId, timerObj);
        debugLogger.info(`定时器 "${timerId}" 已启动，${delay}ms后执行`);
        
        return timerId;
    }

    /**
     * 暂停定时器
     * @param {string} timerId - 定时器ID
     * @returns {boolean} 是否成功
     */
    pause(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer || !timer.isActive || timer.isPaused) {
            debugLogger.warn(`定时器 "${timerId}" 不存在、未激活或已暂停`);
            return false;
        }

        // 计算已运行的时间
        const elapsed = Date.now() - timer.startTime;
        timer.remaining = Math.max(0, timer.remaining - elapsed);
        
        // 清除原生定时器
        clearTimeout(timer.timerId);
        timer.timerId = null;
        timer.isPaused = true;
        timer.status = 'paused';
        
        debugLogger.info(`定时器 "${timerId}" 已暂停，剩余 ${timer.remaining}ms`);
        return true;
    }

    /**
     * 恢复定时器
     * @param {string} timerId - 定时器ID
     * @returns {boolean} 是否成功
     */
    resume(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer || !timer.isActive || !timer.isPaused) {
            debugLogger.warn(`定时器 "${timerId}" 不存在、未激活或未暂停`);
            return false;
        }

        // 重新设置定时器
        timer.startTime = Date.now();
        timer.isPaused = false;
        timer.status = 'running';
        
        timer.timerId = setTimeout(() => {
            this._executeTimer(timerId);
        }, timer.remaining);

        debugLogger.info(`定时器 "${timerId}" 已恢复，${timer.remaining}ms后执行`);
        return true;
    }

    /**
     * 清除定时器
     * @param {string} timerId - 定时器ID
     * @returns {boolean} 是否成功
     */
    remove(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer) {
            return false;
        }

        // 清除原生定时器
        if (timer.timerId) {
            clearTimeout(timer.timerId);
        }

        // 从Map中移除
        this.timers.delete(timerId);
        debugLogger.info(`定时器 "${timerId}" 已清除`);
        return true;
    }

    /**
     * 获取所有定时器状态
     * @returns {Array} 定时器状态列表
     */
    getAllStatus() {
        const statusList = [];
        for (const [id, timer] of this.timers) {
            let remaining = timer.remaining;
            
            // 如果正在运行，重新计算剩余时间
            if (timer.isActive && !timer.isPaused) {
                const elapsed = Date.now() - timer.startTime;
                remaining = Math.max(0, timer.remaining - elapsed);
            }
            
            statusList.push({
                id: timer.id,
                name: timer.id,
                status: timer.status,
                delay: timer.delay,
                remaining: remaining,
                progress: timer.delay > 0 ? 
                    ((timer.delay - remaining) / timer.delay * 100).toFixed(1) + '%' : '100%',
                isActive: timer.isActive,
                isPaused: timer.isPaused
            });
        }
        return statusList;
    }

    /**
     * 获取单个定时器状态
     * @param {string} timerId - 定时器ID
     * @returns {Object|null} 定时器状态
     */
    getStatus(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer) return null;

        let remaining = timer.remaining;
        if (timer.isActive && !timer.isPaused) {
            const elapsed = Date.now() - timer.startTime;
            remaining = Math.max(0, timer.remaining - elapsed);
        }

        return {
            id: timer.id,
            status: timer.status,
            delay: timer.delay,
            remaining: remaining,
            progress: timer.delay > 0 ? 
                ((timer.delay - remaining) / timer.delay * 100).toFixed(1) + '%' : '100%',
            isActive: timer.isActive,
            isPaused: timer.isPaused
        };
    }

    /**
     * 清除所有定时器
     */
    clearAll() {
        for (const [id, timer] of this.timers) {
            if (timer.timerId) {
                clearTimeout(timer.timerId);
            }
        }
        this.timers.clear();
        debugLogger.info('所有定时器已清除');
    }

    /**
     * 暂停所有定时器
     */
    pauseAll() {
        for (const [id] of this.timers) {
            this.pause(id);
        }
        debugLogger.info('所有定时器已暂停');
    }

    /**
     * 恢复所有定时器
     */
    resumeAll() {
        for (const [id] of this.timers) {
            this.resume(id);
        }
        debugLogger.info('所有定时器已恢复');
    }

    /**
     * 执行定时器回调（内部方法）
     * @param {string} timerId - 定时器ID
     */
    _executeTimer(timerId) {
        const timer = this.timers.get(timerId);
        if (!timer) return;

        // 检查动画状态
        const checkAnimationState = () => {
            if (document.body.style.animationPlayState === 'paused') {
                // 动画暂停中，无限等待动画恢复
                debugLogger.info(`定时器 "${timerId}" 等待动画恢复播放...`);
                
                // 监听动画状态变化
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'style' && 
                            document.body.style.animationPlayState !== 'paused') {
                            // 动画已恢复播放，停止监听并执行回调
                            observer.disconnect();
                            executeTimerCallback();
                        }
                    });
                });

                // 开始监听body元素的style属性变化
                observer.observe(document.body, {
                    attributes: true,
                    attributeFilter: ['style']
                });
            } else {
                // 动画正在播放，直接执行回调
                executeTimerCallback();
            }
        };

        // 执行定时器回调的实际函数
        const executeTimerCallback = () => {
            try {
                this.timers.delete(timerId);
                // 执行回调
                timer.callback();
                timer.status = 'finished';
                timer.isActive = false;

                debugLogger.info(`定时器 "${timerId}" 执行完成`);
            } catch (error) {
                debugLogger.error(`定时器 "${timerId}" 执行出错:`, error);
                timer.status = 'error';
            }
        };

        // 开始检查动画状态
        checkAnimationState();
    }
}

window.MultiTimerManager = MultiTimerManager;
var timerManager = new MultiTimerManager();

/**
 * 等待条件成立后执行函数
 * @param {Function} conditionFn - 条件检测函数，返回true时执行
 * @param {Function} actionFn - 条件成立后要执行的函数
 * @param {number} interval - 检查间隔(毫秒)
 * @param {number} timeout - 超时时间(毫秒)
 * @returns {Promise} 返回Promise，在actionFn执行后resolve
 */
function waitAndExecute(conditionFn, actionFn, interval = 100, timeout = 20000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
            try {
                const conditionMet = conditionFn();
                
                if (conditionMet === true) {
                    const result = actionFn();
                    resolve(result);
                } else if (Date.now() - startTime > timeout) {
                    debugLogger.error('等待条件超时');
                    reject(new Error('等待条件超时'));
                } else {
                    setTimeout(check, interval);
                }
            } catch (error) {
                debugLogger.error(`条件检测失败: ${error.message}`);
                reject(new Error(`条件检测失败: ${error.message}`));
            }
        };
        
        check();
    });
}

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间(毫秒)
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖处理后的函数
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    
    return function executedFunction(...args) {
        const context = this;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        
        const callNow = immediate && !timeout;
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        
        if (callNow) func.apply(context, args);
    };
}

/**
 * 节流函数
 * @param {Function} func - 需要节流的函数
 * @param {number} limit - 限制时间(毫秒)
 * @returns {Function} 节流处理后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    
    return function(...args) {
        const context = this;
        
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}