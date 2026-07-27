/**
 * Stores index — re-exports active Pinia stores.
 *
 * Consumers should import only what they need:
 *   import { useConfigStore, useRuntimeStore } from '@/stores';
 */
export { useConfigStore } from './config';
export { useRuntimeStore } from './runtime';

// Types
export type { ConfigStoreState, RuntimeStoreState } from './types';
