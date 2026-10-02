// Vẽ sẵn (bake) nền bản đồ vào một canvas phụ: đất, cỏ, đường, ao, cây, đá, cổng thành...
// Chỉ vẽ lại khi đổi màn hoặc đổi độ phân giải, nên có thể vẽ rất nhiều chi tiết.
import { WORLD, dist, seededRandom } from '../core/utils.js';
import { INK, tint, blob, rrect, poly, shape, line, groundShadow } from './art.js';

export const THEMES = {
  meadow: {
    ground: '#78b04c',
    patches: ['#86bd57', '#6aa142', '#93c662', '#5f9a3e'],
    blade: '#4f8a34',
    pathEdge: '#7a5a34',
    path: '#d4b07a',
    pathLight: '#e6c896',
    pebble: '#a88a5c',
    trees: ['#3d8a3a', '#4a9a40', '#2f7a34'],
    trunk: '#6b4a2b',
    rock: '#9aa0a3',
    bush: '#4f9a3c',
    flower: ['#ffffff', '#ffd93d', '#ff8fab', '#b98cff'],
    water: '#4aa3d8',
    treeShape: 'round',
    ambient: 'meadow',
  },
  autumn: {
    ground: '#a3a64e',
    patches: ['#b0b058', '#949a44', '#bba552', '#87903c'],
    blade: '#7d7f34',
    pathEdge: '#6e4d2e',
    path: '#cfa36c',
    pathLight: '#e0b985',
    pebble: '#9a774c',
    trees: ['#d0601f', '#e58a2a', '#bf4220', '#ddb02c'],
    trunk: '#5b3b22',
    rock: '#96918a',
    bush: '#b8702a',
    flower: ['#f7e9a0', '#e86a3a'],
    water: '#4b8fb8',
    treeShape: 'round',
    ambient: 'autumn',
  },
  snow: {
    ground: '#e4edf3',
    patches: ['#f4f8fb', '#d3dfe8', '#dbe6ee', '#cad7e1'],
    blade: null,
    pathEdge: '#8593a0',
    path: '#b9c4cd',
    pathLight: '#cdd6dd',
    pebble: '#98a4ae',
    trees: ['#2e5d4f', '#356b5a', '#24503f'],
    trunk: '#4b3a2c',
    rock: '#7d8a96',
    bush: '#3b6a5a',
    flower: [],
    water: '#9fd0ea',
    treeShape: 'pine',
    ambient: 'snow',
  },
};

export const PATH_WIDTH = 46;

function strokePath(ctx, path, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  path.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
}

