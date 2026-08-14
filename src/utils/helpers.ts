/**
 * propertyHandlers 共用工具
 */
import { debugLogger } from './logger';

/** 在 FirstLoad 时输出 "参数初始化完成" 日志 */
export function logInitComplete(tag: string, displayName: string, FirstLoad: boolean): void {
    if (FirstLoad) { debugLogger.info(`${tag} ${displayName}参数初始化完成`); }
}
