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

// ---- the ballroom: one-point perspective, globe as chandelier, compass rose in the floor ----
const V = { x: 960, y: 560 };            // vanishing point
const BW = { l: 600, r: 1320, t: 300, b: 700 }; // back wall
const at = (px, py, k) => [V.x + (px - V.x) * k, V.y + (py - V.y) * k];
const L = (a, b, w = 1, extra = '') =>
  `<path d="M${(a[0] + j(0.8)).toFixed(1)},${(a[1] + j(0.8)).toFixed(1)} L${(b[0] + j(0.8)).toFixed(1)},${(b[1] + j(0.8)).toFixed(1)}" stroke="${INK}" stroke-width="${w}" fill="none" ${extra}/>`;
const quad = (pts, fill, extra = '') =>
  `<path d="M${pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' L')} Z" fill="${fill}" ${extra}/>`;

function archWindow(x, w, top, bottom) {
  const r = w / 2, cx = x + r, spring = top + r;
  let s = `<path d="M${x},${bottom} L${x},${spring} A${r},${r} 0 0 1 ${x + w},${spring} L${x + w},${bottom} Z" fill="#f4ecd9" stroke="${INK}" stroke-width="1.4"/>`;
  s += `<path d="M${x - 9},${bottom + 6} L${x - 9},${spring} A${r + 9},${r + 9} 0 0 1 ${x + w + 9},${spring} L${x + w + 9},${bottom + 6}" fill="none" stroke="${INK}" stroke-width="0.7"/>`;
  // mullions and panes
  s += L([cx, top], [cx, bottom], 0.8);
  for (let y = spring; y < bottom; y += (bottom - spring) / 6) s += L([x, y], [x + w, y], 0.6);
  s += `<path d="M${x + w * 0.15},${spring} A${r * 0.7},${r * 0.7} 0 0 1 ${x + w * 0.85},${spring}" fill="none" stroke="${INK}" stroke-width="0.6"/>`;
  // a little evening sky hatching in the glass
  for (let y = spring + 8; y < bottom - 4; y += 7) s += L([x + 4, y], [x + w * 0.4, y - w * 0.4], 0.35, 'opacity="0.5"');
  return s;
}

function floor() {
  let s = '';
  const fl = [BW.l, BW.b], fr = [BW.r, BW.b];
  s += quad([fl, fr, at(...fr, 4.2), at(...fl, 4.2)], '#e6d6b4');
  // boards running toward the vanishing point
  for (let x = BW.l; x <= BW.r; x += 40) s += L([x, BW.b], at(x, BW.b, 4.2), 0.45, 'opacity="0.7"');
  // cross joints, spaced the way a real floor recedes
  for (let i = 1; i < 12; i++) {
    const k = 1 + 0.32 * i * (1 + i * 0.06);
    const a = at(BW.l, BW.b, k), b = at(BW.r, BW.b, k);
    s += L(a, b, 0.4, 'opacity="0.55"');
  }
  return s;
}

