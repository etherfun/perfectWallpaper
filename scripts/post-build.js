/**
 * Post-build script — runs after `vite build` to:
 *   1. Compile SCSS → dist/default.css
 *   2. Rewrite bundle.js paths (src/source/ → source/)
 *   3. Copy assets (index.html, project.json, source/, update/, preview.jpg)
 *   4. Copy npm package assets (qweather-icons)
 *   5. Process index.html (path replacements)
 *   6. Process project.json (strip dist/ prefixes)
 *   7. Generate THIRD_PARTY_LICENSES/DEPENDENCIES.md
 *
 * Designed to work on top of a Vite IIFE bundle output at dist/bundle.js.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '..');
const distDir = path.resolve(srcDir, 'dist');

// Files to copy to project root (for wallpaper engine)
const copyFiles = [
    { src: 'index.html', dest: 'index.html', force: true },
    { src: 'project.json', dest: 'project.json' },
    { src: 'source/i18n/', dest: 'source/i18n/', force: true },
    { src: 'source/imgs/', dest: 'source/imgs/' },
    { src: 'source/map/', dest: 'source/map/' },
    { src: 'update/', dest: 'update/', force: true },
    { src: 'preview.jpg', dest: 'preview.jpg' },
];

// npm package assets to copy
const npmAssets = [
    { from: 'node_modules/qweather-icons/icons', to: 'source/QWeather-Icons/icons' },
    { from: 'node_modules/qweather-icons/LICENSE', to: 'source/QWeather-Icons/LICENSE' },
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
        return;
    }
    const destDir = path.dirname(dest);
    if (!destDir || destDir === '.') {
        // nothing
    } else if (!fs.existsSync(destDir)) {
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
    if (!fs.existsSync(srcHtml)) {
        console.log(`  Warning: ${srcHtml} does not exist, skipping HTML processing`);
        return;
    }
    let content = fs.readFileSync(srcHtml, 'utf8');
    for (const [original, replacement] of htmlPathReplacements) {
        content = content.replaceAll(original, replacement);
    }
    fs.writeFileSync(destHtml, content);
    console.log(`  Processed: index.html`);
}

async function processProjectJson() {
    const srcJson = path.join(srcDir, 'project.json');
    const destJson = path.join(distDir, 'project.json');
    if (!fs.existsSync(srcJson)) {
        console.log(`  Warning: ${srcJson} does not exist, skipping project.json processing`);
        return;
    }
    let content = fs.readFileSync(srcJson, 'utf8');
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
            await copyFile(srcPath, destPath, true);
        }
    }
}

async function generateThirdPartyLicenses() {
    console.log('Generating third-party licenses...');
    const srcLicense = path.join(srcDir, 'THIRD_PARTY_LICENSES');
    const destLicense = path.join(distDir, 'THIRD_PARTY_LICENSES');
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
    const licensesPath = path.join(destLicense, 'DEPENDENCIES.md');
    try {
        execSync(`npx license-checker-rseidelsohn --markdown --out "${licensesPath}" --production`, {
            cwd: srcDir,
            stdio: 'inherit',
        });
        console.log('  Generated DEPENDENCIES.md');
    } catch (err) {
        console.warn(`  Warning: license-checker failed (${err.message || err})`);
    }
}

async function rewriteBundlePaths() {
    const bundlePath = path.join(distDir, 'bundle.js');
    if (!fs.existsSync(bundlePath)) {
        console.log('  Warning: dist/bundle.js not found, skipping path rewrite');
        return;
    }
    let content = fs.readFileSync(bundlePath, 'utf8');
    content = content.replaceAll('src/source/', 'source/');
    fs.writeFileSync(bundlePath, content);
    console.log('  Rewrote paths in bundle.js');
}

async function compileScss() {
    const scssPath = path.resolve(srcDir, 'src/scss/main.scss');
    const cssOut = path.resolve(distDir, 'default.css');
    if (!fs.existsSync(scssPath)) {
        console.log('  SCSS source not found, skipping compilation');
        return;
    }
    console.log('Compiling SCSS...');
    execSync(`npx sass --style=compressed --no-source-map "${scssPath}" "${cssOut}"`, {
        stdio: 'inherit',
    });
    console.log('  SCSS compiled to dist/default.css');
}

async function main() {
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    await compileScss();
    await rewriteBundlePaths();
    await copyAssets();
    await processHtml();
    await processProjectJson();
    await generateThirdPartyLicenses();

    const bundlePath = path.join(distDir, 'bundle.js');
    if (fs.existsSync(bundlePath)) {
        const bundleSize = fs.statSync(bundlePath).size;
        console.log(`  Bundle size: ${(bundleSize / 1024).toFixed(2)} KB`);
    }
    console.log('Post-build complete.');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
