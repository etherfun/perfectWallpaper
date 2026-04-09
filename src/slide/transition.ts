/**
 * Background transition logic
 * Handles two-layer background system with fade transitions
 */
import { config } from '../utils/config';
import { applyBackgroundStyle } from './styles';
import { backgroundLayers } from './types';

/** Use two-layer background for gradient switching */
export function transitionBackground(newImageUrl: string): void {
    // Skip if image URL is invalid
    if (!newImageUrl || newImageUrl === 'null' || newImageUrl === 'undefined') {
        return;
    }

    if (backgroundLayers.isTransitioning) return;

    // Get current active layer
    const activeLayer =
        backgroundLayers.currentActive === 1 ? backgroundLayers.layer1 : backgroundLayers.layer2;

    // Skip if new image is same as current
    if (activeLayer && activeLayer.style.backgroundImage) {
        const currentBg = activeLayer.style.backgroundImage.replace(/"/g, "'");
        const newBg = "url('" + newImageUrl + "')";
        if (currentBg === newBg) return;
    }

    backgroundLayers.isTransitioning = true;

    // Get current and next layers
    const currentLayer =
        backgroundLayers.currentActive === 1 ? backgroundLayers.layer1 : backgroundLayers.layer2;
    const nextLayer =
        backgroundLayers.currentActive === 1 ? backgroundLayers.layer2 : backgroundLayers.layer1;

    // Get current and next blur layers
    const currentBlurLayer =
        backgroundLayers.blurCurrentActive === 1
            ? backgroundLayers.blurLayer1
            : backgroundLayers.blurLayer2;
    const nextBlurLayer =
        backgroundLayers.blurCurrentActive === 1
            ? backgroundLayers.blurLayer2
            : backgroundLayers.blurLayer1;

    // Set background image for next layer
    nextLayer.style.backgroundImage = "url('" + newImageUrl + "')";

    // Set background image for next blur layer
    if (nextBlurLayer) {
        nextBlurLayer.style.backgroundImage = "url('" + newImageUrl + "')";
    }

    // Auto apply background style
    applyBackgroundStyle();

    // Start transition
    setTimeout(function () {
        // Fade out current layer
        currentLayer.style.opacity = '0';
        // Fade in next layer
        nextLayer.style.opacity = '1';
        // Fade out current blur layer
        if (currentBlurLayer) {
            currentBlurLayer.style.opacity = '0';
        }
        // Fade in next blur layer
        if (nextBlurLayer) {
            nextBlurLayer.style.opacity = '1';
        }

        // Switch active layer
        backgroundLayers.currentActive = backgroundLayers.currentActive === 1 ? 2 : 1;
        backgroundLayers.blurCurrentActive = backgroundLayers.blurCurrentActive === 1 ? 2 : 1;

        // Reset transition state
        setTimeout(function () {
            backgroundLayers.isTransitioning = false;
        }, 1000);
    }, 50);
}

/** Update playlist */
export function updateFileList(currentFiles: string[]): void {
    for (let i = 0; i < currentFiles.length; ++i) {
        if (config.runtime.myList.indexOf(currentFiles[i]) === -1) {
            config.runtime.myList.push(currentFiles[i]);
        }
    }
}
