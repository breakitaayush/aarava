// Draws the Atlas ballroom plate as an engraved-map style illustration and renders PNGs.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

// seeded random so every render looks the same, but not machine-perfect
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const j = (a) => (rnd() - 0.5) * a;

const INK = '#3b2f24';
const RUST = '#9a4b2b';
const R = 300;
const LAT0 = 22 * Math.PI / 180;
const LON0 = -18 * Math.PI / 180;
const rad = (d) => d * Math.PI / 180;

function project(lat, lon) {
  const dl = lon - LON0;
  const cosc = Math.sin(LAT0) * Math.sin(lat) + Math.cos(LAT0) * Math.cos(lat) * Math.cos(dl);
  const x = R * Math.cos(lat) * Math.sin(dl);
  const y = -R * (Math.cos(LAT0) * Math.sin(lat) - Math.sin(LAT0) * Math.cos(lat) * Math.cos(dl));
  return { x, y, vis: cosc > 0 };
}

function polyline(points, wobble = 0.6) {
  const segs = [];
  let cur = [];
  for (const p of points) {
    if (p.vis) cur.push(p);
    else if (cur.length) { segs.push(cur); cur = []; }
  }
  if (cur.length) segs.push(cur);
  return segs
    .filter((s) => s.length > 1)
    .map((s) => 'M' + s.map((p) => `${(p.x + j(wobble)).toFixed(1)},${(p.y + j(wobble)).toFixed(1)}`).join(' L'))
    .join(' ');
}

function graticule() {
  let d = '';
  for (let lon = -180; lon < 180; lon += 20) {
    const pts = [];
    for (let lat = -80; lat <= 80; lat += 2) pts.push(project(rad(lat), rad(lon)));
    d += polyline(pts) + ' ';
  }
  for (let lat = -60; lat <= 60; lat += 20) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 2) pts.push(project(rad(lat), rad(lon)));
    d += polyline(pts) + ' ';
  }
  return d;
}

function equator() {
  const pts = [];
  for (let lon = -180; lon <= 180; lon += 2) pts.push(project(0, rad(lon)));
  return polyline(pts, 0.3);
}

// great-circle route between two lat/lon points (degrees)
function route(a, b) {
  const [la1, lo1, la2, lo2] = [rad(a[0]), rad(a[1]), rad(b[0]), rad(b[1])];
  const v = (la, lo) => [Math.cos(la) * Math.cos(lo), Math.cos(la) * Math.sin(lo), Math.sin(la)];
  const p = v(la1, lo1), q = v(la2, lo2);
  const om = Math.acos(p[0] * q[0] + p[1] * q[1] + p[2] * q[2]);
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
    const x = s1 * p[0] + s2 * q[0], y = s1 * p[1] + s2 * q[1], z = s1 * p[2] + s2 * q[2];
    const lat = Math.asin(z), lon = Math.atan2(y, x);
    const pr = project(lat, lon);
    // lift the arc a little off the surface so it reads like a journey, not a border
    const lift = 1 + 0.06 * Math.sin(Math.PI * t);
    pts.push({ x: pr.x * lift, y: pr.y * lift, vis: pr.vis });
  }
  return polyline(pts, 0.4);
}

function hatching() {
  let d = '';
  for (let k = -R * 1.5; k < R * 1.5; k += 6.5) {
    d += `M${(k - R + j(1.5)).toFixed(1)},${(-R - 20).toFixed(1)} L${(k + R + j(1.5)).toFixed(1)},${(R + 20).toFixed(1)} `;
  }
  return d;
}

function ringTicks(r1) {
  let d = '';
  for (let a = 0; a < 360; a += 2.5) {
    const len = a % 30 === 0 ? 14 : a % 10 === 0 ? 9 : 5;
    const t = rad(a);
    d += `M${(Math.cos(t) * r1).toFixed(1)},${(Math.sin(t) * r1).toFixed(1)} L${(Math.cos(t) * (r1 + len)).toFixed(1)},${(Math.sin(t) * (r1 + len)).toFixed(1)} `;
  }
  return d;
}

function compass(cx, cy, s) {
  const star = (r1, r2, n, rot) => {
    const p = [];
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1;
      const a = rot + (Math.PI / n) * i - Math.PI / 2;
      p.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
    }
    return p.join(' ');
  };
  return `
    <circle cx="${cx}" cy="${cy}" r="${s * 0.62}" fill="none" stroke="${INK}" stroke-width="0.9"/>
    <circle cx="${cx}" cy="${cy}" r="${s * 0.56}" fill="none" stroke="${INK}" stroke-width="0.5" stroke-dasharray="1.5 3"/>
    <polygon points="${star(s * 0.55, s * 0.1, 4, Math.PI / 4)}" fill="none" stroke="${INK}" stroke-width="0.8"/>
    <polygon points="${star(s, s * 0.14, 4, 0)}" fill="#efe5cf" stroke="${INK}" stroke-width="1"/>
    <path d="M${cx},${cy - s} L${cx + s * 0.14},${cy - s * 0.14} L${cx},${cy} Z" fill="${RUST}"/>
    <text x="${cx}" y="${cy - s - 10}" text-anchor="middle" font-family="Cinzel" font-size="${s * 0.32}" fill="${INK}">N</text>`;
}

const origins = [[52, -40], [-34, -58], [8, 62], [48, 30]];
const meet = [24, 4];

