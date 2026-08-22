/**
 * Build dev preview — produces a self-contained `dev/` directory.
 *
 * Uses `prepareDevBuild` from the `wallpaper-engine-web-dev-kit` npm package
 * for core injection, then adds project-specific customizations.
 *
 * Usage: `npm run build:dev`
 *
 * Flow:
 *   1. Build main project via Vite (dev mode: sourcemap, skip typecheck)
 *   2. Run prepareDevBuild — copy dist → dev, inject dev-kit script into HTML
 *   3. Add project.json defaults + URL param + status overlay to index.html
 *   4. Copy supporting files (project.json, i18n, update/, preview.jpg)
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { prepareDevBuild } from 'wallpaper-engine-web-dev-kit/inject';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DEV_DIR = resolve(ROOT, 'dev');

// ---- 1. Build main project ----
console.log('\n[dev-build] Step 1: Building main project…');
try {
  execSync('npx vite build --sourcemap && node scripts/post-build.js', {
    cwd: ROOT,
    stdio: 'inherit',
  });
  console.log('  ✓ main project built (sourcemap enabled)');
} catch (e) {
  console.error('  ✗ main project build failed:', e.stderr?.toString() || e.message);
  process.exit(1);
}

// ---- 2. Use prepareDevBuild from we-dev-kit (npm) ----
console.log('\n[dev-build] Step 2: Injecting we-dev-kit into dev/…');
prepareDevBuild({
  inputDir: resolve(ROOT, 'dist'),
  outputDir: DEV_DIR,
  config: {
    panel: true,
    audio: { amplitude: 0.6 },
    media: { autoCycle: true, cycleIntervalMs: 8000 },
    rgb: true,
    lifecycle: true,
  },
});

// ---- 3. Inject project.json defaults + URL param + status overlay ----
console.log('\n[dev-build] Step 3: Finalizing dev/index.html…');
const htmlPath = resolve(DEV_DIR, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('  ERROR: dev/index.html not found');
  process.exit(1);
}

// Read project.json defaults
const projectJsonPath = resolve(DEV_DIR, 'project.json');
const defaultsScript = (() => {
  try {
    const pj = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
    const props = pj?.general?.properties;
    if (!props) return '';
    const entries = [];
    for (const [key, def] of Object.entries(props)) {
      const d = def;
      if (d.type === 'group' || d.type === 'text') continue;
      if ('value' in d) {
        entries.push(`"${key}":${JSON.stringify({ value: d.value })}`);
      }
    }
    return entries.length
      ? `<script>window.__weDevKitDefaults={${entries.join(',')}};</script>`
      : '';
  } catch {
    return '';
  }
})();

// Inject defaults + URL param before the dev-kit script
const kitScriptTag = '<script src="./we-dev-kit/index.global.js"></script>';
let html = fs.readFileSync(htmlPath, 'utf8');

if (html.includes(kitScriptTag)) {
  const prefix = [
    defaultsScript && `    ${defaultsScript}`,
    `    <script>`,
    `        if (!location.search.includes('dev-kit')) {`,
    `            const params = new URLSearchParams(location.search);`,
    `            params.set('dev-kit', 'true');`,
    `            history.replaceState(null, '', location.pathname + '?' + params.toString() + location.hash);`,
    `        }`,
    `    </script>`,
  ]
    .filter(Boolean)
    .join('\n');

  html = html.replace(kitScriptTag, prefix + '\n' + kitScriptTag);
} else {
  console.warn('  ⚠ dev-kit script tag not found, skipping injection');
}

// Status overlay before </body>
const statusOverlay = `
    <!-- Dev build: loading status -->
    <div id="__dev_status" style="position:fixed;top:8px;left:8px;z-index:999999;background:rgba(0,0,0,0.6);color:#0f0;font:12px/1.4 monospace;padding:4px 8px;border-radius:4px;pointer-events:none;white-space:pre-wrap;">loading…</div>
    <script>
        (function(){
            var el = document.getElementById('__dev_status');
            var t0 = performance.now();
            var lines = [];
            function push(m){ lines.push('[+' + Math.round(performance.now()-t0) + 'ms] ' + m); el.textContent = lines.join('\\n'); }
            window.addEventListener('error', function(e){ push('ERROR: ' + e.message); });
            window.addEventListener('unhandledrejection', function(e){ push('REJECT: ' + (e.reason && e.reason.message)); });
            push('script loaded');
            requestAnimationFrame(function(){ push('RAF tick'); });
            setTimeout(function(){ push('+500ms timer alive'); }, 500);
            setTimeout(function(){ push('dev build ready'); }, 1000);
        })();
    </script>
`;

html = html.replace('</body>', statusOverlay + '\n</body>');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('  ✓ index.html finalized (defaults + URL param + status overlay)');

// ---- 4. Copy supporting files ----
console.log('\n[dev-build] Step 4: Copying supporting files…');
const supportingFiles = [
  { src: 'project.json', dest: 'project.json' },
  { src: 'source/i18n/', dest: 'source/i18n/' },
  { src: 'update/', dest: 'update/' },
  { src: 'preview.jpg', dest: 'preview.jpg' },
];

for (const { src, dest } of supportingFiles) {
  const srcPath = resolve(ROOT, src);
  const destPath = resolve(DEV_DIR, dest);
  if (!fs.existsSync(srcPath)) continue;

  if (fs.statSync(srcPath).isDirectory()) {
    if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
    copyDirSync(srcPath, destPath);
  } else {
    if (!fs.existsSync(dirname(destPath))) fs.mkdirSync(dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
  }
}
console.log('  ✓ supporting files copied');

// ---- 5. Summary ----
const size = dirSize(DEV_DIR);
console.log(`\n[dev-build] ✓ Build complete: ${(size / 1024 / 1024).toFixed(1)} MB at dev/`);
console.log('  Open dev/index.html in browser, or serve with:');
console.log('    npx http-server dev -p 5175 -c-1');

// ---- Helpers ----

function copyDirSync(src, dest, filter) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (filter && !filter(entry)) continue;
    const srcPath = resolve(src, entry);
    const destPath = resolve(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath, filter);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function dirSize(root) {
  let total = 0;
  function walk(dir) {
    for (const entry of fs.readdirSync(dir)) {
      const p = resolve(dir, entry);
      const s = fs.statSync(p);
      if (s.isDirectory()) walk(p);
      else total += s.size;
    }
  }
  walk(root);
  return total;
}
