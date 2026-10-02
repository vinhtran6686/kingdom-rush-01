// Vẽ sẵn (bake) nền bản đồ vào một canvas phụ: cỏ, đường đất, cây, đá...
// Chỉ vẽ lại khi đổi màn hoặc đổi độ phân giải, nên có thể vẽ nhiều chi tiết.
import { WORLD, dist, seededRandom } from '../core/utils.js';

export const THEMES = {
  meadow: {
    ground: '#6fae4a',
    patches: ['#7dbb55', '#64a042', '#86c25d', '#5b9640'],
    pathEdge: '#8a6a3f',
    path: '#d2b07a',
    pathLight: '#e3c592',
    pebble: '#a88a5c',
    trees: ['#2f7d32', '#3b8f3c', '#4a9e44'],
    treeHighlight: '#6cc05a',
    trunk: '#6b4a2b',
    rock: '#8d9499',
    flower: ['#ffffff', '#ffd93d', '#ff8fab'],
    treeShape: 'round',
  },
  autumn: {
    ground: '#9aa64a',
    patches: ['#a9b052', '#8b9840', '#b5a94e', '#7f8c3a'],
    pathEdge: '#7a5634',
    path: '#c99d68',
    pathLight: '#dbb27f',
    pebble: '#9a774c',
    trees: ['#c8551f', '#e07b24', '#b8401f', '#d9a426'],
    treeHighlight: '#f2b84b',
    trunk: '#5b3b22',
    rock: '#8f8a80',
    flower: ['#f7e9a0', '#e86a3a'],
    treeShape: 'round',
  },
  snow: {
    ground: '#e6eef3',
    patches: ['#f4f8fb', '#d6e2ea', '#dde8ee', '#cfdbe4'],
    pathEdge: '#8d9aa6',
    path: '#b7c3cc',
    pathLight: '#c9d3da',
    pebble: '#98a4ae',
    trees: ['#2e5d4f', '#356b5a', '#24503f'],
    treeHighlight: '#ffffff',
    trunk: '#4b3a2c',
    rock: '#7d8a96',
    flower: [],
    treeShape: 'pine',
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

export function drawTree(ctx, x, y, size, theme, rand) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x + size * 0.3, y + 2, size * 0.9, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  if (theme.treeShape === 'pine') {
    ctx.fillStyle = theme.trunk;
    ctx.fillRect(x - 2.5, y - 6, 5, 8);
    const c = theme.trees[Math.floor(rand() * theme.trees.length)];
    for (let i = 0; i < 3; i++) {
      const w = size * (1 - i * 0.25);
      const top = y - 6 - i * size * 0.55;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x - w, top);
      ctx.lineTo(x + w, top);
      ctx.lineTo(x, top - size * 0.95);
      ctx.closePath();
      ctx.fill();
      // Tuyết phủ trên tán
      ctx.fillStyle = theme.treeHighlight;
      ctx.beginPath();
      ctx.moveTo(x - w * 0.45, top - size * 0.5);
      ctx.lineTo(x, top - size * 0.95);
      ctx.lineTo(x + w * 0.35, top - size * 0.55);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  ctx.fillStyle = theme.trunk;
  ctx.fillRect(x - 3, y - 8, 6, 10);
  const c = theme.trees[Math.floor(rand() * theme.trees.length)];
  const blobs = [
    [0, -size * 0.9, size],
    [-size * 0.55, -size * 0.6, size * 0.7],
    [size * 0.55, -size * 0.65, size * 0.7],
    [0, -size * 1.45, size * 0.65],
  ];
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (const [bx, by, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + bx + 1.5, y + by + 2, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = c;
  for (const [bx, by, r] of blobs) {
    ctx.beginPath();
    ctx.arc(x + bx, y + by, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = theme.treeHighlight;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(x - size * 0.3, y - size * 1.3, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawRock(ctx, x, y, size, theme) {
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 2, size * 1.3, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = theme.rock;
  ctx.beginPath();
  ctx.moveTo(x - size * 1.2, y + size * 0.3);
  ctx.lineTo(x - size * 0.8, y - size * 0.7);
  ctx.lineTo(x + size * 0.2, y - size);
  ctx.lineTo(x + size * 1.2, y - size * 0.2);
  ctx.lineTo(x + size, y + size * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.8, y - size * 0.7);
  ctx.lineTo(x + size * 0.2, y - size);
  ctx.lineTo(x, y - size * 0.3);
  ctx.closePath();
  ctx.fill();
}

// Cổng thành ở cuối đường — nơi người chơi phải bảo vệ.
function drawGate(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(4, 18, 40, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hai tháp canh
  for (const sx of [-30, 30]) {
    ctx.fillStyle = '#9aa3a8';
    ctx.fillRect(sx - 11, -30, 22, 48);
    ctx.fillStyle = '#7b858b';
    for (let i = 0; i < 3; i++) ctx.fillRect(sx - 12 + i * 9, -38, 6, 8);
    ctx.fillStyle = '#3b4248';
    ctx.fillRect(sx - 3, -18, 6, 10);
  }
  ctx.fillStyle = '#b0b8bd';
  ctx.fillRect(-19, -16, 38, 34);
  ctx.fillStyle = '#4a3423';
  ctx.beginPath();
  ctx.moveTo(-12, 18);
  ctx.lineTo(-12, -2);
  ctx.arc(0, -2, 12, Math.PI, 0);
  ctx.lineTo(12, 18);
  ctx.closePath();
  ctx.fill();
  // Cờ
  ctx.strokeStyle = '#3b3b3b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, -44);
  ctx.stroke();
  ctx.fillStyle = '#2f6fd6';
  ctx.beginPath();
  ctx.moveTo(0, -44);
  ctx.lineTo(18, -39);
  ctx.lineTo(0, -33);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function bakeTerrain(level, paths, spots, pixelScale) {
  const theme = THEMES[level.theme];
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(WORLD.width * pixelScale);
  canvas.height = Math.round(WORLD.height * pixelScale);
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelScale, pixelScale);
  const rand = seededRandom(level.id.length * 7919 + level.name.length * 104729);

  // Nền + các mảng màu ngẫu nhiên cho có kết cấu.
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = theme.patches[Math.floor(rand() * theme.patches.length)];
    ctx.globalAlpha = 0.35 + rand() * 0.4;
    ctx.beginPath();
    ctx.ellipse(rand() * WORLD.width, rand() * WORLD.height, 10 + rand() * 40, 6 + rand() * 20, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Ngọn cỏ nhỏ
  if (level.theme !== 'snow') {
    ctx.strokeStyle = 'rgba(40,80,30,0.35)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 500; i++) {
      const x = rand() * WORLD.width;
      const y = rand() * WORLD.height;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y - 5);
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 5);
      ctx.stroke();
    }
  }

  // Đường đi: viền tối, lõi đất, vệt sáng giữa đường.
  for (const p of paths) strokePath(ctx, p, PATH_WIDTH + 10, theme.pathEdge);
  for (const p of paths) strokePath(ctx, p, PATH_WIDTH, theme.path);
  ctx.globalAlpha = 0.6;
  for (const p of paths) strokePath(ctx, p, PATH_WIDTH * 0.45, theme.pathLight);
  ctx.globalAlpha = 1;
  // Sỏi trên đường
  for (const p of paths) {
    for (let d = 0; d < p.length; d += 9) {
      const pt = p.pointAt(d, (rand() - 0.5) * PATH_WIDTH * 0.85);
      ctx.fillStyle = theme.pebble;
      ctx.globalAlpha = 0.5 + rand() * 0.4;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 1 + rand() * 2.2, 1 + rand() * 1.4, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Đồ trang trí, tránh đường và ô xây.
  const near = (x, y, pad) =>
    paths.some((p) => p.distanceFrom(x, y) < PATH_WIDTH / 2 + pad) || spots.some((s) => dist(x, y, s.x, s.y) < 48);
  const items = [];
  let attempts = 0;
  while (items.length < 85 && attempts < 6000) {
    attempts++;
    const x = rand() * WORLD.width;
    const y = rand() * (WORLD.height + 20);
    const r = rand();
    const kind = r < 0.62 ? 'tree' : r < 0.8 ? 'rock' : 'flower';
    const pad = kind === 'tree' ? 26 : 12;
    if (near(x, y, pad)) continue;
    if (kind === 'tree' && items.some((it) => it.kind === 'tree' && dist(x, y, it.x, it.y) < 20)) continue;
    items.push({ x, y, kind, size: kind === 'tree' ? 11 + rand() * 8 : 4 + rand() * 5 });
  }
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    if (it.kind === 'tree') drawTree(ctx, it.x, it.y, it.size, theme, rand);
    else if (it.kind === 'rock') drawRock(ctx, it.x, it.y, it.size, theme);
    else if (theme.flower.length) {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = theme.flower[Math.floor(rand() * theme.flower.length)];
        ctx.beginPath();
        ctx.arc(it.x + (rand() - 0.5) * 14, it.y + (rand() - 0.5) * 10, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Cổng thành tại điểm cuối (đường cuối cùng ra khỏi màn hình).
  const exits = [];
  for (const p of paths) {
    let d = p.length;
    let pt = p.pointAt(d);
    while (d > 0 && (pt.x < 40 || pt.x > WORLD.width - 40 || pt.y < 50 || pt.y > WORLD.height - 30)) {
      d -= 6;
      pt = p.pointAt(d);
    }
    if (!exits.some((e) => dist(e.x, e.y, pt.x, pt.y) < 80)) exits.push(pt);
  }
  for (const pt of exits) drawGate(ctx, pt.x, pt.y);

  // Viền tối nhẹ quanh mép bản đồ (vignette).
  const grad = ctx.createRadialGradient(WORLD.width / 2, WORLD.height / 2, WORLD.width * 0.35, WORLD.width / 2, WORLD.height / 2, WORLD.width * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  return canvas;
}
