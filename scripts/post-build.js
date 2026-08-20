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
    // update/ 不复制：dist/update/ 手动维护发布用压缩版（<150KB JPG），
    // 主目录 update/ 是交错化原图（推送到 GitHub 供更新日志加载）
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

/**
 * Strip legacy widget markup from the processed HTML.
 *
 * Phase 1 design left 8 legacy widget shells in index.html (clock, oDate,
 * countdown, weather, player_control, system-monitor, dockbar, hitokoto,
 * picture_info) that the imperative propertyHandlers populate at runtime.
 * The Vue wrappers in src/components/ ALSO render equivalents inside
 * #app-root, producing two stacked #clock / #oDate / etc. elements that
 * fight for the same screen position.
 *
 * Phase 8+: Vue fully takes over. We strip the legacy shells so the
 * compiled dist/index.html contains only:
 *   - background containers + audio/video + 7 canvas elements
 *   - sakura shader scripts
 *   - weather tooltip shells + alert template (used by Vue Weather.vue)
 *   - #app-root (Vue mount target)
 */
function stripLegacyWidgets(html) {
    const ids = [
        'clock', 'countdown', 'oDate',
        'hitokoto',
    ];
    let out = html;
    for (const id of ids) {
        out = stripBalancedWidget(out, id);
    }
    return out;
}

/**
 * 找到 <div id="X"> ... </div> 整块并移除。
 *
 * 旧版用非贪婪正则 `<div id="X"[^>]*>[\s\S]*?</div>`，在嵌套 DOM 上
 * 只匹配到第一个 </div> 就停止，导致留下撕裂的内层节点
 * （例如 #player_control > .background > .thumbnail-wrap 被剥离后，
 * .info-container / .aubar-wrapper 变成了 <body> 的孤儿直接子节点，
 * 破坏了 DOM 结构）。
 *
 * 这个版本用括号匹配算法：扫描整个块，平衡 <div> vs </div> 数量，
 * 找到使深度归零的 </div>，删除整块。
 */
function stripBalancedWidget(html, id) {
    const openRe = new RegExp(`<div\\s+id="${id}"[^>]*>`, 'i');
    const m = openRe.exec(html);
    if (!m) return html;

    const startIdx = m.index;
    let depth = 0;
    let i = startIdx;
    while (i < html.length) {
        // 跳过 HTML 注释
        if (html.startsWith('<!--', i)) {
            const end = html.indexOf('-->', i);
            if (end === -1) break;
            i = end + 3;
            continue;
        }
        const nextLt = html.indexOf('<', i);
        if (nextLt === -1) break;
        const nextGt = html.indexOf('>', nextLt);
        if (nextGt === -1) break;
        const tag = html.substring(nextLt, nextGt + 1);
        const tagLower = tag.toLowerCase();
        if (tagLower.startsWith('<div') && !tag.endsWith('/>')) {
            depth++;
        } else if (tagLower.startsWith('</div>')) {
            depth--;
            if (depth === 0) {
                // 跳过尾部空白直到换行
                let end = nextGt + 1;
                while (
                    end < html.length &&
                    (html[end] === ' ' || html[end] === '\t' || html[end] === '\n' || html[end] === '\r')
                ) {
                    end++;
                }
                return html.substring(0, startIdx) + html.substring(end);
            }
        }
        i = nextGt + 1;
    }
    return html;
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
    content = stripLegacyWidgets(content);
    // Hide the <audio> fallback "music note" icon that some browsers render
    // when <audio> has no src attribute. The audio element is still functional
    // (player_control.ts uses it for streaming) — just visually hidden.
    content = content.replaceAll(
        '<audio id="myAudio" autoplay loop></audio>',
        '<audio id="myAudio" autoplay loop style="display:none"></audio>',
    );
    fs.writeFileSync(destHtml, content);
    console.log(`  Processed: index.html (legacy widgets stripped)`);
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
