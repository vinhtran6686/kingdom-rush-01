// Nhân vật vẽ tay (thiết kế gốc của game): tỉ lệ chibi đầu to, viền đậm, đổ khối.
// Mỗi hàm vẽ quay mặt sang PHẢI, chân tại (0, 0). Tư thế:
//   pose.walk: 0..1 pha bước đi; pose.atk: 0..1 tiến độ đòn đánh (hoặc -1);
//   pose.cyc: 0..1 pha chuyển động lặp (thở, vỗ cánh, phát sáng); pose.moving; pose.spin (anh hùng).
import { INK, tint, blob, rrect, poly, shape, line, limb, glow } from './art.js';

const SKIN = '#f1c9a0';
const STEEL = '#c3ccd4';

// Góc vung vũ khí theo tiến độ đòn đánh: giơ lên rồi chém xuống.
function swing(atk, rest = 0.3) {
  if (atk < 0) return rest;
  if (atk < 0.45) return rest - (atk / 0.45) * 1.9; // giơ lên
  return rest - 1.9 + ((atk - 0.45) / 0.55) * 3.0; // chém xuống
}

// Khung người đi 2 chân dùng chung. o: tuỳ chọn kích thước/màu; parts: các hàm vẽ phụ kiện.
function biped(g, pose, o, parts = {}) {
  const p = pose.walk * Math.PI * 2;
  const moving = pose.moving;
  const stride = moving ? Math.sin(p) * o.stride : 0;
  const bob = moving ? Math.abs(Math.cos(p)) * 1.6 : Math.sin(pose.cyc * 6.2832) * 0.5;
  const hip = -o.legH - bob;
  // Chân sau
  limb(g, [[-2, hip], [-2 - stride, -o.footLift * Math.max(0, -Math.sin(p)) * (moving ? 1 : 0)]], tint(o.legs, -0.25), o.legW);
  parts.backArm?.(g, hip, bob);
  // Chân trước
  limb(g, [[2, hip], [2 + stride, -o.footLift * Math.max(0, Math.sin(p)) * (moving ? 1 : 0)]], o.legs, o.legW);
  // Thân
  parts.body(g, hip, bob);
  // Đầu
  parts.head(g, hip - o.torsoH, bob);
  parts.frontArm?.(g, hip, bob);
}

// ======================= PHE TA =======================

function footman(g, pose, palette) {
  const { tunic, trim, helm, shield } = palette;
  const o = { legH: 9, legW: 3.4, stride: 4, footLift: 2.5, torsoH: 11, legs: '#4a4038' };
  biped(g, pose, o, {
    backArm: (g, hip) => {
      // Khiên tròn ở tay sau
      blob(g, -6, hip - 6, 6.5, 7.5, shield);
      blob(g, -6, hip - 6, 2.2, 2.2, trim, { lw: 1 });
    },
    body: (g, hip) => {
      rrect(g, -6.5, hip - 12, 13, 13.5, 4, tunic);
      line(g, [[-6, hip - 3], [6, hip - 3]], '#5b3a1e', 2.2);
      rrect(g, -1.5, hip - 11, 3, 8, 1, trim, { outline: null });
    },
    head: (g, top) => {
      blob(g, 1, top - 6, 7.2, 7, SKIN);
      // Mũ sắt có chóp và miếng che mũi
      shape(g, (g) => {
        g.moveTo(-6.8, top - 6);
        g.quadraticCurveTo(-6.5, top - 15, 1, top - 15.5);
        g.quadraticCurveTo(8.5, top - 15, 8.4, top - 6);
        g.lineTo(-6.8, top - 6);
      }, helm, { x: -7, y: top - 16, w: 16, h: 10 });
      rrect(g, 3.2, top - 7, 2, 6, 1, tint(helm, -0.2), { lw: 1 });
      g.fillStyle = INK;
      g.fillRect(5.6, top - 5.2, 1.6, 2);
    },
    frontArm: (g, hip) => {
      const a = swing(pose.atk);
      g.save();
      g.translate(4, hip - 9);
      g.rotate(a);
      limb(g, [[0, 0], [5, 4]], tunic, 3);
      // Kiếm
      rrect(g, 4, -14, 2.6, 17, 1, STEEL, { lw: 1.1 });
      rrect(g, 1.5, 2, 7.5, 2.4, 1, '#a07a3a', { lw: 1 });
      g.restore();
    },
  });
}

