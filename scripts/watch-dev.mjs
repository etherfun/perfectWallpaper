/**
 * Watch dev — vite build --watch 每次重建后自动同步到 dev/
 * 首次 build:dev 后运行，修改 src/ 即可自动刷新浏览器
 */

import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DEV_DIR = resolve(ROOT, 'dev');
const DIST_DIR = resolve(ROOT, 'dist');

function copyDistToDev() {
  if (!fs.existsSync(DIST_DIR)) return;
  if (!fs.existsSync(DEV_DIR)) {
    fs.mkdirSync(DEV_DIR, { recursive: true });
  }
  // 只清理非 we-dev-kit 的内容
  for (const entry of fs.readdirSync(DEV_DIR)) {
    if (entry === 'we-dev-kit') continue;
    fs.rmSync(resolve(DEV_DIR, entry), { recursive: true, force: true });
  }
  // 复制 dist/ 到 dev/
  copyDirSync(DIST_DIR, DEV_DIR, (file) => !file.startsWith('.'));
}

// 复制目录工具
function copyDirSync(src, dest, filter) {
  for (const entry of fs.readdirSync(src)) {
    if (filter && !filter(entry)) continue;
    const srcPath = resolve(src, entry);
    const destPath = resolve(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath, filter);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function runPostBuildSteps() {
  console.log('[watch:dev] Running post-build steps…');
  try {
    // 1. 编译 SCSS → dev/default.css
    execSync('npx sass src/scss/main.scss:dev/default.css --style compressed --no-source-map', {
      cwd: ROOT, stdio: 'inherit'
    });
    // 2. HTML 路径重写: 读取 dev/index.html，替换路径
    let html = fs.readFileSync(resolve(DEV_DIR, 'index.html'), 'utf-8');
    html = html
      .replace(/\.\/dist\/style\//g, './')
      .replace(/\.\/dist\//g, './')
      .replace(/dist\/style\//g, '')
      .replace(/dist\//g, '')
      .replace(/src\/source\//g, 'source/');
    fs.writeFileSync(resolve(DEV_DIR, 'index.html'), html, 'utf-8');
    console.log('[watch:dev] Post-build steps completed');
  } catch (err) {
    console.error('[watch:dev] Post-build step failed:', err.message);
  }
}

console.log('[watch:dev] Starting vite build --watch…');
console.log('[watch:dev] Each rebuild will auto-sync to dev/\n');

const vite = spawn('npx', ['vite', 'build', '--watch', '--sourcemap'], {
  cwd: ROOT,
  stdio: ['ignore', 'pipe', 'inherit'],
  shell: true,
});

let buildCount = 0;

vite.stdout.on('data', (chunk) => {
  const text = chunk.toString();
  process.stdout.write(text);

  // vite 重建完成时输出 "built in Xms" — 这时同步到 dev/
  if (text.includes('built in')) {
    buildCount++;
    try {
      copyDistToDev();
      runPostBuildSteps();
      const time = new Date().toLocaleTimeString();
      console.log(`[watch:dev] ${time} — synced to dev/ (build #${buildCount})`);
    } catch (err) {
      console.error('[watch:dev] sync failed:', err.message);
    }
  }
});

vite.on('error', (err) => {
  console.error('[watch:dev] vite process error:', err);
  process.exit(1);
});

vite.on('close', (code) => {
  console.log(`[watch:dev] vite exited with code ${code}`);
  process.exit(code ?? 0);
});

// 优雅退出
process.on('SIGINT', () => {
  vite.kill();
  process.exit(0);
});
