import { ENEMIES } from '../data/enemies.js';
import { rollDamage, dist } from '../core/utils.js';

let nextId = 1;

// Giảm sát thương theo loại: vật lý bị giáp giảm, phép bị kháng phép giảm.
export function applyResist(amount, type, armor, magicResist) {
  if (type === 'physical') return amount * (1 - armor);
  if (type === 'magic') return amount * (1 - magicResist);
  return amount;
}

export class Enemy {
  constructor(type, path, pathIndex) {
    this.id = nextId++;
    this.type = type;
    this.def = ENEMIES[type];
    this.path = path;
    this.pathIndex = pathIndex;
    this.maxHp = this.def.hp;
    this.hp = this.def.hp;
    this.distance = 0;
    this.lateral = (Math.random() - 0.5) * (this.def.boss ? 4 : 22); // lệch làn
    this.flying = !!this.def.flying;
    this.blocker = null; // lính/anh hùng đang chặn quái này
    this.attackCd = 0;
    this.stun = 0;
    this.healCd = this.def.heal ? this.def.heal.interval : 0;
    this.dead = false;
    this.escaped = false;
    this.anim = Math.random() * 10;
    this.hitFlash = 0;
    this.facing = 1;
    this.attackAnim = 0;
    this.syncPosition();
  }

  get radius() {
    return this.def.radius;
  }

  get alive() {
    return !this.dead && !this.escaped;
  }

  // Quãng đường còn lại tới cuối — tháp ưu tiên quái có giá trị nhỏ nhất.
  get remaining() {
    return this.path.length - this.distance;
  }

  syncPosition() {
    const p = this.path.pointAt(this.distance, this.lateral);
    if (p.x !== this.x) this.facing = p.x > (this.x ?? p.x) ? 1 : p.x < this.x ? -1 : this.facing;
    this.x = p.x;
    this.y = p.y;
    this.angle = p.angle;
  }

  update(dt, game) {
    if (!this.alive) return;
    this.anim += dt;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.attackAnim = Math.max(0, this.attackAnim - dt);

    if (this.def.regen && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.def.regen * dt);
    }
    if (this.def.heal) this.updateHeal(dt, game);

    if (this.stun > 0) {
      this.stun -= dt;
      return;
    }

    if (this.blocker) {
      if (!this.blocker.alive || this.blocker.target !== this) {
        this.blocker = null;
      } else {
        this.fight(dt, game);
        return;
      }
    }

    this.distance += this.def.speed * dt;
    if (this.distance >= this.path.length) {
      this.escaped = true;
      return;
    }
    this.syncPosition();
  }

  fight(dt, game) {
    const b = this.blocker;
    this.facing = b.x >= this.x ? 1 : -1;
    // Chỉ đánh khi lính đã tới sát bên.
    if (dist(this.x, this.y, b.x, b.y) > this.radius + 22) return;
    this.attackCd -= dt;
    if (this.attackCd <= 0) {
      this.attackCd = this.def.interval;
      this.attackAnim = 0.25;
      b.takeDamage(rollDamage(this.def.damage), 'physical', game);
    }
  }

  updateHeal(dt, game) {
    this.healCd -= dt;
    if (this.healCd > 0) return;
    const h = this.def.heal;
    let healed = false;
    for (const e of game.enemies) {
      if (!e.alive || e === this || e.hp >= e.maxHp) continue;
      if (dist(this.x, this.y, e.x, e.y) > h.radius) continue;
      e.hp = Math.min(e.maxHp, e.hp + h.amount);
      healed = true;
    }
    if (healed) {
      this.healCd = h.interval;
      game.addEffect({ kind: 'heal', x: this.x, y: this.y, r: h.radius, life: 0.6, maxLife: 0.6 });
    } else {
      this.healCd = 0.5;
    }
  }

  takeDamage(amount, type) {
    if (!this.alive) return 0;
    const real = applyResist(amount, type, this.def.armor, this.def.magicResist);
    this.hp -= real;
    this.hitFlash = 0.08;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
    return real;
  }
}
