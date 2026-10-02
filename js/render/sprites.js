// Nhân vật, tháp, đạn — tất cả vẽ thủ tục bằng Canvas 2D (không dùng ảnh).

const OUTLINE = '#1f1a17';

function shadow(ctx, x, y, rx, ry = rx * 0.4) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function circle(ctx, x, y, r, fill, stroke = OUTLINE, lw = 1.5) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function roundRect(ctx, x, y, w, h, r, fill, stroke = OUTLINE, lw = 1.5) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function legs(ctx, x, y, t, moving, color, spread = 4, len = 7) {
  const swing = moving ? Math.sin(t * 14) * 3 : 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - spread / 2, y - len);
  ctx.lineTo(x - spread / 2 + swing, y);
  ctx.moveTo(x + spread / 2, y - len);
  ctx.lineTo(x + spread / 2 - swing, y);
  ctx.stroke();
}

// ======================= THÁP =======================

function stoneBase(ctx, x, y, w, h, color, dark) {
  roundRect(ctx, x - w / 2, y - h, w, h, 3, color);
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1;
  for (let row = 1; row < h / 9; row++) {
    const yy = y - row * 9;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 1, yy);
    ctx.lineTo(x + w / 2 - 1, yy);
    ctx.stroke();
    const off = row % 2 ? 0 : 7;
    for (let xx = x - w / 2 + 7 + off; xx < x + w / 2 - 2; xx += 14) {
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx, yy + 9);
      ctx.stroke();
    }
  }
}

function banner(ctx, x, y, color, t) {
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 20);
  ctx.stroke();
  const wave = Math.sin(t * 4) * 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - 20);
  ctx.quadraticCurveTo(x + 8, y - 18 + wave, x + 15, y - 16);
  ctx.lineTo(x, y - 11);
  ctx.closePath();
  ctx.fill();
}

function drawArcher(ctx, tw, t) {
  const { x, y, level } = tw;
  const h = 34 + level * 6;
  shadow(ctx, x, y + 2, 30, 12);
  stoneBase(ctx, x, y + 4, 44, 18, '#a7a29a', '#7d786f');
  // Thân gỗ
  roundRect(ctx, x - 17, y - h, 34, h - 10, 3, '#9b6a3c');
  ctx.strokeStyle = '#6d4626';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 17 + i * 8.5, y - h + 2);
    ctx.lineTo(x - 17 + i * 8.5, y - 12);
    ctx.stroke();
  }
  // Sàn trên
  roundRect(ctx, x - 21, y - h - 6, 42, 8, 2, '#7a5230');
  // Cung thủ
  const ay = y - h - 12;
  circle(ctx, x, ay, 7, '#2f8f4e');
  circle(ctx, x, ay - 9, 5, '#f2c9a0');
  ctx.fillStyle = '#2f8f4e';
  ctx.beginPath();
  ctx.moveTo(x - 6, ay - 10);
  ctx.lineTo(x, ay - 20);
  ctx.lineTo(x + 6, ay - 10);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.translate(x, ay - 2);
  ctx.rotate(tw.aim);
  const pull = tw.shootAnim > 0 ? 0 : 3;
  ctx.strokeStyle = '#5a3a1e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(4, 0, 10, -Math.PI / 2.2, Math.PI / 2.2);
  ctx.stroke();
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(5.5, -9.5);
  ctx.lineTo(4 - pull, 0);
  ctx.lineTo(5.5, 9.5);
  ctx.stroke();
  ctx.restore();
  // Mái nhọn cho cấp 2+
  if (level >= 1) {
    ctx.fillStyle = level === 2 ? '#2f6fd6' : '#b8402f';
    for (const sx of [-21, 17]) ctx.fillRect(x + sx, y - h - 10, 4, 6);
  }
  if (level === 2) banner(ctx, x + 16, y - h - 6, '#2f6fd6', t);
}

