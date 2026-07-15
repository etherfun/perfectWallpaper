/**
 * Stores index — re-exports all Pinia stores.
 *
 * Consumers can import selectively using:
 *   import { useConfigStore, useTimeDateStore, useRuntimeStore } from '@/stores';
 *
 * Or continue using `useConfigStore` for all fields during migration.
 */
export { useAudioVisualStore } from './audioVisual';
export { useBackgroundStore } from './background';
export { useConfigStore } from './config';
export { useCountdownStore } from './countdown';
export { useDockbarStore } from './dockbar';
export { useFluidStore } from './fluid';
export { useHitokotoStore } from './hitokoto';
export { useLyricsStore } from './lyrics';
export { useParticleStore } from './particle';
export { usePlayerStore } from './player';
export { useRgbStore } from './rgb';
export { useRuntimeStore } from './runtime';
export { useSakuraStore } from './sakura';
export { useSettingsStore } from './settings';
export { useSystemMonitorStore } from './systemMonitor';
export { useTimeDateStore } from './timeDate';
export { useWeatherStore } from './weather';

// Types
export type { ConfigStoreState, RuntimeStoreState } from './types';
