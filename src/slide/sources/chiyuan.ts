/**
 * 次元 API 源
 */

import { config } from '../../utils/config';
import { onImageError, onImageLoad } from './loader';

export function loadChiyuan(): void {
    fetch(config.chiyuanapi)
        .then(response => response.text())
        .then((url: string) => {
            const img = new Image();
            img.src = url;
            img.onload = function () {
                onImageLoad(img.src);
            };
            img.onerror = function () {
                onImageError('次元api', img.src);
            };
        });
}