export function drawSoldier(g, pose) {
  footman(g, pose, { tunic: '#3f6fc8', trim: '#f2d36b', helm: '#b8c2cb', shield: '#d9dfe4' });
}

export function drawMilitia(g, pose) {
  const o = { legH: 9, legW: 3.4, stride: 4, footLift: 2.5, torsoH: 11, legs: '#5a4636' };
  biped(g, pose, o, {
    body: (g, hip) => {
      rrect(g, -6, hip - 12, 12, 13, 4, '#8a6b45');
      line(g, [[-5.5, hip - 3], [5.5, hip - 3]], '#3b2a1a', 2);
    },
    head: (g, top) => {
      blob(g, 1, top - 6, 7, 6.8, SKIN);
      shape(g, (g) => {
        g.ellipse(1, top - 9, 8, 5, 0, Math.PI, 0);
        g.closePath();
      }, '#6b4a2b', { x: -7, y: top - 14, w: 16, h: 6 });
      g.fillStyle = INK;
      g.fillRect(5, top - 6, 1.6, 2);
    },
    frontArm: (g, hip) => {
      // Giáo dài đâm thẳng
      const thrust = pose.atk < 0 ? 0 : Math.sin(pose.atk * Math.PI) * 7;
      limb(g, [[3, hip - 9], [7 + thrust * 0.5, hip - 6]], '#8a6b45', 3);
      line(g, [[-6 + thrust, hip - 4], [18 + thrust, hip - 10]], '#7a5634', 2.4);
      poly(g, [[18 + thrust, hip - 13], [25 + thrust, hip - 11.5], [18 + thrust, hip - 8]], STEEL, { lw: 1 });
    },
  });
}

// Anh hùng gốc: Hiệp Sĩ Bình Minh — giáp bạc viền vàng, chùm lông cam, áo choàng đỏ, khiên mặt trời.
export function drawHero(g, pose) {
  const o = { legH: 11, legW: 4.2, stride: 5, footLift: 3, torsoH: 14, legs: '#8a96a2' };
  const cape = Math.sin(pose.cyc * 6.2832 + pose.walk * 6) * 2;
  biped(g, pose, o, {
    backArm: (g, hip) => {
      // Áo choàng phía sau
      shape(g, (g) => {
        g.moveTo(-4, hip - 16);
        g.quadraticCurveTo(-15, hip - 6 + cape, -12 - cape, hip + 6);
        g.lineTo(-1, hip + 2);
        g.closePath();
      }, '#c23b2a', { x: -16, y: hip - 16, w: 16, h: 22 });
      // Khiên mặt trời
      blob(g, -8, hip - 8, 8, 9, '#2f5fb8');
      g.save();
      g.beginPath();
      g.ellipse(-8, hip - 8, 7, 8, 0, 0, Math.PI * 2);
      g.clip();
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        line(g, [[-8, hip - 6], [-8 + Math.cos(a) * 9, hip - 6 + Math.sin(a) * 9]], '#ffd34d', 1.4);
      }
      blob(g, -8, hip - 6, 3.4, 3, '#ffd34d', { lw: 1 });
      g.restore();
    },
    body: (g, hip) => {
      rrect(g, -8, hip - 15, 16, 16.5, 5, '#d5dde5');
      line(g, [[-7.5, hip - 4], [7.5, hip - 4]], '#c9962e', 3);
      blob(g, 0, hip - 10, 3, 3, '#e8b33a', { lw: 1 });
    },
    head: (g, top) => {
      // Mũ trụ kín với khe mắt
      blob(g, 1, top - 8, 9, 9, '#dce3ea');
      rrect(g, 0, top - 10, 10, 2.6, 1, '#2a2f36', { outline: null });
      line(g, [[-7.5, top - 4], [9.5, top - 4]], '#c9962e', 2);
      // Chùm lông
      const sway = Math.sin(pose.cyc * 6.2832) * 1.5;
      shape(g, (g) => {
        g.moveTo(0, top - 16);
        g.quadraticCurveTo(-8, top - 28 + sway, -17, top - 18 + sway);
        g.quadraticCurveTo(-9, top - 19, -3, top - 13);
        g.closePath();
      }, '#ff8c2a', { x: -17, y: top - 28, w: 18, h: 15 });
    },
    frontArm: (g, hip) => {
      const a = pose.spin >= 0 ? -pose.spin * Math.PI * 2 : swing(pose.atk);
      g.save();
      g.translate(5, hip - 11);
      g.rotate(a);
      limb(g, [[0, 0], [6, 5]], '#c3ccd4', 3.6);
      // Trường kiếm
      shape(g, (g) => {
        g.moveTo(5, 3);
        g.lineTo(5, -22);
        g.lineTo(7.2, -26);
        g.lineTo(9.4, -22);
        g.lineTo(9.4, 3);
        g.closePath();
      }, '#eef3f7', { x: 5, y: -26, w: 5, h: 29 }, { lw: 1.2 });
      rrect(g, 2, 3, 10.5, 3, 1.4, '#e8b33a', { lw: 1 });
      g.restore();
    },
  });
}

