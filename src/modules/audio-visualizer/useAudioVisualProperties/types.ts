/**
 * useAudioVisualProperties 拆分辅助 — 共享类型定义
 */

import { useConfigStore } from '@/stores/config';
import type { RuntimeStoreState } from '@/stores/types';

/** Config store 实例类型 */
export type ConfigStore = ReturnType<typeof useConfigStore>;
/** PWCircle 渲染参数（runtimeStore.param） */
export type CircleParam = RuntimeStoreState['param'];
/** PWLine 渲染参数（runtimeStore.PWLineParam） */
export type LineParam = RuntimeStoreState['PWLineParam'];