function drawMage(ctx, tw, t) {
  const { x, y, level } = tw;
  const h = 36 + level * 6;
  shadow(ctx, x, y + 2, 28, 11);
  stoneBase(ctx, x, y + 4, 40, 16, '#8e86a8', '#6b6385');
  // Thân tháp tròn màu tím đá
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 10);
  ctx.lineTo(x - 12, y - h);
  ctx.lineTo(x + 12, y - h);
  ctx.lineTo(x + 16, y - 10);
  ctx.closePath();
  ctx.fillStyle = '#7b6aa8';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(x - 9, y - h + 2, 5, h - 14);
  // Cửa sổ phát sáng
  ctx.fillStyle = '#ffe58a';
  ctx.beginPath();
  ctx.arc(x, y - h / 2 - 2, 4, Math.PI, 0);
  ctx.lineTo(x + 4, y - h / 2 + 5);
  ctx.lineTo(x - 4, y - h / 2 + 5);
  ctx.closePath();
  ctx.fill();
  // Mái nhọn
  ctx.beginPath();
  ctx.moveTo(x - 16, y - h);
  ctx.lineTo(x, y - h - 18 - level * 3);
  ctx.lineTo(x + 16, y - h);
  ctx.closePath();
  ctx.fillStyle = '#3f2d73';
  ctx.fill();
  ctx.stroke();
  // Quả cầu pha lê lơ lửng
  const bob = Math.sin(t * 3) * 2;
  const oy = y - h - 30 - level * 3 + bob;
  const glow = 10 + level * 2 + (tw.shootAnim > 0 ? 6 : 0);
  const grad = ctx.createRadialGradient(x, oy, 1, x, oy, glow + 6);
  grad.addColorStop(0, 'rgba(230,200,255,0.9)');
  grad.addColorStop(1, 'rgba(160,90,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, oy, glow + 6, 0, Math.PI * 2);
  ctx.fill();
  circle(ctx, x, oy, 5 + level, '#c49bff', '#5b2fa8', 1.5);
  circle(ctx, x - 1.5, oy - 1.5, 1.8, '#fff', null);
}

function drawArtillery(ctx, tw, t) {
  const { x, y, level } = tw;
  shadow(ctx, x, y + 2, 32, 13);
  // Pháo đài thấp, rộng
  stoneBase(ctx, x, y + 4, 52, 28 + level * 4, '#b3aa98', '#857c6b');
  const top = y + 4 - 28 - level * 4;
  ctx.fillStyle = '#857c6b';
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 26 + i * 11, top - 6, 7, 7);
  // Nòng pháo cối hướng lên trời
  const recoil = tw.shootAnim > 0 ? 3 : 0;
  ctx.save();
  ctx.translate(x, top - 2);
  ctx.rotate(-Math.PI / 4 + (Math.cos(tw.aim) > 0 ? Math.PI / 2 : 0));
  roundRect(ctx, -6, -24 + recoil, 12, 22, 3, level === 2 ? '#3d4148' : '#4d535c');
  roundRect(ctx, -7.5, -26 + recoil, 15, 5, 2, '#2c3036');
  ctx.restore();
  circle(ctx, x, top, 9, '#6b4a2b');
  circle(ctx, x, top, 4, '#3a2a1a', null);
  // Đống đạn
  circle(ctx, x - 20, y - 4, 3.5, '#2c3036', null);
  circle(ctx, x - 14, y - 4, 3.5, '#2c3036', null);
  circle(ctx, x - 17, y - 9, 3.5, '#2c3036', null);
  if (level === 2) banner(ctx, x + 20, top - 4, '#d4a020', t);
}

function drawBarracks(ctx, tw, t) {
  const { x, y, level } = tw;
  shadow(ctx, x, y + 2, 32, 13);
  // Nhà gỗ + mái đỏ
  roundRect(ctx, x - 24, y - 26, 48, 30, 2, level >= 1 ? '#c9b48c' : '#b39a6e');
  ctx.fillStyle = '#5c3b1f';
  ctx.fillRect(x - 6, y - 14, 12, 18);
  ctx.fillStyle = '#2b1d10';
  ctx.fillRect(x - 18, y - 20, 7, 7);
  ctx.fillRect(x + 11, y - 20, 7, 7);
  ctx.beginPath();
  ctx.moveTo(x - 30, y - 24);
  ctx.lineTo(x, y - 46 - level * 3);
  ctx.lineTo(x + 30, y - 24);
  ctx.closePath();
  ctx.fillStyle = level === 2 ? '#2f5fb8' : '#b8402f';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 30 + i * 4, y - 24 - i * 4);
    ctx.lineTo(x + 30 - i * 4, y - 24 - i * 4);
    ctx.stroke();
  }
  // Khiên treo tường
  circle(ctx, x, y - 32 - level, 5, '#e0c060', OUTLINE, 1);
  banner(ctx, x + 22, y - 24, level === 2 ? '#e0c060' : '#2f6fd6', t);
}

