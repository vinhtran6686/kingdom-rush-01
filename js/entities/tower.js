import { TOWERS } from '../config.js';
import { dist } from '../utils.js';
import { Projectile } from './projectile.js';

export class Tower {
  constructor(type, spot) {
    this.type = type;
    this.def = TOWERS[type];
    this.spot = spot;
    this.x = spot.x;
    this.y = spot.y;
    this.cooldown = 0;
    this.aimAngle = -Math.PI / 2;
    this.target = null;
  }

  get sellValue() {
    return Math.floor(this.def.cost * this.def.sellRatio);
  }

  // Chọn quái "đi xa nhất" trong tầm — giống cách Kingdom Rush ưu tiên quái sắp lọt.
  findTarget(enemies) {
    let best = null;
    for (const e of enemies) {
      if (!e.alive) continue;
      if (dist(this.x, this.y, e.x, e.y) > this.def.range + e.radius) continue;
      if (!best || e.distance > best.distance) best = e;
    }
    return best;
  }

  // Trả về Projectile mới nếu bắn trong frame này, ngược lại trả về null.
  update(dt, enemies) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.target = this.findTarget(enemies);
    if (!this.target) return null;

    // Cung thủ đứng trên nóc tháp (lệch lên trên so với tâm ô).
    const ax = this.x;
    const ay = this.y - 22;
    this.aimAngle = Math.atan2(this.target.y - ay, this.target.x - ax);

    if (this.cooldown > 0) return null;
    this.cooldown = this.def.fireInterval;
    return new Projectile(ax, ay, this.target, this.def.damage, this.def.projectileSpeed);
  }
}
