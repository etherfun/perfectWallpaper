/**
 * Tiny static file server for browser-side testing.
 *
 * Serves the project root so that `browser-preview.html` can be loaded
 * directly. Streams binary MIME types (jpg/png/webm/wasm) with correct
 * Content-Type, falls back to `application/octet-stream` for unknowns.
 *
 * Usage:
 *   node scripts/preview-server.mjs [--port 5175] [--host 127.0.0.1]
 */
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const argMap = Object.fromEntries(
    args.reduce((acc, cur, i) => {
        if (cur.startsWith('--')) acc.push([cur.slice(2), args[i + 1]]);
        return acc;
    }, []),
);

const PORT = Number(argMap.port ?? 5175);
const HOST = argMap.host ?? '127.0.0.1';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.map': 'application/json',
    '.wasm': 'application/wasm',
};

function safeResolve(urlPath) {
    const decoded = decodeURIComponent(urlPath.split('?')[0]);
    const candidate = path.resolve(ROOT, '.' + decoded);
    if (!candidate.startsWith(ROOT)) return null;
    return candidate;
}

const server = http.createServer((req, res) => {
    const resolved = safeResolve(req.url ?? '/');
    if (!resolved) {
        res.writeHead(403);
        res.end('forbidden');
        return;
    }
    let target = resolved;
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
        target = path.join(target, 'browser-preview.html');
    }
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
        res.writeHead(404);
        res.end('not found: ' + req.url);
        return;
    }
    const ext = path.extname(target).toLowerCase();
    const mime = MIME[ext] ?? 'application/octet-stream';
    res.writeHead(200, {
        'Content-Type': mime,
        'Cache-Control': 'no-store',
    });
    fs.createReadStream(target).pipe(res);
});

server.listen(PORT, HOST, () => {
    console.log(`preview server: http://${HOST}:${PORT}/browser-preview.html`);
});