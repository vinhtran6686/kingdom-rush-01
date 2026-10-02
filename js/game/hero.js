// Anh hùng: binh sĩ mạnh, người chơi điều khiển bằng cách chạm để di chuyển.
import { HERO } from '../data/hero.js';
import { dist, moveToward, rollDamage } from '../core/utils.js';
import { Soldier } from './soldier.js';

export class Hero extends Soldier {
  constructor(spawn) {
    super({
      kind: 'hero',
      x: spawn.x,
      y: spawn.y,
      hp: HERO.hp,
      damage: HERO.damage,
      armor: HERO.armor,
      interval: HERO.interval,
      speed: HERO.speed,
      regen: HERO.regen,
      engageRange: HERO.engageRange,
    });
    this.spawn = spawn;
    this.commanded = false; // đang đi tới điểm người chơi chỉ định → bỏ qua quái
    this.respawnTimer = 0;
    this.skillCd = 3;
    this.skillAnim = 0;
  }

  moveTo(x, y) {
    if (this.dead) return;
    this.releaseTarget();
    this.setHome(x, y);
    this.commanded = true;
  }

  update(dt, game) {
    if (this.dead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.revive();
      return;
    }
    this.skillCd = Math.max(0, this.skillCd - dt);
    this.skillAnim = Math.max(0, this.skillAnim - dt);

    if (this.commanded) {
      this.anim += dt;
      this.facing = this.homeX >= this.x ? 1 : -1;
      this.moving = !moveToward(this, this.homeX, this.homeY, this.speed * dt);
      if (!this.moving) this.commanded = false;
      return;
    }

    super.update(dt, game);
    if (this.target && this.skillCd <= 0 && !this.moving) this.useSkill(game);
  }

  useSkill(game) {
    const s = HERO.skill;
    let hit = 0;
    for (const e of game.enemies) {
      if (!e.alive || e.flying) continue;
      if (dist(this.x, this.y, e.x, e.y) > s.radius + e.radius) continue;
      e.takeDamage(rollDamage([s.damage, s.damage]), 'physical');
      e.stun = Math.max(e.stun, s.stun);
      hit++;
    }
    if (!hit) return;
    this.skillCd = s.cooldown;
    this.skillAnim = 0.4;
    game.addEffect({ kind: 'ring', x: this.x, y: this.y, r: s.radius, color: '255,220,120', life: 0.4, maxLife: 0.4 });
    game.emit('sfx', 'whirl');
  }

  die(game, killed) {
    super.die(game, killed);
    this.commanded = false;
    this.respawnTimer = HERO.respawn;
    game.emit('sfx', 'heroDown');
  }

  revive() {
    this.dead = false;
    this.hp = this.maxHp;
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.setHome(this.spawn.x, this.spawn.y);
    this.commanded = false;
  }
}
