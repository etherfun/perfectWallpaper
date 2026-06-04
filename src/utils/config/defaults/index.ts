import { type AudioVisualDefaults, audioVisualDefaults } from './audioVisual';
import { type BackgroundDefaults, backgroundDefaults } from './background';
import { type CoreDefaults, coreDefaults } from './core';
import { type CountdownDefaults, countdownDefaults } from './countdown';
import { type FluidDefaults, fluidDefaults } from './fluid';
import { type FullscreenLyricsDefaults, fullscreenLyricsDefaults } from './fullscreenLyrics';
import { type HitokotoDefaults, hitokotoDefaults } from './hitokoto';
import { type ParticleDefaults, particleDefaults } from './particle';
import { type PlayerDefaults, playerDefaults } from './player';
import { type RgbDefaults, rgbDefaults } from './rgb';
import { type SakuraDefaults, sakuraDefaults } from './sakura';
import { type SlideDefaults, slideDefaults } from './slide';
import { type TimeDateDefaults, timeDateDefaults } from './timeDate';
import { type WallpaperDefaults, wallpaperDefaults } from './wallpaper';
import { type WeatherDefaults, weatherDefaults } from './weather';

export const SYNC_DEFAULTS = {
    ...coreDefaults,
    ...backgroundDefaults,
    ...audioVisualDefaults,
    ...slideDefaults,
    ...sakuraDefaults,
    ...timeDateDefaults,
    ...countdownDefaults,
    ...weatherDefaults,
    ...hitokotoDefaults,
    ...fluidDefaults,
    ...particleDefaults,
    ...rgbDefaults,
    ...playerDefaults,
    ...fullscreenLyricsDefaults,
    ...wallpaperDefaults,
};

export type SyncDefaults = CoreDefaults &
    BackgroundDefaults &
    AudioVisualDefaults &
    SlideDefaults &
    SakuraDefaults &
    TimeDateDefaults &
    CountdownDefaults &
    WeatherDefaults &
    HitokotoDefaults &
    FluidDefaults &
    ParticleDefaults &
    RgbDefaults &
    PlayerDefaults &
    FullscreenLyricsDefaults &
    WallpaperDefaults;
