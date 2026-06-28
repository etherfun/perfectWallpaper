/**
 * 集中化 #player_control 区域的 DOM 元素引用。
 *
 * Phase 8+ 把 widget 渲染交给 Vue。#player_control 在 module-load 时
 * 还不存在（旧 const 缓存 null 模式）。这里改用 let + refresh：
 * 在 main.ts 的 app.mount 之后调用 refreshDomRefs() 重新查询 DOM。
 *
 * 调用约定保持兼容：
 *   - import { player_control } from './domRefs' 仍然有效
 *   - 用法保持 player_control.style.xxx（不需要 null check）
 *   - ES module 的 import 是 live binding，refresh 后引用会更新
 */
import { elements } from '@/utils/elementManager';

/**
 * 类型：HTMLElement 强制非 null。运行时如果 refresh 之前被访问仍可能为 null，
 * 但调用点内部已有 if (!player_control) return 兜底（Phase 1 既定模式）。
 */
export let player_control: HTMLElement = null as unknown as HTMLElement;
export let player_control_background: HTMLElement = null as unknown as HTMLElement;
export let player_control_thumbnail: HTMLImageElement =
    null as unknown as HTMLImageElement;
export let player_control_thumbnailWrap: HTMLElement = null as unknown as HTMLElement;
export let player_control_info: HTMLElement = null as unknown as HTMLElement;
export let player_control_title: HTMLElement = null as unknown as HTMLElement;
export let player_control_artist: HTMLElement = null as unknown as HTMLElement;
export let player_control_albumTitle: HTMLElement = null as unknown as HTMLElement;
export let player_control_timeline: HTMLElement = null as unknown as HTMLElement;
export let player_control_aubar: HTMLCanvasElement = null as unknown as HTMLCanvasElement;

/**
 * 重新查询 #player_control 区域的所有 DOM 引用。
 * 在 main.ts 的 app.mount(root) 之后调用，保证 Vue 渲染完成后
 * 引用指向真实节点。
 */
export function refreshDomRefs(): void {
    player_control = elements.playerControl.container;
    player_control_background = elements.playerControl.background;
    player_control_thumbnail = elements.playerControl.thumbnail;
    player_control_thumbnailWrap = elements.playerControl.thumbnailWrap;
    player_control_info = elements.playerControl.info;
    player_control_title = elements.playerControl.title;
    player_control_artist = elements.playerControl.artist;
    player_control_albumTitle = elements.playerControl.albumTitle;
    player_control_timeline = elements.playerControl.timeline;
    player_control_aubar = elements.playerControl.aubar;
}