function roundTree(ctx, x, y, size, theme, rand) {
  groundShadow(ctx, x + size * 0.35, y + 2, size * 1.1, size * 0.42, 0.3);
  rrect(ctx, x - 3, y - size * 0.7, 6, size * 0.7 + 2, 2, theme.trunk, { lw: 1.3 });
  const c = theme.trees[Math.floor(rand() * theme.trees.length)];
  const top = y - size * 0.75;
  const blobs = [
    [-size * 0.55, top - size * 0.1, size * 0.62],
    [size * 0.55, top - size * 0.05, size * 0.6],
    [0, top - size * 0.55, size * 0.75],
    [0, top + size * 0.05, size * 0.7],
  ];
  // Viền ngoài chung rồi tô từng chùm lá có khối
  ctx.fillStyle = INK;
  for (const [bx, by, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + bx, by, r + 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [bx, by, r] of blobs) blob(ctx, x + bx, by, r, r, c, { outline: null, light: 0.3, dark: 0.35 });
  // Đốm sáng trên tán
  ctx.fillStyle = 'rgba(255,255,220,0.22)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x - size * 0.3 + rand() * size * 0.4, top - size * 0.6 + rand() * size * 0.4, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pineTree(ctx, x, y, size, theme, rand) {
  groundShadow(ctx, x + size * 0.4, y + 2, size * 0.9, size * 0.35, 0.25);
  rrect(ctx, x - 2.5, y - 8, 5, 10, 1.5, theme.trunk, { lw: 1.2 });
  const c = theme.trees[Math.floor(rand() * theme.trees.length)];
  for (let i = 0; i < 3; i++) {
    const w = size * (1 - i * 0.24);
    const base = y - 6 - i * size * 0.58;
    poly(ctx, [[x - w, base], [x, base - size * 1.05], [x + w, base]], c, { lw: 1.5, light: 0.2 });
    // Tuyết đọng
    shape(ctx, (g) => {
      g.moveTo(x - w * 0.55, base - size * 0.45);
      g.lineTo(x, base - size * 1.05);
      g.lineTo(x + w * 0.45, base - size * 0.5);
      g.quadraticCurveTo(x, base - size * 0.35, x - w * 0.55, base - size * 0.45);
    }, '#ffffff', { x: x - w, y: base - size, w: w * 2, h: size }, { outline: null, noShade: true });
  }
}

function rock(ctx, x, y, s, theme) {
  groundShadow(ctx, x + 2, y + 2, s * 1.4, s * 0.55, 0.25);
  poly(ctx, [[x - s * 1.25, y + s * 0.3], [x - s * 0.8, y - s * 0.75], [x + s * 0.15, y - s * 1.05], [x + s * 1.2, y - s * 0.25], [x + s, y + s * 0.45]], theme.rock, { lw: 1.4, light: 0.45 });
}

function bush(ctx, x, y, s, theme) {
  groundShadow(ctx, x + 2, y + 2, s * 1.4, s * 0.5, 0.25);
  for (const [dx, dy, r] of [[-s * 0.6, 0, s * 0.7], [s * 0.6, 0, s * 0.7], [0, -s * 0.45, s * 0.8]]) {
    blob(ctx, x + dx, y + dy - s * 0.4, r, r * 0.85, theme.bush, { lw: 1.3 });
  }
}

function stump(ctx, x, y, theme) {
  groundShadow(ctx, x + 2, y + 2, 9, 3.5, 0.25);
  rrect(ctx, x - 6, y - 8, 12, 9, 2, theme.trunk, { lw: 1.3 });
  blob(ctx, x, y - 8, 6, 2.6, '#c9a26b', { lw: 1.2, noShade: true });
}

function mushroom(ctx, x, y) {
  rrect(ctx, x - 1.5, y - 4, 3, 5, 1, '#f3e9d6', { lw: 1 });
  blob(ctx, x, y - 4.5, 4.5, 3, '#d9473a', { lw: 1 });
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 2, y - 6, 1.4, 1.2);
  ctx.fillRect(x + 1, y - 5.4, 1.2, 1.1);
}

function fence(ctx, x, y, n) {
  for (let i = 0; i < n; i++) rrect(ctx, x + i * 9 - 1.5, y - 11, 3, 12, 1, '#8a6235', { lw: 1 });
  line(ctx, [[x - 2, y - 8], [x + (n - 1) * 9 + 2, y - 8]], '#6b4a2b', 2);
  line(ctx, [[x - 2, y - 3], [x + (n - 1) * 9 + 2, y - 3]], '#6b4a2b', 2);
}

function pond(ctx, x, y, rx, ry, theme, rand) {
  // Bờ đất, nước có độ sâu, đốm sáng, lá súng / băng
  blob(ctx, x, y + 2, rx + 7, ry + 5, tint(theme.pathEdge, 0.1), { lw: 1.8 });
  blob(ctx, x, y, rx, ry, theme.water, { outline: null, light: 0.1, dark: 0.35 });
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x - rx * 0.2 + rand() * rx * 0.4, y - ry * 0.3 + i * ry * 0.3, rx * 0.25, ry * 0.08, 0, 0, Math.PI);
    ctx.stroke();
  }
  if (theme.ambient !== 'snow') {
    for (let i = 0; i < 3; i++) {
      const lx = x - rx * 0.5 + rand() * rx;
      const ly = y - ry * 0.4 + rand() * ry * 0.8;
      blob(ctx, lx, ly, 5, 3, '#4f9a3c', { lw: 1 });
    }
  }
}