function walls() {
  let s = '';
  const tl = [BW.l, BW.t], tr = [BW.r, BW.t], bl = [BW.l, BW.b], br = [BW.r, BW.b];
  const K = 4.2;
  // side walls + ceiling fills
  s += quad([tl, bl, at(...bl, K), at(...tl, K)], '#e8dcc0');
  s += quad([tr, br, at(...br, K), at(...tr, K)], '#e8dcc0');
  s += quad([tl, tr, at(...tr, K), at(...tl, K)], '#ece2c9');
  // side-wall columns with mirrored arches between them
  const ks = [1.25, 1.6, 2.1, 2.9, 4.0];
  for (const side of [BW.l, BW.r]) {
    for (let i = 0; i < ks.length; i++) {
      const k = ks[i], w = 22 * k * (side === BW.l ? 1 : -1);
      const top = at(side, BW.t + 38, k), bot = at(side, BW.b, k);
      const top2 = at(side + w / k, BW.t + 38, k), bot2 = at(side + w / k, BW.b, k);
      s += quad([top, top2, bot2, bot], '#efe5cf', `stroke="${INK}" stroke-width="1"`);
      s += L(at(side, BW.b - 30, k), at(side + w / k, BW.b - 30, k), 0.7);
      s += L(at(side, BW.t + 60, k), at(side + w / k, BW.t + 60, k), 0.7);
      if (i < ks.length - 1) {
        // tall panel between this column and the next
        const k2 = ks[i + 1];
        const pad = 0.12;
        const ka = k + pad, kb = k2 - pad * 1.6;
        const p = [at(side, BW.t + 80, ka), at(side, BW.t + 80, kb), at(side, BW.b - 50, kb), at(side, BW.b - 50, ka)];
        s += quad(p, '#f2e9d5', `stroke="${INK}" stroke-width="0.7"`);
        const c1 = at(side, BW.t + 140, ka), c2 = at(side, BW.t + 140, kb);
        s += L(c1, c2, 0.5, 'opacity="0.7"');
      }
    }
  }
  // cornice running round the room
  for (const off of [0, 14, 24]) {
    const y = BW.t + off;
    s += L(at(BW.l, y, 1), at(BW.l, y, K), off ? 0.6 : 1.2);
    s += L(at(BW.r, y, 1), at(BW.r, y, K), off ? 0.6 : 1.2);
    s += L([BW.l, y], [BW.r, y], off ? 0.6 : 1.2);
  }
  // ceiling coffers
  for (let x = BW.l; x <= BW.r; x += 120) s += L([x, BW.t], at(x, BW.t, K), 0.5, 'opacity="0.6"');
  for (const k of [1.4, 2.0, 2.9]) s += L(at(BW.l, BW.t, k), at(BW.r, BW.t, k), 0.5, 'opacity="0.6"');
  // room edges
  s += L(tl, at(...tl, K), 1.4) + L(tr, at(...tr, K), 1.4) + L(bl, at(...bl, K), 1.4) + L(br, at(...br, K), 1.4);
  s += `<rect x="${BW.l}" y="${BW.t}" width="${BW.r - BW.l}" height="${BW.b - BW.t}" fill="#efe6d1" stroke="${INK}" stroke-width="1.4"/>`;
  // back wall: three tall arched windows with pilasters
  const ww = 130, gap = (BW.r - BW.l - ww * 3) / 4;
  for (let i = 0; i < 3; i++) s += archWindow(BW.l + gap + i * (ww + gap), ww, BW.t + 70, BW.b - 30);
  for (let i = 0; i <= 3; i++) {
    const x = BW.l + gap / 2 + i * (ww + gap) - 9;
    if (i === 0 || i === 3) continue;
    s += `<rect x="${x}" y="${BW.t + 30}" width="18" height="${BW.b - BW.t - 30}" fill="none" stroke="${INK}" stroke-width="0.7"/>`;
  }
  s += L([BW.l, BW.b - 22], [BW.r, BW.b - 22], 0.7);
  return s;
}

function roseOnFloor(cx, cy, s) {
  // drawn flat, then laid down onto the floor
  const pts = (r1, r2, n, rot) => {
    const p = [];
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1, a = rot + (Math.PI / n) * i - Math.PI / 2;
      p.push(`${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`);
    }
    return p.join(' ');
  };
  let ticks = '';
  for (let a = 0; a < 360; a += 5) {
    const t = rad(a), l = a % 45 === 0 ? 22 : 10;
    ticks += `M${(Math.cos(t) * s * 1.02).toFixed(1)},${(Math.sin(t) * s * 1.02).toFixed(1)} L${(Math.cos(t) * (s * 1.02 + l)).toFixed(1)},${(Math.sin(t) * (s * 1.02 + l)).toFixed(1)} `;
  }
  return `<g transform="translate(${cx} ${cy}) scale(1 0.26)" class="ns">
    <circle r="${s * 1.18}" fill="#ecdfc2" stroke="${INK}" stroke-width="1.2"/>
    <circle r="${s * 1.02}" fill="none" stroke="${INK}" stroke-width="0.8"/>
    <path d="${ticks}" stroke="${INK}" stroke-width="0.8" fill="none"/>
    <polygon points="${pts(s * 0.62, s * 0.12, 8, Math.PI / 8)}" fill="none" stroke="${INK}" stroke-width="0.8"/>
    <polygon points="${pts(s * 0.95, s * 0.16, 4, Math.PI / 4)}" fill="#e3d2ad" stroke="${INK}" stroke-width="0.9"/>
    <polygon points="${pts(s * 0.98, s * 0.18, 4, 0)}" fill="#f3ead6" stroke="${INK}" stroke-width="1.1"/>
    <path d="M0,${-s * 0.98} L${s * 0.09},${-s * 0.2} L0,${-s * 0.12} Z" fill="${RUST}" stroke="${INK}" stroke-width="0.6"/>
    <circle r="${s * 0.05}" fill="${RUST}"/><circle r="${s * 0.1}" fill="none" stroke="${RUST}" stroke-width="1"/>
  </g>`;
}

