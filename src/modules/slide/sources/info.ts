/**
 * 图片信息显示
 *
 * Stage 3.5-A3: pictures_info_show_ror_l / pictures_info_show 改读 Pinia。
 */

import { useConfigStore } from '@/stores/config';
import { useRuntimeStore } from '@/stores/runtime';

import { applyPictureInfoTokens } from '@/tokens/pictureInfo.tokens';

/** Clear picture info — 令牌化隐藏 */
export function clearpicturesinfo(): void {
    const rt = useRuntimeStore();
    rt.photo.infomation.title = '';
    rt.photo.infomation.copyright = '';
    rt.photo.infomation.where = '';
    rt.photo.infomation.text = '';
    applyPictureInfoTokens({ visible: false });
}

/** Show picture info — 令牌化显示（仅当开关开启） */
export function picturesinfo_showrl(
    title: string,
    author: string,
    where: string,
    text: string
): void {
    const rt = useRuntimeStore();
    const cfg = useConfigStore();
    // 先清再写，保持旧时序
    clearpicturesinfo();
    rt.photo.infomation.title = title;
    rt.photo.infomation.copyright = author;
    rt.photo.infomation.where = where;
    rt.photo.infomation.text = text;
    if (cfg.pictures_info_show !== true) return;
    applyPictureInfoTokens({ visible: true });
}
