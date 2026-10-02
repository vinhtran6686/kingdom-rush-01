// Icon giao diện vẽ bằng canvas cùng phong cách với game (thay cho emoji).
// Mỗi icon được vẽ một lần thành ảnh PNG (data URL) rồi dùng làm background CSS / <img>.
import { SpriteCache, INK, blob, rrect, shape, glow } from '../render/art.js';
import { UNIT_ART } from '../render/characters.js';

const cache = new Map();
const unitCache = new SpriteCache();
unitCache.setScale(3);

function makeIcon(name, size, draw) {
  if (cache.has(name)) return cache.get(name);
  const c = document.createElement('canvas');
  const s = 3;
  c.width = size * s;
  c.height = size * s;
  const g = c.getContext('2d');
  g.scale(s, s);
  draw(g, size);
  const url = c.toDataURL();
  cache.set(name, url);
  return url;
}

// Chân dung nhân vật: lấy sprite đứng yên rồi phóng to phần thân trên.
function portrait(kind, zoom = 1.6, dy = 0) {
  return makeIcon(`unit:${kind}:${zoom}`, 48, (g, size) => {
    const art = UNIT_ART[kind];
    const spr = unitCache.get(`${kind}:icon`, art.spec, (gg) => art.draw(gg, { walk: 0, atk: -1, cyc: 0, moving: false, spin: -1 }));
    const sp = spr.spec;
    const k = Math.min(size / sp.w, size / sp.h) * zoom;
    g.translate(size / 2, size * 0.92 + dy);
    g.scale(k, k);
    g.drawImage(spr, -sp.ax, -sp.ay, sp.w, sp.h);
  });
}

const DRAW = {
  heart: (g) => {
    shape(g, (g) => {
      g.moveTo(12, 21);
      g.bezierCurveTo(-2, 12, 1, 2, 7, 3);
      g.bezierCurveTo(10, 3.5, 12, 6, 12, 7);
      g.bezierCurveTo(12, 6, 14, 3.5, 17, 3);
      g.bezierCurveTo(23, 2, 26, 12, 12, 21);
    }, '#e8413a', { x: 1, y: 2, w: 22, h: 19 }, { lw: 1.6, light: 0.5 });
    blob(g, 7.5, 7.5, 2, 1.4, '#ffffff', { outline: null, noShade: true, rot: -0.5 });
  },
  coin: (g) => {
    blob(g, 12, 13, 9, 8.5, '#c98f1a', { lw: 1.6 });
    blob(g, 12, 11.5, 9, 8.5, '#f2c033', { lw: 1.6, light: 0.55 });
    blob(g, 12, 11.5, 5.5, 5, '#e0a82a', { lw: 1, noShade: true });
    g.fillStyle = 'rgba(255,255,255,0.7)';
    g.fillRect(8, 6.5, 2, 5);
  },
  skull: (g) => {
    blob(g, 12, 10, 9, 8.5, '#f2ece0', { lw: 1.6, light: 0.2 });
    rrect(g, 7.5, 14, 9, 6.5, 2, '#f2ece0', { lw: 1.6, light: 0.2 });
    g.fillStyle = INK;
    g.beginPath();
    g.ellipse(8.5, 10, 2.6, 3, 0, 0, Math.PI * 2);
    g.ellipse(15.5, 10, 2.6, 3, 0, 0, Math.PI * 2);
    g.fill();
    for (const x of [10, 12, 14]) g.fillRect(x - 0.5, 16, 1, 4);
  },
  meteor: (g) => {
    for (let i = 5; i >= 1; i--) glow(g, 30 - i * 4.5, 16 - i * 2.4, 12 - i, `255,${120 + i * 20},40`, 0.55);
    glow(g, 30, 30, 14, '255,150,50', 0.8);
    blob(g, 30, 30, 9, 9, '#5a3020', { lw: 1.8 });
    blob(g, 28, 28, 4.5, 4, '#ff8a2a', { outline: null, noShade: true });
  },
  swords: (g) => {
    for (const s of [-1, 1]) {
      g.save();
      g.translate(24, 26);
      g.rotate(s * 0.75);
      shape(g, (g) => {
        g.moveTo(-2.2, 8);
        g.lineTo(-2.2, -17);
        g.lineTo(0, -21);
        g.lineTo(2.2, -17);
        g.lineTo(2.2, 8);
        g.closePath();
      }, '#e8edf2', { x: -2, y: -21, w: 4, h: 29 }, { lw: 1.3 });
      rrect(g, -6, 8, 12, 3, 1.5, '#e8b33a', { lw: 1.1 });
      rrect(g, -1.5, 11, 3, 7, 1, '#6b4a2b', { lw: 1 });
      g.restore();
    }
  },
};

export function icon(name) {
  if (name === 'hero') return portrait('hero', 1.55, 8);
  if (name === 'militia') return portrait('militia', 1.5, 6);
  const size = name === 'meteor' || name === 'swords' ? 48 : 24;
  return makeIcon(name, size, DRAW[name]);
}

export function enemyIcon(type) {
  const zoom = type === 'golem' ? 1.25 : type === 'wolf' || type === 'bat' ? 1.1 : 1.45;
  return portrait(type, zoom, type === 'bat' ? -10 : type === 'golem' ? 4 : 6);
}

// Gắn icon cho mọi phần tử có data-icon="...".
export function applyIcons(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) {
    el.style.backgroundImage = `url(${icon(el.dataset.icon)})`;
  }
}
