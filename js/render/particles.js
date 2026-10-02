// Hệ thống hạt chỉ để trang trí (không ảnh hưởng logic): khói, mảnh vỡ, tia lửa, bụi,
// lá rơi / tuyết / đom đóm theo theme bản đồ.
import { WORLD } from '../core/utils.js';

const MAX = 600;

export class Particles {
  constructor() {
    this.list = [];
    this.seen = new WeakSet();
    this.ambientTimer = 0;
  }

  reset() {
    this.list.length = 0;
    this.seen = new WeakSet();
  }

  add(p) {
    if (this.list.length < MAX) this.list.push(p);
  }

  // Sinh hạt cho những hiệu ứng logic mới xuất hiện (nổ, chết, trúng phép...).
  ingest(effects) {
    for (const fx of effects) {
      if (this.seen.has(fx)) continue;
      this.seen.add(fx);
      if (fx.kind === 'explosion') this.explosion(fx.x, fx.y, fx.r, fx.big);
      else if (fx.kind === 'death') this.dust(fx.x, fx.y, 7, '#b9a98f');
      else if (fx.kind === 'poof') this.dust(fx.x, fx.y, 9, '#e6e1d6');
      else if (fx.kind === 'spark') this.sparks(fx.x, fx.y, 7, fx.color);
      else if (fx.kind === 'heal') this.sparks(fx.x, fx.y - 10, 8, '120,255,160', true);
    }
  }

  explosion(x, y, r, big) {
    const n = big ? 26 : 16;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * (big ? 200 : 140);
      this.add({ kind: 'debris', x, y: y - 4, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.5 - 60, z: 0, vz: 80 + Math.random() * 120,
        life: 0.6 + Math.random() * 0.4, max: 1, size: 1.5 + Math.random() * 2.5, color: Math.random() < 0.5 ? '#5a4632' : '#3a2f26' });
    }
    for (let i = 0; i < (big ? 12 : 7); i++) {
      const a = Math.random() * Math.PI * 2;
      this.add({ kind: 'smoke', x: x + Math.cos(a) * r * 0.4, y: y + Math.sin(a) * r * 0.25 - 6, vx: Math.cos(a) * 14, vy: -18 - Math.random() * 16,
        life: 0.9 + Math.random() * 0.6, max: 1.5, size: 8 + Math.random() * 8 });
    }
    for (let i = 0; i < (big ? 14 : 8); i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 120;
      this.add({ kind: 'ember', x, y: y - 8, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 40, life: 0.4 + Math.random() * 0.3, max: 0.7, size: 1.6 });
    }
  }

  dust(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      this.add({ kind: 'puff', x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 3, vx: Math.cos(a) * 26, vy: Math.sin(a) * 10 - 10,
        life: 0.5 + Math.random() * 0.3, max: 0.8, size: 4 + Math.random() * 4, color });
    }
  }

  sparks(x, y, n, rgb, rise = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 30 + Math.random() * 70;
      this.add({ kind: 'spark', x, y, vx: Math.cos(a) * s * (rise ? 0.3 : 1), vy: rise ? -30 - Math.random() * 40 : Math.sin(a) * s,
        life: 0.35 + Math.random() * 0.3, max: 0.65, size: 1.8, rgb });
    }
  }

  trail(x, y) {
    this.add({ kind: 'smoke', x, y, vx: 0, vy: -8, life: 0.4, max: 0.4, size: 3 });
  }

  ambient(dt, theme) {
    this.ambientTimer -= dt;
    if (this.ambientTimer > 0) return;
    this.ambientTimer = theme === 'snow' ? 0.04 : theme === 'autumn' ? 0.35 : 0.5;
    const x = Math.random() * WORLD.width;
    if (theme === 'snow') {
      this.add({ kind: 'snow', x, y: -10, vx: -8 + Math.random() * 6, vy: 26 + Math.random() * 20, life: 30, max: 30, size: 1 + Math.random() * 1.8, ph: Math.random() * 6 });
    } else if (theme === 'autumn') {
      this.add({ kind: 'leaf', x, y: -10, vx: 14 + Math.random() * 10, vy: 22 + Math.random() * 12, life: 30, max: 30, size: 3,
        ph: Math.random() * 6, color: Math.random() < 0.5 ? '#e07b24' : '#c8551f' });
    } else {
      this.add({ kind: 'firefly', x, y: Math.random() * WORLD.height, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
        life: 4, max: 4, size: 1.6, ph: Math.random() * 6 });
    }
  }

  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'debris') {
        p.z += p.vz * dt;
        p.vz -= 400 * dt;
        if (p.z < 0) {
          p.z = 0;
          p.vz *= -0.35;
          p.vx *= 0.6;
          p.vy *= 0.6;
        }
        p.vy *= 0.98;
      } else if (p.kind === 'smoke' || p.kind === 'puff') {
        p.vx *= 0.96;
        p.size += dt * 10;
      } else if (p.kind === 'ember' || p.kind === 'spark') {
        p.vy += 120 * dt;
      } else if (p.kind === 'snow' || p.kind === 'leaf') {
        p.ph += dt * 2;
        p.x += Math.sin(p.ph) * 12 * dt;
        if (p.y > WORLD.height + 10) p.life = 0;
      } else if (p.kind === 'firefly') {
        p.ph += dt * 3;
      }
    }
    this.list = this.list.filter((p) => p.life > 0);
  }

  // layer: 'ground' (vẽ dưới nhân vật) hoặc 'air'.
  draw(ctx, layer) {
    for (const p of this.list) {
      const k = Math.max(0, p.life / p.max);
      if (layer === 'ground') {
        if (p.kind !== 'debris') continue;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.fillRect(p.x - p.size / 2, p.y - p.z - p.size / 2, p.size, p.size);
        continue;
      }
      if (p.kind === 'debris') continue;
      if (p.kind === 'smoke' || p.kind === 'puff') {
        ctx.globalAlpha = k * (p.kind === 'smoke' ? 0.45 : 0.6);
        ctx.fillStyle = p.color || '#8a8580';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'ember') {
        ctx.globalAlpha = k;
        ctx.fillStyle = k > 0.5 ? '#ffe08a' : '#ff8a2a';
        ctx.fillRect(p.x - 1, p.y - 1, p.size, p.size);
      } else if (p.kind === 'spark') {
        ctx.globalAlpha = k;
        ctx.fillStyle = `rgb(${p.rgb})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * k + 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'snow') {
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'leaf') {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.ph);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'firefly') {
        const a = Math.max(0, Math.sin(p.ph)) * Math.min(1, k * 2);
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(255,250,170,0.35)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fffbd0';
        ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6);
      }
    }
    ctx.globalAlpha = 1;
  }
}
