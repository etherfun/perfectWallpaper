/**
 * esbuild bundle script
 * Bundles all TypeScript modules into a single file for classic script loading
 */

const esbuild = require('esbuild');
const path = require('path');

async function build() {
    // Bundle all TypeScript modules into a single file
    const result = await esbuild.build({
        entryPoints: ['src/bundle.ts'],
        bundle: true,
        outfile: 'dist/bundle.js',
        format: 'iife',
        globalName: 'PerfectWall',
        platform: 'browser',
        target: 'es2020',
        sourcemap: false,
        minify: true,
        logLevel: 'info',
    });

    console.log('Bundle built successfully to dist/bundle.js');
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});