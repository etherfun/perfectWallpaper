/** PictureInfo design tokens — 统一控制显示/亚克力/形状等 */
export type PictureInfoTokens = {
    /** 是否显示容器（由 pictures_info_show 映射） */
    visible: boolean;
    /** 是否启用亚克力（yakeli） */
    yakeliEnabled: boolean;
    /** 亚克力颜色 (r,g,b) */
    yakeliColor: [number, number, number];
    /** 亚克力强度 0..1 */
    yakeli: number;
    /** 亚克力模糊 */
    blurYakeli: string;
    /** 是否启用外发光模糊 */
    blurEnabled: boolean;
    blurColor: [number, number, number];
    /** 圆角 0..100 */
    roundedCorners: number;
    /** 容器高度 CSS 变量源 */
    height: string;
};

export const pictureInfoTokenKeys = {
    display: '--picture-info-display',
    visibility: '--picture-info-visibility',
    yakeliEnabled: '--picture-info-yakeli-enabled',
    yakeliColor: '--picture-info-yakeli-color',
    yakeli: '--picture-info-yakeli',
    blurYakeli: '--picture-info-blur-yakeli',
    blurEnabled: '--picture-info-blur-enabled',
    blurColor: '--picture-info-blur-color',
    roundedCorners: '--picture-info-roundedcorners',
    height: '--picture-info-height',
} as const;

export function applyPictureInfoTokens(tokens: Partial<PictureInfoTokens>): void {
    const root = document.body.style;
    if (tokens.visible !== undefined) {
        root.setProperty(pictureInfoTokenKeys.display, tokens.visible ? 'flex' : 'none');
        root.setProperty(pictureInfoTokenKeys.visibility, tokens.visible ? 'visible' : 'hidden');
    }
    if (tokens.yakeliEnabled !== undefined) root.setProperty(pictureInfoTokenKeys.yakeliEnabled, tokens.yakeliEnabled ? '1' : '0');
    if (tokens.yakeliColor) root.setProperty(pictureInfoTokenKeys.yakeliColor, tokens.yakeliColor.join(','));
    if (tokens.yakeli !== undefined) root.setProperty(pictureInfoTokenKeys.yakeli, String(tokens.yakeli));
    if (tokens.blurYakeli !== undefined) root.setProperty(pictureInfoTokenKeys.blurYakeli, tokens.blurYakeli);
    if (tokens.blurEnabled !== undefined) root.setProperty(pictureInfoTokenKeys.blurEnabled, tokens.blurEnabled ? '1' : '0');
    if (tokens.blurColor) root.setProperty(pictureInfoTokenKeys.blurColor, tokens.blurColor.join(','));
    if (tokens.roundedCorners !== undefined) root.setProperty(pictureInfoTokenKeys.roundedCorners, String(tokens.roundedCorners));
    if (tokens.height !== undefined) root.setProperty(pictureInfoTokenKeys.height, tokens.height);
}
