/**
 * Pinia early-init module.
 *
 * Loaded FIRST in bundle.ts (before `./main`) so that `setActivePinia` runs
 * before any legacy module's module-level `useConfigStore()` calls evaluate.
 *
 * Why this is necessary:
 *   Legacy `.ts` files (e.g. `src/sakura/particles.ts`) execute
 *   `const config = useConfigStore()` at module top. ES module imports are
 *   hoisted to the top of the importing file, so these top-level statements
 *   run during `import` evaluation — strictly before any subsequent
 *   top-level code in the importer.
 *
 *   By putting `setActivePinia` in a SEPARATE module that is imported
 *   before any consumer, the `setActivePinia` call still runs during that
 *   module's evaluation, but the **imports of the consumer module happen
 *   AFTER** this module has fully loaded. Because ES module evaluation is
 *   post-order DFS, the first import side-effects to run are from this
 *   `piniaInit.ts`, then its imports' side-effects, etc.
 *
 *   Wait — actually that's backwards. ES modules evaluate their **imports
 *   first**, then their **own top-level**. So `import './piniaInit'`
 *   evaluates piniaInit's imports (just `pinia`), then its top-level
 *   (`createPinia()` + `setActivePinia()`), THEN returns to the importer.
 *   Only THEN does the importer's other imports evaluate.
 *
 *   So this works: piniaInit's `setActivePinia` runs BEFORE the importer
 *   evaluates `./main` or `./sakura` etc., which means by the time
 *   `sakura/particles.ts` does `useConfigStore()`, the active pinia exists.
 */

import { createPinia, setActivePinia } from 'pinia';

const pinia = createPinia();
setActivePinia(pinia);

export { pinia };