/**
 * 次元 API 源
 *
 * Stage 3.5-A3: chiyuanapi 改读 Pinia。
 */

import { useConfigStore } from '@/stores/config';
import { onImageError, onImageLoad } from './loader';

export function loadChiyuan(): void {
    const store = useConfigStore();
    fetch(store.chiyuanapi ?? '')
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