// ======================= QUÁI =======================

function goblin(g, pose) {
  const o = { legH: 6, legW: 3, stride: 3.5, footLift: 2, torsoH: 8, legs: '#4d7a2a' };
  biped(g, pose, o, {
    body: (g, hip) => {
      blob(g, 0, hip - 4, 6, 6.5, '#6fa83a');
      shape(g, (g) => {
        g.moveTo(-6, hip - 1);
        g.lineTo(6, hip - 1);
        g.lineTo(4, hip + 3);
        g.lineTo(0, hip + 1);
        g.lineTo(-4, hip + 3);
        g.closePath();
      }, '#8a6234', { x: -6, y: hip - 1, w: 12, h: 4 }, { lw: 1.2 });
    },
    head: (g, top) => {
      // Tai nhọn to
      poly(g, [[-4, top - 9], [-16, top - 15], [-5, top - 4]], '#7fbd45', { lw: 1.3 });
      poly(g, [[5, top - 9], [15, top - 14], [6, top - 4]], '#7fbd45', { lw: 1.3 });
      blob(g, 1, top - 7, 8, 7.5, '#7fbd45');
      // Mắt vàng và nụ cười nhe răng
      blob(g, 5, top - 9, 2.3, 2.3, '#ffe14d', { lw: 1, noShade: true });
      g.fillStyle = INK;
      g.fillRect(5.6, top - 9.6, 1.3, 1.6);
      shape(g, (g) => {
        g.moveTo(1, top - 4);
        g.quadraticCurveTo(5, top - 1.5, 8.5, top - 4.5);
        g.closePath();
      }, '#fff6e0', { x: 1, y: top - 5, w: 8, h: 3 }, { lw: 1, noShade: true });
    },
    frontArm: (g, hip) => {
      g.save();
      g.translate(4, hip - 6);
      g.rotate(swing(pose.atk, 0.6));
      limb(g, [[0, 0], [4, 3]], '#6fa83a', 2.6);
      poly(g, [[3.5, 2], [5, -9], [6.5, 2]], STEEL, { lw: 1 });
      g.restore();
    },
  });
}

