/**
 * propertyHandlers 共用工具
 *
 * 每个 handler 末尾的 `if (FirstLoad) debugLogger.info(...)` 模式重复 14+ 次。
 * logInitComplete 把这段样板代码集中。
 *
 * 不做"统一导入桶" — 每个 handler 仍然按需 import 自己用到的模块（避免
 * 引入隐式依赖，方便后续拆分时定位）。
 */

import { debugLogger } from './logger';

/**
 * 在 FirstLoad 时输出"参数初始化完成"日志
 * @param tag 模块标签，例如 '[Background]'、'[Hitokoto]'
 * @param displayName 参数显示名，例如 '背景'、'一言'
 * @param FirstLoad 是否首次加载
 */
export function logInitComplete(tag: string, displayName: string, FirstLoad: boolean): void {
    if (FirstLoad) {
        debugLogger.info(`${tag} ${displayName}参数初始化完成`);
    }
}
