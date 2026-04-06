/**
 * esbuild bundle script
 * Bundles all TypeScript modules into a single file for classic script loading
 * Handles CSS bundling, file copying, and HTML processing
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chokidar = require('chokidar');

const isWatch = process.argv.includes('--watch');
const srcDir = path.resolve(__dirname, '..');
const distDir = path.resolve(srcDir, 'dist');

// Files to copy to project root (for wallpaper engine)
const copyFiles = [
    { src: 'index.html', dest: 'index.html', force: true },
    { src: 'project.json', dest: 'project.json' },
    { src: 'source/i18n/', dest: 'source/i18n/', force: true  },
    { src: 'source/imgs/', dest: 'source/imgs/' },
    { src: 'source/map/', dest: 'source/map/' },
    { src: 'update/', dest: 'update/', force: true  },
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
    ['dist/style/', './'],
    ['dist/', './'],
    ['src/source/', 'source/'],
];

async function copyFile(src, dest, force = false) {
    if (!force && fs.existsSync(dest)) {
        return; // Skip if destination already exists
    }
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`  Copy: ${path.relative(srcDir, src)} -> ${path.relative(srcDir, dest)}`);
}

async function copyDirectory(src, dest, force = false) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath, force);
        } else if (force || !fs.existsSync(destPath)) {
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

async function processProjectJson() {
    const srcJson = path.join(srcDir, 'project.json');
    const destJson = path.join(distDir, 'project.json');
    let content = fs.readFileSync(srcJson, 'utf8');

    // 只替换 dist/ 为空 (用于 "file" : "dist/index.html" -> "file" : "index.html")
    content = content.replaceAll('"dist/', '"');
    content = content.replaceAll("'dist/", "'");

    fs.writeFileSync(destJson, content);
    console.log(`  Processed: project.json`);
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
            await copyDirectory(srcPath, destPath, item.force);
        } else {
            await copyFile(srcPath, destPath, item.force);
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
            await copyDirectory(srcPath, destPath, true);
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
    const scssPath = path.resolve(srcDir, 'src/scss/main.scss');
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
        // Watch source files and trigger post-processing on changes
        const srcWatcher = chokidar.watch(['src/**/*', 'index.html', 'project.json'], {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }
        });

        srcWatcher.on('all', async (event, filePath) => {
            console.log(`\nChange detected: ${event} - ${path.relative(srcDir, filePath)}`);

            // Rebuild bundle
            await esbuild.build(options);

            // Post-processing after each rebuild
            await postProcess();

            const bundlePath = path.join(distDir, 'bundle.js');
            const bundleSize = fs.statSync(bundlePath).size;
            console.log(`  Bundle size: ${(bundleSize / 1024).toFixed(2)} KB`);
        });

        // Initial build with esbuild context for live reload
        const ctx = await esbuild.context(options);
        await ctx.watch();
        console.log('Bundle built successfully (watching for changes)...');

        // Initial post-processing
        await postProcess();
    } else {
        await esbuild.build(options);
        console.log('Bundle built successfully to dist/bundle.js');
        await postProcess();

        const bundlePath = path.join(distDir, 'bundle.js');
        const bundleSize = fs.statSync(bundlePath).size;
        console.log(`  Bundle size: ${(bundleSize / 1024).toFixed(2)} KB`);
    }
}

async function postProcess() {
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
    await processProjectJson();
    await generateThirdPartyLicenses();
}

async function generateThirdPartyLicenses() {
    console.log('Generating third-party licenses...');

    const srcLicense = path.join(srcDir, 'THIRD_PARTY_LICENSES');
    const destLicense = path.join(distDir, 'THIRD_PARTY_LICENSES');

    // 复制根目录的 THIRD_PARTY_LICENSES 到 dist
    if (fs.existsSync(srcLicense)) {
        if (!fs.existsSync(destLicense)) {
            fs.mkdirSync(destLicense, { recursive: true });
        }
        const entries = fs.readdirSync(srcLicense, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(srcLicense, entry.name);
            const destPath = path.join(destLicense, entry.name);
            if (entry.isDirectory()) {
                await copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
        console.log('  Copied root THIRD_PARTY_LICENSES to dist');
    }

    // 使用 license-checker-rseidelsohn 汇集依赖许可证 (markdown 格式)
    const licensesPath = path.join(distDir, 'THIRD_PARTY_LICENSES', 'DEPENDENCIES.md');
    execSync(
        `npx license-checker-rseidelsohn --markdown --out "${licensesPath}" --production`,
        { cwd: srcDir, stdio: 'inherit' }
    );
    console.log('  Generated DEPENDENCIES.md from license-checker-rseidelsohn');
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});