function bandit(g, pose) {
  const o = { legH: 8, legW: 3.6, stride: 4, footLift: 2.5, torsoH: 11, legs: '#3e3228' };
  biped(g, pose, o, {
    body: (g, hip) => {
      rrect(g, -7, hip - 12, 14, 14, 5, '#7b5a3a');
      line(g, [[-6, hip - 12], [6, hip]], '#3b2a1a', 2.2);
    },
    head: (g, top) => {
      blob(g, 1.5, top - 6, 7, 7, SKIN);
      // Mũ trùm và khăn che mặt
      shape(g, (g) => {
        g.moveTo(-7.5, top - 1);
        g.quadraticCurveTo(-9, top - 16, 1.5, top - 16);
        g.quadraticCurveTo(10, top - 15, 8.5, top - 8);
        g.lineTo(3, top - 9);
        g.quadraticCurveTo(-2, top - 8, -3, top);
        g.closePath();
      }, '#4a3a2e', { x: -9, y: top - 16, w: 19, h: 16 });
      rrect(g, 1, top - 6, 8.5, 5, 2, '#2e2a33', { lw: 1 });
      g.fillStyle = INK;
      g.fillRect(5.5, top - 8.6, 1.8, 1.6);
    },
    frontArm: (g, hip) => {
      g.save();
      g.translate(4, hip - 9);
      g.rotate(swing(pose.atk));
      limb(g, [[0, 0], [5, 4]], '#7b5a3a', 3.2);
      line(g, [[5, 6], [5, -15]], '#6b4a2b', 2.6);
      shape(g, (g) => {
        g.moveTo(5, -15);
        g.quadraticCurveTo(14, -16, 13, -7);
        g.lineTo(5, -9);
        g.closePath();
      }, STEEL, { x: 5, y: -16, w: 9, h: 9 }, { lw: 1.1 });
      g.restore();
    },
  });
}

function shaman(g, pose) {
  const o = { legH: 7, legW: 3, stride: 3, footLift: 2, torsoH: 12, legs: '#4b3a2a' };
  biped(g, pose, o, {
    backArm: (g, hip) => {
      // Gậy phép có đá phát sáng
      line(g, [[-7, hip + 6], [-7, hip - 26]], '#6b4a2b', 2.6);
      const pulse = 0.6 + 0.4 * Math.sin(pose.cyc * 6.2832);
      glow(g, -7, hip - 28, 9, '120,255,170', pulse * 0.7);
      blob(g, -7, hip - 28, 3.4, 3.4, '#7dffb0', { lw: 1 });
    },
    body: (g, hip) => {
      shape(g, (g) => {
        g.moveTo(-8, hip + 3);
        g.lineTo(-5, hip - 13);
        g.lineTo(5, hip - 13);
        g.lineTo(8, hip + 3);
        g.closePath();
      }, '#2f7d78', { x: -8, y: hip - 13, w: 16, h: 16 });
      for (let i = 0; i < 3; i++) blob(g, -3 + i * 3, hip - 10, 1.4, 1.6, '#e8d9a8', { lw: 0.8, noShade: true });
    },
    head: (g, top) => {
      // Mặt nạ gỗ chạm khắc + lông vũ
      for (const [dx, c] of [[-5, '#e04a3a'], [0, '#f2c14e'], [5, '#3aa0e0']]) {
        poly(g, [[dx - 1.5, top - 12], [dx + 0.5, top - 25], [dx + 2.5, top - 12]], c, { lw: 1 });
      }
      rrect(g, -6, top - 15, 14, 15, 5, '#d9a95a');
      g.fillStyle = INK;
      g.fillRect(-1.5, top - 10, 3, 2.4);
      g.fillRect(3.5, top - 10, 3, 2.4);
      line(g, [[0, top - 4], [5.5, top - 4]], INK, 1.4);
    },
  });
}

function troll(g, pose) {
  const o = { legH: 12, legW: 6, stride: 5, footLift: 3, torsoH: 18, legs: '#556b4e' };
  biped(g, pose, o, {
    backArm: (g, hip) => limb(g, [[-8, hip - 16], [-12, hip - 4]], '#6f8f6a', 5.5),
    body: (g, hip) => {
      blob(g, 0, hip - 10, 14, 13, '#6f8f6a');
      blob(g, 2, hip - 6, 8, 7, tint('#6f8f6a', 0.25), { outline: null, noShade: true });
      // Giáp vai bằng đá
      blob(g, -9, hip - 20, 7, 5, '#8a8f94');
      blob(g, 9, hip - 20, 7, 5, '#8a8f94');
      rrect(g, -13, hip - 2, 26, 5, 2, '#5b3a1e');
    },
    head: (g, top) => {
      blob(g, 5, top - 3, 8.5, 8, '#7a9a72');
      poly(g, [[0, top - 9], [-3, top - 17], [3, top - 10]], '#e8e0cf', { lw: 1.1 });
      poly(g, [[8, top - 10], [10, top - 18], [11, top - 9]], '#e8e0cf', { lw: 1.1 });
      blob(g, 9, top - 4, 1.8, 1.8, '#ffcc33', { lw: 0.8, noShade: true });
      poly(g, [[6, top + 1], [7.5, top - 3], [9, top + 1]], '#fff6e0', { lw: 0.8 });
      poly(g, [[10, top + 1], [11.5, top - 3], [13, top + 1]], '#fff6e0', { lw: 0.8 });
    },
    frontArm: (g, hip) => {
      g.save();
      g.translate(9, hip - 15);
      g.rotate(swing(pose.atk, 0.4));
      limb(g, [[0, 0], [6, 8]], '#6f8f6a', 5.5);
      // Chùy gỗ to
      shape(g, (g) => {
        g.moveTo(4, 12);
        g.lineTo(6, -12);
        g.quadraticCurveTo(10, -22, 14, -12);
        g.lineTo(9, 12);
        g.closePath();
      }, '#7a5634', { x: 4, y: -22, w: 10, h: 34 });
      g.restore();
    },
  });
}

