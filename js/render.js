// Vẽ toàn bộ game bằng hình khối đơn giản. Chỉ ĐỌC trạng thái game, không sửa.
import { WORLD, TOWERS } from './config.js';
import { PATH_WIDTH, SPOT_RADIUS } from './map.js';
import { STATUS } from './game.js';

const COLORS = {
  letterbox: '#1e272e',
  grass: '#6ab04c',
  grassDark: '#5a9a3e',
  pathEdge: '#a77b4a',
  path: '#d9b77e',
  spot: '#8d6e4a',
  spotRing: '#f5e6c8',
  stone: '#95a5a6',
  stoneDark: '#636e72',
  roof: '#2c3e50',
  wood: '#6d4c2f',
};

export function render(ctx, viewport, game) {
  // Xoá toàn bộ canvas (kể cả viền letterbox).
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COLORS.letterbox;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  viewport.applyTransform(ctx);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, WORLD.width, WORLD.height);
  ctx.clip();

  drawGround(ctx, game.map);
  drawPath(ctx, game.map.path);
  drawSpots(ctx, game);
  drawRangePreview(ctx, game);

  // Vẽ tháp, quái và đồ trang trí theo thứ tự y để tạo cảm giác chiều sâu.
  const drawables = [
    ...game.map.decorations.map((d) => ({ y: d.y, draw: () => drawDecoration(ctx, d) })),
    ...game.towers.map((t) => ({ y: t.y, draw: () => drawTower(ctx, t) })),
    ...game.enemies.map((e) => ({ y: e.y, draw: () => drawEnemy(ctx, e) })),
  ].sort((a, b) => a.y - b.y);
  for (const d of drawables) d.draw();

  for (const p of game.projectiles) drawProjectile(ctx, p);
  for (const e of game.enemies) drawHealthBar(ctx, e);
  drawEffects(ctx, game.effects);
  drawMenu(ctx, game);
  drawStatusHint(ctx, game);

  ctx.restore();
}

// ---------- Nền & đường ----------

