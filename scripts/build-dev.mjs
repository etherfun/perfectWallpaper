/**
 * Build dev preview — produces a self-contained `dev/` directory.
 *
 * The `dev/` directory is a complete mirror of `dist/` plus the WE Dev Kit
 * injected. You can open `dev/index.html` directly or serve it with any
 * static file server and get the full PerfectWall experience with all WE
 * APIs simulated.
 *
 * Run: `yarn build:dev` (builds dev-kit + main project + assembles dev/)
 *
 * Synopsis:
 *   1. Build @perfectwall/we-dev-kit IIFE → dev/we-dev-kit/index.global.js
 *   2. Copy everything from dist/ → dev/ (bundle.js, default.css, source/, …)
 *   3. Inject dev-kit script + init into dev/index.html
 *   4. Copy supporting files (project.json, update/, preview.jpg)
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DEV_DIR = resolve(ROOT, 'dev');
const DIST_DIR = resolve(ROOT, 'dist');
const DEVKIT_SRC = resolve('F:', 'dev', 'GitHub', 'we-dev-kit');
const DEVKIT_OUT = resolve(DEV_DIR, 'we-dev-kit');

// ---- 1. Build dev-kit ----
console.log('\n[dev-build] Step 1: Building @perfectwall/we-dev-kit…');
if (!fs.existsSync(resolve(DEVKIT_SRC, 'node_modules', 'tsup'))) {
  console.error('  ERROR: dev-kit dependencies not installed. Run: cd F:/dev/GitHub/we-dev-kit && npm install');
  process.exit(1);
}

const { execSync } = await import('node:child_process');
try {
  execSync('npx --no-install tsup', { cwd: DEVKIT_SRC, stdio: 'pipe' });
  console.log('  ✓ dev-kit built');
} catch (e) {
  console.error('  ✗ dev-kit build failed:', e.stderr?.toString() || e.message);
  process.exit(1);
}

// ---- 2. Build main project (dev mode: skip typecheck, enable sourcemap) ----
console.log('\n[dev-build] Step 2: Building main project…');
try {
  execSync('npx vite build --sourcemap && node scripts/post-build.js', { cwd: ROOT, stdio: 'inherit' });
  console.log('  ✓ main project built (sourcemap enabled)');
} catch (e) {
  console.error('  ✗ main project build failed:', e.stderr?.toString() || e.message);
  process.exit(1);
}

// ---- 3. Copy dist/ → dev/ recursively ----
console.log('\n[dev-build] Step 3: Copying dist/ → dev/…');
if (fs.existsSync(DEV_DIR)) {
  // Remove everything except we-dev-kit/ (preserve dev-kit if already there)
  for (const entry of fs.readdirSync(DEV_DIR)) {
    if (entry === 'we-dev-kit') continue;
    const full = resolve(DEV_DIR, entry);
    fs.rmSync(full, { recursive: true, force: true });
  }
} else {
  fs.mkdirSync(DEV_DIR, { recursive: true });
}

copyDirSync(DIST_DIR, DEV_DIR, (file) => {
  // Skip .gitkeep or other hidden files
  return !file.startsWith('.');
});
console.log('  ✓ dist/ → dev/ copied');

// ---- 4. Copy dev-kit build output into dev/we-dev-kit/ ----
console.log('\n[dev-build] Step 4: Copying dev-kit build output…');
const devKitDist = resolve(DEVKIT_SRC, 'dist');
if (!fs.existsSync(devKitDist)) {
  console.error('  ERROR: dev-kit dist/ not found. Build may have failed.');
  process.exit(1);
}
// Clean and copy
if (fs.existsSync(DEVKIT_OUT)) {
  fs.rmSync(DEVKIT_OUT, { recursive: true, force: true });
}
fs.mkdirSync(DEVKIT_OUT, { recursive: true });
copyDirSync(devKitDist, DEVKIT_OUT);
console.log('  ✓ dev-kit copied to dev/we-dev-kit/');

// ---- 5. Inject project.json defaults + dev-kit script into dev/index.html ----
console.log('\n[dev-build] Step 5: Injecting defaults + WE Dev Kit into dev/index.html…');
const htmlPath = resolve(DEV_DIR, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('  ERROR: dev/index.html not found');
  process.exit(1);
}

// Read project.json from dev/ directory (already copied by Step 3)
const projectJsonPath = resolve(DEV_DIR, 'project.json');
const defaultsScript = (() => {
  try {
    const pj = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
    const props = pj?.general?.properties;
    if (!props) return '';

    // Build { key: { value: defaultValue } } for all non-group/non-text properties
    const entries = [];
    for (const [key, def] of Object.entries(props)) {
      const d = def;
      if (d.type === 'group' || d.type === 'text') continue;
      if ('value' in d) {
        entries.push(`"${key}":${JSON.stringify({ value: d.value })}`);
      }
    }
    return `window.__weDevKitDefaults={${entries.join(',')}};`;
  } catch {
    return '';
  }
})();

const shim = `
    <!-- Dev build: WE Dev Kit runtime simulation -->
    <script>${defaultsScript}</script>
    <script src="./we-dev-kit/index.global.js"></script>
    <script>
        // 标记为开发环境（we-dev-kit 的 detectEnvironment 通过 ?dev-kit=true 识别）
        if (!location.search.includes('dev-kit')) {
            const params = new URLSearchParams(location.search);
            params.set('dev-kit', 'true');
            history.replaceState(null, '', location.pathname + '?' + params.toString() + location.hash);
        }
        try {
            WeDevKit.createWeDevKit({
                panel: true,
                audio: { amplitude: 0.6 },
                media: { autoCycle: true, cycleIntervalMs: 8000 },
                rgb: true,
                lifecycle: true,
            });
        } catch (e) {
            console.warn('[Dev Build] WE Dev Kit init failed:', e);
        }
    </script>
`;

let html = fs.readFileSync(htmlPath, 'utf8');
// Inject after <body>
html = html.replace('<body>', '<body>\n' + shim);

// Also add status overlay
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
console.log('  ✓ WE Dev Kit injected into dev/index.html');

// ---- 6. Copy project.json, update/, preview.jpg ----
console.log('\n[dev-build] Step 6: Copying supporting files…');
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

// ---- 7. Summary ----
const size = dirSize(DEV_DIR);
console.log(`\n✓ dev build complete: ${(size / 1024 / 1024).toFixed(1)} MB at dev/`);
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
