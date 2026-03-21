declare global {
  interface Window {
    wallpaperPropertyListener: {
      applyUserProperties: (properties: Record<string, any>) => void;
      applyGeneralProperties: (properties: Record<string, any>) => void;
      userDirectoryFilesAddedOrChanged: (propertyName: string, changedFiles: string[]) => void;
      userDirectoryFilesRemoved: (propertyName: string, removedFiles: string[]) => void;
      setPaused: (isPaused: boolean) => void;
    };
    wallpaperMediaIntegration?: {
      PLAYBACK_PLAYING: number;
      PLAYBACK_PAUSED: number;
      PLAYBACK_STOPPED: number;
      pauseMedia: () => void;
      playMedia: () => void;
      nextMedia: () => void;
      previousMedia: () => void;
      setMediaPosition: (position: number) => void;
      setMediaVolume: (volume: number) => void;
      toggleMediaMute: () => void;
    };
    wallpaperRegisterMediaThumbnailListener?: (listener: (thumbnail: any) => void) => void;
    wallpaperRegisterMediaTimelineListener?: (listener: (timeline: any) => void) => void;
    wallpaperRegisterMediaPropertiesListener?: (listener: (properties: any) => void) => void;
    wallpaperRegisterMediaPlaybackListener?: (listener: (playback: any) => void) => void;
    wallpaperRegisterAudioListener?: (listener: (audioData: number[]) => void) => void;
  }
}

export {}; // Ensure file is treated as a module