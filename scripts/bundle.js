/**
 * esbuild bundle script
 * Bundles all TypeScript modules into a single file for classic script loading
 */

const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

async function build() {
    const options = {
        entryPoints: ['src/bundle.ts'],
        bundle: true,
        outfile: 'dist/bundle.js',
        format: 'iife',
        globalName: 'PerfectWall',
        platform: 'browser',
        target: 'es2020',
        sourcemap: isWatch ? 'inline' : false,
        minify: !isWatch,
        logLevel: 'info',
        legalComments: 'none'
    };

    if (isWatch) {
        const ctx = await esbuild.context(options);
        await ctx.watch();
        console.log('Watching for changes...');
    } else {
        await esbuild.build(options);
        console.log('Bundle built successfully to dist/bundle.js');
    }
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});