function wolf(g, pose) {
  const p = pose.walk * Math.PI * 2;
  const run = pose.moving ? 1 : 0;
  const body = '#7d868c';
  const leg = (x, phase, c) => {
    const s = Math.sin(p + phase) * 5 * run;
    limb(g, [[x, -11], [x + s, -Math.max(0, Math.cos(p + phase)) * 2.5 * run]], c, 3.4);
  };
  const lunge = pose.atk < 0 ? 0 : Math.sin(pose.atk * Math.PI) * 4;
  leg(-9, Math.PI, tint(body, -0.25));
  leg(7, 0, tint(body, -0.25));
  // Đuôi
  const tail = Math.sin(p * 2) * 3;
  shape(g, (g) => {
    g.moveTo(-13, -15);
    g.quadraticCurveTo(-24, -20 + tail, -27, -12 + tail);
    g.quadraticCurveTo(-21, -13, -13, -11);
    g.closePath();
  }, body, { x: -27, y: -20, w: 14, h: 9 });
  blob(g, -1, -15 + Math.abs(Math.sin(p)) * run, 15, 7.5, body);
  blob(g, 1, -12, 10, 3.6, tint(body, 0.35), { outline: null, noShade: true });
  leg(-6, 0, body);
  leg(10, Math.PI, body);
  // Đầu
  g.save();
  g.translate(13 + lunge, -19);
  poly(g, [[-3, -5], [-1, -13], [3, -6]], body, { lw: 1.2 });
  blob(g, 0, 0, 7, 6.2, tint(body, 0.1));
  poly(g, [[3, -2], [13, 1], [12, 4], [3, 4]], tint(body, 0.15), { lw: 1.2 });
  blob(g, 12.5, 1, 1.6, 1.4, INK, { outline: null, noShade: true });
  blob(g, 3, -2, 1.7, 1.5, '#ffd84a', { lw: 0.8, noShade: true });
  if (pose.atk >= 0) poly(g, [[6, 4], [7, 7], [8, 4]], '#fff', { lw: 0.8 });
  g.restore();
}

function bat(g, pose) {
  const flap = Math.sin(pose.cyc * 6.2832);
  const c = '#4b3566';
  for (const s of [-1, 1]) {
    shape(g, (g) => {
      g.moveTo(s * 3, -2);
      g.quadraticCurveTo(s * 12, -14 * flap - 6, s * 22, -4 * flap - 2);
      g.lineTo(s * 17, 3);
      g.lineTo(s * 13, 0);
      g.lineTo(s * 9, 4);
      g.lineTo(s * 5, 2);
      g.closePath();
    }, s < 0 ? tint(c, -0.2) : c, { x: -22, y: -20, w: 44, h: 24 }, { lw: 1.3 });
  }
  blob(g, 0, 0, 7, 7.5, c);
  poly(g, [[-5, -5], [-4, -13], [-1, -6]], c, { lw: 1.1 });
  poly(g, [[5, -5], [4, -13], [1, -6]], c, { lw: 1.1 });
  blob(g, -2.4, -1, 1.6, 1.6, '#ff5050', { lw: 0.6, noShade: true });
  blob(g, 2.4, -1, 1.6, 1.6, '#ff5050', { lw: 0.6, noShade: true });
  poly(g, [[-1.5, 3], [-0.7, 5.5], [0, 3]], '#fff', { lw: 0.6 });
  poly(g, [[0, 3], [0.7, 5.5], [1.5, 3]], '#fff', { lw: 0.6 });
}

