// Serves this folder and screenshots a 3D scene page to PNG.
// usage: node render.mjs <page.html> <out.png> [w] [h] [title=0|1]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const [page, outPng, w = '1920', h = '1080', title = '0'] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  try {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const pg = await browser.newPage({ viewport: { width: +w, height: +h } });
pg.on('console', (m) => console.log('[page]', m.text()));
pg.on('pageerror', (e) => console.log('[error]', e.message));
await pg.goto(`http://localhost:${port}/${page}?w=${w}&h=${h}&title=${title}`);
await pg.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 300000 });
await pg.evaluate(() => document.fonts.ready);
await pg.screenshot({ path: outPng });
await browser.close();
server.close();
console.log('saved', outPng);
