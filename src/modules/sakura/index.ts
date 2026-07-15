/**
 * 樱花效果 - 公开 API 入口
 *
 * 保持与原 src/sakura.ts 完全兼容的导入面：
 *   import * as sakura from '@/modules/sakura'
 *   import { removesakura } from '@/modules/sakura'
 *
 * @/sakura 自动解析到本 index.ts，外部零修改。
 */

export { animate, getAnimating, setAnimating, stepAnimation, toggleAnimation } from './effect/animation';
export {
    applySakuraTransparency,
    initSakura,
    makeCanvasFullScreen,
    makeCanvasHide,
    removesakura,
    sakuraLoad,
    sakuraReLoadEffect,
    sakuraResize,
} from './render/sakura';
export { Matrix44, Vector3 } from '@/utils/webgl-math';
