/**
 * Version module - re-export from version folder for backwards compatibility
 */

// Re-export all public APIs from the version folder
export { SimpleMarkdown, versionManager, versionConfig, VERSION_HISTORY_PROMISE } from './version/index';

// Import the version module to trigger side effects (singleton initialization)
import './version/index';
