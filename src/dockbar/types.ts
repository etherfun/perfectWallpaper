export interface DockItem {
    id: string;
    name: string;
    icon: string;
    type: 'app' | 'file' | 'url';
    path?: string;
    url?: string;
}

export interface DockBarConfig {
    enabled: boolean;
    position: 'bottom' | 'top' | 'left' | 'right';
    positionX: number;
    positionY: number;
    showAddButton: boolean;
    iconSize: number;
    spacing: number;
    yakeliEnabled: boolean;
    yakeliIntensity: number;
    blurIntensity: number;
    yakeliColorR: number;
    yakeliColorG: number;
    yakeliColorB: number;
    roundedCorners: number;
    items: DockItem[];
}
