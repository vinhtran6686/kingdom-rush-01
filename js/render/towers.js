// Tháp vẽ tay. Phần tĩnh (thân tháp theo cấp) được cache; phần động (cung thủ ngắm, cầu pha lê,
// nòng pháo, cờ bay) vẽ trực tiếp mỗi frame. Gốc toạ độ = tâm ô xây trên mặt đất.
import { INK, tint, blob, rrect, poly, shape, line, limb, glow, groundShadow, sprites } from './art.js';

const TOWER_SPEC = { w: 100, h: 120, ax: 50, ay: 96 };
const SPOT_SPEC = { w: 76, h: 46, ax: 38, ay: 22 };

// ---------- Chi tiết dùng chung ----------

function stoneWall(g, x, y, w, h, base, rows = 3) {
  rrect(g, x, y, w, h, 3, base);
  g.save();
  g.beginPath();
  g.roundRect(x, y, w, h, 3);
  g.clip();
  const rh = h / rows;
  g.strokeStyle = tint(base, -0.35);
  g.lineWidth = 1;
  for (let r = 0; r < rows; r++) {
    const yy = y + r * rh;
    g.beginPath();
    g.moveTo(x, yy);
    g.lineTo(x + w, yy);
    g.stroke();
    const off = r % 2 ? 0 : 6;
    for (let xx = x + 6 + off; xx < x + w; xx += 12) {
      g.beginPath();
      g.moveTo(xx, yy);
      g.lineTo(xx, yy + rh);
      g.stroke();
    }
    // Viên đá sáng ngẫu nhiên tạo kết cấu
    g.fillStyle = 'rgba(255,255,255,0.12)';
    for (let xx = x + 2 + off; xx < x + w - 4; xx += 24) g.fillRect(xx, yy + 1.5, 7, rh - 3);
  }
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 1.8;
  g.beginPath();
  g.roundRect(x, y, w, h, 3);
  g.stroke();
}

