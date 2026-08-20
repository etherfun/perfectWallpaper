/**
 * Background styles and transition effects
 */

import { useConfigStore } from '@/stores/config';

import { debugLogger } from '../../utils/logger';
import { backgroundLayers } from './types';

const config = useConfigStore();

/** Get switch interval based on speed setting or custom input */
export function getSwitchInterval(): number {
    const speed = config.speed;
    if (String(speed) === 'custom') {
        const customInterval = Number(config.switch_interval_input);
        // 验证输入值：如果是 NaN 或小于等于0，使用默认值 60秒
        if (isNaN(customInterval) || customInterval <= 0) {
            debugLogger.warn(
                `无效的custom切换间隔: ${config.switch_interval_input}，使用默认值60秒`
            );
            return 60000;
        }
        return customInterval * 1000;
    }
    return calculate(Number(speed));
}

const SPEED_TO_SECONDS: Record<number, number> = {
    0.5: 30,
    1: 60,
    2: 5 * 60,
    3: 10 * 60,
    4: 30 * 60,
    5: 60 * 60,
};

/** Calculate switch interval from speed setting */
export function calculate(t: number): number {
    return (SPEED_TO_SECONDS[t] ?? 60) * 1000;
}

/** Switch transition effect */
export function TransitionSwith(): void {
    let transitionValue = '';

    const TransitionMode = config.transition_mode;
    const TransitionMode_choose_0 = (config.transition_mode_choose_0 as unknown as number) ?? 0;
    const TransitionMode_choose_1 = (config.transition_mode_choose_1 as unknown as number) ?? 0;
    const TransitionMode_choose_4 = (config.transition_mode_choose_4 as unknown as string) ?? '';

    switch (TransitionMode) {
        case 0:
            switch (TransitionMode_choose_0) {
                case 0:
                    transitionValue = 'opacity 1s linear 0s';
                    break;
                case 1:
                    transitionValue =
                        'opacity 1s linear(0 0%, 0.22 2.1%, 0.86 6.5%, 1.11 8.6%, 1.3 10.7%, 1.35 11.8%, 1.37 12.9%, 1.37 13.7%, 1.36 14.5%, 1.32 16.2%, 1.03 21.8%, 0.94 24%, 0.89 25.9%, 0.88 26.85%, 0.87 27.8%, 0.87 29.25%, 0.88 30.7%, 0.91 32.4%, 0.98 36.4%, 1.01 38.3%, 1.04 40.5%, 1.05 42.7%, 1.05 44.1%, 1.04 45.7%, 1 53.3%, 0.99 55.4%, 0.98 57.5%, 0.99 60.7%, 1 68.1%, 1.01 72.2%, 1 86.7%, 1 100%) 0s';
                    break;
                case 2:
                    transitionValue =
                        'opacity 1s linear(0 0%, 0 2.27%, 0.02 4.53%, 0.04 6.8%, 0.06 9.07%, 0.1 11.33%, 0.14 13.6%, 0.25 18.15%, 0.39 22.7%, 0.56 27.25%, 0.77 31.8%, 1 36.35%, 0.89 40.9%, 0.85 43.18%, 0.81 45.45%, 0.79 47.72%, 0.77 50%, 0.75 52.27%, 0.75 54.55%, 0.75 56.82%, 0.77 59.1%, 0.79 61.38%, 0.81 63.65%, 0.85 65.93%, 0.89 68.2%, 1 72.7%, 0.97 74.98%, 0.95 77.25%, 0.94 79.53%, 0.94 81.8%, 0.94 84.08%, 0.95 86.35%, 0.97 88.63%, 1 90.9%, 0.99 93.18%, 0.98 95.45%, 0.99 97.73%, 1 100%) 0s';
                    break;
                case 3:
                    transitionValue =
                        'opacity 1s linear(0 0%, 0 1.8%, 0.01 3.6%, 0.03 6.35%, 0.07 9.1%, 0.13 11.4%, 0.19 13.4%, 0.27 15%, 0.34 16.1%, 0.54 18.35%, 0.66 20.6%, 0.72 22.4%, 0.77 24.6%, 0.81 27.3%, 0.85 30.4%, 0.88 35.1%, 0.92 40.6%, 0.94 47.2%, 0.96 55%, 0.98 64%, 0.99 74.4%, 1 86.4%, 1 100%) 0s';
                    break;
            }
            break;
        case 1:
            switch (TransitionMode_choose_1) {
                case 0:
                    transitionValue = 'opacity 1s ease-in-out 0s';
                    break;
                case 1:
                    transitionValue = 'opacity 1s cubic-bezier(0.45, 0.05, 0.55, 0.95) 0s';
                    break;
                case 2:
                    transitionValue = 'opacity 1s cubic-bezier(0.46, 0.03, 0.52, 0.96) 0s';
                    break;
                case 3:
                    transitionValue = 'opacity 1s cubic-bezier(0.65, 0.05, 0.36, 1) 0s';
                    break;
                case 4:
                    transitionValue = 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1) 0s';
                    break;
            }
            break;
        case 2:
            transitionValue = 'opacity 1s ease-in 0s';
            break;
        case 3:
            transitionValue = 'opacity 1s ease-out 0s';
            break;
        case 4:
            transitionValue = TransitionMode_choose_4;
            break;
    }

    // Apply to main background layers
    if (backgroundLayers.layer1 && backgroundLayers.layer2) {
        backgroundLayers.layer1.style.transition = transitionValue;
        backgroundLayers.layer2.style.transition = transitionValue;
    }

    // Apply to blur background layers
    if (backgroundLayers.blurLayer1 && backgroundLayers.blurLayer2) {
        backgroundLayers.blurLayer1.style.transition = transitionValue;
        backgroundLayers.blurLayer2.style.transition = transitionValue;
    }
}

