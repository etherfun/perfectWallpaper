import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

/**
 * Vite build config — emits a single IIFE file (globalName `PerfectWall`)
 * for Wallpaper Engine compatibility. Wallpaper Engine loads `dist/index.html`,
 * which in turn references `./bundle.js` as a classic script.
 *
 * Output layout:
 *   dist/bundle.js           — IIFE bundle (globalName=PerfectWall)
 *   dist/index.html          — copied & path-rewritten by scripts/post-build.js
 *   dist/project.json        — copied & path-rewritten by scripts/post-build.js
 *   dist/default.css         — compiled from src/scss/main.scss by post-build
 *   dist/source/**           — copied by post-build
 *
 * Build target: es2020 (matches the original esbuild config).
 */
export default defineConfig({
    root: '.',
    base: './',
    publicDir: false,
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
        },
    },
    plugins: [vue()],
    build: {
        // Output: dist/bundle.js  (single-file IIFE)
        outDir: 'dist',
        emptyOutDir: false,
        cssCodeSplit: false,
        target: 'es2020',
        minify: 'esbuild',
        sourcemap: false,
        lib: {
            entry: fileURLToPath(new URL('./src/modules/core/bundle.ts', import.meta.url)),
            name: 'PerfectWall',
            fileName: () => 'bundle.js',
            formats: ['iife'],
        },
        rollupOptions: {
            output: {
                extend: true,
                // Keep external so Node-only deps never enter the bundle
                // (matches existing esbuild external list)
            },
            external: ['express', 'systeminformation'],
        },
        chunkSizeWarningLimit: 600,
    },
    esbuild: {
        legalComments: 'none',
    },
    define: {
        // 让 vue-i18n 等库的 dev-only 分支在生产构建中被剔除
        __VUE_OPTIONS_API__: 'false',
        __VUE_PROD_DEVTOOLS__: 'false',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
        'process.env.NODE_ENV': '"production"',
    },
    optimizeDeps: {
        noDiscovery: true,
        include: [],
    },
});
