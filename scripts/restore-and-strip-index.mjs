/**
 * Strip legacy widget blocks from source index.html — robust version.
 *
 * The previous regex `<div\s+id="X"[^>]*>[\s\S]*?</div>\s*` is non-greedy
 * and stops at the FIRST </div>, so when the widget block contains
 * nested divs (e.g. <div id="weather">...<div class="weather-container">
 * <div class="weather-left"><div class="weather-icon"></div>...</div></div></div>),
 * only the outermost opening tag is matched up to the first nested </div>,
 * leaving 50+ orphan lines of inner content.
 *
 * This version uses a bracket-balanced scanner to find the matching
 * closing </div> for each widget's opening tag, then strips the entire
 * block cleanly.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import fs from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const indexPath = resolve(ROOT, 'index.html');

let src = fs.readFileSync(indexPath, 'utf8');

const ids = [
    'clock', 'countdown', 'oDate', 'weather', 'player_control',
    'system-monitor', 'dockbar', 'hitokoto', 'picture_info',
];

function findBlockEnd(html, startIdx) {
    // startIdx points AT the '<' of the opening <div id="X">.
    // Scan forward, counting opening vs closing <div>/</div> tags,
    // skipping <div ...> inside <script>, <template>, and inside
    // self-closing tags. Returns the index AFTER the matching </div>.
    let depth = 0;
    let i = startIdx;
    while (i < html.length) {
        // Skip HTML comments
        if (html.startsWith('<!--', i)) {
            const end = html.indexOf('-->', i);
            if (end === -1) return -1;
            i = end + 3;
            continue;
        }
        // Look for next < character
        const nextLt = html.indexOf('<', i);
        if (nextLt === -1) return -1;
        // Find closing > on same tag
        const nextGt = html.indexOf('>', nextLt);
        if (nextGt === -1) return -1;
        const tag = html.substring(nextLt, nextGt + 1);
        const tagLower = tag.toLowerCase();
        if (tagLower.startsWith('<div') && !tag.endsWith('/>')) {
            depth++;
        } else if (tagLower.startsWith('</div>')) {
            depth--;
            if (depth === 0) {
                // Skip trailing whitespace until newline
                let end = nextGt + 1;
                while (end < html.length && (html[end] === ' ' || html[end] === '\t' || html[end] === '\n' || html[end] === '\r')) {
                    end++;
                }
                return end;
            }
        }
        i = nextGt + 1;
    }
    return -1;
}

let totalRemoved = 0;
for (const id of ids) {
    const openRe = new RegExp(`<div\\s+id="${id}"[^>]*>`, 'i');
    const m = openRe.exec(src);
    if (!m) {
        console.log(`  [skip] #${id} not found`);
        continue;
    }
    const startIdx = m.index;
    const endIdx = findBlockEnd(src, startIdx);
    if (endIdx === -1) {
        console.log(`  [FAIL] #${id} no matching </div>`);
        continue;
    }
    const removed = src.substring(startIdx, endIdx);
    src = src.substring(0, startIdx) + src.substring(endIdx);
    totalRemoved += removed.length;
    console.log(`  [ok]   #${id} removed (${removed.length} bytes)`);
}

fs.writeFileSync(indexPath, src, 'utf8');
console.log(`\nDone. Removed ${totalRemoved} bytes (${src.split('\n').length} lines).`);