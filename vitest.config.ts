import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        globals: false,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        setupFiles: ['./tests/setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: [
                'src/utils/color.ts',
                'src/utils/string.ts',
                'src/utils/webgl-math.ts',
                'src/utils/markdown.ts',
                'src/utils/logger.ts',
                'src/utils/playback.ts',
                'src/utils/tool.ts',
                'src/player_control/colorUtils.ts',
                'src/systemMonitor/formatters.ts',
                'src/systemMonitor/renderer.ts',
                'src/dockbar/storage.ts',
                'src/dockbar/configApply.ts',
                'src/dockbar/renderer.ts',
                'src/dockbar/iconCache.ts',
                'src/slide/transition.ts',
                'src/propertyHandlers/_helpers.ts',
                'src/version/simple-markdown.ts',
            ],
            exclude: ['src/utils/config/**', 'src/utils/elementManager/**'],
        },
    },
});
