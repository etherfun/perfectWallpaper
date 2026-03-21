/**
 * Property Handlers Index
 * 统一导出所有属性处理器模块
 */

// Date property handler
export { handleDateProperties } from './datePropertyHandler';
export type { DatePropertyHandlerResult } from './datePropertyHandler';

// Time property handler
export { handleTimeProperties } from './timePropertyHandler';
export type { TimePropertyHandlerResult } from './timePropertyHandler';

// Background property handler
export { handleBackgroundProperties } from './backgroundPropertyHandler';
export type { BackgroundPropertyHandlerResult } from './backgroundPropertyHandler';

// Weather property handler
export { handleWeatherProperties } from './weatherPropertyHandler';
export type { WeatherPropertyHandlerResult } from './weatherPropertyHandler';

// Hitokoto property handler
export { handleHitokotoProperties } from './hitokotoPropertyHandler';
export type { HitokotoPropertyHandlerResult } from './hitokotoPropertyHandler';

// Countdown property handler
export { handleCountdownProperties } from './countdownPropertyHandler';
export type { CountdownPropertyHandlerResult } from './countdownPropertyHandler';

// Player control property handler
export { handlePlayerControlProperties } from './playerControlPropertyHandler';
export type { PlayerControlPropertyHandlerResult } from './playerControlPropertyHandler';

// RGB property handler
export { handleRGBProperties } from './rgbPropertyHandler';
export type { RGBPropertyHandlerResult } from './rgbPropertyHandler';

// Particle property handler
export { handleParticleProperties } from './particlePropertyHandler';
export type { ParticlePropertyHandlerResult } from './particlePropertyHandler';

// Audio visual property handler
export { handleAudioVisualProperties } from './audioVisualPropertyHandler';
export type { AudioVisualPropertyHandlerResult } from './audioVisualPropertyHandler';

// Sakura property handler
export { handleSakuraProperties } from './sakuraPropertyHandler';
export type { SakuraPropertyHandlerResult } from './sakuraPropertyHandler';

// Fluid effect property handler
export { handleFluidEffectProperties } from './fluidEffectPropertyHandler';
export type { FluidEffectPropertyHandlerResult } from './fluidEffectPropertyHandler';

// Wallpaper property listener
export { createWallpaperPropertyListener, setupWallpaperPropertyListener } from './wallpaperPropertyListener';
export type { WallpaperPropertyHandlerResults } from './wallpaperPropertyListener';
