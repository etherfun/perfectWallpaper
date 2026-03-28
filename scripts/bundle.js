/**
 * esbuild bundle script
 * Bundles all TypeScript modules into a single file for classic script loading
 * Handles CSS bundling, file copying, and HTML processing
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const isWatch = process.argv.includes('--watch');
const srcDir = path.resolve(__dirname, '..');
const distDir = path.resolve(srcDir, 'dist');

// Files to copy to project root (for wallpaper engine)
const copyFiles = [
    { src: 'index.html', dest: 'index.html' },
    { src: 'project.json', dest: 'project.json' },
    { src: 'source/i18n/', dest: 'source/i18n/' },
    { src: 'source/imgs/', dest: 'source/imgs/' },
    { src: 'source/map/', dest: 'source/map/' },
    { src: 'update/', dest: 'update/' },
    { src: 'preview.jpg', dest: 'preview.jpg' }
];

// npm 包资源复制
const npmAssets = [
    { from: 'node_modules/qweather-icons/icons', to: 'source/QWeather-Icons/icons' },
    { from: 'node_modules/qweather-icons/LICENSE', to: 'source/QWeather-Icons/LICENSE' }
];

// HTML path replacements for dist
const htmlPathReplacements = [
    // [original, replacement]
    ['./dist/style/', './'],
    ['./dist/', './'],
    ['./src/source/', './source/'],
    ['dist/style/', './'],
    ['dist/', './'],
    ['src/source/', './source/'],
];

async function copyFile(src, dest) {
    if (fs.existsSync(dest)) {
        return; // Skip if destination already exists
    }
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`  Copy: ${path.relative(srcDir, src)} -> ${path.relative(srcDir, dest)}`);
}

async function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function processHtml() {
    const srcHtml = path.join(srcDir, 'index.html');
    const destHtml = path.join(distDir, 'index.html');
    let content = fs.readFileSync(srcHtml, 'utf8');

    // 替换所有路径
    for (const [original, replacement] of htmlPathReplacements) {
        content = content.replaceAll(original, replacement);
    }

    fs.writeFileSync(destHtml, content);
    console.log(`  Processed: index.html`);
}

async function copyAssets() {
    console.log('Copying assets...');
    for (const item of copyFiles) {
        const srcPath = path.join(srcDir, item.src);
        const destPath = path.join(distDir, item.dest);

        if (!fs.existsSync(srcPath)) {
            console.log(`  Warning: ${item.src} does not exist, skipping`);
            continue;
        }

        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await copyFile(srcPath, destPath);
        }
    }

    // 复制 npm 包资源
    for (const asset of npmAssets) {
        const srcPath = path.join(srcDir, asset.from);
        const destPath = path.join(distDir, asset.to);
        if (!fs.existsSync(srcPath)) {
            console.log(`  Warning: ${asset.from} does not exist, skipping`);
            continue;
        }
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await copyFile(srcPath, destPath);
        }
    }
}

async function build() {
    console.log('Building bundle...');

    // Ensure dist directory exists
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }

    // Compile SCSS (if source exists)
    const scssPath = path.resolve(srcDir, 'src/style/scss/main.scss');
    if (fs.existsSync(scssPath)) {
        console.log('Compiling SCSS...');
        execSync(
            `npx sass --style=compressed --no-source-map "${scssPath}" "${path.resolve(distDir, 'default.css')}"`,
            { stdio: 'inherit' }
        );
        console.log('  SCSS compiled to dist/default.css');
    } else {
        console.log('  SCSS source not found, skipping compilation');
    }

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
        legalComments: 'none',
        // 防止 Node.js 包被打包到浏览器 bundle
        external: ['express', 'systeminformation']
    };

    if (isWatch) {
        const ctx = await esbuild.context(options);
        await ctx.watch();
        console.log('Bundle built successfully (watching for changes)...');
    } else {
        await esbuild.build(options);
        console.log('Bundle built successfully to dist/bundle.js');
    }

    // 替换 bundle.js 中的路径
    const bundlePath = path.join(distDir, 'bundle.js');
    if (fs.existsSync(bundlePath)) {
        let bundleContent = fs.readFileSync(bundlePath, 'utf8');
        bundleContent = bundleContent.replaceAll('src/source/', 'source/');
        fs.writeFileSync(bundlePath, bundleContent);
        console.log('  Replaced paths in bundle.js');
    }

    // Copy assets and process HTML after bundling
    await copyAssets();
    await processHtml();

    // Output bundle size
    const bundleSize = fs.statSync(bundlePath).size;
    const sizeKB = (bundleSize / 1024).toFixed(2);

    console.log('Build complete!');
    console.log(`  Bundle size: ${sizeKB} KB`);
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});