function drawGround(ctx, map) {
  ctx.fillStyle = COLORS.grass;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  // Vài mảng cỏ đậm cố định cho đỡ đơn điệu.
  ctx.fillStyle = COLORS.grassDark;
  for (const d of map.decorations) {
    ctx.beginPath();
    ctx.ellipse(d.x + 18, d.y + 10, 26, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function strokePath(ctx, path, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  path.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
}

function drawPath(ctx, path) {
  strokePath(ctx, path, PATH_WIDTH + 8, COLORS.pathEdge);
  strokePath(ctx, path, PATH_WIDTH - 4, COLORS.path);
}

function drawDecoration(ctx, d) {
  if (d.kind === 'tree') {
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(d.x - 3, d.y - 4, 6, 10);
    ctx.fillStyle = '#2d6a2f';
    ctx.beginPath();
    ctx.arc(d.x, d.y - d.size * 0.8, d.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3e8e41';
    ctx.beginPath();
    ctx.arc(d.x - d.size * 0.3, d.y - d.size * 1.1, d.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.ellipse(d.x, d.y, d.size * 1.3, d.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b2bec3';
    ctx.beginPath();
    ctx.ellipse(d.x - d.size * 0.3, d.y - d.size * 0.3, d.size * 0.5, d.size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- Ô xây tháp ----------

function drawSpots(ctx, game) {
  for (const spot of game.map.spots) {
    if (spot.tower) continue;
    const selected = game.selectedSpot === spot;
    ctx.fillStyle = COLORS.spot;
    ctx.beginPath();
    ctx.ellipse(spot.x, spot.y, SPOT_RADIUS, SPOT_RADIUS * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = selected ? '#ffffff' : COLORS.spotRing;
    ctx.lineWidth = selected ? 4 : 2;
    ctx.setLineDash(selected ? [] : [6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Gợi ý "có thể xây" bằng dấu + nhấp nháy nhẹ.
    const a = 0.5 + 0.3 * Math.sin(game.time * 4);
    ctx.strokeStyle = `rgba(255,255,255,${a})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(spot.x - 8, spot.y);
    ctx.lineTo(spot.x + 8, spot.y);
    ctx.moveTo(spot.x, spot.y - 8);
    ctx.lineTo(spot.x, spot.y + 8);
    ctx.stroke();
  }
}

function drawRangePreview(ctx, game) {
  const spot = game.selectedSpot;
  if (!spot) return;
  const range = spot.tower ? spot.tower.def.range : TOWERS.archer.range;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, range, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// ---------- Tháp ----------

function drawTower(ctx, tower) {
  const { x, y } = tower;
  // Bóng
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 30, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Thân tháp bằng đá
  ctx.fillStyle = COLORS.stone;
  ctx.strokeStyle = '#2d3436';
  ctx.lineWidth = 2;
  ctx.fillRect(x - 22, y - 30, 44, 34);
  ctx.strokeRect(x - 22, y - 30, 44, 34);
  // Đường gạch
  ctx.strokeStyle = COLORS.stoneDark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 22, y - 18);
  ctx.lineTo(x + 22, y - 18);
  ctx.moveTo(x - 22, y - 6);
  ctx.lineTo(x + 22, y - 6);
  ctx.stroke();

  // Răng cưa trên đỉnh
  ctx.fillStyle = COLORS.stoneDark;
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x - 24 + i * 13, y - 38, 9, 9);
  }

  // Cung thủ: thân tròn + cây cung hướng về mục tiêu
  const ax = x;
  const ay = y - 22;
  ctx.fillStyle = '#27ae60';
  ctx.beginPath();
  ctx.arc(ax, ay - 14, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8c291';
  ctx.beginPath();
  ctx.arc(ax, ay - 22, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(ax, ay - 14);
  ctx.rotate(tower.aimAngle);
  ctx.strokeStyle = COLORS.wood;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(6, 0, 9, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.strokeStyle = '#ecf0f1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(6, -9);
  ctx.lineTo(6, 9);
  ctx.stroke();
  ctx.restore();
}

function drawProjectile(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);
  ctx.strokeStyle = COLORS.wood;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(4, 0);
  ctx.stroke();
  ctx.fillStyle = '#dfe6e9';
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(2, -3);
  ctx.lineTo(2, 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------- Quái ----------

function drawEnemy(ctx, e) {
  const r = e.radius;
  const bob = Math.abs(Math.sin(e.walkTime * 10)) * 2.5; // nhún nhảy khi đi

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(e.x, e.y + r * 0.6, r, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  const cy = e.y - bob;
  ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.def.color;
  ctx.strokeStyle = '#2d3436';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(e.x, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Mắt nhìn theo hướng di chuyển
  const fx = Math.cos(e.angle);
  const fy = Math.sin(e.angle);
  const px = -fy;
  const py = fx;
  ctx.fillStyle = '#fff';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(e.x + fx * r * 0.45 + px * side * r * 0.35, cy + fy * r * 0.45 + py * side * r * 0.35 - 2, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHealthBar(ctx, e) {
  if (e.hp >= e.maxHp) return;
  const w = e.radius * 2 + 6;
  const x = e.x - w / 2;
  const y = e.y - e.radius - 14;
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(x - 1, y - 1, w + 2, 6);
  ctx.fillStyle = '#d63031';
  ctx.fillRect(x, y, w, 4);
  ctx.fillStyle = '#55efc4';
  ctx.fillRect(x, y, w * (e.hp / e.maxHp), 4);
}

// ---------- Hiệu ứng & UI trên canvas ----------

function drawEffects(ctx, effects) {
  for (const fx of effects) {
    const t = fx.life / fx.maxLife; // 1 → 0
    if (fx.kind === 'text') {
      ctx.globalAlpha = Math.min(1, t * 2);
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#2d3436';
      ctx.strokeText(fx.text, fx.x, fx.y);
      ctx.fillStyle = fx.color;
      ctx.fillText(fx.text, fx.x, fx.y);
    } else if (fx.kind === 'poof') {
      ctx.globalAlpha = t;
      ctx.fillStyle = '#dfe6e9';
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.r * (1 + (1 - t) * 1.2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawMenu(ctx, game) {
  for (const btn of game.getMenuButtons()) {
    ctx.globalAlpha = btn.enabled ? 1 : 0.55;
    ctx.fillStyle = btn.action === 'sell' ? '#d63031' : '#0984e3';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Biểu tượng
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 3;
    if (btn.action === 'build') {
      // cây cung nhỏ
      ctx.beginPath();
      ctx.arc(btn.x - 4, btn.y - 6, 10, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(btn.x - 4, btn.y - 16);
      ctx.lineTo(btn.x - 4, btn.y + 4);
      ctx.stroke();
    } else {
      // dấu $ cho bán
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', btn.x, btn.y - 6);
    }

    // Nhãn giá
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = btn.enabled ? '#ffeaa7' : '#ff7675';
    ctx.fillText(btn.label, btn.x, btn.y + 15);
    ctx.globalAlpha = 1;
  }
}

function drawStatusHint(ctx, game) {
  if (game.status !== STATUS.IDLE || game.waveIndex >= 0) return;
  const text = 'Chạm vào ô đất để xây tháp, rồi bấm “Bắt đầu wave”';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 28;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(WORLD.width / 2 - w / 2, WORLD.height - 52, w, 36);
  ctx.fillStyle = '#fff';
  ctx.fillText(text, WORLD.width / 2, WORLD.height - 34);
}
