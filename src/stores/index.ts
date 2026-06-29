/**
 * Stores index — re-exports all Pinia stores.
 *
 * Consumers can import selectively using:
 *   import { useConfigStore, useTimeDateStore, useRuntimeStore } from '@/stores';
 *
 * Or continue using `useConfigStore` for all fields during migration.
 */
export { useConfigStore } from './config';
export { useRuntimeStore } from './runtime';
export { useTimeDateStore } from './timeDate';
export { useCountdownStore } from './countdown';
export { useHitokotoStore } from './hitokoto';
export { useWeatherStore } from './weather';
export { usePlayerStore } from './player';
export { useBackgroundStore } from './background';
export { useSakuraStore } from './sakura';
export { useParticleStore } from './particle';
export { useAudioVisualStore } from './audioVisual';
export { useLyricsStore } from './lyrics';
export { useRgbStore } from './rgb';
export { useFluidStore } from './fluid';
export { useSystemMonitorStore } from './systemMonitor';
export { useDockbarStore } from './dockbar';
export { useSettingsStore } from './settings';

// Types
export type { ConfigStoreState, RuntimeStoreState } from './types';