function planks(g, x, y, w, h, base) {
  rrect(g, x, y, w, h, 2, base);
  g.save();
  g.beginPath();
  g.roundRect(x, y, w, h, 2);
  g.clip();
  g.strokeStyle = tint(base, -0.35);
  g.lineWidth = 1;
  for (let xx = x + 5; xx < x + w; xx += 6) {
    g.beginPath();
    g.moveTo(xx, y);
    g.lineTo(xx, y + h);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = INK;
  g.lineWidth = 1.8;
  g.beginPath();
  g.roundRect(x, y, w, h, 2);
  g.stroke();
}

function crenels(g, x, y, w, base, n) {
  const step = w / n;
  for (let i = 0; i < n; i += 2) rrect(g, x + i * step, y - 7, step, 8, 1.5, base, { lw: 1.4 });
}

function roofCone(g, cx, baseY, halfW, height, color) {
  shape(g, (g) => {
    g.moveTo(cx - halfW, baseY);
    g.quadraticCurveTo(cx - halfW * 0.35, baseY - height * 0.55, cx, baseY - height);
    g.quadraticCurveTo(cx + halfW * 0.35, baseY - height * 0.55, cx + halfW, baseY);
    g.quadraticCurveTo(cx, baseY + 5, cx - halfW, baseY);
  }, color, { x: cx - halfW, y: baseY - height, w: halfW * 2, h: height });
  // Ngói
  g.save();
  g.beginPath();
  g.moveTo(cx - halfW, baseY);
  g.lineTo(cx, baseY - height);
  g.lineTo(cx + halfW, baseY);
  g.closePath();
  g.clip();
  g.strokeStyle = tint(color, -0.3);
  g.lineWidth = 1;
  for (let k = 1; k < 5; k++) {
    const yy = baseY - (height * k) / 5;
    g.beginPath();
    g.moveTo(cx - halfW, yy + 3);
    g.quadraticCurveTo(cx, yy + 6, cx + halfW, yy + 3);
    g.stroke();
  }
  g.restore();
}

function basePad(g) {
  groundShadow(g, 2, 4, 38, 15, 0.35);
  blob(g, 0, 0, 34, 14, '#8f8778');
  blob(g, 0, -2, 30, 11, '#a39b8a', { outline: null });
}

// ---------- Từng loại tháp (phần tĩnh) ----------

function archerBody(g, lv) {
  basePad(g);
  if (lv === 0) {
    // Tháp gỗ: 4 cột chống + bục
    limb(g, [[-18, -2], [-13, -44]], '#7a5230', 4);
    limb(g, [[18, -2], [13, -44]], '#7a5230', 4);
    line(g, [[-17, -10], [16, -34]], '#5c3b1f', 2.4);
    line(g, [[17, -10], [-16, -34]], '#5c3b1f', 2.4);
    planks(g, -21, -56, 42, 13, '#a8743f');
  } else {
    stoneWall(g, -20, -40, 40, 40, lv === 2 ? '#b9b2a4' : '#a39b8a', 4);
    rrect(g, -5, -16, 10, 16, 5, '#4a3423');
    planks(g, -24, -58, 48, 18, lv === 2 ? '#9b6a3c' : '#a8743f');
  }
  // Mái hiên trên bục cho cấp cao
  if (lv === 2) crenels(g, -24, -58, 48, '#c9c2b4', 7);
}

function mageBody(g, lv) {
  basePad(g);
  const h = 54 + lv * 8;
  const stone = ['#8e86a8', '#7f76a0', '#6f6698'][lv];
  shape(g, (g) => {
    g.moveTo(-19, -2);
    g.lineTo(-14, -h);
    g.lineTo(14, -h);
    g.lineTo(19, -2);
    g.quadraticCurveTo(0, 4, -19, -2);
  }, stone, { x: -19, y: -h, w: 38, h });
  // Chữ rune phát sáng
  g.strokeStyle = 'rgba(200,170,255,0.85)';
  g.lineWidth = 1.4;
  for (let i = 0; i < 2 + lv; i++) {
    const yy = -14 - i * 12;
    g.beginPath();
    g.moveTo(-6, yy);
    g.lineTo(-2, yy - 5);
    g.lineTo(2, yy);
    g.lineTo(6, yy - 5);
    g.stroke();
  }
  // Cửa sổ vòm sáng
  shape(g, (g) => {
    g.moveTo(-4, -h + 26);
    g.lineTo(-4, -h + 18);
    g.arc(0, -h + 18, 4, Math.PI, 0);
    g.lineTo(4, -h + 26);
    g.closePath();
  }, '#ffe58a', { x: -4, y: -h + 14, w: 8, h: 12 }, { lw: 1.2 });
  rrect(g, -18, -h - 4, 36, 7, 3, tint(stone, -0.15));
  roofCone(g, 0, -h - 2, 21, 30 + lv * 4, ['#4a3a86', '#3f2d73', '#2e1f5e'][lv]);
  if (lv >= 1) {
    // Vòng đá bay quanh tháp
    blob(g, -22, -h + 6, 4, 3, '#9a92b8', { lw: 1 });
    blob(g, 23, -h + 14, 3.5, 2.6, '#9a92b8', { lw: 1 });
  }
}

function artilleryBody(g, lv) {
  basePad(g);
  const h = 30 + lv * 6;
  stoneWall(g, -27, -h, 54, h, ['#b3aa98', '#a8a08d', '#9c9482'][lv], 3);
  crenels(g, -27, -h, 54, '#c4bba8', 9);
  if (lv === 2) {
    rrect(g, -28, -h * 0.55, 56, 4, 1, '#5d6670', { lw: 1.2 });
  }
  rrect(g, -6, -14, 12, 14, 5, '#4a3423');
  // Đống đạn cạnh tháp
  for (const [x, y] of [[-30, 2], [-24, 3], [-27, -3]]) blob(g, x, y, 3.6, 3.4, '#2c3036', { lw: 1 });
}

function barracksBody(g, lv) {
  basePad(g);
  const wall = ['#c9b48c', '#d2bf98', '#dbc9a4'][lv];
  rrect(g, -26, -32, 52, 33, 2, wall);
  // Khung gỗ kiểu nhà sàn
  for (const x of [-26, -9, 9, 24]) line(g, [[x + 1, -31], [x + 1, 0]], '#5c3b1f', 2.6);
  line(g, [[-25, -16], [25, -16]], '#5c3b1f', 2.6);
  rrect(g, -5, -15, 10, 16, 4, '#4a2f1c');
  rrect(g, -21, -27, 8, 7, 1, '#2b1d10', { lw: 1.2 });
  rrect(g, 13, -27, 8, 7, 1, '#2b1d10', { lw: 1.2 });
  // Mái ngói
  const roof = ['#b8402f', '#a8352a', '#2f5fb8'][lv];
  shape(g, (g) => {
    g.moveTo(-33, -28);
    g.lineTo(0, -56 - lv * 4);
    g.lineTo(33, -28);
    g.quadraticCurveTo(0, -24, -33, -28);
  }, roof, { x: -33, y: -60, w: 66, h: 32 }, { lw: 2 });
  g.save();
  g.beginPath();
  g.moveTo(-33, -28);
  g.lineTo(0, -56 - lv * 4);
  g.lineTo(33, -28);
  g.closePath();
  g.clip();
  g.strokeStyle = tint(roof, -0.3);
  g.lineWidth = 1;
  for (let k = 1; k < 5; k++) {
    g.beginPath();
    g.moveTo(-33, -28 - k * 6);
    g.lineTo(33, -28 - k * 6);
    g.stroke();
  }
  g.restore();
  // Huy hiệu khiên
  shape(g, (g) => {
    g.moveTo(-5, -44);
    g.lineTo(5, -44);
    g.lineTo(5, -38);
    g.quadraticCurveTo(0, -33, -5, -38);
    g.closePath();
  }, '#f2d36b', { x: -5, y: -44, w: 10, h: 11 }, { lw: 1.2 });
  if (lv >= 1) {
    // Giá vũ khí
    line(g, [[30, 2], [30, -14]], '#6b4a2b', 2);
    line(g, [[34, 2], [34, -16]], '#6b4a2b', 2);
    poly(g, [[28.5, -14], [30, -20], [31.5, -14]], '#c3ccd4', { lw: 0.8 });
    poly(g, [[32.5, -16], [34, -22], [35.5, -16]], '#c3ccd4', { lw: 0.8 });
  }
}

const BODY = { archer: archerBody, mage: mageBody, artillery: artilleryBody, barracks: barracksBody };

// ---------- Phần động ----------

function pennant(ctx, x, y, color, t, len = 22) {
  line(ctx, [[x, y], [x, y - len]], '#3a2a1a', 2);
  const w = Math.sin(t * 5) * 2.5;
  shape(ctx, (g) => {
    g.moveTo(x, y - len);
    g.quadraticCurveTo(x + 8, y - len + 1 + w, x + 16, y - len + 4 + w);
    g.lineTo(x, y - len + 9);
    g.closePath();
  }, color, { x, y: y - len, w: 16, h: 10 }, { lw: 1.2 });
}

function archerMan(ctx, x, y, aim, drawn, cloak) {
  const flip = Math.cos(aim) < 0;
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  const a = flip ? Math.PI - aim : aim;
  blob(ctx, 0, -6, 6, 7, cloak);
  blob(ctx, 0.5, -15, 5.5, 5.2, '#f1c9a0');
  shape(ctx, (g) => {
    g.moveTo(-6, -15);
    g.quadraticCurveTo(-5, -24, 1, -24);
    g.quadraticCurveTo(7, -23, 6.5, -15);
    g.lineTo(2, -18);
    g.closePath();
  }, cloak, { x: -6, y: -24, w: 13, h: 9 }, { lw: 1.2 });
  ctx.fillStyle = INK;
  ctx.fillRect(3, -15.5, 1.4, 1.6);
  ctx.translate(2, -8);
  ctx.rotate(Math.max(-1.2, Math.min(1.2, a)));
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.arc(5, 0, 10, -1.25, 1.25);
  ctx.stroke();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 2;
  ctx.stroke();
  const pull = drawn ? 4 : 0;
  line(ctx, [[8.2, -9.5], [5 - pull, 0], [8.2, 9.5]], '#eee', 0.9);
  if (drawn) line(ctx, [[1, 0], [15, 0]], '#6b4a2b', 1.4);
  ctx.restore();
}

export function drawTower(ctx, tw, t) {
  const pop = tw.buildAnim > 0 ? 1 + Math.sin((tw.buildAnim / 0.5) * Math.PI) * 0.1 : 1;
  ctx.save();
  ctx.translate(tw.x, tw.y);
  if (pop !== 1) ctx.scale(pop, 2 - pop);
  const body = sprites.get(`tower:${tw.type}:${tw.level}`, TOWER_SPEC, (g) => BODY[tw.type](g, tw.level));
  sprites.draw(ctx, body, 0, 0);

  const lv = tw.level;
  if (tw.type === 'archer') {
    const top = lv === 0 ? -56 : -58;
    const cloak = ['#2f8f4e', '#2f7f8f', '#2f5fb8'][lv];
    const drawn = tw.cooldown < 0.25;
    if (lv === 2) {
      archerMan(ctx, -9, top, tw.aim, drawn, cloak);
      archerMan(ctx, 9, top, tw.aim + 0.05, tw.shootAnim > 0 || drawn, cloak);
    } else {
      archerMan(ctx, 0, top, tw.aim, drawn, cloak);
    }
    if (lv >= 1) pennant(ctx, 22, top + 2, lv === 2 ? '#2f5fb8' : '#c23b2a', t);
  } else if (tw.type === 'mage') {
    const h = 54 + lv * 8 + 30 + lv * 4;
    const bob = Math.sin(t * 2.6) * 2.5;
    const oy = -h - 14 + bob;
    const charge = tw.shootAnim > 0 ? 1 : 0.55 + 0.25 * Math.sin(t * 4);
    glow(ctx, 0, oy, 20 + lv * 4, '190,130,255', charge * 0.8);
    shape(ctx, (g) => {
      g.moveTo(0, oy - 9 - lv);
      g.lineTo(6 + lv, oy);
      g.lineTo(0, oy + 9 + lv);
      g.lineTo(-6 - lv, oy);
      g.closePath();
    }, '#c49bff', { x: -7, y: oy - 10, w: 14, h: 20 }, { lw: 1.4, light: 0.6 });
    // Hạt sáng xoay quanh
    for (let i = 0; i < 3 + lv; i++) {
      const a = t * 2 + (i / (3 + lv)) * Math.PI * 2;
      ctx.fillStyle = 'rgba(230,210,255,0.9)';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 14, oy + Math.sin(a) * 5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (tw.type === 'artillery') {
    const h = 30 + lv * 6;
    const recoil = tw.shootAnim > 0 ? tw.shootAnim * 18 : 0;
    const dir = Math.cos(tw.aim) >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(0, -h - 4);
    ctx.scale(dir, 1);
    ctx.rotate(-0.75);
    rrect(ctx, -7 - lv, -26 + recoil, 14 + lv * 2, 26, 4, lv === 2 ? '#3d4148' : '#4d535c');
    rrect(ctx, -8.5 - lv, -29 + recoil, 17 + lv * 2, 6, 2, '#2c3036');
    ctx.restore();
    blob(ctx, 0, -h - 3, 10, 7, '#6b4a2b');
    if (tw.shootAnim > 0.1) glow(ctx, dir * 16, -h - 26, 14, '255,180,80', tw.shootAnim * 4);
    if (lv === 2) pennant(ctx, 24, -h - 6, '#d4a020', t);
  } else if (tw.type === 'barracks') {
    pennant(ctx, 27, -26, lv === 2 ? '#f2d36b' : '#2f6fd6', t, 30);
  }
  ctx.restore();

  // Sao cấp
  for (let i = 0; i <= lv; i++) {
    const sx = tw.x - lv * 6 + i * 12;
    star(ctx, sx, tw.y + 15, 4.5);
  }
}

function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd34d';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.stroke();
}

// Ô đất xây tháp: nền đá vòng tròn + đất xới + biển gỗ.
function drawSpotBody(g) {
  groundShadow(g, 2, 4, 33, 13, 0.3);
  blob(g, 0, 0, 31, 14, '#8c8574');
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    blob(g, Math.cos(a) * 27, Math.sin(a) * 11.5, 5.5, 3.6, i % 2 ? '#a7a08f' : '#9a9382', { lw: 1 });
  }
  blob(g, 0, -1, 22, 9, '#8a6842', { outline: null });
  g.strokeStyle = 'rgba(60,40,20,0.45)';
  g.lineWidth = 1.2;
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.moveTo(-14 + i * 2, -3 + i * 2.5);
    g.lineTo(14 + i * 2, -3 + i * 2.5);
    g.stroke();
  }
}

export function drawSpot(ctx, spot, t, selected) {
  const body = sprites.get('spot', SPOT_SPEC, drawSpotBody);
  sprites.draw(ctx, body, spot.x, spot.y);
  const a = selected ? 1 : 0.3 + 0.25 * Math.sin(t * 3 + spot.id);
  ctx.strokeStyle = selected ? 'rgba(255,236,150,1)' : `rgba(255,255,255,${a})`;
  ctx.lineWidth = selected ? 3 : 1.8;
  ctx.beginPath();
  ctx.ellipse(spot.x, spot.y, 34, 16, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// Biểu tượng tháp thu nhỏ cho nút menu.
export function drawTowerIcon(ctx, type, x, y, size) {
  const body = sprites.get(`tower:${type}:0`, TOWER_SPEC, (g) => BODY[type](g, 0));
  const s = size / 70;
  ctx.save();
  ctx.translate(x, y + 18 * s);
  ctx.scale(s, s);
  sprites.draw(ctx, body, 0, 0);
  ctx.restore();
}