function globe() {
  const routes = origins.map((o) => route(o, meet)).join(' ');
  const dots = origins
    .map((o) => project(rad(o[0]), rad(o[1])))
    .filter((p) => p.vis)
    .map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.4" fill="${INK}"/>`)
    .join('');
  const m = project(rad(meet[0]), rad(meet[1]));
  const mx = m.x * 1.0, my = m.y * 1.0;
  return `
  <g filter="url(#ink)">
    <circle r="${R + 62}" fill="none" stroke="${INK}" stroke-width="0.6" opacity="0.55"/>
    <circle r="${R + 40}" fill="none" stroke="${INK}" stroke-width="1.1"/>
    <path d="${ringTicks(R + 40)}" stroke="${INK}" stroke-width="0.7" fill="none"/>
    <circle r="${R + 22}" fill="none" stroke="${INK}" stroke-width="0.5" opacity="0.7"/>
    <circle r="${R}" fill="url(#sea)" stroke="${INK}" stroke-width="2"/>
    <g clip-path="url(#disc)">
      <path d="${hatching()}" stroke="${INK}" stroke-width="0.55" mask="url(#shade)" fill="none"/>
      <path d="${graticule()}" stroke="${INK}" stroke-width="0.75" fill="none" opacity="0.8"/>
      <path d="${equator()}" stroke="${INK}" stroke-width="1.1" fill="none" stroke-dasharray="7 4"/>
    </g>
    <path d="${routes}" stroke="${RUST}" stroke-width="1.6" fill="none" stroke-dasharray="2 5" stroke-linecap="round"/>
    ${dots}
    <circle cx="${mx}" cy="${my}" r="15" fill="none" stroke="${RUST}" stroke-width="1"/>
    <circle cx="${mx}" cy="${my}" r="8" fill="none" stroke="${RUST}" stroke-width="1.4"/>
    <circle cx="${mx}" cy="${my}" r="3.6" fill="${RUST}"/>
  </g>`;
}

const fontFaces = `
@font-face{font-family:'Cinzel';src:url(cinzel-latin-63551c.woff2) format('woff2');}
@font-face{font-family:'Cormorant';font-style:normal;src:url(cormorant-garamond-latin-2fed1d.woff2) format('woff2');}
@font-face{font-family:'Cormorant';font-style:italic;src:url(cormorant-garamond-latin-9ca58f.woff2) format('woff2');}
`;

const defs = `
<defs>
  <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="11"/>
    <feColorMatrix values="0 0 0 0 0.23  0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 0.09 0"/>
  </filter>
  <filter id="blotch">
    <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="5"/>
    <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.40  0 0 0 0 0.22  0 0 0 0.16 0"/>
  </filter>
  <radialGradient id="paper" cx="50%" cy="45%" r="75%">
    <stop offset="0" stop-color="#f3ebd8"/>
    <stop offset="0.7" stop-color="#e9ddc2"/>
    <stop offset="1" stop-color="#d6c39f"/>
  </radialGradient>
  <radialGradient id="sea" cx="38%" cy="34%" r="75%">
    <stop offset="0" stop-color="#f6efdd"/>
    <stop offset="1" stop-color="#e2d3b2"/>
  </radialGradient>
  <radialGradient id="shadeGrad" cx="30%" cy="28%" r="85%">
    <stop offset="0.45" stop-color="#000"/>
    <stop offset="1" stop-color="#fff"/>
  </radialGradient>
  <mask id="shade"><rect x="-400" y="-400" width="800" height="800" fill="url(#shadeGrad)"/></mask>
  <clipPath id="disc"><circle r="${R}"/></clipPath>
</defs>`;

const paper = (w, h) => `
  <rect width="${w}" height="${h}" fill="url(#paper)"/>
  <rect width="${w}" height="${h}" filter="url(#blotch)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)"/>`;

function square(withTitle) {
  const W = 1000, H = 1000;
  const gy = withTitle ? 440 : 500;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${defs}${paper(W, H)}
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${INK}" stroke-width="1.2" opacity="0.75"/>
  <rect x="38" y="38" width="${W - 76}" height="${H - 76}" fill="none" stroke="${INK}" stroke-width="0.5" opacity="0.6"/>
  <g transform="translate(500 ${gy}) rotate(-8)">${globe()}</g>
  <g filter="url(#ink)">${compass(870, withTitle ? 800 : 860, 46)}</g>
  ${withTitle ? `
  <text x="500" y="870" text-anchor="middle" font-family="Cinzel" font-size="64" letter-spacing="22" fill="${INK}">ATLAS</text>
  <line x1="390" y1="896" x2="610" y2="896" stroke="${INK}" stroke-width="0.8"/>
  <text x="500" y="932" text-anchor="middle" font-family="Cormorant" font-style="italic" font-size="27" fill="${INK}">the ballroom &#183; where every road meets</text>` : ''}
</svg>`;
}

function wide() {
  const W = 1920, H = 1080;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  ${defs}${paper(W, H)}
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${INK}" stroke-width="1.4" opacity="0.75"/>
  <rect x="48" y="48" width="${W - 96}" height="${H - 96}" fill="none" stroke="${INK}" stroke-width="0.6" opacity="0.6"/>
  <g transform="translate(1380 540) scale(1.32) rotate(-8)">${globe()}</g>
  <g filter="url(#ink)">${compass(170, 900, 52)}</g>
</svg>`;
}

const page = (svg, w, h) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces}html,body{margin:0;background:#e9ddc2}svg{display:block}</style></head><body>${svg}</body></html>`;

const jobs = [
  ['atlas-square.png', square(true), 1000, 1000],
  ['atlas-square-plain.png', square(false), 1000, 1000],
  ['atlas-wide-background.png', wide(), 1920, 1080],
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [name, svg, w, h] of jobs) {
  const html = path.join(here, name.replace('.png', '.html'));
  seed = 7;
  writeFileSync(html, page(svg, w, h));
  const pg = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await pg.goto('file://' + html);
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: path.join(here, name) });
  await pg.close();
}
await browser.close();
console.log('done');
