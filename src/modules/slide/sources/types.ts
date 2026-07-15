/**
 * 外部 API 响应类型定义
 */

export interface BingImage {
    title: string;
    urlbase: string;
    copyright: string;
}

export interface BingResponse {
    images: BingImage[];
}

export interface NasaApodResponse {
    media_type: 'image' | 'video' | 'other';
    title: string;
    explanation: string;
    copyright?: string;
    hdurl?: string;
    thumbnail_url?: string;
}

export interface WindowsSpotlightItem {
    ad: {
        title: string;
        description: string;
        copyright: string;
        iconHoverText: string;
        landscapeImage: { asset: string };
    };
}

export interface WindowsSpotlightResponse {
    batchrsp: {
        items: Array<{ item: string }>;
    };
}