// Cổng thành ở cuối đường — nơi người chơi phải bảo vệ.
function drawGate(ctx, x, y) {
  groundShadow(ctx, x + 6, y + 18, 46, 13, 0.35);
  for (const sx of [-30, 30]) {
    rrect(ctx, x + sx - 12, y - 34, 24, 52, 2, '#a2a9ad');
    for (let i = 0; i < 3; i++) rrect(ctx, x + sx - 13 + i * 9, y - 42, 7, 9, 1.5, '#8a9296', { lw: 1.2 });
    rrect(ctx, x + sx - 3, y - 22, 6, 11, 3, '#2b3036', { lw: 1 });
  }
  rrect(ctx, x - 20, y - 20, 40, 38, 2, '#b5bcc0');
  shape(ctx, (g) => {
    g.moveTo(x - 12, y + 18);
    g.lineTo(x - 12, y - 1);
    g.arc(x, y - 1, 12, Math.PI, 0);
    g.lineTo(x + 12, y + 18);
    g.closePath();
  }, '#5a3d24', { x: x - 12, y: y - 13, w: 24, h: 31 });
  line(ctx, [[x - 12, y + 6], [x + 12, y + 6]], '#3b2a1a', 1.5);
  line(ctx, [[x, y - 12], [x, y + 18]], '#3b2a1a', 1.5);
  line(ctx, [[x, y - 20], [x, y - 52]], '#3b3b3b', 2);
  poly(ctx, [[x, y - 52], [x + 20, y - 46], [x, y - 40]], '#2f6fd6', { lw: 1.3 });
}

