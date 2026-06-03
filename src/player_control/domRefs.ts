/**
 * 集中化 #player_control 区域的 DOM 元素引用。
 *
 * 直接从 elementManager 解构而来，便于子模块共用，
 * 避免每个文件重复访问 `elements.playerControl.*`。
 */
import { elements } from '@/utils/elementManager';

export const player_control = elements.playerControl.container;
export const player_control_background = elements.playerControl.background;
export const player_control_thumbnail = elements.playerControl.thumbnail;
export const player_control_thumbnailWrap = elements.playerControl.thumbnailWrap;
export const player_control_info = elements.playerControl.info;
export const player_control_title = elements.playerControl.title;
export const player_control_artist = elements.playerControl.artist;
export const player_control_albumTitle = elements.playerControl.albumTitle;
export const player_control_timeline = elements.playerControl.timeline;
export const player_control_aubar = elements.playerControl.aubar;
