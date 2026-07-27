/**
 * Pinia 早期初始化 — 必须在所有模块级 useXxxStore() 调用之前运行。
 *
 * bundle.ts 将其作为第一个 import，利用 ES module 的 DFS 求值顺序
 * 确保 setActivePinia() 先于任何 store 消费者执行。
 */
import { createPinia, setActivePinia } from 'pinia';

const pinia = createPinia();
setActivePinia(pinia);

export { pinia };