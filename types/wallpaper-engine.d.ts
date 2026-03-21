declare global {
  interface Window {
    wallpaperPropertyListener?: {
      applyUserProperties?: (properties: Record<string, any>) => void;
      applyGeneralProperties?: (properties: Record<string, any>) => void;
    };
    wallpaperMediaIntegration?: {
      PLAYBACK_PLAYING: number;
      PLAYBACK_PAUSED: number;
      PLAYBACK_STOPPED: number;
    };
  }
}

export {}; // Ensure file is treated as a module