export function drawTower(ctx, tw, t) {
  const pop = tw.buildAnim > 0 ? 1 + Math.sin((tw.buildAnim / 0.5) * Math.PI) * 0.08 : 1;
  ctx.save();
  ctx.translate(tw.x, tw.y);
  ctx.scale(pop, pop);
  ctx.translate(-tw.x, -tw.y);
  if (tw.type === 'archer') drawArcher(ctx, tw, t);
  else if (tw.type === 'mage') drawMage(ctx, tw, t);
  else if (tw.type === 'artillery') drawArtillery(ctx, tw, t);
  else drawBarracks(ctx, tw, t);
  // Sao cấp độ
  for (let i = 0; i <= tw.level; i++) {
    const sx = tw.x - tw.level * 5 + i * 10;
    ctx.fillStyle = '#ffd34d';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    star(ctx, sx, tw.y + 14, 4);
  }
  ctx.restore();
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// Ô đất trống để xây tháp.
export function drawSpot(ctx, spot, t, selected) {
  const { x, y } = spot;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 30, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6a44';
  ctx.beginPath();
  ctx.ellipse(x, y, 28, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a58257';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 22, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cọc gỗ đánh dấu
  for (const [sx, sy] of [[-18, -4], [18, -4], [0, 8]]) {
    ctx.fillStyle = '#5c3b1f';
    ctx.fillRect(x + sx - 2, y + sy - 7, 4, 8);
  }
  const a = selected ? 1 : 0.35 + 0.25 * Math.sin(t * 3);
  ctx.strokeStyle = `rgba(255,255,255,${a})`;
  ctx.lineWidth = selected ? 3 : 2;
  ctx.setLineDash(selected ? [] : [5, 5]);
  ctx.beginPath();
  ctx.ellipse(x, y, 31, 17, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ======================= QUÁI =======================

function hpColor(e) {
  return e.hitFlash > 0 ? '#ffffff' : null;
}

function drawGoblin(ctx, e, t) {
  const moving = !e.blocker && e.stun <= 0;
  legs(ctx, e.x, e.y, t, moving, '#3e5a20', 5, 6);
  const by = e.y - 10;
  const body = hpColor(e) || '#6aa836';
  roundRect(ctx, e.x - 6, by - 6, 12, 11, 4, '#7a5a34');
  circle(ctx, e.x, by - 10, 7, body);
  // Tai nhọn
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(e.x - 5, by - 12);
  ctx.lineTo(e.x - 14, by - 16);
  ctx.lineTo(e.x - 5, by - 7);
  ctx.moveTo(e.x + 5, by - 12);
  ctx.lineTo(e.x + 14, by - 16);
  ctx.lineTo(e.x + 5, by - 7);
  ctx.fill();
  circle(ctx, e.x + e.facing * 2.5, by - 11, 1.6, '#ffef5a', null);
  // Dao găm
  const swing = e.attackAnim > 0 ? -0.8 : 0.3;
  ctx.save();
  ctx.translate(e.x + e.facing * 7, by - 2);
  ctx.rotate(swing * e.facing);
  ctx.fillStyle = '#c9d1d6';
  ctx.fillRect(-1, -9, 2, 9);
  ctx.restore();
}

function drawBandit(ctx, e, t) {
  const moving = !e.blocker && e.stun <= 0;
  legs(ctx, e.x, e.y, t, moving, '#3a2c20', 6, 8);
  const by = e.y - 12;
  const body = hpColor(e) || '#7b5a3a';
  roundRect(ctx, e.x - 8, by - 9, 16, 15, 5, body);
  // Áo choàng mũ trùm
  ctx.fillStyle = hpColor(e) || '#4a3a2e';
  ctx.beginPath();
  ctx.arc(e.x, by - 13, 8, Math.PI, 0);
  ctx.lineTo(e.x + 8, by - 8);
  ctx.lineTo(e.x - 8, by - 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  circle(ctx, e.x + e.facing * 2, by - 11, 4.5, '#e2b48a', null);
  ctx.fillStyle = '#222';
  ctx.fillRect(e.x + e.facing * 2 - 4, by - 13, 8, 2.5);
  // Rìu
  const swing = e.attackAnim > 0 ? -1 : 0.4;
  ctx.save();
  ctx.translate(e.x + e.facing * 9, by - 2);
  ctx.rotate(swing * e.facing);
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(-1.5, -14, 3, 16);
  ctx.fillStyle = '#b8c1c7';
  ctx.beginPath();
  ctx.moveTo(1, -14);
  ctx.lineTo(8 * e.facing, -12);
  ctx.lineTo(1, -6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWolf(ctx, e, t) {
  const moving = !e.blocker && e.stun <= 0;
  const f = e.facing;
  const by = e.y - 9;
  const run = moving ? Math.sin(t * 18) * 3 : 0;
  ctx.strokeStyle = '#4f5559';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(e.x - 7 * f, by + 3);
  ctx.lineTo(e.x - 8 * f + run, e.y);
  ctx.moveTo(e.x + 6 * f, by + 3);
  ctx.lineTo(e.x + 7 * f - run, e.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(e.x, by, 12, 6.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = hpColor(e) || '#7d868c';
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Đuôi
  ctx.strokeStyle = '#7d868c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(e.x - 11 * f, by - 1);
  ctx.quadraticCurveTo(e.x - 18 * f, by - 6 + run, e.x - 20 * f, by - 2);
  ctx.stroke();
  // Đầu
  const hx = e.x + 11 * f;
  const hy = by - 5 + (e.attackAnim > 0 ? 3 : 0);
  circle(ctx, hx, hy, 6, hpColor(e) || '#8f989e');
  ctx.fillStyle = '#8f989e';
  ctx.beginPath();
  ctx.moveTo(hx + 3 * f, hy - 1);
  ctx.lineTo(hx + 11 * f, hy + 2);
  ctx.lineTo(hx + 3 * f, hy + 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx - 3 * f, hy - 4);
  ctx.lineTo(hx - 1 * f, hy - 11);
  ctx.lineTo(hx + 2 * f, hy - 4);
  ctx.fill();
  circle(ctx, hx + 2 * f, hy - 1, 1.4, '#ffdd33', null);
}

function drawShaman(ctx, e, t) {
  const moving = !e.blocker && e.stun <= 0;
  legs(ctx, e.x, e.y, t, moving, '#4b3a2a', 5, 7);
  const by = e.y - 11;
  // Áo choàng
  ctx.fillStyle = hpColor(e) || '#3f7d7a';
  ctx.beginPath();
  ctx.moveTo(e.x - 9, by + 5);
  ctx.lineTo(e.x - 5, by - 12);
  ctx.lineTo(e.x + 5, by - 12);
  ctx.lineTo(e.x + 9, by + 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Mặt nạ gỗ
  roundRect(ctx, e.x - 5, by - 22, 10, 12, 3, '#d9a95a');
  ctx.fillStyle = '#222';
  ctx.fillRect(e.x - 3, by - 18, 2, 2);
  ctx.fillRect(e.x + 1, by - 18, 2, 2);
  // Lông vũ
  ctx.fillStyle = '#e04a3a';
  ctx.fillRect(e.x - 4, by - 28, 2, 7);
  ctx.fillStyle = '#3aa0e0';
  ctx.fillRect(e.x + 2, by - 27, 2, 6);
  // Gậy phép
  ctx.strokeStyle = '#6b4a2b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(e.x + 9 * e.facing, by + 8);
  ctx.lineTo(e.x + 9 * e.facing, by - 20);
  ctx.stroke();
  const glow = 0.6 + 0.4 * Math.sin(t * 5);
  circle(ctx, e.x + 9 * e.facing, by - 22, 3.5, `rgba(120,255,160,${glow})`, null);
}

function drawBat(ctx, e, t) {
  const fy = e.y - 30 + Math.sin(t * 6) * 3;
  shadow(ctx, e.x, e.y, 9, 3.5);
  const flap = Math.sin(t * 22);
  const col = hpColor(e) || '#4b3566';
  ctx.fillStyle = col;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(e.x + s * 3, fy);
    ctx.quadraticCurveTo(e.x + s * 12, fy - 10 * flap - 4, e.x + s * 18, fy - 2 * flap);
    ctx.lineTo(e.x + s * 12, fy + 3);
    ctx.lineTo(e.x + s * 8, fy + 1);
    ctx.lineTo(e.x + s * 4, fy + 4);
    ctx.closePath();
    ctx.fill();
  }
  circle(ctx, e.x, fy, 6, col);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(e.x - 4, fy - 4);
  ctx.lineTo(e.x - 3, fy - 10);
  ctx.lineTo(e.x - 1, fy - 5);
  ctx.moveTo(e.x + 4, fy - 4);
  ctx.lineTo(e.x + 3, fy - 10);
  ctx.lineTo(e.x + 1, fy - 5);
  ctx.fill();
  circle(ctx, e.x - 2, fy - 1, 1.3, '#ff4d4d', null);
  circle(ctx, e.x + 2, fy - 1, 1.3, '#ff4d4d', null);
}

function drawTroll(ctx, e, t) {
  const moving = !e.blocker && e.stun <= 0;
  legs(ctx, e.x, e.y, t * 0.7, moving, '#3d4a3a', 10, 9);
  const by = e.y - 16;
  const col = hpColor(e) || '#6f8f6a';
  ctx.beginPath();
  ctx.ellipse(e.x, by - 2, 15, 13, 0, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Giáp vai bằng đá
  roundRect(ctx, e.x - 16, by - 12, 10, 8, 3, '#8a8f94');
  roundRect(ctx, e.x + 6, by - 12, 10, 8, 3, '#8a8f94');
  circle(ctx, e.x + e.facing * 4, by - 14, 7, col);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(e.x + e.facing * 1, by - 10);
  ctx.lineTo(e.x + e.facing * 2, by - 6);
  ctx.lineTo(e.x + e.facing * 3, by - 10);
  ctx.moveTo(e.x + e.facing * 6, by - 10);
  ctx.lineTo(e.x + e.facing * 7, by - 6);
  ctx.lineTo(e.x + e.facing * 8, by - 10);
  ctx.fill();
  circle(ctx, e.x + e.facing * 6, by - 16, 1.6, '#ffcc33', null);
  // Chùy gỗ
  const swing = e.attackAnim > 0 ? -1.2 : 0.3;
  ctx.save();
  ctx.translate(e.x + e.facing * 14, by);
  ctx.rotate(swing * e.facing);
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(-2, -20, 4, 22);
  circle(ctx, 0, -22, 6, '#7a5634');
  ctx.restore();
}

function drawGolem(ctx, e, t) {
  const moving = !e.blocker && e.stun <= 0;
  const step = moving ? Math.sin(t * 5) * 3 : 0;
  const col = hpColor(e) || '#8b8378';
  const by = e.y - 26;
  // Chân
  roundRect(ctx, e.x - 18, by + 12 + step, 13, 16 - step, 4, '#6e675e');
  roundRect(ctx, e.x + 5, by + 12 - step, 13, 16 + step, 4, '#6e675e');
  // Thân khối đá
  roundRect(ctx, e.x - 26, by - 26, 52, 42, 10, col);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(e.x - 18, by - 12);
  ctx.lineTo(e.x - 6, by - 4);
  ctx.lineTo(e.x - 10, by + 8);
  ctx.moveTo(e.x + 12, by - 20);
  ctx.lineTo(e.x + 6, by - 6);
  ctx.stroke();
  // Rêu và lõi phát sáng
  ctx.fillStyle = '#5f8a4a';
  ctx.beginPath();
  ctx.ellipse(e.x - 12, by - 24, 12, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();
  const pulse = 0.6 + 0.4 * Math.sin(t * 3);
  circle(ctx, e.x, by - 4, 6, `rgba(255,140,40,${pulse})`, '#3a2a1a', 2);
  // Đầu
  roundRect(ctx, e.x - 11 + e.facing * 4, by - 42, 22, 18, 6, col);
  ctx.fillStyle = `rgba(255,160,60,${pulse})`;
  ctx.fillRect(e.x - 6 + e.facing * 5, by - 35, 4, 3);
  ctx.fillRect(e.x + 2 + e.facing * 5, by - 35, 4, 3);
  // Tay
  const swing = e.attackAnim > 0 ? -10 : 0;
  roundRect(ctx, e.x - 36, by - 18 + swing, 12, 30, 5, '#7a736a');
  roundRect(ctx, e.x + 24, by - 18 - swing, 12, 30, 5, '#7a736a');
}

const ENEMY_DRAW = {
  goblin: drawGoblin,
  bandit: drawBandit,
  wolf: drawWolf,
  shaman: drawShaman,
  bat: drawBat,
  troll: drawTroll,
  golem: drawGolem,
};

export function drawEnemy(ctx, e) {
  if (!e.flying) shadow(ctx, e.x, e.y, e.radius * 0.9, e.radius * 0.38);
  ENEMY_DRAW[e.type](ctx, e, e.anim);
  if (e.stun > 0) {
    const top = e.y - e.radius * 2.6;
    for (let i = 0; i < 3; i++) {
      const a = e.anim * 5 + (i * Math.PI * 2) / 3;
      ctx.fillStyle = '#ffe14d';
      ctx.beginPath();
      ctx.arc(e.x + Math.cos(a) * 9, top + Math.sin(a) * 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function enemyTop(e) {
  if (e.flying) return e.y - 44;
  if (e.type === 'golem') return e.y - 76;
  return e.y - e.radius * 2.6 - 8;
}

export function drawHealthBar(ctx, x, y, w, ratio) {
  ctx.fillStyle = '#1b1b1b';
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 5);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(x - w / 2, y, w, 3);
  ctx.fillStyle = '#5ddc4a';
  ctx.fillRect(x - w / 2, y, w * Math.max(0, ratio), 3);
}

// ======================= LÍNH & ANH HÙNG =======================

export function drawSoldier(ctx, s) {
  const militia = s.kind === 'militia';
  shadow(ctx, s.x, s.y, 8, 3);
  legs(ctx, s.x, s.y, s.anim, s.moving, '#3a3a44', 4, 6);
  const by = s.y - 9;
  const col = s.hitFlash > 0 ? '#fff' : militia ? '#8a6a44' : '#3d6fc4';
  roundRect(ctx, s.x - 5.5, by - 7, 11, 11, 3, col);
  circle(ctx, s.x, by - 11, 4.5, '#f0c8a0');
  // Mũ sắt
  ctx.fillStyle = militia ? '#6b4a2b' : '#aab4bc';
  ctx.beginPath();
  ctx.arc(s.x, by - 12, 5, Math.PI, 0);
  ctx.fill();
  // Khiên
  circle(ctx, s.x - s.facing * 5, by - 2, 4, militia ? '#a07a4a' : '#d8dee3', OUTLINE, 1);
  // Kiếm
  const swing = s.attackAnim > 0 ? -1.1 : 0.2;
  ctx.save();
  ctx.translate(s.x + s.facing * 6, by - 2);
  ctx.rotate(swing * s.facing);
  ctx.fillStyle = '#e6eaed';
  ctx.fillRect(-1, -11, 2, 11);
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(-2.5, -1, 5, 2);
  ctx.restore();
}

// Anh hùng gốc của game: hiệp sĩ giáp bạc, chùm lông cam, khiên hình mặt trời mọc.
export function drawHero(ctx, h, t, selected) {
  if (selected) {
    ctx.strokeStyle = 'rgba(255,220,120,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(h.x, h.y, 16, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  shadow(ctx, h.x, h.y, 11, 4);
  legs(ctx, h.x, h.y, h.anim, h.moving, '#5a5f66', 6, 8);
  const by = h.y - 11;
  const f = h.facing;
  // Áo choàng
  ctx.fillStyle = '#c9472c';
  ctx.beginPath();
  ctx.moveTo(h.x - 6 * f, by - 10);
  ctx.quadraticCurveTo(h.x - 14 * f, by + 2 + Math.sin(t * 6) * 1.5, h.x - 9 * f, by + 9);
  ctx.lineTo(h.x - 2 * f, by + 6);
  ctx.closePath();
  ctx.fill();
  // Thân giáp
  roundRect(ctx, h.x - 7.5, by - 10, 15, 15, 4, h.hitFlash > 0 ? '#fff' : '#c8d0d8');
  ctx.fillStyle = '#e8b33a';
  ctx.fillRect(h.x - 7, by - 2, 14, 2.5);
  // Đầu + mũ trụ
  circle(ctx, h.x, by - 15, 6.5, '#d7dee5');
  ctx.fillStyle = '#2a2f36';
  ctx.fillRect(h.x - 4 + f * 1.5, by - 16, 8, 2);
  // Chùm lông
  ctx.fillStyle = '#ff8c2a';
  ctx.beginPath();
  ctx.moveTo(h.x - 1, by - 21);
  ctx.quadraticCurveTo(h.x - 9 * f, by - 30, h.x - 12 * f, by - 20);
  ctx.quadraticCurveTo(h.x - 6 * f, by - 24, h.x + 2, by - 20);
  ctx.closePath();
  ctx.fill();
  // Khiên mặt trời
  const sx = h.x - f * 8;
  circle(ctx, sx, by - 2, 6.5, '#2f5fb8', OUTLINE, 1.2);
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath();
  ctx.arc(sx, by, 3, Math.PI, 0);
  ctx.fill();
  // Kiếm lớn / đòn xoáy
  ctx.save();
  ctx.translate(h.x + f * 8, by - 2);
  const swing = h.skillAnim > 0 ? (h.skillAnim / 0.4) * Math.PI * 2 * f : h.attackAnim > 0 ? -1.2 * f : 0.25 * f;
  ctx.rotate(swing);
  ctx.fillStyle = '#f3f6f8';
  ctx.beginPath();
  ctx.moveTo(-1.8, 0);
  ctx.lineTo(-1.8, -17);
  ctx.lineTo(0, -20);
  ctx.lineTo(1.8, -17);
  ctx.lineTo(1.8, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.fillStyle = '#e8b33a';
  ctx.fillRect(-4, -1, 8, 2.5);
  ctx.restore();
}

// ======================= ĐẠN =======================

export function drawProjectile(ctx, p, t) {
  if (p.kind === 'arrow') {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.strokeStyle = '#5a3a1e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(5, 0);
    ctx.stroke();
    ctx.fillStyle = '#d9dee2';
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(3, -2.5);
    ctx.lineTo(3, 2.5);
    ctx.fill();
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(-12, -2, 3, 4);
    ctx.restore();
  } else if (p.kind === 'bolt') {
    p.trail.forEach((q, i) => {
      ctx.fillStyle = `rgba(190,130,255,${(i + 1) / (p.trail.length + 2)})`;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 2 + i * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    const grad = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, 10);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#c49bff');
    grad.addColorStop(1, 'rgba(140,80,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'shell') {
    shadow(ctx, p.x, p.y, 5, 2);
    circle(ctx, p.x, p.y - p.height, 5, '#2c3036', '#111', 1);
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(p.x + 2, p.y - p.height - 4, 1.5 + Math.random(), 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'meteor') {
    const k = Math.min(1, p.t / p.flightTime);
    shadow(ctx, p.tx, p.ty, 8 + k * 14, (8 + k * 14) * 0.4);
    const ang = Math.atan2(p.ty - p.sy, p.tx - p.sx);
    for (let i = 5; i >= 1; i--) {
      ctx.fillStyle = `rgba(255,${120 + i * 20},40,${0.15 * (6 - i)})`;
      ctx.beginPath();
      ctx.arc(p.x - Math.cos(ang) * i * 9, p.y - Math.sin(ang) * i * 9, 9 - i, 0, Math.PI * 2);
      ctx.fill();
    }
    circle(ctx, p.x, p.y, 9, '#5a3020', '#2a1508', 1.5);
    circle(ctx, p.x - 2, p.y - 2, 4, '#ff7a2a', null);
    void t;
  }
}