/** Apply background style to layers */
export function applyBackgroundStyle(): void {
    if (!backgroundLayers.layer1 || !backgroundLayers.layer2) {
        return;
    }

    // Get current blur layers
    const currentBlurLayer =
        backgroundLayers.blurCurrentActive === 1
            ? backgroundLayers.blurLayer1
            : backgroundLayers.blurLayer2;
    // Note: nextBlurLayer reserved for future cross-fade transitions
    const _nextBlurLayer =
        backgroundLayers.blurCurrentActive === 1
            ? backgroundLayers.blurLayer2
            : backgroundLayers.blurLayer1;

    // Hide all blur layers by default
    if (backgroundLayers.blurLayer1) {
        backgroundLayers.blurLayer1.style.opacity = '0';
    }
    if (backgroundLayers.blurLayer2) {
        backgroundLayers.blurLayer2.style.opacity = '0';
    }

    // Clear all styles
    backgroundLayers.layer1.style.filter = '';
    backgroundLayers.layer2.style.filter = '';
    backgroundLayers.layer1.style.transform = '';
    backgroundLayers.layer2.style.transform = '';
    backgroundLayers.container.style.backgroundColor = '';
    backgroundLayers.layer1.style.backgroundRepeat = '';
    backgroundLayers.layer2.style.backgroundRepeat = '';
    backgroundLayers.layer1.style.backgroundSize = '';
    backgroundLayers.layer2.style.backgroundSize = '';
    backgroundLayers.layer1.style.backgroundPosition = '';
    backgroundLayers.layer2.style.backgroundPosition = '';

    // Apply style based on bgStyle setting
    switch (config.bg_style) {
        case 1: // Fill
            backgroundLayers.layer1.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer2.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer1.style.backgroundSize = 'cover';
            backgroundLayers.layer2.style.backgroundSize = 'cover';
            backgroundLayers.layer1.style.backgroundPosition = 'center';
            backgroundLayers.layer2.style.backgroundPosition = 'center';
            break;
        case 2: // Stretch
            backgroundLayers.layer1.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer2.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer1.style.backgroundSize = '100% 100%';
            backgroundLayers.layer2.style.backgroundSize = '100% 100%';
            backgroundLayers.layer1.style.backgroundPosition = 'center';
            backgroundLayers.layer2.style.backgroundPosition = 'center';
            break;
        case 3: // Fit mode
            backgroundLayers.layer1.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer2.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer1.style.backgroundSize = 'contain';
            backgroundLayers.layer2.style.backgroundSize = 'contain';
            backgroundLayers.layer1.style.backgroundPosition = 'center';
            backgroundLayers.layer2.style.backgroundPosition = 'center';

            if (currentBlurLayer) {
                currentBlurLayer.style.opacity = '1';
                currentBlurLayer.style.backgroundSize = 'cover';
                currentBlurLayer.style.backgroundPosition = 'center';
                currentBlurLayer.style.backgroundRepeat = 'no-repeat';
            }
            backgroundLayers.container.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            break;
        case 4: // Tile
            backgroundLayers.layer1.style.backgroundRepeat = 'repeat';
            backgroundLayers.layer2.style.backgroundRepeat = 'repeat';
            backgroundLayers.layer1.style.backgroundSize = 'contain';
            backgroundLayers.layer2.style.backgroundSize = 'contain';
            backgroundLayers.layer1.style.backgroundPosition = 'center';
            backgroundLayers.layer2.style.backgroundPosition = 'center';
            break;
        case 5: // Center mode
            backgroundLayers.layer1.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer2.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer1.style.backgroundPosition = 'center';
            backgroundLayers.layer2.style.backgroundPosition = 'center';

            if (currentBlurLayer) {
                currentBlurLayer.style.opacity = '1';
                currentBlurLayer.style.backgroundSize = 'cover';
                currentBlurLayer.style.backgroundPosition = 'center';
                currentBlurLayer.style.backgroundRepeat = 'no-repeat';
            }
            backgroundLayers.container.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            break;
        case 6: // Free mode
            backgroundLayers.layer1.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer2.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer1.style.backgroundSize = config.bgs || '100% 100%';
            backgroundLayers.layer2.style.backgroundSize = config.bgs || '100% 100%';
            backgroundLayers.layer1.style.backgroundPosition = config.bgx + ' ' + config.bgy;
            backgroundLayers.layer2.style.backgroundPosition = config.bgx + ' ' + config.bgy;

            if (currentBlurLayer) {
                currentBlurLayer.style.opacity = '1';
                currentBlurLayer.style.backgroundSize = 'cover';
                currentBlurLayer.style.backgroundPosition = 'center';
                currentBlurLayer.style.backgroundRepeat = 'no-repeat';
            }
            backgroundLayers.container.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            break;
        default: // Default fill
            backgroundLayers.layer1.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer2.style.backgroundRepeat = 'no-repeat';
            backgroundLayers.layer1.style.backgroundSize = 'cover';
            backgroundLayers.layer2.style.backgroundSize = 'cover';
            backgroundLayers.layer1.style.backgroundPosition = 'center';
            backgroundLayers.layer2.style.backgroundPosition = 'center';
    }

    // Clear body background styles
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundImage = '';
}