function golem(g, pose) {
  const p = pose.walk * Math.PI * 2;
  const step = pose.moving ? Math.sin(p) * 4 : 0;
  const rock = '#8b8378';
  const pulse = 0.55 + 0.45 * Math.sin(pose.cyc * 6.2832);
  // Chân
  rrect(g, -20, -26 - Math.max(0, step), 15, 26 + Math.max(0, step) * 0.3, 5, tint(rock, -0.2));
  rrect(g, 5, -26 - Math.max(0, -step), 15, 26 + Math.max(0, -step) * 0.3, 5, tint(rock, -0.1));
  // Tay sau
  const lift = pose.atk < 0 ? 0 : Math.sin(pose.atk * Math.PI) * 14;
  rrect(g, -38, -66 + lift * 0.3, 15, 36, 7, tint(rock, -0.25));
  // Thân tảng đá
  shape(g, (g) => {
    g.moveTo(-26, -30);
    g.quadraticCurveTo(-32, -62, -12, -76);
    g.quadraticCurveTo(10, -84, 26, -68);
    g.quadraticCurveTo(34, -46, 24, -28);
    g.quadraticCurveTo(0, -20, -26, -30);
  }, rock, { x: -32, y: -84, w: 66, h: 60 }, { lw: 2.2 });
  // Rêu và vết nứt phát sáng
  blob(g, -10, -74, 13, 5, '#5f8a4a', { lw: 1.2, rot: -0.2 });
  line(g, [[-14, -58], [-6, -50], [-10, -40]], `rgba(255,150,50,${pulse})`, 2.4);
  line(g, [[12, -64], [6, -52], [14, -44]], `rgba(255,150,50,${pulse})`, 2.4);
  glow(g, 0, -48, 14, '255,140,40', pulse * 0.8);
  blob(g, 0, -48, 5, 5, '#ffb04a', { lw: 1.4 });
  // Đầu
  rrect(g, 2, -96, 24, 20, 7, tint(rock, 0.1));
  g.fillStyle = `rgba(255,170,70,${0.6 + pulse * 0.4})`;
  g.fillRect(10, -88, 4, 3.5);
  g.fillRect(18, -88, 4, 3.5);
  // Tay trước
  rrect(g, 22, -66 - lift, 16, 38, 7, tint(rock, -0.05));
  blob(g, 30, -28 - lift, 10, 8, tint(rock, -0.1));
}

// spec: kích thước khung sprite (đơn vị thế giới) + điểm neo ở chân.
export const UNIT_ART = {
  soldier: { spec: { w: 54, h: 50, ax: 24, ay: 44 }, draw: drawSoldier },
  militia: { spec: { w: 60, h: 46, ax: 22, ay: 40 }, draw: drawMilitia },
  hero: { spec: { w: 72, h: 76, ax: 32, ay: 66 }, draw: drawHero },
  goblin: { spec: { w: 50, h: 44, ax: 24, ay: 38 }, draw: goblin },
  bandit: { spec: { w: 52, h: 54, ax: 22, ay: 46 }, draw: bandit },
  shaman: { spec: { w: 44, h: 64, ax: 20, ay: 56 }, draw: shaman },
  troll: { spec: { w: 72, h: 80, ax: 30, ay: 70 }, draw: troll },
  wolf: { spec: { w: 72, h: 44, ax: 34, ay: 38 }, draw: wolf },
  bat: { spec: { w: 54, h: 40, ax: 27, ay: 22 }, draw: bat },
  golem: { spec: { w: 110, h: 124, ax: 52, ay: 108 }, draw: golem },
};

// Số khung hình cho mỗi trạng thái — sprite được cache theo khung đã lượng tử hoá.
export const WALK_FRAMES = 8;
export const ATK_FRAMES = 5;