// guests' paths: dotted footsteps from the doors and the front, all ending at the rose
function paths(cx, cy) {
  const starts = [[150, 1080], [1770, 1080], [320, 822], [1600, 822], [960, 1100]];
  return starts.map(([x, y], i) => {
    const mx = (x + cx) / 2 + (i % 2 ? -1 : 1) * 120, my = (y + cy) / 2 + 40;
    return `<path d="M${x},${y} Q${mx},${my} ${cx},${cy}" stroke="${RUST}" stroke-width="2" fill="none" stroke-dasharray="2 9" stroke-linecap="round" opacity="0.9"/>`;
  }).join('');
}

function chandelier(cx, cy, scale) {
  const r = (R + 62) * scale;
  let drops = '';
  for (let i = 1; i < 9; i++) {
    const a = rad(i * 20);
    const x = cx + Math.cos(a) * (R + 40) * scale, y = cy + Math.sin(a) * (R + 40) * scale * 0.32 + 4;
    drops += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(y + 14).toFixed(1)}" stroke="${INK}" stroke-width="0.6"/>
      <path d="M${x.toFixed(1)},${(y + 14).toFixed(1)} q-3.5,6 0,10 q3.5,-4 0,-10 Z" fill="#f6efdd" stroke="${INK}" stroke-width="0.6"/>`;
  }
  return `
    <circle cx="${cx}" cy="${cy}" r="${r * 2.1}" fill="url(#glow)"/>
    <g filter="url(#ink)">
      <path d="M${cx},0 L${cx},${cy - r}" stroke="${INK}" stroke-width="1.6" stroke-dasharray="6 3"/>
      <path d="M${cx - 30},${cy - r - 4} Q${cx},${cy - r - 40} ${cx + 30},${cy - r - 4}" stroke="${INK}" stroke-width="1" fill="none"/>
      <g transform="translate(${cx} ${cy}) scale(${scale}) rotate(-8)" class="ns">${globe()}</g>
      <path d="M${cx - (R + 40) * scale},${cy} A${(R + 40) * scale},${(R + 40) * scale * 0.32} 0 0 0 ${cx + (R + 40) * scale},${cy}" fill="none" stroke="${INK}" stroke-width="1.3"/>
      ${drops}
    </g>`;
}

function ballroom(W, H, withTitle) {
  const roseC = [960, 880];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${W === 1920 ? '0 0 1920 1080' : `${(1920 - W) / 2} 0 ${W} ${H}`}" width="${W}" height="${H}">
  ${defs.replace('</defs>', `<radialGradient id="glow"><stop offset="0" stop-color="#fff6dc" stop-opacity="0.9"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient></defs>`)}
  <rect x="-200" width="2400" height="1200" fill="url(#paper)"/>
  <g filter="url(#ink)">${walls()}${floor()}</g>
  <g filter="url(#ink)">${roseOnFloor(roseC[0], roseC[1], 300)}${paths(roseC[0], roseC[1])}</g>
  ${chandelier(960, 330, 0.5)}
  <rect x="-200" width="2400" height="1200" filter="url(#blotch)"/>
  <rect x="-200" width="2400" height="1200" filter="url(#grain)"/>
  ${withTitle ? `
  <rect x="${960 - 260}" y="${H - 150}" width="520" height="118" fill="#efe6d1" stroke="${INK}" stroke-width="1"/>
  <rect x="${960 - 252}" y="${H - 142}" width="504" height="102" fill="none" stroke="${INK}" stroke-width="0.5"/>
  <text x="960" y="${H - 86}" text-anchor="middle" font-family="Cinzel" font-size="50" letter-spacing="18" fill="${INK}">ATLAS</text>
  <text x="960" y="${H - 54}" text-anchor="middle" font-family="Cormorant" font-style="italic" font-size="24" fill="${INK}">the ballroom &#183; where every road meets</text>` : ''}
  <rect x="${(1920 - W) / 2 + 28}" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="${INK}" stroke-width="1.3" opacity="0.8"/>
  <rect x="${(1920 - W) / 2 + 38}" y="38" width="${W - 76}" height="${H - 76}" fill="none" stroke="${INK}" stroke-width="0.5" opacity="0.6"/>
</svg>`;
}

const page = (svg, w, h) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces}html,body{margin:0;background:#e9ddc2}.ns *{vector-effect:non-scaling-stroke}svg{display:block}</style></head><body>${svg}</body></html>`;

const jobs = [
  ['atlas-square.png', square(true), 1000, 1000],
  ['atlas-square-plain.png', square(false), 1000, 1000],
  ['atlas-wide-background.png', wide(), 1920, 1080],
  ['atlas-ballroom-wide.png', ballroom(1920, 1080, true), 1920, 1080],
  ['atlas-ballroom-wide-plain.png', ballroom(1920, 1080, false), 1920, 1080],
  ['atlas-ballroom-square.png', ballroom(1080, 1080, true), 1080, 1080],
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
