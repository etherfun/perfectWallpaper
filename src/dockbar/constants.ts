import type { DockBarConfig } from './types';

export const DEFAULT_CONFIG: DockBarConfig = {
    enabled: false,
    position: 'bottom',
    positionX: 50,
    positionY: 100,
    showAddButton: true,
    iconSize: 48,
    spacing: 12,
    yakeliEnabled: true,
    yakeliIntensity: 0.5,
    blurIntensity: 10,
    yakeliColorR: 255,
    yakeliColorG: 255,
    yakeliColorB: 255,
    roundedCorners: 50,
    items: [],
};

export const STORAGE_KEY = 'perfectwall_dockbar_items';
export const SERVER_URL = 'http://localhost:27420';

const PLACEHOLDER_PNG =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
export const DEFAULT_ICON = `data:image/png;base64,${PLACEHOLDER_PNG}`;
