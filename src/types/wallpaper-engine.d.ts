export declare global {
    // Media Integration event types
    interface MediaStatusEvent {
        enabled: boolean;
    }

    interface MediaPropertiesEvent {
        title: string;
        artist: string;
        subTitle?: string;
        albumTitle?: string;
        albumArtist?: string;
        genres?: string;
        contentType: 'music' | 'video' | 'image';
    }

    interface MediaThumbnailEvent {
        thumbnail: string;
        primaryColor: string;
        secondaryColor: string;
        tertiaryColor: string;
        textColor: string;
        highContrastColor: string;
    }

    interface MediaPlaybackEvent {
        state: number;
    }

    interface MediaTimelineEvent {
        position: number;
        duration: number;
    }

    interface Window {
        wallpaperPluginListener?: {
            onPluginLoaded: (name: string, version: string) => void;
        };
        wpPlugins?: {
            led?: {
                setAllDevicesByImageData: (
                    imageData: string,
                    width: number,
                    height: number
                ) => void;
            };
        };
        smoothedAudioArray?: number[];
        wallpaperPropertyListener: {
            applyUserProperties: (properties: Record<string, any>) => void;
            applyGeneralProperties: (properties: Record<string, any>) => void;
            userDirectoryFilesAddedOrChanged: (
                propertyName: string,
                changedFiles: string[]
            ) => void;
            userDirectoryFilesRemoved: (propertyName: string, removedFiles: string[]) => void;
            setPaused: (isPaused: boolean) => void;
        };
        wallpaperMediaIntegration?: {
            PLAYBACK_PLAYING: number;
            PLAYBACK_PAUSED: number;
            PLAYBACK_STOPPED: number;
        };
        wallpaperRegisterMediaStatusListener?: (
            listener: (event: MediaStatusEvent) => void
        ) => void;
        wallpaperRegisterMediaPropertiesListener?: (
            listener: (event: MediaPropertiesEvent) => void
        ) => void;
        wallpaperRegisterMediaThumbnailListener?: (
            listener: (event: MediaThumbnailEvent) => void
        ) => void;
        wallpaperRegisterMediaPlaybackListener?: (
            listener: (event: MediaPlaybackEvent) => void
        ) => void;
        wallpaperRegisterMediaTimelineListener?: (
            listener: (event: MediaTimelineEvent) => void
        ) => void;
        wallpaperRegisterAudioListener?: (listener: (audioData: number[]) => void) => void;
    }
}