export function bakeTerrain(level, paths, spots, pixelScale) {
  const theme = THEMES[level.theme];
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(WORLD.width * pixelScale);
  canvas.height = Math.round(WORLD.height * pixelScale);
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelScale, pixelScale);
  const rand = seededRandom(level.id.length * 7919 + level.name.length * 104729);

  // Nền: màu gốc + các mảng mềm (gradient tròn) tạo cảm giác tranh vẽ.
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  for (let i = 0; i < 140; i++) {
    const x = rand() * WORLD.width;
    const y = rand() * WORLD.height;
    const r = 20 + rand() * 60;
    const c = theme.patches[Math.floor(rand() * theme.patches.length)];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, `${c}00`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Ngọn cỏ
  if (theme.blade) {
    ctx.strokeStyle = theme.blade;
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < 900; i++) {
      const x = rand() * WORLD.width;
      const y = rand() * WORLD.height;
      const h = 3 + rand() * 4;
      ctx.beginPath();
      ctx.moveTo(x - 2, y);
      ctx.quadraticCurveTo(x - 2, y - h * 0.6, x - 3.5, y - h);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.5, y - h * 1.2);
      ctx.moveTo(x + 2, y);
      ctx.quadraticCurveTo(x + 2, y - h * 0.6, x + 3.5, y - h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Ao nước ở chỗ trống xa đường và ô xây.
  const clear = (x, y, pad) =>
    !paths.some((p) => p.distanceFrom(x, y) < PATH_WIDTH / 2 + pad) && !spots.some((s) => dist(x, y, s.x, s.y) < 40 + pad);
  for (let tries = 0, made = 0; tries < 400 && made < 2; tries++) {
    const x = 60 + rand() * (WORLD.width - 120);
    const y = 60 + rand() * (WORLD.height - 120);
    if (!clear(x, y, 55)) continue;
    pond(ctx, x, y, 34 + rand() * 12, 18 + rand() * 6, theme, rand);
    made++;
  }

  // Đường: bóng đổ mềm, viền đất tối, lõi, vệt sáng, vết bánh xe, sỏi.
  ctx.globalAlpha = 0.25;
  for (const p of paths) strokePath(ctx, p, PATH_WIDTH + 22, '#000000');
  ctx.globalAlpha = 1;
  for (const p of paths) strokePath(ctx, p, PATH_WIDTH + 10, theme.pathEdge);
  for (const p of paths) strokePath(ctx, p, PATH_WIDTH, theme.path);
  ctx.globalAlpha = 0.55;
  for (const p of paths) strokePath(ctx, p, PATH_WIDTH * 0.5, theme.pathLight);
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.18;
  ctx.setLineDash([14, 10]);
  for (const p of paths) {
    for (const off of [-9, 9]) {
      ctx.strokeStyle = theme.pathEdge;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let d = 0; d <= p.length; d += 10) {
        const pt = p.pointAt(d, off);
        if (d === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  for (const p of paths) {
    for (let d = 0; d < p.length; d += 7) {
      const pt = p.pointAt(d, (rand() - 0.5) * PATH_WIDTH * 0.9);
      ctx.fillStyle = rand() < 0.5 ? theme.pebble : tint(theme.pebble, 0.3);
      ctx.globalAlpha = 0.45 + rand() * 0.4;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 1 + rand() * 2.4, 0.8 + rand() * 1.4, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  // Cỏ mọc lấn ra mép đường
  if (theme.blade) {
    for (const p of paths) {
      for (let d = 0; d < p.length; d += 6) {
        const side = rand() < 0.5 ? -1 : 1;
        const pt = p.pointAt(d, side * (PATH_WIDTH / 2 + 3));
        ctx.fillStyle = theme.patches[Math.floor(rand() * 4)];
        ctx.beginPath();
        ctx.ellipse(pt.x, pt.y, 3 + rand() * 4, 2 + rand() * 2, rand() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Đồ trang trí, tránh đường và ô xây.
  const items = [];
  let attempts = 0;
  while (items.length < 120 && attempts < 9000) {
    attempts++;
    const x = rand() * WORLD.width;
    const y = rand() * (WORLD.height + 24);
    const r = rand();
    const kind = r < 0.5 ? 'tree' : r < 0.62 ? 'bush' : r < 0.74 ? 'rock' : r < 0.8 ? 'stump' : r < 0.86 ? 'mushroom' : r < 0.88 ? 'fence' : 'flower';
    const pad = kind === 'tree' ? 26 : kind === 'fence' ? 20 : 12;
    if (!clear(x, y, pad)) continue;
    if ((kind === 'tree' || kind === 'bush') && items.some((it) => it.kind === 'tree' && dist(x, y, it.x, it.y) < 18)) continue;
    items.push({ x, y, kind, size: kind === 'tree' ? 13 + rand() * 9 : kind === 'bush' ? 7 + rand() * 4 : 4 + rand() * 5 });
  }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    if (it.kind === 'tree') (theme.treeShape === 'pine' ? pineTree : roundTree)(ctx, it.x, it.y, it.size, theme, rand);
    else if (it.kind === 'bush') bush(ctx, it.x, it.y, it.size, theme);
    else if (it.kind === 'rock') rock(ctx, it.x, it.y, it.size, theme);
    else if (it.kind === 'stump') stump(ctx, it.x, it.y, theme);
    else if (it.kind === 'mushroom' && theme.ambient !== 'snow') mushroom(ctx, it.x, it.y);
    else if (it.kind === 'fence') fence(ctx, it.x, it.y, 3 + Math.floor(rand() * 3));
    else if (theme.flower.length) {
      for (let i = 0; i < 5; i++) {
        const fx = it.x + (rand() - 0.5) * 16;
        const fy = it.y + (rand() - 0.5) * 10;
        ctx.fillStyle = theme.flower[Math.floor(rand() * theme.flower.length)];
        for (let k = 0; k < 4; k++) {
          ctx.beginPath();
          ctx.arc(fx + Math.cos(k * 1.57) * 1.6, fy + Math.sin(k * 1.57) * 1.6, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ffd34d';
        ctx.fillRect(fx - 0.6, fy - 0.6, 1.2, 1.2);
      }
    }
  }

  // Cổng thành tại điểm cuối mỗi đường (gộp các đường kết thúc cùng chỗ).
  const exits = [];
  for (const p of paths) {
    let d = p.length;
    let pt = p.pointAt(d);
    while (d > 0 && (pt.x < 44 || pt.x > WORLD.width - 44 || pt.y < 56 || pt.y > WORLD.height - 30)) {
      d -= 6;
      pt = p.pointAt(d);
    }
    if (!exits.some((e) => dist(e.x, e.y, pt.x, pt.y) < 80)) exits.push(pt);
  }
  for (const pt of exits) drawGate(ctx, pt.x, pt.y);

  // Ánh sáng: nắng ấm góc trên trái, tối dần ra mép (vignette).
  const sun = ctx.createRadialGradient(140, 80, 0, 140, 80, 520);
  sun.addColorStop(0, 'rgba(255,240,190,0.18)');
  sun.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  const vig = ctx.createRadialGradient(WORLD.width / 2, WORLD.height / 2, WORLD.width * 0.4, WORLD.width / 2, WORLD.height / 2, WORLD.width * 0.78);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,6,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  return canvas;
}
