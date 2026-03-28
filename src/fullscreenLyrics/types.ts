/**
 * Fullscreen Lyrics module type definitions
 */

/** Lyric line data type */
export interface LyricLine {
    time: number; // Time when this line starts playing (ms)
    duration: number; // Duration of this line (ms)
    originalLyric: string; // Original lyrics
    translatedLyric?: string;
    romanLyric?: string;
    dynamicLyricTime?: number; // Dynamic lyrics start time (ms)
    dynamicLyric?: DynamicWord[]; // Dynamic lyrics data
}

/** Dynamic word in lyrics */
export interface DynamicWord {
    time: number; // Word start time (ms, relative to line time)
    duration: number; // Word display duration (ms)
    flag: number; // Flag (0=normal, 1=start, 2=end, etc.)
    word: string; // Displayed character/word
}

/** Lyrics data */
export interface LyricsData {
    song: string;
    artist: string;
    songId: number;
    album: string;
    lineIndex: number;
    currentTime: number;
    lyricsArray: LyricLine[];
    totalLines: number;
    hasTranslation: boolean;
    hasRoman: boolean;
    hasDynamic: boolean;
    playing: boolean;
    timestamp: number;
    currentLine?: LyricLine;
}

/** Fullscreen lyrics configuration */
export interface FullscreenLyricsConfig {
    enabled: boolean;
    showTranslation: boolean;
    showRoman: boolean;
    delay: number;
    enableBlur: boolean;
    hideOtherElements: boolean;
    showClock: boolean;
}
