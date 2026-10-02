// Binh sĩ cận chiến: dùng cho lính doanh trại, dân quân và làm lớp cha của anh hùng.
// Lính chặn quái dưới đất: khi giao chiến, quái dừng lại (enemy.blocker = lính).
import { dist, moveToward, rollDamage } from '../core/utils.js';
import { applyResist } from './enemy.js';

export class Soldier {
  constructor(opts) {
    this.kind = opts.kind || 'soldier'; // 'soldier' | 'militia' | 'hero'
    this.x = opts.x;
    this.y = opts.y;
    this.homeX = opts.homeX ?? opts.x;
    this.homeY = opts.homeY ?? opts.y;
    this.maxHp = opts.hp;
    this.hp = opts.hp;
    this.damage = opts.damage;
    this.armor = opts.armor || 0;
    this.interval = opts.interval || 1;
    this.speed = opts.speed || 70;
    this.regen = opts.regen ?? 6;
    this.engageRange = opts.engageRange || 60;
    this.lifetime = opts.lifetime ?? Infinity;
    this.target = null;
    this.attackCd = 0;
    this.dead = false;
    this.facing = 1;
    this.anim = Math.random() * 10;
    this.attackAnim = 0;
    this.moving = false;
    this.hitFlash = 0;
  }

  get alive() {
    return !this.dead;
  }

  setHome(x, y) {
    this.homeX = x;
    this.homeY = y;
  }

  releaseTarget() {
    if (this.target && this.target.blocker === this) this.target.blocker = null;
    this.target = null;
  }

  // Tìm quái dưới đất gần nhất quanh điểm tập kết, ưu tiên quái chưa bị ai chặn.
  findTarget(game) {
    let best = null;
    let bestScore = Infinity;
    for (const e of game.enemies) {
      if (!e.alive || e.flying) continue;
      if (e.blocker && e.blocker !== this) continue;
      const dHome = dist(this.homeX, this.homeY, e.x, e.y);
      if (dHome > this.engageRange) continue;
      const score = dist(this.x, this.y, e.x, e.y);
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }

  update(dt, game) {
    if (this.dead) return;
    this.anim += dt;
    this.attackAnim = Math.max(0, this.attackAnim - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);

    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.die(game, false);
      return;
    }

    if (this.target && (!this.target.alive || (this.target.blocker && this.target.blocker !== this))) {
      this.target = null;
    }
    if (!this.target) {
      const t = this.findTarget(game);
      if (t) {
        this.target = t;
        t.blocker = this;
      }
    }

    if (this.target) {
      this.fight(dt, game);
    } else {
      this.moving = !moveToward(this, this.homeX, this.homeY, this.speed * dt);
      if (this.moving) this.facing = this.homeX >= this.x ? 1 : -1;
      else this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
    }
  }

  fight(dt, game) {
    const e = this.target;
    // Đứng cạnh quái, phía đối diện hướng quái đang đi tới.
    const side = this.x <= e.x ? -1 : 1;
    const tx = e.x + side * (e.radius + 12);
    const ty = e.y + 2;
    const arrived = moveToward(this, tx, ty, this.speed * dt);
    this.moving = !arrived;
    this.facing = e.x >= this.x ? 1 : -1;
    if (!arrived) return;
    this.attackCd -= dt;
    if (this.attackCd <= 0) {
      this.attackCd = this.interval;
      this.attackAnim = 0.25;
      e.takeDamage(rollDamage(this.damage), 'physical');
      game.emit('sfx', 'sword');
    }
  }

  takeDamage(amount, type, game) {
    if (this.dead) return;
    this.hp -= applyResist(amount, type, this.armor, 0);
    this.hitFlash = 0.08;
    if (this.hp <= 0) this.die(game, true);
  }

  die(game, killed) {
    this.hp = 0;
    this.dead = true;
    this.releaseTarget();
    if (killed) game.addEffect({ kind: 'poof', x: this.x, y: this.y, r: 10, life: 0.4, maxLife: 0.4 });
  }
}
