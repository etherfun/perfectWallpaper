/**
 * Regenerate `browser-preview.html` from `dist/index.html`.
 *
 * dist/index.html is the post-build artifact: it has all asset paths
 * rewritten (./dist/style/default.css → ./default.css, ./dist/source/...,
 * etc.) by scripts/post-build.js. The source index.html keeps the
 * pre-rewrite paths (./dist/style/default.css, ./src/source/...) because
 * Wallpaper Engine reads dist/index.html, not the source.
 *
 * dist/index.html also still has the XHTML 1.0 Transitional doctype.
 * parse5 / modern browsers reject the inline PUBLIC identifier under
 * HTML5 parsing rules, so we replace it with a vanilla HTML5 doctype.
 *
 * Run: `yarn build && node scripts/build-preview.mjs`
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const distHtmlPath = resolve(ROOT, 'dist', 'index.html');
if (!fs.existsSync(distHtmlPath)) {
    console.error('ERROR: dist/index.html not found. Run `yarn build` first.');
    process.exit(1);
}

const src = fs.readFileSync(distHtmlPath, 'utf8');

// 1. Replace XHTML 1.0 doctype with HTML5
let html5 = src.replace(
    /^<!DOCTYPE\s+html[\s\S]*?>\s*/i,
    '<!DOCTYPE html>\n',
);

// 2. Rewrite dist-relative asset paths to project-root-relative paths,
//    since browser-preview.html lives at project root (not in dist/).
//    dist/index.html uses `./bundle.js` etc. (relative to dist/),
//    but browser-preview.html is at root, so `./bundle.js` → `./dist/bundle.js`.
html5 = html5
    .replace(/href="\.\/default\.css"/g, 'href="./dist/default.css"')
    .replace(/src="\.\/bundle\.js"/g, 'src="./dist/bundle.js"')
    // background-image url(./source/imgs/...) → url(./dist/source/imgs/...)
    .replace(/url\('\.\/source\//g, "url('./dist/source/");

// 3. Legacy widget markup stripping is now done by scripts/post-build.js
//    (Phase 8+: Vue fully takes over; legacy shells removed from dist/index.html).
//    dist/index.html coming out of post-build already has no #clock, #oDate,
//    etc. — only the Vue components render those inside #app-root.

// 4. Inject preview status overlay + WE global shim just after <body>
const shim = `
    <!-- Browser-preview only: status overlay + WE global stubs -->
    <div id="__preview_status">loading…</div>
    <script>
        const noop = function () {};
        window.wallpaperPropertyListener = {
            applyUserProperties: noop,
            applyGeneralProperties: noop,
        };
        window.wallpaperRegisterAudioListener = noop;
        window.__previewPiniaReady = true;
    </script>
`;

const withShim = html5.replace(/<body[^>]*>/i, (m) => m + '\n' + shim);

// 5. Inject preview-only CSS + status logger script just before </body>
const tail = `
    <style id="__preview_theme">
        /* Preview defaults — mimic Wallpaper Engine's default theme so the
           CSS-variable-driven layout works even when the WE property listener
           never fires. Spreads widgets across the viewport.

           IMPORTANT: must be set on body (not :root) because the property
           composables do elements.body.style.setProperty('--clock-top', ...)
           which sets inline style on body. Inline style on body wins over
           :root declarations but loses to <style> declarations also on
           body. We use body { --var: value !important; } so our defaults
           survive any subsequent inline setProperty calls — we want the
           preview layout to be predictable, not fighting with the bundle. */
        body {
            /* Clock — center-top */
            --clock-visibility: visible !important;
            --clock-display: flex !important;
            --clock-top: 35% !important;
            --clock-left: 50% !important;
            --clock-font-size: 8vh !important;
            --clock-line-height: 1 !important;
            --clock-opacity: 1 !important;
            --clock-color: 255 255 255 !important;

            /* Date — directly below clock */
            --date-visibility: visible !important;
            --date-display: flex !important;
            --date-top: 50% !important;
            --date-left: 50% !important;
            --date-font-size: 4vh !important;
            --date-opacity: 1 !important;
            --date-color: 255 255 255 !important;
            --date-blur-color: 0 0 0 !important;

            /* Countdown — bottom-left */
            --countdown-visibility: visible !important;
            --countdown-display: flex !important;
            --countdown-top: 78% !important;
            --countdown-left: 25% !important;
            --countdown-font-size: 5vh !important;
            --countdown-color: 255 255 255 !important;

            /* Weather — top-right */
            --weather-visibility: visible !important;
            --weather-display: flex !important;
            --weather-top: 15% !important;
            --weather-left: 80% !important;
            --weather-font-size: 2.5vh !important;
            --weather-color: 255 255 255 !important;

            /* Hitokoto — bottom-center */
            --hitokoto-visibility: visible !important;
            --hitokoto-display: flex !important;
            --hitokoto-top: 88% !important;
            --hitokoto-left: 50% !important;
            --hitokoto-font-size: 2.5vh !important;
            --hitokoto-color: 255 255 255 !important;

            /* Dockbar — bottom edge */
            --dockbar-visibility: visible !important;
            --dockbar-display: flex !important;
            --dockbar-bottom: 5% !important;
            --dockbar-left: 50% !important;

            /* System monitor — top-left */
            --systemmonitor-visibility: visible !important;
            --systemmonitor-display: flex !important;
            --systemmonitor-top: 12% !important;
            --systemmonitor-left: 12% !important;

            /* Player control — hide by default (no audio) */
            --player-control-visibility: hidden !important;
        }
        html, body { background: #1a1a1a; margin: 0; min-height: 100vh; overflow: hidden; }
        #__preview_status {
            position: fixed; top: 8px; left: 8px; z-index: 999999;
            background: rgba(0,0,0,0.6); color: #0f0;
            font: 12px/1.4 ui-monospace, Consolas, monospace;
            padding: 4px 8px; border-radius: 4px;
            pointer-events: none; max-width: calc(100vw - 16px);
            white-space: pre-wrap;
        }
    </style>
    <script>
        (function () {
            const status = document.getElementById('__preview_status');
            const t0 = performance.now();
            const lines = [];
            function push(line) {
                lines.push('[+' + Math.round(performance.now() - t0) + 'ms] ' + line);
                status.textContent = lines.join('\\n');
            }
            window.addEventListener('error', (e) => push('ERROR: ' + e.message));
            window.addEventListener('unhandledrejection', (e) => push('REJECT: ' + (e.reason && e.reason.message)));
            push('script loaded');
            requestAnimationFrame(() => push('RAF tick (event loop alive)'));
            setTimeout(() => push('+500ms (timer alive)'), 500);
            setTimeout(() => {
                push('clock el: ' + !!document.getElementById('clock'));
                push('app-root: ' + !!document.getElementById('app-root'));
                push('bg layer1: ' + !!document.getElementById('background-layer1'));
                push('bundle loaded — preview ready');
            }, 1000);
        })();
    </script>
`;

const final = withShim.replace(/<\/body>/i, tail + '\n</body>');

fs.writeFileSync(resolve(ROOT, 'browser-preview.html'), final, 'utf8');
console.log('wrote browser-preview.html', '(' + final.length + ' bytes)');