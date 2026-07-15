/**
 * Slide Image API
 *
 * 追踪当前"稳定显示"的图片 URL——即已完全完成过渡、用户实际看到的图片。
 *
 * - 写入：slide/transition.ts 在每次过渡完全结束后调用 setStableUrl()
 * - 读取：RGB.ts 用 getStableUrl() 替代 runtimeStore.photo.currentImg
 *
 * 这样 RGB 在 CSS 过渡期间不会中途切到新图，避免 canvas 闪烁。
 */

let stableUrl: string | null = null;

/** 设置当前稳定显示的图片 URL（仅过渡完成后调用） */
export function setStableUrl(url: string | null): void {
    stableUrl = url;
}

/** 获取当前稳定显示的图片 URL */
export function getStableUrl(): string | null {
    return stableUrl;
}
