// Đạn: mũi tên / tia phép (đuổi theo mục tiêu), đạn pháo và thiên thạch (rơi xuống một điểm, nổ lan).
import { dist } from '../core/utils.js';

// Đạn đuổi theo mục tiêu; nếu mục tiêu chết thì bay tới vị trí cuối rồi biến mất.
export class Homing {
  constructor({ kind, x, y, target, damage, damageType, speed }) {
    this.kind = kind; // 'arrow' | 'bolt'
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.damageType = damageType;
    this.speed = speed;
    this.tx = target.x;
    this.ty = target.y;
    this.angle = Math.atan2(this.ty - y, this.tx - x);
    this.done = false;
    this.trail = [];
  }

  update(dt, game) {
    if (this.target.alive) {
      this.tx = this.target.x;
      this.ty = this.target.y - (this.target.flying ? 18 : 6);
    }
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const d = Math.hypot(dx, dy);
    const step = this.speed * dt;
    this.angle = Math.atan2(dy, dx);
    if (this.kind === 'bolt') {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 6) this.trail.shift();
    }
    if (d <= step) {
      this.done = true;
      if (this.target.alive) {
        this.target.takeDamage(this.damage, this.damageType);
        if (this.kind === 'bolt') {
          game.addEffect({ kind: 'spark', x: this.tx, y: this.ty, r: 14, color: '190,120,255', life: 0.25, maxLife: 0.25 });
        }
      }
      return;
    }
    this.x += (dx / d) * step;
    this.y += (dy / d) * step;
  }
}

// Đạn bay theo đường cong tới một điểm cố định trên mặt đất, nổ gây sát thương lan
// cho quái dưới đất (không trúng quái bay).
export class Lobbed {
  constructor({ kind, x, y, tx, ty, flightTime, arc, damage, damageType, splash }) {
    this.kind = kind; // 'shell' | 'meteor'
    this.sx = x;
    this.sy = y;
    this.tx = tx;
    this.ty = ty;
    this.x = x;
    this.y = y;
    this.flightTime = flightTime;
    this.arc = arc;
    this.t = 0;
    this.damage = damage;
    this.damageType = damageType;
    this.splash = splash;
    this.done = false;
    this.height = 0;
  }

  update(dt, game) {
    this.t += dt;
    const k = Math.min(1, this.t / this.flightTime);
    this.x = this.sx + (this.tx - this.sx) * k;
    this.y = this.sy + (this.ty - this.sy) * k;
    this.height = this.arc * 4 * k * (1 - k);
    if (k < 1) return;

    this.done = true;
    for (const e of game.enemies) {
      if (!e.alive || e.flying) continue;
      const d = dist(this.tx, this.ty, e.x, e.y);
      if (d > this.splash + e.radius) continue;
      // Ở rìa vụ nổ nhận ít sát thương hơn.
      const falloff = 1 - 0.5 * Math.min(1, d / this.splash);
      e.takeDamage(this.damage * falloff, this.damageType);
    }
    game.addEffect({
      kind: 'explosion',
      x: this.tx,
      y: this.ty,
      r: this.splash,
      life: 0.45,
      maxLife: 0.45,
      big: this.kind === 'meteor',
    });
    game.addEffect({ kind: 'scorch', x: this.tx, y: this.ty, r: this.splash * 0.55, life: 4, maxLife: 4 });
    game.emit('sfx', this.kind === 'meteor' ? 'meteor' : 'boom');
  }
}
