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
            include: ['src/utils/**/*.ts', 'src/player_control/colorUtils.ts', 'src/systemMonitor/formatters.ts'],
            exclude: ['src/utils/config/**', 'src/utils/elementManager/**'],
        },
    },
});
