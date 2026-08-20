/**
 * Background transition logic
 * Handles two-layer background system with fade transitions
 */
import { useRuntimeStore } from '@/stores/runtime';

import { setStableUrl } from './imageApi';
import { applyBackgroundStyle } from './styles';
import { backgroundLayers } from './types';

const runtimeStore = useRuntimeStore();

/** Use two-layer background for gradient switching */
export function transitionBackground(newImageUrl: string): void {
    if (!newImageUrl || newImageUrl === 'null' || newImageUrl === 'undefined') return;
    if (backgroundLayers.isTransitioning) return;

    const isLayer1Active = backgroundLayers.currentActive === 1;
    const activeLayer = isLayer1Active ? backgroundLayers.layer1 : backgroundLayers.layer2;
    if (activeLayer?.style.backgroundImage) {
        const currentBg = activeLayer.style.backgroundImage.replace(/"/g, "'");
        if (currentBg === `url('${newImageUrl}')`) return;
    }

    backgroundLayers.isTransitioning = true;

    const currentLayer = isLayer1Active ? backgroundLayers.layer1 : backgroundLayers.layer2;
    const nextLayer = isLayer1Active ? backgroundLayers.layer2 : backgroundLayers.layer1;
    const isBlurLayer1 = backgroundLayers.blurCurrentActive === 1;
    const currentBlurLayer = isBlurLayer1 ? backgroundLayers.blurLayer1 : backgroundLayers.blurLayer2;
    const nextBlurLayer = isBlurLayer1 ? backgroundLayers.blurLayer2 : backgroundLayers.blurLayer1;

    nextLayer.style.backgroundImage = `url('${newImageUrl}')`;
    if (nextBlurLayer) nextBlurLayer.style.backgroundImage = `url('${newImageUrl}')`;

    applyBackgroundStyle();

    setTimeout(() => {
        currentLayer.style.opacity = '0';
        nextLayer.style.opacity = '1';
        if (currentBlurLayer) currentBlurLayer.style.opacity = '0';
        if (nextBlurLayer) nextBlurLayer.style.opacity = '1';

        backgroundLayers.currentActive = isLayer1Active ? 2 : 1;
        backgroundLayers.blurCurrentActive = isBlurLayer1 ? 2 : 1;

        setTimeout(() => {
            backgroundLayers.isTransitioning = false;
            setStableUrl(newImageUrl);
        }, 1000);
    }, 50);
}

/** Update playlist */
export function updateFileList(currentFiles: string[]): void {
    for (let i = 0; i < currentFiles.length; ++i) {
        const file = currentFiles[i];
        if (file && runtimeStore.myList.indexOf(file) === -1) {
            runtimeStore.myList.push(file);
        }
    }
}
