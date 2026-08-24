/**
 * Copy & process project.json → dist/project.json（独立脚本）
 *
 * 从 post-build.js 剥离出来，便于单独调整 project.json 后快速同步到
 * dist，无需重跑完整构建：
 *
 *     node scripts/copy-project-json.mjs
 *     # 或
 *     yarn build:json
 *
 * 处理内容：剥掉属性值里的 "dist/" 前缀（根目录 project.json 用
 * "./dist/index.html" 指向构建产物；WE 工作坊加载的是 dist 内的副本，
 * 路径必须相对于 dist 自身）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '..');
const srcJson = path.join(srcDir, 'project.json');
const destJson = path.join(srcDir, 'dist', 'project.json');

if (!fs.existsSync(srcJson)) {
    console.error(`Error: ${srcJson} does not exist`);
    process.exit(1);
}

const distDir = path.dirname(destJson);
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

let content = fs.readFileSync(srcJson, 'utf8');
// 剥掉路径值里的 dist/ 前缀，使路径相对于 dist 自身：
//   "./dist/index.html" → "./index.html"
//   "dist/xxx"          → "/xxx"（历史行为，保持兼容）
content = content.replaceAll('"./dist/', '"./');
content = content.replaceAll('"dist/', '"');
content = content.replaceAll("'dist/", "'");
fs.writeFileSync(destJson, content);

console.log(`  Copy: project.json -> dist/project.json (dist/ prefixes stripped)`);
